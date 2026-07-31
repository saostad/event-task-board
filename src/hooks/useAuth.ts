import { useEffect, useState, useCallback } from 'react'
import {
  auth,
  onAuthStateChanged,
  signInWithGoogle,
  signOut,
  getLocalDisplayName,
  setDisplayName,
  type User
} from '../lib/firebase'
import { startNotificationListeners } from '../lib/notifications'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [displayName, setDisplayNameState] = useState(getLocalDisplayName())
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let stopNotifications: (() => void) | undefined

    const unsub = onAuthStateChanged(auth, (u) => {
      if (!mounted) return
      setUser(u)
      if (u?.displayName) {
        setDisplayNameState(u.displayName)
        localStorage.setItem('displayName', u.displayName)
      } else if (!u) {
        setDisplayNameState('')
      }
      setLoading(false)

      // Start (or restart) push notification setup when a user is signed in
      if (u) {
        stopNotifications?.()
        stopNotifications = startNotificationListeners((title, body) => {
          // Simple foreground feedback – can be replaced with a nicer toast later
          if (document.visibilityState === 'visible') {
            // Browser may still show a system notification depending on the OS
            console.info('[FCM foreground]', title, body)
          }
        })
      } else {
        stopNotifications?.()
        stopNotifications = undefined
      }
    })

    return () => {
      mounted = false
      unsub()
      stopNotifications?.()
    }
  }, [])

  const login = useCallback(async () => {
    setAuthError(null)
    try {
      const u = await signInWithGoogle()
      setUser(u)
      if (u.displayName) setDisplayNameState(u.displayName)
      return u
    } catch (err: any) {
      setAuthError(err?.message || 'Google sign-in failed')
      return null
    }
  }, [])

  const logout = useCallback(async () => {
    await signOut()
    setUser(null)
    setDisplayNameState('')
  }, [])

  const updateName = useCallback(async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    await setDisplayName(trimmed)
    setDisplayNameState(trimmed)
  }, [])

  return {
    user,
    displayName,
    loading,
    authError,
    login,
    logout,
    updateName,
    isAuthenticated: !!user
  }
}
