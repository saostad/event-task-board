import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously, onAuthStateChanged, updateProfile, User } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Validate config early
const missing = Object.entries(firebaseConfig).filter(([, v]) => !v).map(([k]) => k)
if (missing.length > 0) {
  console.warn('Missing Firebase env vars:', missing.join(', '))
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

export async function ensureAuth(): Promise<User> {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub()
      if (user) {
        resolve(user)
      } else {
        try {
          const cred = await signInAnonymously(auth)
          resolve(cred.user)
        } catch (err) {
          reject(err)
        }
      }
    })
  })
}

export async function setDisplayName(name: string) {
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: name })
  }
  localStorage.setItem('displayName', name)
}

export function getLocalDisplayName(): string {
  return localStorage.getItem('displayName') || auth.currentUser?.displayName || ''
}
