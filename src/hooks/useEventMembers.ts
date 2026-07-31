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
  query
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
  }
) {
  const [members, setMembers] = useState<EventMember[]>([])
  const [loading, setLoading] = useState(true)

  // Live member list
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

  // Auto-register current user when they open the event
  useEffect(() => {
    if (!eventId || !options?.uid || !options.displayName) return

    const memberRef = doc(db, 'events', eventId, 'members', options.uid)
    setDoc(
      memberRef,
      {
        displayName: options.displayName,
        email: options.email || null,
        photoURL: options.photoURL || null,
        joinedAt: Date.now(),
        role: options.isOwner ? 'owner' : 'contributor'
      },
      { merge: true }
    ).catch((err) => console.error('join member failed', err))
  }, [
    eventId,
    options?.uid,
    options?.displayName,
    options?.email,
    options?.photoURL,
    options?.isOwner
  ])

  /** Owner removes a contributor: drop membership + unclaim their tasks */
  const removeMember = useCallback(
    async (member: EventMember) => {
      if (!eventId) return
      if (member.role === 'owner') return

      // Unclaim from all tasks under this display name
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
    },
    [eventId]
  )

  return { members, loading, removeMember }
}
