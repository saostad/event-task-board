import { useEffect, useState, useCallback } from 'react'
import {
  auth,
  onAuthStateChanged,
  signInWithGoogle,
  handleRedirectResult,
  signOut,
  getLocalDisplayName,
  setDisplayName,
  type User
} from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [displayName, setDisplayNameState] = useState(getLocalDisplayName())
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    // Handle redirect result (mobile / popup blocked cases)
    handleRedirectResult()
      .then((u) => {
        if (u && mounted) {
          setUser(u)
          if (u.displayName) setDisplayNameState(u.displayName)
        }
      })
      .catch(console.error)

    const unsub = onAuthStateChanged(auth, (u) => {
      if (!mounted) return
      setUser(u)
      if (u?.displayName) {
        setDisplayNameState(u.displayName)
        // Keep localStorage in sync
        localStorage.setItem('displayName', u.displayName)
      } else if (!u) {
        setDisplayNameState('')
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      unsub()
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
      // Redirect case — page will reload, don't show error
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/popup-closed-by-user') {
        return null
      }
      setAuthError(err?.message || 'Google sign-in failed')
      throw err
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
