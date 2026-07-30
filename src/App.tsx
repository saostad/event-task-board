import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'
import { Home } from './pages/Home'
import { EventBoard } from './components/EventBoard'
import { useAuth } from './hooks/useAuth'
import { GoogleSignInButton } from './components/GoogleSignInButton'
import { CalendarHeart } from 'lucide-react'

function EventPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { user, displayName, updateName, loading, login, authError } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    )
  }

  // Shared link opened while logged out → must sign in with Google first
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex p-4 rounded-3xl bg-brand-500/10 mb-6">
            <CalendarHeart className="w-12 h-12 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Join this event</h1>
          <p className="text-slate-400 mb-8">
            Sign in with Google to view tasks and volunteer.
          </p>

          <GoogleSignInButton onClick={login} label="Sign in to join" />

          {authError && (
            <p className="mt-4 text-sm text-red-400">{authError}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <EventBoard
      eventId={eventId!}
      displayName={displayName || user.displayName || user.email || 'User'}
      onUpdateName={updateName}
      userUid={user.uid}
    />
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/e/:eventId" element={<EventPage />} />
      </Routes>
    </BrowserRouter>
  )
}
