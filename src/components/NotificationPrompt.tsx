import { useEffect, useState } from 'react'
import { Bell, BellOff, X } from 'lucide-react'
import {
  getNotificationStatus,
  setupNotifications,
  type NotificationStatus
} from '../lib/notifications'

export function NotificationPrompt() {
  const [status, setStatus] = useState<NotificationStatus>(() => getNotificationStatus())
  const [busy, setBusy] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setStatus(getNotificationStatus())
  }, [])

  if (dismissed) return null
  if (status === 'granted' || status === 'unsupported') return null

  const handleEnable = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const token = await setupNotifications()
      const next = getNotificationStatus()
      setStatus(next)
      if (token || next === 'granted') {
        setMessage('Notifications enabled')
        setTimeout(() => setDismissed(true), 1500)
      } else if (next === 'denied') {
        setMessage('Permission blocked. Enable it in browser settings for this site.')
      } else if (next === 'missing-key') {
        setMessage('Notification key is missing. Redeploy the app after adding VAPID secret.')
      } else {
        setMessage('Could not enable notifications on this device.')
      }
    } finally {
      setBusy(false)
    }
  }

  if (status === 'denied') {
    return (
      <div className="mx-4 mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
        <div className="flex items-start gap-3">
          <BellOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-amber-200">Notifications blocked</p>
            <p className="text-xs text-amber-200/80 mt-0.5">
              Open site settings in your browser and allow notifications for this site, then
              refresh.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-amber-300/70 hover:bg-amber-500/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  if (status === 'missing-key') {
    return (
      <div className="mx-4 mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
        <div className="flex items-start gap-3">
          <BellOff className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-red-200">Notifications not configured</p>
            <p className="text-xs text-red-200/80 mt-0.5">
              VAPID key is missing in the build. Add VITE_FIREBASE_VAPID_KEY and redeploy hosting.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-red-300/70 hover:bg-red-500/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // status === 'default'
  return (
    <div className="mx-4 mb-3 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3">
      <div className="flex items-start gap-3">
        <Bell className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-brand-100">Get notified of new tasks</p>
          <p className="text-xs text-slate-400 mt-0.5 mb-2">
            Allow notifications so you know when someone adds a task to this event.
          </p>
          {message && <p className="text-xs text-slate-300 mb-2">{message}</p>}
          <button
            type="button"
            onClick={handleEnable}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-sm font-medium disabled:opacity-50 transition"
          >
            <Bell className="w-3.5 h-3.5" />
            {busy ? 'Enabling…' : 'Enable notifications'}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg text-slate-400 hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
