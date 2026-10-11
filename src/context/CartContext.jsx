import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'nexus.cart.v1'

function readStoredCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      addItem: (product, quantity = 1) => {
        setItems((prev) => {
          const existing = prev.find((item) => item.id === product.id)
          if (existing) {
            return prev.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item,
            )
          }
          return [
            ...prev,
            {
              id: product.id,
              name: product.name,
              price: Number(product.price),
              imageUrl: product.imageUrl || '',
              type: product.type || 'product',
              quantity,
            },
          ]
        })
      },
      removeItem: (id) => setItems((prev) => prev.filter((item) => item.id !== id)),
      setQuantity: (id, quantity) =>
        setItems((prev) =>
          prev
            .map((item) =>
              item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item,
            )
            .filter((item) => item.quantity > 0),
        ),
      clear: () => setItems([]),
    }),
    [items],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart deve ser usado dentro de <CartProvider>')
  return context
}