import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, LogIn, CalendarHeart } from 'lucide-react'
import { createEvent, findEventByCode } from '../hooks/useEvent'
import { useAuth } from '../hooks/useAuth'
import { NamePrompt } from '../components/NamePrompt'

export function Home() {
  const navigate = useNavigate()
  const { user, displayName, loading, updateName } = useAuth()
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home')
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showName, setShowName] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !user) return
    if (!displayName) {
      setShowName(true)
      return
    }
    setBusy(true)
    setError('')
    try {
      const id = await createEvent(title, displayName, user.uid)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Starting...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-flex p-4 rounded-3xl bg-brand-500/10 mb-4">
              <CalendarHeart className="w-12 h-12 text-brand-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Event Task Board</h1>
            <p className="mt-2 text-slate-400">
              List the things that need to happen.<br />
              People volunteer. Everyone sees what’s left.
            </p>
          </div>

          {mode === 'home' && (
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

      <footer className="text-center text-xs text-slate-600 pb-6">
        Install as app · Works offline after first load
      </footer>

      {(showName || (mode === 'create' && !displayName)) && (
        <NamePrompt
          currentName={displayName}
          onSave={async (n) => {
            await updateName(n)
            setShowName(false)
          }}
          onClose={displayName ? () => setShowName(false) : undefined}
        />
      )}
    </div>
  )
}
