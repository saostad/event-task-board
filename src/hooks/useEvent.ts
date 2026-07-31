import { useEffect, useState, useCallback } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  setDoc,
  where,
  getDocs,
  limit
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../lib/firebase'
import type { EventDoc, Task, TaskStatus, Attachment, EventWritableFields } from '../types'
import { generateCode } from '../lib/utils'

export function useEvent(eventId: string | undefined) {
  const [event, setEvent] = useState<EventDoc | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) {
      setLoading(false)
      return
    }

    setLoading(true)
    const eventRef = doc(db, 'events', eventId)

    const unsubEvent = onSnapshot(
      eventRef,
      (snap) => {
        if (snap.exists()) {
          setEvent({ id: snap.id, ...snap.data() } as EventDoc)
          setError(null)
        } else {
          setEvent(null)
          setError('Event not found')
        }
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError(err.message)
        setLoading(false)
      }
    )

    const tasksQuery = query(
      collection(db, 'events', eventId, 'tasks'),
      orderBy('createdAt', 'asc')
    )

    const unsubTasks = onSnapshot(
      tasksQuery,
      (snap) => {
        const list: Task[] = []
        snap.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as Task)
        })
        setTasks(list)
      },
      (err) => console.error('tasks error', err)
    )

    return () => {
      unsubEvent()
      unsubTasks()
    }
  }, [eventId])

  const addTask = useCallback(
    async (data: {
      title: string
      description?: string
      deadline?: string | null
      capacity?: number
      location?: string | null
      phone?: string | null
      files?: File[]
    }) => {
      if (!eventId) return

      const taskRef = await addDoc(collection(db, 'events', eventId, 'tasks'), {
        title: data.title.trim(),
        description: data.description?.trim() || '',
        deadline: data.deadline || null,
        capacity: data.capacity || 1,
        location: data.location?.trim() || null,
        phone: data.phone?.trim() || null,
        claimedBy: [],
        status: 'open' as TaskStatus,
        createdAt: Date.now(),
        attachments: []
      })

      if (data.files && data.files.length > 0) {
        const attachments: Attachment[] = []

        for (const file of data.files) {
          const path = `events/${eventId}/tasks/${taskRef.id}/${Date.now()}_${file.name}`
          const storageRef = ref(storage, path)
          await uploadBytes(storageRef, file)
          const url = await getDownloadURL(storageRef)

          attachments.push({
            name: file.name,
            url,
            type: file.type || 'application/octet-stream',
            size: file.size,
            uploadedAt: Date.now()
          })
        }

        await updateDoc(taskRef, { attachments })
      }
    },
    [eventId]
  )

  const claimTask = useCallback(
    async (taskId: string, name: string) => {
      if (!eventId || !name.trim()) return
      const taskRef = doc(db, 'events', eventId, 'tasks', taskId)
      const task = tasks.find((t) => t.id === taskId)
      if (!task || task.status === 'done') return
      if (task.claimedBy.includes(name)) return
      if (task.claimedBy.length >= task.capacity) return

      const newClaimed = [...task.claimedBy, name.trim()]
      const newStatus: TaskStatus =
        newClaimed.length >= task.capacity ? 'claimed' : 'open'

      await updateDoc(taskRef, {
        claimedBy: newClaimed,
        status: newStatus
      })
    },
    [eventId, tasks]
  )

  const unclaimTask = useCallback(
    async (taskId: string, name: string) => {
      if (!eventId) return
      const taskRef = doc(db, 'events', eventId, 'tasks', taskId)
      const task = tasks.find((t) => t.id === taskId)
      if (!task) return

      const newClaimed = task.claimedBy.filter((n) => n !== name)
      await updateDoc(taskRef, {
        claimedBy: newClaimed,
        status: newClaimed.length === 0 ? 'open' : 'claimed'
      })
    },
    [eventId, tasks]
  )

  const markDone = useCallback(
    async (taskId: string) => {
      if (!eventId) return
      await updateDoc(doc(db, 'events', eventId, 'tasks', taskId), {
        status: 'done'
      })
    },
    [eventId]
  )

  const reopenTask = useCallback(
    async (taskId: string) => {
      if (!eventId) return
      const task = tasks.find((t) => t.id === taskId)
      if (!task) return
      await updateDoc(doc(db, 'events', eventId, 'tasks', taskId), {
        status: task.claimedBy.length >= task.capacity ? 'claimed' : 'open'
      })
    },
    [eventId, tasks]
  )

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!eventId) return
      await deleteDoc(doc(db, 'events', eventId, 'tasks', taskId))
    },
    [eventId]
  )

  const updateEvent = useCallback(
    async (data: EventWritableFields) => {
      if (!eventId) return
      const title = data.title.trim()
      if (!title) throw new Error('Title is required')
      await updateDoc(doc(db, 'events', eventId), {
        title,
        description: data.description?.trim() || '',
        location: data.location?.trim() || null,
        phone: data.phone?.trim() || null,
        eventDate: data.eventDate || null
      })
    },
    [eventId]
  )

  return {
    event,
    tasks,
    loading,
    error,
    addTask,
    claimTask,
    unclaimTask,
    markDone,
    reopenTask,
    deleteTask,
    updateEvent
  }
}

export async function createEvent(
  data: EventWritableFields,
  ownerName: string,
  ownerUid: string
): Promise<string> {
  const title = data.title.trim()
  if (!title) throw new Error('Title is required')

  const code = generateCode(6)
  const eventRef = doc(collection(db, 'events'))
  await setDoc(eventRef, {
    title,
    description: data.description?.trim() || '',
    location: data.location?.trim() || null,
    phone: data.phone?.trim() || null,
    eventDate: data.eventDate || null,
    createdAt: Date.now(),
    createdBy: ownerUid,
    ownerName: ownerName.trim(),
    code
  })
  return eventRef.id
}

export async function findEventByCode(code: string): Promise<string | null> {
  const q = query(
    collection(db, 'events'),
    where('code', '==', code.toUpperCase()),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return snap.docs[0].id
}
