import { useState } from 'react'
import { Plus, X } from 'lucide-react'

interface Props {
  onAdd: (data: {
    title: string
    description?: string
    deadline?: string | null
    capacity?: number
  }) => Promise<void>
  onClose: () => void
}

export function AddTaskForm({ onAdd, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [capacity, setCapacity] = useState(1)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    try {
      await onAdd({
        title,
        description,
        deadline: deadline || null,
        capacity: Math.max(1, capacity)
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-slate-900 rounded-2xl p-5 shadow-xl border border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Task</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Title *</label>
            <input
              autoFocus
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Set up ceremony chairs"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Instructions / details</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Any notes, location, or how-to..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Deadline</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">People needed</label>
              <input
                type="number"
                min={1}
                max={20}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-3 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 font-medium disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {loading ? 'Adding...' : 'Add Task'}
          </button>
        </form>
      </div>
    </div>
  )
}
