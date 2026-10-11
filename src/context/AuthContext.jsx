import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { ADMIN_EMAILS, auth, db, googleProvider } from '../lib/firebase'
import { COLLECTIONS } from '../lib/constants'

const AuthContext = createContext(null)

/** Cria/atualiza o documento do utilizador na colecao users. */
async function upsertUserDoc(user) {
  if (!user) return null
  const ref = doc(db, COLLECTIONS.users, user.uid)
  const snapshot = await getDoc(ref)
  const isAdminEmail = ADMIN_EMAILS.includes((user.email || '').toLowerCase())

  if (!snapshot.exists()) {
    const profile = {
      uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'Cliente',
      email: user.email,
      phone: '',
      address: '',
      role: isAdminEmail ? 'admin' : 'customer',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    await setDoc(ref, profile)
    return profile
  }

  return { uid: user.uid, ...snapshot.data() }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser)
      if (nextUser) {
        try {
          setProfile(await upsertUserDoc(nextUser))
        } catch (error) {
          console.error('Falha ao carregar perfil:', error)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = useMemo(() => {
    const isAdmin =
      profile?.role === 'admin' ||
      ADMIN_EMAILS.includes((user?.email || '').toLowerCase())

    return {
      user,
      profile,
      loading,
      isAdmin,
      login: (email, password) =>
        signInWithEmailAndPassword(auth, email, password),
      register: async (name, email, password) => {
        const credential = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(credential.user, { displayName: name })
        const created = await upsertUserDoc({
          ...credential.user,
          displayName: name,
        })
        setProfile(created)
        return credential
      },
      loginWithGoogle: async () => {
        const credential = await signInWithPopup(auth, googleProvider)
        const created = await upsertUserDoc(credential.user)
        setProfile(created)
        return credential
      },
      logout: () => signOut(auth),
      refreshProfile: async () => {
        if (auth.currentUser) setProfile(await upsertUserDoc(auth.currentUser))
      },
      updateProfileData: async (data) => {
        if (!user) return
        const ref = doc(db, COLLECTIONS.users, user.uid)
        await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })
        setProfile((prev) => ({ ...prev, ...data }))
      },
    }
  }, [user, profile, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return context
}