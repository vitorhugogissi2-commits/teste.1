import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'

/**
 * Escuta uma colecao do Firestore em tempo real (onSnapshot).
 * Devolve { data, loading, error } e mantem-se sincronizado sem refresh.
 *
 * @param {string} path nome da colecao
 * @param {object} options { orderByField, direction, whereClauses: [[field, op, value]] }
 */
export function useRealtimeCollection(path, options = {}) {
  const { orderByField, direction = 'desc', whereClauses = [], enabled = true } = options
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(Boolean(enabled))
  const [error, setError] = useState(null)

  // Chave estavel para reexecutar o efeito apenas quando os filtros mudam.
  const filterKey = JSON.stringify(whereClauses)

  useEffect(() => {
    if (!enabled) {
      setData([])
      setLoading(false)
      return undefined
    }

    const constraints = []
    JSON.parse(filterKey).forEach(([field, op, value]) => {
      constraints.push(where(field, op, value))
    })
    if (orderByField) constraints.push(orderBy(orderByField, direction))

    const q = query(collection(db, path), ...constraints)

    setLoading(true)
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setData(
          snapshot.docs.map((document) => ({ id: document.id, ...document.data() })),
        )
        setError(null)
        setLoading(false)
      },
      (err) => {
        console.error(`Erro ao escutar ${path}:`, err)
        setError(err)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [path, orderByField, direction, filterKey, enabled])

  return { data, loading, error }
}