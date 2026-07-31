import { useState, useRef } from 'react'
import {
  X,
  MapPin,
  Phone,
  Save,
  Paperclip,
  File,
  Clock,
  Users,
  Mic,
  AlignLeft
} from 'lucide-react'
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

type OptionalField = 'description' | 'location' | 'phone' | 'deadline' | 'capacity' | 'voice' | 'files'

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function initialVisible(task: Task): Set<OptionalField> {
  const s = new Set<OptionalField>()
  if (task.description?.trim()) s.add('description')
  if (task.location) s.add('location')
  if (task.phone) s.add('phone')
  if (task.deadline) s.add('deadline')
  if (task.capacity && task.capacity > 1) s.add('capacity')
  if (task.voiceNote?.url) s.add('voice')
  if (task.attachments && task.attachments.length > 0) s.add('files')
  return s
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
  const [visible, setVisible] = useState<Set<OptionalField>>(() => initialVisible(task))
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalFiles = attachments.length + newFiles.length

  const show = (field: OptionalField) => setVisible((prev) => new Set(prev).add(field))

  const hide = (field: OptionalField) => {
    setVisible((prev) => {
      const next = new Set(prev)
      next.delete(field)
      return next
    })
    if (field === 'description') setDescription('')
    if (field === 'location') setLocation('')
    if (field === 'phone') setPhone('')
    if (field === 'deadline') setDeadline('')
    if (field === 'capacity') setCapacity(1)
    if (field === 'voice') {
      setVoiceBlob(null)
      setVoiceDurationMs(0)
      setVoiceNote(null)
      setClearVoice(true)
    }
    if (field === 'files') {
      setAttachments([])
      setNewFiles([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError('')
    try {
      await onSave({
        title,
        description: visible.has('description') ? description : '',
        deadline: visible.has('deadline') && deadline ? deadline : null,
        capacity: visible.has('capacity') ? Math.max(1, capacity) : 1,
        location: visible.has('location') ? location.trim() || null : null,
        phone: visible.has('phone') ? phone.trim() || null : null,
        attachments: visible.has('files') ? attachments : [],
        newFiles: visible.has('files') && newFiles.length > 0 ? newFiles : undefined,
        voiceNote: visible.has('voice') && !clearVoice ? voiceNote : null,
        voiceBlob: visible.has('voice') ? voiceBlob : null,
        voiceDurationMs: visible.has('voice') ? voiceDurationMs : 0,
        clearVoice: !visible.has('voice') || (clearVoice && !voiceBlob)
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

  const addButtons: { id: OptionalField; label: string; icon: React.ReactNode }[] = [
    { id: 'description', label: 'Details', icon: <AlignLeft className="w-4 h-4" /> },
    { id: 'location', label: 'Location', icon: <MapPin className="w-4 h-4" /> },
    { id: 'phone', label: 'Phone', icon: <Phone className="w-4 h-4" /> },
    { id: 'deadline', label: 'Deadline', icon: <Clock className="w-4 h-4" /> },
    { id: 'capacity', label: 'People', icon: <Users className="w-4 h-4" /> },
    { id: 'voice', label: 'Voice', icon: <Mic className="w-4 h-4" /> },
    { id: 'files', label: 'Files', icon: <Paperclip className="w-4 h-4" /> }
  ]

  const available = addButtons.filter((b) => !visible.has(b.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
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

          {visible.has('description') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-slate-400">Instructions / details</label>
                <button type="button" onClick={() => hide('description')} className="text-slate-500 hover:text-red-400 p-0.5">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
          )}

          {visible.has('voice') && (
            <div className="relative">
              <button
                type="button"
                onClick={() => hide('voice')}
                className="absolute right-0 top-0 z-10 text-slate-500 hover:text-red-400 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
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
            </div>
          )}

          {visible.has('location') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Location
                </label>
                <button type="button" onClick={() => hide('location')} className="text-slate-500 hover:text-red-400 p-0.5">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. 123 Main St, Atlanta"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          {visible.has('phone') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Phone
                </label>
                <button type="button" onClick={() => hide('phone')} className="text-slate-500 hover:text-red-400 p-0.5">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                placeholder="e.g. (678) 555-1234"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          {visible.has('deadline') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Deadline
                </label>
                <button type="button" onClick={() => hide('deadline')} className="text-slate-500 hover:text-red-400 p-0.5">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>
          )}

          {visible.has('capacity') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-slate-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> People needed
                </label>
                <button type="button" onClick={() => hide('capacity')} className="text-slate-500 hover:text-red-400 p-0.5">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="number"
                min={1}
                max={20}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-3 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          {visible.has('files') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-slate-400 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" /> Attachments
                </label>
                <button type="button" onClick={() => hide('files')} className="text-slate-500 hover:text-red-400 p-0.5">
                  <X className="w-4 h-4" />
                </button>
              </div>

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
                    {compressing ? 'Compressing images…' : 'Add files (photos → 30%)'}
                  </label>
                </>
              )}
            </div>
          )}

          {available.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2 text-center">Add more</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {available.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => show(b.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sm text-slate-200 transition"
                  >
                    {b.icon}
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          )}

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
