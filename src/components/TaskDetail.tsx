import { useState } from 'react'
import {
  ArrowLeft,
  Check,
  Clock,
  UserPlus,
  UserMinus,
  Trash2,
  RotateCcw,
  AlertCircle,
  MapPin,
  Paperclip,
  ExternalLink,
  Phone,
  Pencil,
  X,
  Users
} from 'lucide-react'
import type { Task } from '../types'
import { formatDeadline, isOverdue, cn } from '../lib/utils'
import { VoiceNotePlayer } from './VoiceNoteControl'

interface Props {
  task: Task
  currentName: string
  isOwner: boolean
  onClose: () => void
  onClaim: (id: string) => void
  onUnclaim: (id: string, name?: string) => void
  onDone: (id: string) => void
  onReopen: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

function isImageAttachment(type: string, name: string) {
  if (type.startsWith('image/')) return true
  return /\.(jpe?g|png|webp|gif)$/i.test(name)
}

export function TaskDetail({
  task,
  currentName,
  isOwner,
  onClose,
  onClaim,
  onUnclaim,
  onDone,
  onReopen,
  onDelete,
  onEdit
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isClaimedByMe = task.claimedBy.includes(currentName)
  const isFull = task.claimedBy.length >= task.capacity
  const overdue = isOverdue(task.deadline) && task.status !== 'done'
  const hasAttachments = task.attachments && task.attachments.length > 0

  const mapsUrl = task.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.location)}`
    : null

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="max-w-2xl mx-auto px-3 h-14 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-1 rounded-xl hover:bg-slate-800 transition"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-slate-500">Task</div>
            <div className="text-sm font-medium truncate">Details</div>
          </div>
          {isOwner && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 transition"
              title="Edit"
            >
              <Pencil className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-5 pb-32 space-y-5">
          {/* Title + status */}
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {task.status === 'done' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">
                  <Check className="w-3.5 h-3.5" /> Done
                </span>
              )}
              {task.status === 'claimed' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-medium">
                  Claimed
                </span>
              )}
              {task.status === 'open' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium">
                  Open
                </span>
              )}
              {overdue && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> Overdue
                </span>
              )}
            </div>

            <h1
              className={cn(
                'text-2xl font-bold leading-tight',
                task.status === 'done' && 'line-through text-slate-400'
              )}
            >
              {task.title}
            </h1>
          </div>

          {/* Description */}
          {task.description?.trim() && (
            <section>
              <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Instructions
              </h2>
              <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>
            </section>
          )}

          {/* Voice */}
          {task.voiceNote?.url && (
            <section>
              <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Voice note
              </h2>
              <VoiceNotePlayer url={task.voiceNote.url} durationMs={task.voiceNote.durationMs} />
            </section>
          )}

          {/* Meta grid */}
          <section className="grid gap-3">
            {task.deadline && (
              <div className="flex items-start gap-3 rounded-xl bg-slate-900 border border-slate-800 px-4 py-3">
                <Clock className={cn('w-5 h-5 mt-0.5', overdue ? 'text-amber-400' : 'text-slate-400')} />
                <div>
                  <div className="text-xs text-slate-500">Deadline</div>
                  <div className={cn('text-sm font-medium', overdue && 'text-amber-300')}>
                    {formatDeadline(task.deadline)}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 rounded-xl bg-slate-900 border border-slate-800 px-4 py-3">
              <Users className="w-5 h-5 mt-0.5 text-slate-400" />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-slate-500">People</div>
                <div className="text-sm font-medium">
                  {task.claimedBy.length}/{task.capacity} claimed
                </div>
                {task.claimedBy.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {task.claimedBy.map((name) => (
                      <span
                        key={name}
                        className={cn(
                          'text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1',
                          name === currentName
                            ? 'bg-brand-500/30 text-brand-200'
                            : 'bg-slate-800 text-slate-300'
                        )}
                      >
                        {name}
                        {isOwner && task.status !== 'done' && (
                          <button
                            type="button"
                            title={`Remove ${name}`}
                            onClick={() => onUnclaim(task.id, name)}
                            className="ml-0.5 p-0.5 rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {task.location && (
              <a
                href={mapsUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 hover:border-brand-500/40 transition"
              >
                <MapPin className="w-5 h-5 mt-0.5 text-brand-400" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-500">Location</div>
                  <div className="text-sm font-medium text-brand-300 underline underline-offset-2">
                    {task.location}
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 mt-1" />
              </a>
            )}

            {task.phone && (
              <a
                href={telHref(task.phone)}
                className="flex items-start gap-3 rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 hover:border-emerald-500/40 transition"
              >
                <Phone className="w-5 h-5 mt-0.5 text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-500">Phone</div>
                  <div className="text-sm font-medium text-emerald-300 underline underline-offset-2">
                    {task.phone}
                  </div>
                </div>
              </a>
            )}
          </section>

          {/* Attachments */}
          {hasAttachments && (
            <section>
              <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" /> Attachments
              </h2>
              <div className="space-y-2">
                {task.attachments!.map((att, i) => {
                  const isImg = isImageAttachment(att.type, att.name)
                  return (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl bg-slate-900 border border-slate-800 overflow-hidden hover:border-slate-600 transition"
                    >
                      {isImg && (
                        <img
                          src={att.url}
                          alt={att.name}
                          className="w-full max-h-64 object-cover bg-slate-800"
                        />
                      )}
                      <div className="flex items-center gap-2 px-3 py-2.5 text-sm">
                        <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate flex-1 text-slate-200">{att.name}</span>
                        <span className="text-xs text-slate-500">{formatFileSize(att.size)}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </a>
                  )
                })}
              </div>
            </section>
          )}

          {!task.description?.trim() &&
            !task.voiceNote?.url &&
            !task.location &&
            !task.phone &&
            !task.deadline &&
            !hasAttachments && (
              <p className="text-sm text-slate-500 text-center py-6">
                No extra details on this task.
              </p>
            )}
        </div>
      </main>

      {/* Bottom actions */}
      <div className="sticky bottom-0 border-t border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-3 flex flex-wrap gap-2">
          {task.status !== 'done' && (
            <>
              {!isClaimedByMe && !isFull && currentName && (
                <button
                  onClick={() => onClaim(task.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-sm font-medium transition"
                >
                  <UserPlus className="w-4 h-4" /> Claim
                </button>
              )}

              {isClaimedByMe && (
                <button
                  onClick={() => onUnclaim(task.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm transition"
                >
                  <UserMinus className="w-4 h-4" /> Unclaim
                </button>
              )}

              {(isClaimedByMe || isOwner) && (
                <button
                  onClick={() => onDone(task.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-sm font-medium transition"
                >
                  <Check className="w-4 h-4" /> Mark done
                </button>
              )}
            </>
          )}

          {task.status === 'done' && (isOwner || isClaimedByMe) && (
            <button
              onClick={() => onReopen(task.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm transition"
            >
              <RotateCcw className="w-4 h-4" /> Reopen
            </button>
          )}

          {isOwner && (
            <>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-sm transition ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-700 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onDelete(task.id)
                      onClose()
                    }}
                    className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-sm"
                  >
                    Delete
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
