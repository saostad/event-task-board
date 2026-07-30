import { useState } from 'react'
import { Plus, Share2, Check, Settings } from 'lucide-react'
import { useEvent } from '../hooks/useEvent'
import { TaskCard } from './TaskCard'
import { AddTaskForm } from './AddTaskForm'
import { NamePrompt } from './NamePrompt'
import { cn } from '../lib/utils'

interface Props {
  eventId: string
  displayName: string
  onUpdateName: (name: string) => void
  userUid: string
}

type Filter = 'all' | 'open' | 'claimed' | 'done' | 'mine'

export function EventBoard({ eventId, displayName, onUpdateName, userUid }: Props) {
  const {
    event,
    tasks,
    loading,
    error,
    addTask,
    claimTask,
    unclaimTask,
    markDone,
    reopenTask,
    deleteTask
  } = useEvent(eventId)

  const [showAdd, setShowAdd] = useState(false)
  const [showName, setShowName] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [copied, setCopied] = useState(false)

  const isOwner = event?.createdBy === userUid

  const filtered = tasks.filter((t) => {
    if (filter === 'open') return t.status === 'open'
    if (filter === 'claimed') return t.status === 'claimed'
    if (filter === 'done') return t.status === 'done'
    if (filter === 'mine') return t.claimedBy.includes(displayName)
    return true
  })

  const openCount = tasks.filter((t) => t.status === 'open').length
  const doneCount = tasks.filter((t) => t.status === 'done').length

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

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

  const handleCopyCode = async () => {
    if (event?.code) {
      await navigator.clipboard.writeText(event.code)
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
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold truncate">{event.title}</h1>
              <p className="text-sm text-slate-400">
                by {event.ownerName} · Code:{' '}
                <button onClick={handleCopyCode} className="font-mono text-brand-400">
                  {event.code}
                </button>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
                title="Share"
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
                title="Change name"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
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

      {/* Filters */}
      <div className="max-w-2xl mx-auto px-4 py-3 overflow-x-auto">
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

      {/* Task list */}
      <main className="max-w-2xl mx-auto px-4 space-y-3">
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
              onUnclaim={(id) => unclaimTask(id, displayName)}
              onDone={markDone}
              onReopen={reopenTask}
              onDelete={deleteTask}
            />
          ))
        )}
      </main>

      {/* FAB */}
      {isOwner && (
        <button
          onClick={() => setShowAdd(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-900/40 flex items-center justify-center transition z-30"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {showAdd && (
        <AddTaskForm onAdd={addTask} onClose={() => setShowAdd(false)} />
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
