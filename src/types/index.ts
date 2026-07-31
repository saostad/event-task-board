export type TaskStatus = 'open' | 'claimed' | 'done'

export interface Attachment {
  name: string
  url: string
  type: string
  size: number
  uploadedAt: number
}

export interface VoiceNote {
  url: string
  durationMs: number
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
  voiceNote?: VoiceNote | null
}

export interface EventDoc {
  id: string
  title: string
  description?: string
  location?: string | null
  phone?: string | null
  eventDate?: string | null
  createdAt: number
  createdBy: string
  ownerName: string
  code: string
}

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
