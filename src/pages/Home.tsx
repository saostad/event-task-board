import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, LogIn, CalendarHeart, LogOut } from 'lucide-react'
import { createEvent, findEventByCode } from '../hooks/useEvent'
import { useAuth } from '../hooks/useAuth'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { AppFooter } from '../components/AppFooter'

export function Home() {
  const navigate = useNavigate()
  const { user, displayName, loading, login, logout, authError } = useAuth()
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home')
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

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
      <div className="flex-1 flex flex-col items-center justify-center p-6">
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
              <p className="text-xs text-slate-500 text-center">
                After creating you’ll get a shareable link for contributors.
              </p>
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
    </div>
  )
}
