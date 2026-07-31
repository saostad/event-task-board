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
  createdBy?: string | null
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
  inviteToken?: string
  blockedUids?: string[]
  /** @deprecated */
  code?: string
}

export type EventWritableFields = {
  title: string
  description?: string
  location?: string | null
  phone?: string | null
  eventDate?: string | null
}

export interface EventMember {
  uid: string
  displayName: string
  email?: string | null
  photoURL?: string | null
  joinedAt: number
  role: 'owner' | 'contributor'
}

export interface BlockedMember {
  uid: string
  displayName: string
  email?: string | null
  photoURL?: string | null
  blockedAt: number
}

export interface UserProfile {
  uid: string
  displayName: string
  lastSeen: number
}
