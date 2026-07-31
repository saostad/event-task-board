import {
  Check,
  Clock,
  UserPlus,
  AlertCircle,
  MapPin,
  Paperclip,
  Phone,
  Mic,
  ChevronRight
} from 'lucide-react'
import type { Task } from '../types'
import { formatDeadline, isOverdue, cn } from '../lib/utils'

interface Props {
  task: Task
  currentName: string
  isOwner: boolean
  onOpen: (task: Task) => void
  onClaim: (id: string) => void
}

export function TaskCard({ task, currentName, onOpen, onClaim }: Props) {
  const isClaimedByMe = task.claimedBy.includes(currentName)
  const isFull = task.claimedBy.length >= task.capacity
  const overdue = isOverdue(task.deadline) && task.status !== 'done'
  const hasAttachments = task.attachments && task.attachments.length > 0

  return (
    <div
      className={cn(
        'rounded-2xl border transition-all',
        task.status === 'done'
          ? 'bg-slate-900/50 border-slate-700/50 opacity-70'
          : 'bg-slate-900 border-slate-700',
        overdue && 'border-amber-500/50'
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(task)}
        className="w-full text-left p-4 active:bg-slate-800/40 rounded-2xl"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                'font-semibold text-base leading-snug',
                task.status === 'done' && 'line-through text-slate-400'
              )}
            >
              {task.title}
            </h3>

            {task.description?.trim() && (
              <p className="mt-1 text-sm text-slate-400 line-clamp-2">{task.description}</p>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
              {task.status === 'done' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  <Check className="w-3 h-3" /> Done
                </span>
              )}

              {task.deadline && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
                    overdue
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-800 text-slate-300'
                  )}
                >
                  {overdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {formatDeadline(task.deadline)}
                </span>
              )}

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {task.claimedBy.length}/{task.capacity}
              </span>

              {task.location && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  <MapPin className="w-3 h-3" />
                </span>
              )}
              {task.phone && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  <Phone className="w-3 h-3" />
                </span>
              )}
              {task.voiceNote?.url && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  <Mic className="w-3 h-3" />
                </span>
              )}
              {hasAttachments && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  <Paperclip className="w-3 h-3" />
                  {task.attachments!.length}
                </span>
              )}
            </div>

            {task.claimedBy.length > 0 && (
              <div className="mt-2 text-xs text-slate-400 truncate">
                {task.claimedBy.join(', ')}
              </div>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
        </div>
      </button>

      {/* Quick claim without opening */}
      {task.status !== 'done' && !isClaimedByMe && !isFull && currentName && (
        <div className="px-4 pb-3 -mt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClaim(task.id)
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-sm font-medium transition"
          >
            <UserPlus className="w-4 h-4" /> Claim
          </button>
        </div>
      )}
    </div>
  )
}
