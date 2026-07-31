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

/**
 * Request notification permission, obtain FCM token, and store it.
 * Safe to call multiple times.
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

  // Already denied → do nothing (user must change it in browser settings)
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

    // Prefer the dedicated messaging SW if it exists, otherwise let Firebase handle it.
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
 * Convenience helper – call after the user is signed in.
 */
export function startNotificationListeners(
  onForegroundMessage?: (title: string, body: string) => void
) {
  setupNotifications()

  if (onForegroundMessage) {
    return listenForForegroundMessages(({ title, body }) => {
      onForegroundMessage(title, body)
    })
  }

  return () => {}
}
