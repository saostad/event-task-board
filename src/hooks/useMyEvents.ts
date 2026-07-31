import { useEffect, useState, useCallback } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
  writeBatch
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { EventDoc, EventWritableFields } from '../types'

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

  const updateEvent = useCallback(async (eventId: string, data: EventWritableFields) => {
    const title = data.title.trim()
    if (!title) throw new Error('Title is required')

    await updateDoc(doc(db, 'events', eventId), {
      title,
      description: data.description?.trim() || '',
      location: data.location?.trim() || null,
      phone: data.phone?.trim() || null,
      eventDate: data.eventDate || null
    })
  }, [])

  const deleteEvent = useCallback(async (eventId: string) => {
    const tasksSnap = await getDocs(collection(db, 'events', eventId, 'tasks'))
    const batch = writeBatch(db)
    tasksSnap.forEach((t) => batch.delete(t.ref))
    batch.delete(doc(db, 'events', eventId))
    await batch.commit()
  }, [])

  return { events, loading, error, updateEvent, deleteEvent }
}
