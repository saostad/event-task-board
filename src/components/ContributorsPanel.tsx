import { useState } from 'react'
import { X, Users, Trash2, Crown } from 'lucide-react'
import type { EventMember } from '../types'

interface Props {
  members: EventMember[]
  loading: boolean
  onRemove: (member: EventMember) => Promise<void>
  onClose: () => void
}

export function ContributorsPanel({ members, loading, onRemove, onClose }: Props) {
  const [busyUid, setBusyUid] = useState<string | null>(null)
  const [confirmUid, setConfirmUid] = useState<string | null>(null)
  const [error, setError] = useState('')

  const contributors = members.filter((m) => m.role !== 'owner')
  const owners = members.filter((m) => m.role === 'owner')

  const handleRemove = async (member: EventMember) => {
    setBusyUid(member.uid)
    setError('')
    try {
      await onRemove(member)
      setConfirmUid(null)
    } catch (err: any) {
      setError(err?.message || 'Could not remove')
    } finally {
      setBusyUid(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" />
            <h2 className="text-lg font-semibold">Contributors</h2>
            <span className="text-xs text-slate-500">
              {loading ? '…' : members.length}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-3 flex-1">
          {loading && (
            <p className="text-sm text-slate-500 py-8 text-center">Loading…</p>
          )}

          {!loading && members.length === 0 && (
            <p className="text-sm text-slate-500 py-8 text-center">
              No one has joined yet. Share the event link.
            </p>
          )}

          {owners.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Owner
              </p>
              <ul className="space-y-2">
                {owners.map((m) => (
                  <li
                    key={m.uid}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60"
                  >
                    {m.photoURL ? (
                      <img
                        src={m.photoURL}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-sm font-medium text-brand-300">
                        {(m.displayName || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate flex items-center gap-1.5">
                        {m.displayName}
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      {m.email && (
                        <div className="text-xs text-slate-500 truncate">{m.email}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {contributors.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Helpers ({contributors.length})
              </p>
              <ul className="space-y-2">
                {contributors.map((m) => (
                  <li
                    key={m.uid}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60"
                  >
                    {m.photoURL ? (
                      <img
                        src={m.photoURL}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium text-slate-300">
                        {(m.displayName || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{m.displayName}</div>
                      {m.email && (
                        <div className="text-xs text-slate-500 truncate">{m.email}</div>
                      )}
                      <div className="text-[11px] text-slate-600">
                        Joined {new Date(m.joinedAt).toLocaleDateString()}
                      </div>
                    </div>

                    {confirmUid === m.uid ? (
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setConfirmUid(null)}
                          className="px-2 py-1 rounded-lg text-xs bg-slate-700"
                          disabled={busyUid === m.uid}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(m)}
                          disabled={busyUid === m.uid}
                          className="px-2 py-1 rounded-lg text-xs bg-red-600 hover:bg-red-500 disabled:opacity-50"
                        >
                          {busyUid === m.uid ? '…' : 'Remove'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmUid(m.uid)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                        title="Remove contributor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!loading && contributors.length === 0 && owners.length > 0 && (
            <p className="text-sm text-slate-500 py-4 text-center">
              No helpers yet. Share the link so people can join.
            </p>
          )}

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </div>

        <div className="px-5 py-3 border-t border-slate-800 text-xs text-slate-500">
          Removing someone unclaims them from open tasks. They can rejoin with the same link
          unless you stop sharing it.
        </div>
      </div>
    </div>
  )
}
