import { useState } from 'react'
import {
  Check,
  Clock,
  UserPlus,
  UserMinus,
  Trash2,
  RotateCcw,
  AlertCircle,
  MapPin,
  Paperclip,
  ExternalLink
} from 'lucide-react'
import type { Task } from '../types'
import { formatDeadline, isOverdue, cn } from '../lib/utils'

interface Props {
  task: Task
  currentName: string
  isOwner: boolean
  onClaim: (id: string) => void
  onUnclaim: (id: string) => void
  onDone: (id: string) => void
  onReopen: (id: string) => void
  onDelete: (id: string) => void
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function TaskCard({
  task,
  currentName,
  isOwner,
  onClaim,
  onUnclaim,
  onDone,
  onReopen,
  onDelete
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
    <div
      className={cn(
        'rounded-2xl border p-4 transition-all',
        task.status === 'done'
          ? 'bg-slate-900/50 border-slate-700/50 opacity-70'
          : 'bg-slate-900 border-slate-700',
        overdue && 'border-amber-500/50'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              'font-semibold text-base leading-snug',
              task.status === 'done' && 'line-through text-slate-400'
            )}
          >
            {task.title}
          </h3>

          {task.description && (
            <p className="mt-1 text-sm text-slate-400 whitespace-pre-wrap">
              {task.description}
            </p>
          )}

          {/* Location */}
          {task.location && (
            <a
              href={mapsUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="underline underline-offset-2">{task.location}</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          )}

          {/* Meta badges */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {task.deadline && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-full',
                  overdue
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-slate-800 text-slate-300'
                )}
              >
                {overdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {formatDeadline(task.deadline)}
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800 text-slate-300">
              {task.claimedBy.length}/{task.capacity} claimed
            </span>

            {hasAttachments && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800 text-slate-300">
                <Paperclip className="w-3 h-3" />
                {task.attachments!.length}
              </span>
            )}

            {task.status === 'done' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
                <Check className="w-3 h-3" /> Done
              </span>
            )}
          </div>

          {/* Claimed by */}
          {task.claimedBy.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {task.claimedBy.map((name) => (
                <span
                  key={name}
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    name === currentName
                      ? 'bg-brand-500/30 text-brand-200'
                      : 'bg-slate-800 text-slate-300'
                  )}
                >
                  {name}
                </span>
              ))}
            </div>
          )}

          {/* Attachments list */}
          {hasAttachments && (
            <div className="mt-3 space-y-1.5">
              {task.attachments!.map((att, i) => (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm bg-slate-800/70 hover:bg-slate-800 rounded-lg px-3 py-2 transition"
                >
                  <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate flex-1 text-slate-200">{att.name}</span>
                  <span className="text-xs text-slate-500">{formatFileSize(att.size)}</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {task.status !== 'done' && (
          <>
            {!isClaimedByMe && !isFull && currentName && (
              <button
                onClick={() => onClaim(task.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-sm font-medium transition"
              >
                <UserPlus className="w-4 h-4" /> Claim
              </button>
            )}

            {isClaimedByMe && (
              <button
                onClick={() => onUnclaim(task.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm transition"
              >
                <UserMinus className="w-4 h-4" /> Unclaim
              </button>
            )}

            {(isClaimedByMe || isOwner) && (
              <button
                onClick={() => onDone(task.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-sm font-medium transition"
              >
                <Check className="w-4 h-4" /> Mark done
              </button>
            )}
          </>
        )}

        {task.status === 'done' && (isOwner || isClaimedByMe) && (
          <button
            onClick={() => onReopen(task.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm transition"
          >
            <RotateCcw className="w-4 h-4" /> Reopen
          </button>
        )}

        {isOwner && (
          <>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-sm transition ml-auto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-sm"
                >
                  Delete
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
