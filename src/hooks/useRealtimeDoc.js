import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

/** Escuta um documento unico em tempo real. */
export function useRealtimeDoc(path, id) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(Boolean(path && id))
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!path || !id) {
      setData(null)
      setLoading(false)
      return undefined
    }

    setLoading(true)
    const unsubscribe = onSnapshot(
      doc(db, path, id),
      (snapshot) => {
        setData(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null)
        setError(null)
        setLoading(false)
      },
      (err) => {
        console.error(`Erro ao escutar ${path}/${id}:`, err)
        setError(err)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [path, id])

  return { data, loading, error }
}