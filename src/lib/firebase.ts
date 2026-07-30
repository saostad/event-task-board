import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  } catch (err: any) {
    // Popup blocked or mobile issues → fall back to redirect
    if (
      err?.code === 'auth/popup-blocked' ||
      err?.code === 'auth/popup-closed-by-user' ||
      err?.code === 'auth/cancelled-popup-request'
    ) {
      await signInWithRedirect(auth, googleProvider)
      // Page will reload; this promise won't resolve here
      throw err
    }
    throw err
  }
}

export async function handleRedirectResult(): Promise<User | null> {
  const result = await getRedirectResult(auth)
  return result?.user ?? null
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
