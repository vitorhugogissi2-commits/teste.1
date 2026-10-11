/** Caminhos das colecoes no Firestore (um unico ponto de verdade). */
export const COLLECTIONS = {
  products: 'products',
  orders: 'orders',
  users: 'users',
  categories: 'categories',
}

/** Fluxo de estados de um pedido. A ordem define a barra de progresso. */
export const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PAID: 'paid',
  IN_PRODUCTION: 'in_production',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export const ORDER_FLOW = [
  ORDER_STATUS.PENDING_PAYMENT,
  ORDER_STATUS.PAID,
  ORDER_STATUS.IN_PRODUCTION,
  ORDER_STATUS.READY,
  ORDER_STATUS.COMPLETED,
]

export const ORDER_STATUS_LABEL = {
  [ORDER_STATUS.PENDING_PAYMENT]: 'Aguardando Pagamento',
  [ORDER_STATUS.PAID]: 'Pago',
  [ORDER_STATUS.IN_PRODUCTION]: 'Em Preparacao',
  [ORDER_STATUS.READY]: 'Pronto / Expedido',
  [ORDER_STATUS.COMPLETED]: 'Concluido',
  [ORDER_STATUS.CANCELLED]: 'Cancelado',
}

export const PAYMENT_METHODS = {
  PIX: 'pix',
  CREDIT_CARD: 'credit_card',
}

export const PAYMENT_LABEL = {
  [PAYMENT_METHODS.PIX]: 'Pix',
  [PAYMENT_METHODS.CREDIT_CARD]: 'Cartao de Credito',
}

/** Desconto simples por metodo de pagamento (editavel). */
export const PAYMENT_DISCOUNT = {
  [PAYMENT_METHODS.PIX]: 0.05,
  [PAYMENT_METHODS.CREDIT_CARD]: 0,
}

/** Regras de frete (valores em BRL). */
export const SHIPPING = {
  freeAbove: 300,
  flatRate: 24.9,
}

/** Limite a partir do qual o stock dispara alerta no admin. */
export const LOW_STOCK_THRESHOLD = 5

export const CURRENCY = 'BRL'

export function formatCurrency(value = 0) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: CURRENCY,
  }).format(Number(value) || 0)
}

export function formatDate(value) {
  if (!value) return '-'
  const date = value?.toDate ? value.toDate() : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Calcula subtotal, desconto, frete e total de forma centralizada. */
export function calculateTotals(items = [], paymentMethod = PAYMENT_METHODS.PIX) {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  )
  const discountRate = PAYMENT_DISCOUNT[paymentMethod] ?? 0
  const discount = Number((subtotal * discountRate).toFixed(2))
  const shipping =
    subtotal === 0 || subtotal - discount >= SHIPPING.freeAbove ? 0 : SHIPPING.flatRate
  const total = Number((subtotal - discount + shipping).toFixed(2))
  return { subtotal, discount, shipping, total }
}