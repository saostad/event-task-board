import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  LogIn,
  CalendarHeart,
  LogOut,
  Pencil,
  Trash2,
  ChevronRight,
  X
} from 'lucide-react'
import { createEvent, findEventByCode } from '../hooks/useEvent'
import { useMyEvents } from '../hooks/useMyEvents'
import { useAuth } from '../hooks/useAuth'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { AppFooter } from '../components/AppFooter'
import type { EventDoc } from '../types'

export function Home() {
  const navigate = useNavigate()
  const { user, displayName, loading, login, logout, authError } = useAuth()
  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    renameEvent,
    deleteEvent
  } = useMyEvents(user?.uid)

  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home')
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Edit / delete UI state
  const [editing, setEditing] = useState<EventDoc | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [deleting, setDeleting] = useState<EventDoc | null>(null)
  const [actionBusy, setActionBusy] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !user) return
    setBusy(true)
    setError('')
    try {
      const name = displayName || user.displayName || user.email || 'Owner'
      const id = await createEvent(title, name, user.uid)
      navigate(`/e/${id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create event')
    } finally {
      setBusy(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setBusy(true)
    setError('')
    try {
      const id = await findEventByCode(code.trim())
      if (!id) {
        setError('No event found with that code')
        return
      }
      navigate(`/e/${id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to join')
    } finally {
      setBusy(false)
    }
  }

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing || !editTitle.trim()) return
    setActionBusy(true)
    try {
      await renameEvent(editing.id, editTitle)
      setEditing(null)
    } catch (err: any) {
      setError(err.message || 'Failed to rename')
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

            {authError && (
              <p className="mt-4 text-sm text-red-400">{authError}</p>
            )}

            <p className="mt-6 text-xs text-slate-500">
              Google is the only sign-in method. No passwords to remember.
            </p>
          </div>
        </div>
        <AppFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center p-6 pt-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 rounded-3xl bg-brand-500/10 mb-4">
              <CalendarHeart className="w-12 h-12 text-brand-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Event Task Board</h1>
            <p className="mt-2 text-slate-400">
              Signed in as{' '}
              <span className="text-white font-medium">
                {displayName || user.email}
              </span>
            </p>
          </div>

          {mode === 'home' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <button
                  onClick={() => setMode('create')}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-brand-600 hover:bg-brand-500 font-medium text-lg transition"
                >
                  <Plus className="w-6 h-6" />
                  Create new event
                </button>
                <button
                  onClick={() => setMode('join')}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 font-medium text-lg transition"
                >
                  <LogIn className="w-6 h-6" />
                  Join with code
                </button>
              </div>

              {/* My Events */}
              <div>
                <h2 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wide">
                  My events
                </h2>

                {eventsLoading && (
                  <p className="text-sm text-slate-500 animate-pulse">Loading events...</p>
                )}

                {eventsError && (
                  <p className="text-sm text-red-400 break-words">{eventsError}</p>
                )}

                {!eventsLoading && !eventsError && events.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No events yet. Create one to get started.
                  </p>
                )}

                <ul className="space-y-2">
                  {events.map((ev) => (
                    <li
                      key={ev.id}
                      className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => navigate(`/e/${ev.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800/80 transition"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{ev.title}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Code{' '}
                            <span className="font-mono text-brand-400">{ev.code}</span>
                            {' · '}
                            {new Date(ev.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
                      </button>
                      <div className="flex border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(ev)
                            setEditTitle(ev.title)
                            setError('')
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleting(ev)
                            setError('')
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition border-l border-slate-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-slate-400 hover:text-slate-200 transition"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}

          {mode === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Event name</label>
                <input
                  autoFocus
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sara & Ali Wedding"
                  className="w-full px-4 py-3.5 bg-slate-800 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-lg"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMode('home')}
                  className="flex-1 py-3.5 rounded-xl bg-slate-700 hover:bg-slate-600 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={busy || !title.trim()}
                  className="flex-1 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 font-medium disabled:opacity-50 transition"
                >
                  {busy ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          )}

          {mode === 'join' && (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Event code</label>
                <input
                  autoFocus
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. X7K9P2"
                  className="w-full px-4 py-3.5 bg-slate-800 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-lg font-mono tracking-widest text-center uppercase"
                  maxLength={8}
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMode('home')}
                  className="flex-1 py-3.5 rounded-xl bg-slate-700 hover:bg-slate-600 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={busy || !code.trim()}
                  className="flex-1 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 font-medium disabled:opacity-50 transition"
                >
                  {busy ? 'Joining...' : 'Join'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <AppFooter />

      {/* Edit event modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Edit event</h2>
              <button
                onClick={() => setEditing(null)}
                className="p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRename} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Event name</label>
                <input
                  autoFocus
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <p className="text-xs text-slate-500">
                Code stays the same: <span className="font-mono text-brand-400">{editing.code}</span>
              </p>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={actionBusy || !editTitle.trim()}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 font-medium disabled:opacity-50 transition"
              >
                {actionBusy ? 'Saving...' : 'Save'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl p-5 border border-slate-700">
            <h2 className="text-lg font-semibold mb-2">Delete event?</h2>
            <p className="text-sm text-slate-400 mb-4">
              <span className="text-white font-medium">{deleting.title}</span> and all of its
              tasks will be permanently deleted. This cannot be undone.
            </p>
            {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionBusy}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 font-medium disabled:opacity-50 transition"
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
