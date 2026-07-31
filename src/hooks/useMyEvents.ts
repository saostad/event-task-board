import { useEffect, useState, useCallback } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  writeBatch
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { EventDoc } from '../types'

export function useMyEvents(uid: string | undefined) {
  const [events, setEvents] = useState<EventDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uid) {
      setEvents([])
      setLoading(false)
      return
    }

    setLoading(true)
    // Requires composite index: createdBy ASC, createdAt DESC
    const q = query(
      collection(db, 'events'),
      where('createdBy', '==', uid),
      orderBy('createdAt', 'desc')
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: EventDoc[] = []
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as EventDoc))
        setEvents(list)
        setError(null)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError(err.message)
        setLoading(false)
      }
    )

    return () => unsub()
  }, [uid])

  const renameEvent = useCallback(async (eventId: string, title: string) => {
    const trimmed = title.trim()
    if (!trimmed) return
    await updateDoc(doc(db, 'events', eventId), { title: trimmed })
  }, [])

  /** Deletes the event and all tasks under it */
  const deleteEvent = useCallback(async (eventId: string) => {
    const tasksSnap = await getDocs(collection(db, 'events', eventId, 'tasks'))
    const batch = writeBatch(db)
    tasksSnap.forEach((t) => batch.delete(t.ref))
    batch.delete(doc(db, 'events', eventId))
    await batch.commit()
  }, [])

  return { events, loading, error, renameEvent, deleteEvent }
}
