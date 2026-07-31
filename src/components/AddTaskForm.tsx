import { useState, useRef } from 'react'
import { Plus, X, MapPin, Paperclip, File, Phone } from 'lucide-react'
import { formatPhoneInput, compressImagesInFiles } from '../lib/utils'
import { VoiceNoteControl } from './VoiceNoteControl'

interface Props {
  onAdd: (data: {
    title: string
    description?: string
    deadline?: string | null
    capacity?: number
    location?: string | null
    phone?: string | null
    files?: File[]
    voiceBlob?: Blob | null
    voiceDurationMs?: number
  }) => Promise<void>
  onClose: () => void
}

export function AddTaskForm({ onAdd, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [capacity, setCapacity] = useState(1)
  const [location, setLocation] = useState('')
  const [phone, setPhone] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null)
  const [voiceDurationMs, setVoiceDurationMs] = useState(0)
  const [loading, setLoading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    try {
      await onAdd({
        title,
        description,
        deadline: deadline || null,
        capacity: Math.max(1, capacity),
        location: location.trim() || null,
        phone: phone.trim() || null,
        files: files.length > 0 ? files : undefined,
        voiceBlob,
        voiceDurationMs
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    // Allow larger originals for images (we compress); keep 10MB for non-images
    const candidates = selected.filter((f) => {
      if (f.type.startsWith('image/')) return f.size <= 25 * 1024 * 1024
      return f.size <= 10 * 1024 * 1024
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (candidates.length === 0) return

    setCompressing(true)
    try {
      const processed = await compressImagesInFiles(candidates, 0.3)
      setFiles((prev) => [...prev, ...processed].slice(0, 5))
    } finally {
      setCompressing(false)
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
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
              placeholder="e.g. Pick up cake from bakery"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Instructions / details</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Any notes or how-to..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <VoiceNoteControl
            localBlob={voiceBlob}
            onRecorded={(blob, durationMs) => {
              setVoiceBlob(blob)
              setVoiceDurationMs(durationMs)
            }}
            onCleared={() => {
              setVoiceBlob(null)
              setVoiceDurationMs(0)
            }}
            disabled={loading}
          />

          <div>
            <label className="block text-sm text-slate-400 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Location / address
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. 123 Main St, Atlanta"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Phone number
            </label>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
              placeholder="e.g. (678) 555-1234"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              People can tap this number to call (e.g. the store or contact for pickup).
            </p>
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

          <div>
            <label className="block text-sm text-slate-400 mb-1 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" /> Attachments
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={handleFileChange}
              className="hidden"
              id="task-files"
            />
            <label
              htmlFor="task-files"
              className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-slate-600 rounded-xl text-slate-400 hover:border-brand-500 hover:text-brand-400 cursor-pointer transition text-sm"
            >
              <Paperclip className="w-4 h-4" />
              {compressing
                ? 'Compressing images…'
                : 'Add files (photos compressed to 30%)'}
            </label>

            {files.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {files.map((file, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm bg-slate-800 rounded-lg px-3 py-2"
                  >
                    <File className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate flex-1">{file.name}</span>
                    <span className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="p-1 text-slate-400 hover:text-red-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || compressing || !title.trim()}
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
