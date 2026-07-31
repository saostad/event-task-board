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
  setDoc
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage, auth } from '../lib/firebase'
import type {
  EventDoc,
  Task,
  TaskStatus,
  Attachment,
  EventWritableFields,
  VoiceNote
} from '../types'
import { generateInviteToken } from '../lib/utils'

function statusFromClaims(
  claimedCount: number,
  capacity: number,
  current?: TaskStatus
): TaskStatus {
  if (current === 'done') return 'done'
  if (claimedCount === 0) return 'open'
  if (claimedCount >= capacity) return 'claimed'
  return 'open'
}

async function uploadVoiceBlob(
  eventId: string,
  taskId: string,
  blob: Blob,
  durationMs: number
): Promise<VoiceNote> {
  const ext = blob.type.includes('mp4') ? 'mp4' : 'webm'
  const path = `events/${eventId}/tasks/${taskId}/voice_${Date.now()}.${ext}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, blob, { contentType: blob.type || 'audio/webm' })
  const url = await getDownloadURL(storageRef)
  return {
    url,
    durationMs,
    size: blob.size,
    uploadedAt: Date.now()
  }
}

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
      voiceBlob?: Blob | null
      voiceDurationMs?: number
    }) => {
      if (!eventId) return

      const createdBy = auth.currentUser?.uid || null

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
        createdBy,
        attachments: [],
        voiceNote: null
      })

      const updates: Record<string, unknown> = {}

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
        updates.attachments = attachments
      }

      if (data.voiceBlob) {
        updates.voiceNote = await uploadVoiceBlob(
          eventId,
          taskRef.id,
          data.voiceBlob,
          data.voiceDurationMs || 0
        )
      }

      if (Object.keys(updates).length > 0) {
        await updateDoc(taskRef, updates)
      }
    },
    [eventId]
  )

  const updateTask = useCallback(
    async (
      taskId: string,
      data: {
        title: string
        description?: string
        deadline?: string | null
        capacity?: number
        location?: string | null
        phone?: string | null
        attachments?: Attachment[]
        newFiles?: File[]
        voiceNote?: VoiceNote | null
        voiceBlob?: Blob | null
        voiceDurationMs?: number
        clearVoice?: boolean
      }
    ) => {
      if (!eventId) return
      const task = tasks.find((t) => t.id === taskId)
      if (!task) return

      const capacity = Math.max(1, data.capacity || 1)
      const status = statusFromClaims(task.claimedBy.length, capacity, task.status)

      let attachments: Attachment[] = data.attachments ?? task.attachments ?? []

      if (data.newFiles && data.newFiles.length > 0) {
        const uploaded: Attachment[] = []
        for (const file of data.newFiles) {
          const path = `events/${eventId}/tasks/${taskId}/${Date.now()}_${file.name}`
          const storageRef = ref(storage, path)
          await uploadBytes(storageRef, file)
          const url = await getDownloadURL(storageRef)
          uploaded.push({
            name: file.name,
            url,
            type: file.type || 'application/octet-stream',
            size: file.size,
            uploadedAt: Date.now()
          })
        }
        attachments = [...attachments, ...uploaded].slice(0, 5)
      }

      let voiceNote: VoiceNote | null =
        data.clearVoice
          ? null
          : data.voiceNote !== undefined
            ? data.voiceNote
            : task.voiceNote || null

      if (data.voiceBlob) {
        voiceNote = await uploadVoiceBlob(
          eventId,
          taskId,
          data.voiceBlob,
          data.voiceDurationMs || 0
        )
      }

      await updateDoc(doc(db, 'events', eventId, 'tasks', taskId), {
        title: data.title.trim(),
        description: data.description?.trim() || '',
        deadline: data.deadline || null,
        capacity,
        location: data.location?.trim() || null,
        phone: data.phone?.trim() || null,
        attachments,
        voiceNote,
        status
      })
    },
    [eventId, tasks]
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
      await updateDoc(taskRef, {
        claimedBy: newClaimed,
        status: statusFromClaims(newClaimed.length, task.capacity)
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
        status: statusFromClaims(
          newClaimed.length,
          task.capacity,
          task.status === 'done' ? undefined : task.status
        )
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
        status: statusFromClaims(task.claimedBy.length, task.capacity)
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

  /** Invalidate old share links; returns the new token. */
  const regenerateInviteToken = useCallback(async (): Promise<string> => {
    if (!eventId) throw new Error('No event')
    const token = generateInviteToken(16)
    await updateDoc(doc(db, 'events', eventId), { inviteToken: token })
    return token
  }, [eventId])

  return {
    event,
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    claimTask,
    unclaimTask,
    markDone,
    reopenTask,
    deleteTask,
    updateEvent,
    regenerateInviteToken
  }
}

export async function createEvent(
  data: EventWritableFields,
  ownerName: string,
  ownerUid: string
): Promise<string> {
  const title = data.title.trim()
  if (!title) throw new Error('Title is required')

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
    inviteToken: generateInviteToken(16),
    blockedUids: []
  })
  return eventRef.id
}
