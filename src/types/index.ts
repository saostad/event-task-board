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
  deadline: string | null // ISO date string
  capacity: number
  claimedBy: string[] // display names
  status: TaskStatus
  createdAt: number
  createdBy?: string
  notes?: string
  location?: string | null // address text
  phone?: string | null // tappable tel: link
  attachments?: Attachment[]
}

export interface EventDoc {
  id: string
  title: string
  description?: string
  createdAt: number
  createdBy: string
  ownerName: string
  code: string
}

export interface UserProfile {
  uid: string
  displayName: string
  lastSeen: number
}
