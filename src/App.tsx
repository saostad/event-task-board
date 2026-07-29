import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { EventBoard } from './components/EventBoard'
import { useAuth } from './hooks/useAuth'
import { useParams } from 'react-router-dom'

function EventPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const { user, displayName, updateName, loading } = useAuth()

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    )
  }

  return (
    <EventBoard
      eventId={eventId!}
      displayName={displayName}
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
