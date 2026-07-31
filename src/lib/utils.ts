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
 */
export function formatPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, '')

  let rest = digits
  let prefix = ''
  if (digits.length > 10 && digits.startsWith('1')) {
    prefix = '+1 '
    rest = digits.slice(1, 11)
  } else {
    rest = digits.slice(0, 10)
  }

  if (rest.length === 0) return prefix.trim()
  if (rest.length < 4) return prefix + rest
  if (rest.length < 7) return `${prefix}(${rest.slice(0, 3)}) ${rest.slice(3)}`
  return `${prefix}(${rest.slice(0, 3)}) ${rest.slice(3, 6)}-${rest.slice(6)}`
}

const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif'
])

export function isImageFile(file: File): boolean {
  if (file.type && IMAGE_TYPES.has(file.type.toLowerCase())) return true
  // Fallback by extension (some mobile browsers omit type)
  return /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name)
}

/**
 * Compress an image client-side to the given JPEG quality (default 0.3 = 30%).
 * Also downscales if wider/taller than maxEdge.
 * Non-images are returned unchanged.
 */
export async function compressImageFile(
  file: File,
  quality = 0.3,
  maxEdge = 1920
): Promise<File> {
  if (!isImageFile(file)) return file

  // HEIC often can't be decoded in canvas on all browsers — leave as-is
  if (/heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)) {
    return file
  }

  try {
    const bitmap = await createImageBitmap(file)
    let { width, height } = bitmap

    if (width > maxEdge || height > maxEdge) {
      const scale = maxEdge / Math.max(width, height)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return file
    }

    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
    )

    if (!blob) return file

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now()
    })
  } catch {
    // Decode failed — upload original
    return file
  }
}

/** Compress every image in a list; leave other files untouched. */
export async function compressImagesInFiles(
  files: File[],
  quality = 0.3
): Promise<File[]> {
  return Promise.all(files.map((f) => compressImageFile(f, quality)))
}
