import { useEffect, useState, useCallback } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
  updateDoc,
  orderBy,
  query,
  arrayUnion
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { EventMember, Task, TaskStatus } from '../types'

function statusFromClaims(claimedCount: number, capacity: number): TaskStatus {
  if (claimedCount === 0) return 'open'
  if (claimedCount >= capacity) return 'claimed'
  return 'open'
}

export function useEventMembers(
  eventId: string | undefined,
  options?: {
    uid?: string
    displayName?: string
    email?: string | null
    photoURL?: string | null
    isOwner?: boolean
    /** From ?invite= in the URL */
    inviteFromUrl?: string | null
    /** Current event.inviteToken */
    eventInviteToken?: string | null
    /** Current event.blockedUids */
    blockedUids?: string[]
    /** Called when join is refused */
    onJoinDenied?: (reason: 'blocked' | 'invalid_invite') => void
  }
) {
  const [members, setMembers] = useState<EventMember[]>([])
  const [loading, setLoading] = useState(true)
  const [joinDenied, setJoinDenied] = useState<'blocked' | 'invalid_invite' | null>(null)

  useEffect(() => {
    if (!eventId) {
      setMembers([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'events', eventId, 'members'),
      orderBy('joinedAt', 'asc')
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: EventMember[] = []
        snap.forEach((d) => list.push({ uid: d.id, ...d.data() } as EventMember))
        setMembers(list)
        setLoading(false)
      },
      (err) => {
        console.error('members error', err)
        setLoading(false)
      }
    )

    return () => unsub()
  }, [eventId])

  // Auto-register (or refuse) current user
  useEffect(() => {
    if (!eventId || !options?.uid || !options.displayName) return

    const uid = options.uid
    const blocked = options.blockedUids || []

    if (blocked.includes(uid)) {
      setJoinDenied('blocked')
      options.onJoinDenied?.('blocked')
      return
    }

    const alreadyMember = members.some((m) => m.uid === uid)
    const isOwner = !!options.isOwner

    // New joiners need a matching invite token when the event has one
    if (!alreadyMember && !isOwner) {
      const required = options.eventInviteToken
      if (required) {
        if (!options.inviteFromUrl || options.inviteFromUrl !== required) {
          setJoinDenied('invalid_invite')
          options.onJoinDenied?.('invalid_invite')
          return
        }
      }
    }

    setJoinDenied(null)

    const memberRef = doc(db, 'events', eventId, 'members', uid)
    setDoc(
      memberRef,
      {
        displayName: options.displayName,
        email: options.email || null,
        photoURL: options.photoURL || null,
        joinedAt: Date.now(),
        role: isOwner ? 'owner' : 'contributor'
      },
      { merge: true }
    ).catch((err) => console.error('join member failed', err))
  }, [
    eventId,
    options?.uid,
    options?.displayName,
    options?.email,
    options?.photoURL,
    options?.isOwner,
    options?.inviteFromUrl,
    options?.eventInviteToken,
    options?.blockedUids,
    members
  ])

  const removeMember = useCallback(
    async (member: EventMember) => {
      if (!eventId) return
      if (member.role === 'owner') return

      const tasksSnap = await getDocs(collection(db, 'events', eventId, 'tasks'))
      const updates: Promise<void>[] = []

      tasksSnap.forEach((t) => {
        const data = t.data() as Task
        if (!data.claimedBy?.includes(member.displayName)) return
        if (data.status === 'done') return

        const newClaimed = data.claimedBy.filter((n) => n !== member.displayName)
        updates.push(
          updateDoc(t.ref, {
            claimedBy: newClaimed,
            status: statusFromClaims(newClaimed.length, data.capacity || 1)
          })
        )
      })

      await Promise.all(updates)
      await deleteDoc(doc(db, 'events', eventId, 'members', member.uid))

      // Block rejoin even with a valid invite link
      await updateDoc(doc(db, 'events', eventId), {
        blockedUids: arrayUnion(member.uid)
      })
    },
    [eventId]
  )

  return { members, loading, removeMember, joinDenied }
}
