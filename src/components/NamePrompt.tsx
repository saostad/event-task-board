import { useState } from 'react'
import { User } from 'lucide-react'

interface Props {
  currentName: string
  onSave: (name: string) => void
  onClose?: () => void
}

export function NamePrompt({ currentName, onSave, onClose }: Props) {
  const [name, setName] = useState(currentName)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setError('Please enter at least 2 characters')
      return
    }
    onSave(trimmed)
    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-brand-500/20 rounded-full">
            <User className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Your name</h2>
            <p className="text-sm text-slate-400">
              This will be shown when you claim tasks
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            placeholder="e.g. Saeid or Aunt Mary"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            maxLength={40}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 transition"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 font-medium transition"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
