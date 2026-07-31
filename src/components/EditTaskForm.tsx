import { useState, useRef } from 'react'
import { X, MapPin, Phone, Save, Paperclip, File } from 'lucide-react'
import type { Task, Attachment, VoiceNote } from '../types'
import { formatPhoneInput, compressImagesInFiles } from '../lib/utils'
import { VoiceNoteControl } from './VoiceNoteControl'

export type TaskEditData = {
  title: string
  description?: string
  deadline?: string | null
  capacity?: number
  location?: string | null
  phone?: string | null
  attachments?: Attachment[]
  newFiles?: File[]
  voiceNote?: VoiceNote | null
  voiceBlob?: Blob | null
  voiceDurationMs?: number
  clearVoice?: boolean
}

interface Props {
  task: Task
  onSave: (data: TaskEditData) => Promise<void>
  onClose: () => void
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function EditTaskForm({ task, onSave, onClose }: Props) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [deadline, setDeadline] = useState(task.deadline || '')
  const [capacity, setCapacity] = useState(task.capacity || 1)
  const [location, setLocation] = useState(task.location || '')
  const [phone, setPhone] = useState(formatPhoneInput(task.phone || ''))
  const [attachments, setAttachments] = useState<Attachment[]>(task.attachments || [])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [voiceNote, setVoiceNote] = useState<VoiceNote | null>(task.voiceNote || null)
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null)
  const [voiceDurationMs, setVoiceDurationMs] = useState(task.voiceNote?.durationMs || 0)
  const [clearVoice, setClearVoice] = useState(false)
  const [loading, setLoading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalFiles = attachments.length + newFiles.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError('')
    try {
      await onSave({
        title,
        description,
        deadline: deadline || null,
        capacity: Math.max(1, capacity),
        location: location.trim() || null,
        phone: phone.trim() || null,
        attachments,
        newFiles: newFiles.length > 0 ? newFiles : undefined,
        voiceNote: clearVoice ? null : voiceNote,
        voiceBlob,
        voiceDurationMs,
        clearVoice: clearVoice && !voiceBlob
      })
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    const room = Math.max(0, 5 - attachments.length - newFiles.length)
    const candidates = selected
      .filter((f) => {
        if (f.type.startsWith('image/')) return f.size <= 25 * 1024 * 1024
        return f.size <= 10 * 1024 * 1024
      })
      .slice(0, room)

    if (fileInputRef.current) fileInputRef.current.value = ''
    if (candidates.length === 0) return

    setCompressing(true)
    try {
      const processed = await compressImagesInFiles(candidates, 0.3)
      setNewFiles((prev) => [...prev, ...processed].slice(0, Math.max(0, 5 - attachments.length)))
    } finally {
      setCompressing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-slate-900 rounded-2xl p-5 shadow-xl border border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Edit task</h2>
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
            existingUrl={!clearVoice && !voiceBlob ? voiceNote?.url : null}
            existingDurationMs={voiceNote?.durationMs}
            localBlob={voiceBlob}
            onRecorded={(blob, durationMs) => {
              setVoiceBlob(blob)
              setVoiceDurationMs(durationMs)
              setClearVoice(false)
            }}
            onCleared={() => {
              setVoiceBlob(null)
              setVoiceDurationMs(0)
              setVoiceNote(null)
              setClearVoice(true)
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

            {attachments.length > 0 && (
              <ul className="mb-2 space-y-1.5">
                {attachments.map((att, i) => (
                  <li
                    key={`${att.url}-${i}`}
                    className="flex items-center gap-2 text-sm bg-slate-800 rounded-lg px-3 py-2"
                  >
                    <File className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate flex-1">{att.name}</span>
                    <span className="text-xs text-slate-500">{formatFileSize(att.size)}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                      className="p-1 text-slate-400 hover:text-red-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {newFiles.length > 0 && (
              <ul className="mb-2 space-y-1.5">
                {newFiles.map((file, i) => (
                  <li
                    key={`new-${i}`}
                    className="flex items-center gap-2 text-sm bg-slate-800/70 border border-dashed border-slate-600 rounded-lg px-3 py-2"
                  >
                    <File className="w-4 h-4 text-brand-400 shrink-0" />
                    <span className="truncate flex-1">{file.name}</span>
                    <span className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(0)} KB · new
                    </span>
                    <button
                      type="button"
                      onClick={() => setNewFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="p-1 text-slate-400 hover:text-red-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {totalFiles < 5 && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                  id="edit-task-files"
                />
                <label
                  htmlFor="edit-task-files"
                  className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-slate-600 rounded-xl text-slate-400 hover:border-brand-500 hover:text-brand-400 cursor-pointer transition text-sm"
                >
                  <Paperclip className="w-4 h-4" />
                  {compressing
                    ? 'Compressing images…'
                    : 'Add files (photos compressed to 30%)'}
                </label>
              </>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || compressing || !title.trim()}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 font-medium disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
