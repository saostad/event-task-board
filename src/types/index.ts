export type TaskStatus = 'open' | 'claimed' | 'done'

export interface Attachment {
  name: string
  url: string
  type: string
  size: number
  uploadedAt: number
}

export interface Task {
  id: string
  title: string
  description: string
  deadline: string | null
  capacity: number
  claimedBy: string[]
  status: TaskStatus
  createdAt: number
  createdBy?: string
  notes?: string
  location?: string | null
  phone?: string | null
  attachments?: Attachment[]
}

export interface EventDoc {
  id: string
  title: string
  description?: string
  location?: string | null
  phone?: string | null
  eventDate?: string | null // datetime-local / ISO-ish string
  createdAt: number
  createdBy: string
  ownerName: string
  code: string
}

/** Fields the owner can set when creating or editing an event */
export type EventWritableFields = {
  title: string
  description?: string
  location?: string | null
  phone?: string | null
  eventDate?: string | null
}

export interface UserProfile {
  uid: string
  displayName: string
  lastSeen: number
}
