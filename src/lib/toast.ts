export type ToastPayload = {
  id: string
  title: string
  body?: string
  durationMs?: number
}

type Listener = (toast: ToastPayload) => void

const listeners = new Set<Listener>()

export function showToast(title: string, body?: string, durationMs = 4500) {
  const toast: ToastPayload = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    body,
    durationMs
  }
  listeners.forEach((fn) => fn(toast))
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
