import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  CalendarHeart,
  LogOut,
  Pencil,
  Trash2,
  ChevronRight,
  X,
  Search
} from 'lucide-react'
import { createEvent } from '../hooks/useEvent'
import { useMyEvents } from '../hooks/useMyEvents'
import { useAuth } from '../hooks/useAuth'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { AppFooter } from '../components/AppFooter'
import { EventFieldsForm } from '../components/EventFieldsForm'
import type { EventDoc, EventWritableFields } from '../types'

const emptyFields = (): EventWritableFields => ({
  title: '',
  description: '',
  location: '',
  phone: '',
  eventDate: null
})

function fromEvent(ev: EventDoc): EventWritableFields {
  return {
    title: ev.title || '',
    description: ev.description || '',
    location: ev.location || '',
    phone: ev.phone || '',
    eventDate: ev.eventDate || null
  }
}

export function Home() {
  const navigate = useNavigate()
  const { user, displayName, loading, login, logout, authError } = useAuth()
  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    updateEvent,
    deleteEvent
  } = useMyEvents(user?.uid)

  const [mode, setMode] = useState<'home' | 'create'>('home')
  const [form, setForm] = useState<EventWritableFields>(emptyFields())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  const [editing, setEditing] = useState<EventDoc | null>(null)
  const [editForm, setEditForm] = useState<EventWritableFields>(emptyFields())
  const [deleting, setDeleting] = useState<EventDoc | null>(null)
  const [actionBusy, setActionBusy] = useState(false)

  const filteredEvents = events.filter((ev) => {
    if (!query.trim()) return true
    const q = query.trim().toLowerCase()
    return (
      ev.title.toLowerCase().includes(q) ||
      (ev.location || '').toLowerCase().includes(q)
    )
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !user) return
    setBusy(true)
    setError('')
    try {
      const name = displayName || user.displayName || user.email || 'Owner'
      const id = await createEvent(form, name, user.uid)
      navigate(`/e/${id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create event')
    } finally {
      setBusy(false)
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing || !editForm.title.trim()) return
    setActionBusy(true)
    setError('')
    try {
      await updateEvent(editing.id, editForm)
      setEditing(null)
    } catch (err: any) {
      setError(err.message || 'Failed to save')
    } finally {
      setActionBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setActionBusy(true)
    try {
      await deleteEvent(deleting.id)
      setDeleting(null)
    } catch (err: any) {
      setError(err.message || 'Failed to delete')
    } finally {
      setActionBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Starting...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md text-center">
            <div className="inline-flex p-4 rounded-3xl bg-brand-500/10 mb-6">
              <CalendarHeart className="w-12 h-12 text-brand-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Event Task Board</h1>
            <p className="mt-2 text-slate-400 mb-8">
              Create events, share a link, and let people volunteer for tasks.
            </p>
            <GoogleSignInButton onClick={login} />
            {authError && <p className="mt-4 text-sm text-red-400">{authError}</p>}
            <p className="mt-6 text-xs text-slate-500">Google is the only sign-in method.</p>
          </div>
        </div>
        <AppFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center shrink-0">
              <CalendarHeart className="w-4 h-4 text-brand-400" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm leading-tight truncate">Event Task Board</div>
              <div className="text-[11px] text-slate-400 truncate">
                {displayName || user.email}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5">
        {mode === 'home' && (
          <>
            <div className="mb-5">
              <button
                onClick={() => {
                  setMode('create')
                  setError('')
                  setForm(emptyFields())
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-medium transition"
              >
                <Plus className="w-4 h-4" />
                New event
              </button>
            </div>

            {events.length > 0 && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search events..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}

            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-300">My events</h2>
              <span className="text-xs text-slate-500">
                {eventsLoading ? '…' : `${filteredEvents.length}`}
              </span>
            </div>

            {eventsLoading && (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 rounded-xl bg-slate-900 border border-slate-800 animate-pulse" />
                ))}
              </div>
            )}

            {eventsError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 break-words">
                {eventsError}
              </div>
            )}

            {!eventsLoading && !eventsError && events.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-12 text-center">
                <CalendarHeart className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-300 font-medium">No events yet</p>
                <p className="text-sm text-slate-500 mt-1 mb-4">
                  Create your first event to start assigning tasks.
                </p>
                <button
                  onClick={() => setMode('create')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-medium transition"
                >
                  <Plus className="w-4 h-4" />
                  Create event
                </button>
              </div>
            )}

            {!eventsLoading && filteredEvents.length === 0 && events.length > 0 && (
              <p className="text-sm text-slate-500 text-center py-8">No matches for “{query}”</p>
            )}

            <ul className="space-y-2.5">
              {filteredEvents.map((ev) => (
                <li
                  key={ev.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden hover:border-slate-600 transition"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/e/${ev.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-800/60"
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                      <CalendarHeart className="w-5 h-5 text-brand-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{ev.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <span>{new Date(ev.createdAt).toLocaleDateString()}</span>
                        {ev.location && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="truncate max-w-[12rem]">{ev.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-600 shrink-0" />
                  </button>
                  <div className="flex border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(ev)
                        setEditForm(fromEvent(ev))
                        setError('')
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <div className="w-px bg-slate-800" />
                    <button
                      type="button"
                      onClick={() => {
                        setDeleting(ev)
                        setError('')
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-red-400/90 hover:text-red-300 hover:bg-red-500/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {mode === 'create' && (
          <div className="max-w-md pb-8">
            <button
              type="button"
              onClick={() => setMode('home')}
              className="text-sm text-slate-400 hover:text-white mb-4 transition"
            >
              ← Back
            </button>
            <h2 className="text-xl font-semibold mb-1">New event</h2>
            <p className="text-sm text-slate-400 mb-5">
              Fill in the details. Share the event link with helpers after creating.
            </p>
            <form onSubmit={handleCreate} className="space-y-4">
              <EventFieldsForm values={form} onChange={setForm} idPrefix="create" />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={busy || !form.title.trim()}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 font-medium disabled:opacity-50 transition"
              >
                {busy ? 'Creating...' : 'Create event'}
              </button>
            </form>
          </div>
        )}
      </main>

      <AppFooter />

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl p-5 border border-slate-700 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Edit event</h2>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <EventFieldsForm values={editForm} onChange={setEditForm} idPrefix="edit" />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={actionBusy || !editForm.title.trim()}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 font-medium disabled:opacity-50 transition"
              >
                {actionBusy ? 'Saving...' : 'Save changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl p-5 border border-slate-700 shadow-xl">
            <h2 className="text-lg font-semibold mb-2">Delete event?</h2>
            <p className="text-sm text-slate-400 mb-5">
              <span className="text-white font-medium">{deleting.title}</span> and all of its
              tasks will be permanently deleted. This cannot be undone.
            </p>
            {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionBusy}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 font-medium disabled:opacity-50 transition text-sm"
              >
                {actionBusy ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
