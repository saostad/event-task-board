import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { subscribeToasts, type ToastPayload } from '../lib/toast'

export function InAppToast() {
  const [toasts, setToasts] = useState<ToastPayload[]>([])

  useEffect(() => {
    return subscribeToasts((toast) => {
      setToasts((prev) => [...prev, toast].slice(-3))
      const duration = toast.durationMs ?? 4500
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, duration)
    })
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-3 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto w-full max-w-md rounded-2xl border border-brand-500/40 bg-slate-900/95 backdrop-blur shadow-xl shadow-black/40 px-4 py-3 flex items-start gap-3 animate-[slideDown_0.25s_ease-out]"
          role="status"
        >
          <div className="p-1.5 rounded-full bg-brand-500/20 shrink-0">
            <Bell className="w-4 h-4 text-brand-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white leading-snug">{toast.title}</p>
            {toast.body && (
              <p className="text-xs text-slate-300 mt-0.5 leading-snug line-clamp-2">{toast.body}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
