import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function generateCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function formatDeadline(iso: string | null): string {
  if (!iso) return 'No deadline'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function isOverdue(iso: string | null): boolean {
  if (!iso) return false
  return new Date(iso) < new Date()
}

/**
 * Format a phone number as the user types (US-style).
 * Examples while typing:
 *   6 → 6
 *   678 → 678
 *   6785 → (678) 5
 *   6785551234 → (678) 555-1234
 *   16785551234 → +1 (678) 555-1234
 */
export function formatPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, '')

  // Optional leading country code 1
  let rest = digits
  let prefix = ''
  if (digits.length > 10 && digits.startsWith('1')) {
    prefix = '+1 '
    rest = digits.slice(1, 11)
  } else {
    rest = digits.slice(0, 10)
  }

  if (rest.length === 0) return prefix.trim() // just "+1" edge case → ""
  if (rest.length < 4) return prefix + rest
  if (rest.length < 7) return `${prefix}(${rest.slice(0, 3)}) ${rest.slice(3)}`
  return `${prefix}(${rest.slice(0, 3)}) ${rest.slice(3, 6)}-${rest.slice(6)}`
}
