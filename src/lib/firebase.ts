import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const missing = Object.entries(firebaseConfig).filter(([, v]) => !v).map(([k]) => k)
if (missing.length > 0) {
  console.warn('Missing Firebase env vars:', missing.join(', '))
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

/**
 * Google sign-in via popup only.
 * We intentionally do NOT use signInWithRedirect — it fails with
 * "missing initial state" in WhatsApp/Instagram/Messenger in-app browsers
 * and other storage-partitioned environments.
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  } catch (err: any) {
    const code = err?.code as string | undefined

    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      const e = new Error('Sign-in was cancelled. Please try again.')
      ;(e as any).code = code
      throw e
    }

    if (code === 'auth/popup-blocked') {
      const e = new Error(
        'Sign-in popup was blocked. Open this page in Chrome or Safari (not inside WhatsApp or Messenger), then try again.'
      )
      ;(e as any).code = code
      throw e
    }

    // Network / third-party cookie / in-app browser issues
    if (
      code === 'auth/network-request-failed' ||
      code === 'auth/internal-error' ||
      String(err?.message || '').toLowerCase().includes('missing initial state')
    ) {
      const e = new Error(
        'Sign-in failed in this browser. Open the link in Chrome or Safari (tap ⋮ or Share → Open in browser), then sign in.'
      )
      ;(e as any).code = code
      throw e
    }

    throw err
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
  localStorage.removeItem('displayName')
}

export async function setDisplayName(name: string) {
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: name })
  }
  localStorage.setItem('displayName', name)
}

export function getLocalDisplayName(): string {
  return (
    localStorage.getItem('displayName') ||
    auth.currentUser?.displayName ||
    ''
  )
}

export { onAuthStateChanged }
export type { User }
