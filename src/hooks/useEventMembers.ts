import { useEffect, useState, useCallback, useRef } from 'react'
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
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { EventMember, BlockedMember, Task, TaskStatus } from '../types'

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
    inviteFromUrl?: string | null
    eventInviteToken?: string | null
    blockedUids?: string[]
  }
) {
  const [members, setMembers] = useState<EventMember[]>([])
  const [blocked, setBlocked] = useState<BlockedMember[]>([])
  const [loading, setLoading] = useState(true)
  const [joinDenied, setJoinDenied] = useState<'blocked' | 'invalid_invite' | null>(null)
  const membersReady = useRef(false)

  useEffect(() => {
    if (!eventId) {
      setMembers([])
      setBlocked([])
      setLoading(false)
      membersReady.current = false
      return
    }

    membersReady.current = false
    const q = query(
      collection(db, 'events', eventId, 'members'),
      orderBy('joinedAt', 'asc')
    )

    const unsubMembers = onSnapshot(
      q,
      (snap) => {
        const list: EventMember[] = []
        snap.forEach((d) => list.push({ uid: d.id, ...d.data() } as EventMember))
        setMembers(list)
        membersReady.current = true
        setLoading(false)
      },
      (err) => {
        console.error('members error', err)
        membersReady.current = true
        setLoading(false)
      }
    )

    const unsubBlocked = onSnapshot(
      collection(db, 'events', eventId, 'blocked'),
      (snap) => {
        const list: BlockedMember[] = []
        snap.forEach((d) => list.push({ uid: d.id, ...d.data() } as BlockedMember))
        list.sort((a, b) => b.blockedAt - a.blockedAt)
        setBlocked(list)
      },
      (err) => console.error('blocked error', err)
    )

    return () => {
      unsubMembers()
      unsubBlocked()
    }
  }, [eventId])

  useEffect(() => {
    if (!eventId || !options?.uid || !options.displayName) return
    if (!membersReady.current && loading) return

    const uid = options.uid
    const blockedUids = options.blockedUids || []
    const isBlocked =
      blockedUids.includes(uid) || blocked.some((b) => b.uid === uid)

    if (isBlocked) {
      setJoinDenied('blocked')
      return
    }

    const alreadyMember = members.some((m) => m.uid === uid)
    const isOwner = !!options.isOwner

    if (!alreadyMember && !isOwner) {
      const required = options.eventInviteToken
      if (required) {
        if (!options.inviteFromUrl || options.inviteFromUrl !== required) {
          setJoinDenied('invalid_invite')
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
    loading,
    members,
    blocked,
    options?.uid,
    options?.displayName,
    options?.email,
    options?.photoURL,
    options?.isOwner,
    options?.inviteFromUrl,
    options?.eventInviteToken,
    options?.blockedUids
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

      // Keep a profile record so owner can unblock later
      await setDoc(doc(db, 'events', eventId, 'blocked', member.uid), {
        displayName: member.displayName,
        email: member.email || null,
        photoURL: member.photoURL || null,
        blockedAt: Date.now()
      })

      await updateDoc(doc(db, 'events', eventId), {
        blockedUids: arrayUnion(member.uid)
      })
    },
    [eventId]
  )

  const unblockMember = useCallback(
    async (member: BlockedMember) => {
      if (!eventId) return

      await deleteDoc(doc(db, 'events', eventId, 'blocked', member.uid))
      await updateDoc(doc(db, 'events', eventId), {
        blockedUids: arrayRemove(member.uid)
      })
    },
    [eventId]
  )

  return { members, blocked, loading, removeMember, unblockMember, joinDenied }
}
