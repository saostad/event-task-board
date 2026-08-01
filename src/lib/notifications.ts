import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging
} from 'firebase/messaging'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { app, db, auth } from './firebase'

let messaging: Messaging | null = null
let unsubscribeOnMessage: (() => void) | null = null

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined

/**
 * Initialize Firebase Messaging (only in supported browsers).
 */
async function getMessagingInstance(): Promise<Messaging | null> {
  if (messaging) return messaging
  try {
    const supported = await isSupported()
    if (!supported) {
      console.info('[FCM] Messaging is not supported in this browser')
      return null
    }
    messaging = getMessaging(app)
    return messaging
  } catch (err) {
    console.warn('[FCM] Failed to initialize messaging', err)
    return null
  }
}

/**
 * Save the current FCM token under the signed-in user.
 * Structure is future-proof for Capacitor (multiple platforms/devices).
 */
async function saveTokenToFirestore(token: string) {
  const user = auth.currentUser
  if (!user) return

  const userRef = doc(db, 'users', user.uid)
  await setDoc(
    userRef,
    {
      fcmTokens: {
        [token]: {
          platform: 'web',
          updatedAt: Date.now()
        }
      },
      lastTokenUpdate: serverTimestamp()
    },
    { merge: true }
  )
}

export type NotificationStatus = 'unsupported' | 'missing-key' | 'denied' | 'default' | 'granted'

/** Current permission / readiness status (safe to call anytime). */
export function getNotificationStatus(): NotificationStatus {
  if (!('Notification' in window)) return 'unsupported'
  if (!VAPID_KEY) return 'missing-key'
  if (Notification.permission === 'denied') return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  return 'default'
}

/**
 * Request notification permission, obtain FCM token, and store it.
 * Must be called from a user gesture (button click) for best browser support.
 */
export async function setupNotifications(): Promise<string | null> {
  if (!VAPID_KEY) {
    console.warn('[FCM] VITE_FIREBASE_VAPID_KEY is missing')
    return null
  }

  if (!('Notification' in window)) {
    console.info('[FCM] Notifications API not available')
    return null
  }

  if (Notification.permission === 'denied') {
    console.info('[FCM] Notification permission previously denied')
    return null
  }

  try {
    const permission =
      Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission()

    if (permission !== 'granted') {
      console.info('[FCM] Permission not granted')
      return null
    }

    const msg = await getMessagingInstance()
    if (!msg) return null

    let swRegistration: ServiceWorkerRegistration | undefined
    try {
      swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/firebase-cloud-messaging-push-scope'
      })
    } catch {
      // Fallback – Firebase will try the default location
    }

    const token = await getToken(msg, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration
    })

    if (token) {
      await saveTokenToFirestore(token)
      console.info('[FCM] Token saved')
      return token
    }

    return null
  } catch (err) {
    console.error('[FCM] setupNotifications failed', err)
    return null
  }
}

/**
 * Listen for messages while the app is in the foreground.
 * Returns an unsubscribe function.
 */
export function listenForForegroundMessages(
  onReceive: (payload: {
    title: string
    body: string
    data?: Record<string, string>
  }) => void
): () => void {
  let cancelled = false

  getMessagingInstance().then((msg) => {
    if (!msg || cancelled) return

    unsubscribeOnMessage = onMessage(msg, (payload) => {
      const title =
        payload.notification?.title || payload.data?.title || 'New task'
      const body =
        payload.notification?.body || payload.data?.body || ''
      onReceive({
        title,
        body,
        data: payload.data as Record<string, string> | undefined
      })
    })
  })

  return () => {
    cancelled = true
    if (unsubscribeOnMessage) {
      unsubscribeOnMessage()
      unsubscribeOnMessage = null
    }
  }
}

/**
 * Start foreground listeners only (permission is requested via the UI button).
 */
export function startNotificationListeners(
  onForegroundMessage?: (title: string, body: string) => void
) {
  // Soft attempt if already granted (refresh token)
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    setupNotifications()
  }

  if (onForegroundMessage) {
    return listenForForegroundMessages(({ title, body }) => {
      onForegroundMessage(title, body)
    })
  }

  return () => {}
}
