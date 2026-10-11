import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  writeBatch,
  increment,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { COLLECTIONS, ORDER_STATUS, calculateTotals } from '../lib/constants'

/** Gera um codigo curto legivel para o pedido (ex: NX-8F3K2). */
function generateOrderCode() {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `NX-${random}`
}

/**
 * Cria um pedido no Firestore.
 * - Grava o pedido em `orders` (o Admin e notificado via onSnapshot).
 * - Decrementa o stock dos produtos (batch atomico).
 */
export async function createOrder({ user, profile, items, paymentMethod, notes }) {
  if (!user) throw new Error('Precisas de iniciar sessao para finalizar a compra.')
  if (!items.length) throw new Error('O carrinho esta vazio.')

  const totals = calculateTotals(items, paymentMethod)
  const code = generateOrderCode()

  const orderRef = await addDoc(collection(db, COLLECTIONS.orders), {
    code,
    userId: user.uid,
    customer: {
      name: profile?.name || user.displayName || 'Cliente',
      email: user.email,
      phone: profile?.phone || '',
      address: profile?.address || '',
    },
    items: items.map((item) => ({
      productId: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity),
      imageUrl: item.imageUrl || '',
      type: item.type || 'product',
    })),
    paymentMethod,
    notes: notes || '',
    ...totals,
    status: ORDER_STATUS.PENDING_PAYMENT,
    statusHistory: [{ status: ORDER_STATUS.PENDING_PAYMENT, at: new Date() }],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // Baixa de stock (apenas para itens do tipo "product").
  const batch = writeBatch(db)
  let touched = 0
  items.forEach((item) => {
    if (item.type === 'service') return
    batch.update(doc(db, COLLECTIONS.products, item.id), {
      stock: increment(-Number(item.quantity)),
      updatedAt: serverTimestamp(),
    })
    touched += 1
  })
  if (touched) await batch.commit()

  return { id: orderRef.id, code, ...totals }
}

/** O admin (ou o proprio cliente) avanca o estado do pedido. */
export async function updateOrderStatus(orderId, status, currentHistory = []) {
  await updateDoc(doc(db, COLLECTIONS.orders, orderId), {
    status,
    statusHistory: [...currentHistory, { status, at: new Date() }],
    updatedAt: serverTimestamp(),
  })
}