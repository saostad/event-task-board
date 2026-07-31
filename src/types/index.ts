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
  /** @deprecated No longer used; kept optional for old events */
  code?: string
}

export type EventWritableFields = {
  title: string
  description?: string
  location?: string | null
  phone?: string | null
  eventDate?: string | null
}

/** Someone who opened the event via share link (or the owner). */
export interface EventMember {
  uid: string
  displayName: string
  email?: string | null
  photoURL?: string | null
  joinedAt: number
  role: 'owner' | 'contributor'
}

export interface UserProfile {
  uid: string
  displayName: string
  lastSeen: number
}
