import { useEffect, useState } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { auth, ensureAuth, getLocalDisplayName, setDisplayName } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [displayName, setDisplayNameState] = useState(getLocalDisplayName())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ensureAuth()
      .then((u) => {
        if (mounted) {
          setUser(u)
          if (u.displayName) setDisplayNameState(u.displayName)
        }
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false)
      })

    const unsub = onAuthStateChanged(auth, (u) => {
      if (mounted) setUser(u)
    })

    return () => {
      mounted = false
      unsub()
    }
  }, [])

  const updateName = async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    await setDisplayName(trimmed)
    setDisplayNameState(trimmed)
  }

  return { user, displayName, loading, updateName }
}
