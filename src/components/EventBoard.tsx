import { useState } from 'react'
import { Plus, Share2, Check, Settings, MapPin, Phone, Calendar, Users } from 'lucide-react'
import { useEvent } from '../hooks/useEvent'
import { useEventMembers } from '../hooks/useEventMembers'
import { TaskCard } from './TaskCard'
import { AddTaskForm } from './AddTaskForm'
import { EditTaskForm } from './EditTaskForm'
import { NamePrompt } from './NamePrompt'
import { ContributorsPanel } from './ContributorsPanel'
import { AppFooter } from './AppFooter'
import { cn } from '../lib/utils'
import type { Task } from '../types'

interface Props {
  eventId: string
  displayName: string
  onUpdateName: (name: string) => void
  userUid: string
  userEmail?: string | null
  userPhotoURL?: string | null
}

type Filter = 'all' | 'open' | 'claimed' | 'done' | 'mine'

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

function formatEventDate(value: string | null | undefined) {
  if (!value) return null
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  } catch {
    return value
  }
}

export function EventBoard({
  eventId,
  displayName,
  onUpdateName,
  userUid,
  userEmail,
  userPhotoURL
}: Props) {
  const {
    event,
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    claimTask,
    unclaimTask,
    markDone,
    reopenTask,
    deleteTask
  } = useEvent(eventId)

  const isOwner = event?.createdBy === userUid

  const { members, loading: membersLoading, removeMember } = useEventMembers(eventId, {
    uid: userUid,
    displayName,
    email: userEmail,
    photoURL: userPhotoURL,
    isOwner
  })

  const [showAdd, setShowAdd] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showName, setShowName] = useState(false)
  const [showContributors, setShowContributors] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [copied, setCopied] = useState(false)

  const filtered = tasks.filter((t) => {
    if (filter === 'open') return t.status === 'open'
    if (filter === 'claimed') return t.status === 'claimed'
    if (filter === 'done') return t.status === 'done'
    if (filter === 'mine') return t.claimedBy.includes(displayName)
    return true
  })

  const openCount = tasks.filter((t) => t.status === 'open').length
  const doneCount = tasks.filter((t) => t.status === 'done').length
  const helperCount = members.filter((m) => m.role !== 'owner').length

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const eventDateLabel = formatEventDate(event?.eventDate)
  const mapsUrl = event?.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
    : null

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title || 'Event Tasks',
          text: `Help with tasks for ${event?.title}`,
          url: shareUrl
        })
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading event...</div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Event not found'}</p>
          <a href="/" className="text-brand-400 underline">
            Go home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-28 flex flex-col">
      <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold truncate">{event.title}</h1>
              <p className="text-sm text-slate-400">by {event.ownerName}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isOwner && (
                <button
                  onClick={() => setShowContributors(true)}
                  className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
                  title="Contributors"
                >
                  <Users className="w-5 h-5" />
                  {helperCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-0.5 rounded-full bg-brand-600 text-[10px] font-medium flex items-center justify-center">
                      {helperCount}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
                title="Share link"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Share2 className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => setShowName(true)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
                title="Change display name"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {event.description && (
            <p className="mt-2 text-sm text-slate-400 whitespace-pre-wrap">{event.description}</p>
          )}

          <div className="mt-2 flex flex-col gap-1">
            {eventDateLabel && (
              <div className="inline-flex items-center gap-1.5 text-sm text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {eventDateLabel}
              </div>
            )}
            {event.location && (
              <a
                href={mapsUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300"
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="underline underline-offset-2">{event.location}</span>
              </a>
            )}
            {event.phone && (
              <a
                href={telHref(event.phone)}
                className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300"
              >
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span className="underline underline-offset-2">{event.phone}</span>
              </a>
            )}
          </div>

          <div className="mt-3 flex gap-3 text-sm">
            <span className="text-slate-400">
              <span className="text-white font-medium">{openCount}</span> open
            </span>
            <span className="text-slate-400">
              <span className="text-white font-medium">{doneCount}</span> done
            </span>
            <span className="text-slate-400">
              <span className="text-white font-medium">{tasks.length}</span> total
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-3 overflow-x-auto w-full">
        <div className="flex gap-2">
          {(['all', 'open', 'claimed', 'done', 'mine'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm capitalize whitespace-nowrap transition',
                filter === f
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              )}
            >
              {f === 'mine' ? 'My tasks' : f}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 space-y-3 flex-1 w-full">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            {tasks.length === 0
              ? 'No tasks yet. Add the first one!'
              : 'No tasks match this filter.'}
          </div>
        ) : (
          filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              currentName={displayName}
              isOwner={isOwner}
              onClaim={(id) => {
                if (!displayName) {
                  setShowName(true)
                  return
                }
                claimTask(id, displayName)
              }}
              onUnclaim={(id, name) => unclaimTask(id, name || displayName)}
              onDone={markDone}
              onReopen={reopenTask}
              onDelete={deleteTask}
              onEdit={setEditingTask}
            />
          ))
        )}
      </main>

      <AppFooter />

      {isOwner && (
        <button
          onClick={() => setShowAdd(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-900/40 flex items-center justify-center transition z-30"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {showAdd && <AddTaskForm onAdd={addTask} onClose={() => setShowAdd(false)} />}

      {editingTask && (
        <EditTaskForm
          task={editingTask}
          onSave={(data) => updateTask(editingTask.id, data)}
          onClose={() => setEditingTask(null)}
        />
      )}

      {showContributors && isOwner && (
        <ContributorsPanel
          members={members}
          loading={membersLoading}
          onRemove={removeMember}
          onClose={() => setShowContributors(false)}
        />
      )}

      {(showName || !displayName) && (
        <NamePrompt
          currentName={displayName}
          onSave={onUpdateName}
          onClose={displayName ? () => setShowName(false) : undefined}
        />
      )}
    </div>
  )
}
