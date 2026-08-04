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
import { showToast } from '../lib/toast'

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

      if (u) {
        stopNotifications?.()
        stopNotifications = startNotificationListeners((title, body) => {
          // Foreground FCM → in-app toast
          showToast(title, body)
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
