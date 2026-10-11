import { useEffect, useMemo, useRef, useState } from 'react'
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection'
import { updateOrderStatus } from '../../services/orders'
import {
  COLLECTIONS,
  ORDER_FLOW,
  ORDER_STATUS,
  ORDER_STATUS_LABEL,
  PAYMENT_LABEL,
  formatCurrency,
  formatDate,
} from '../../lib/constants'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import OrderStatusBar from '../../components/OrderStatusBar'

/** Alerta sonoro gerado por Web Audio (sem ficheiros externos). */
function playBell() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.6)
    osc.onended = () => ctx.close()
  } catch (error) {
    console.warn('Audio indisponivel:', error)
  }
}

export default function AdminOrders() {
  const { data: orders, loading } = useRealtimeCollection(COLLECTIONS.orders, {
    orderByField: 'createdAt',
    direction: 'desc',
  })

  const [filter, setFilter] = useState('all')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [highlight, setHighlight] = useState(null)
  const knownIds = useRef(null)
  const firstLoad = useRef(true)

  // Deteta novos pedidos em tempo real e dispara alerta visual + sonoro.
  useEffect(() => {
    if (loading) return
    const ids = new Set(orders.map((order) => order.id))

    if (firstLoad.current) {
      knownIds.current = ids
      firstLoad.current = false
      return
    }

    const added = orders.filter((order) => !knownIds.current?.has(order.id))
    if (added.length) {
      if (soundEnabled) playBell()
      setHighlight(added[0].id)
      setTimeout(() => setHighlight(null), 6000)
    }
    knownIds.current = ids
  }, [orders, loading, soundEnabled])

  const counts = useMemo(() => {
    const base = { all: orders.length }
    Object.values(ORDER_STATUS).forEach((status) => {
      base[status] = orders.filter((order) => order.status === status).length
    })
    return base
  }, [orders])

  const visible = useMemo(
    () => (filter === 'all' ? orders : orders.filter((order) => order.status === filter)),
    [orders, filter],
  )

  const revenue = orders
    .filter((order) => order.status !== ORDER_STATUS.CANCELLED)
    .reduce((sum, order) => sum + Number(order.total || 0), 0)

  async function advance(order, status) {
    await updateOrderStatus(order.id, status, order.statusHistory || [])
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Monitor de Pedidos</h1>
          <p className="muted">
            Feed em tempo real (onSnapshot). {counts.all} pedido(s) •{' '}
            {formatCurrency(revenue)} faturados.
          </p>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(event) => setSoundEnabled(event.target.checked)}
          />
          <span>{soundEnabled ? '🔔 Som ligado' : '🔕 Som desligado'}</span>
        </label>
      </header>

      <nav className="filter-tabs">
        <button
          type="button"
          className={filter === 'all' ? 'is-active' : ''}
          onClick={() => setFilter('all')}
        >
          Todos ({counts.all})
        </button>
        {ORDER_FLOW.map((status) => (
          <button
            key={status}
            type="button"
            className={filter === status ? 'is-active' : ''}
            onClick={() => setFilter(status)}
          >
            {ORDER_STATUS_LABEL[status]} ({counts[status] || 0})
          </button>
        ))}
        <button
          type="button"
          className={filter === ORDER_STATUS.CANCELLED ? 'is-active' : ''}
          onClick={() => setFilter(ORDER_STATUS.CANCELLED)}
        >
          Cancelados ({counts[ORDER_STATUS.CANCELLED] || 0})
        </button>
      </nav>

      {loading ? (
        <Spinner label="A ligar ao feed de pedidos..." />
      ) : visible.length === 0 ? (
        <EmptyState icon="📦" title="Sem pedidos neste filtro" />
      ) : (
        <div className="order-cards">
          {visible.map((order) => {
            const currentIndex = ORDER_FLOW.indexOf(order.status)
            const nextStatus = ORDER_FLOW[currentIndex + 1]
            return (
              <article
                key={order.id}
                className={`order-card ${highlight === order.id ? 'is-new' : ''}`}
              >
                <header className="order-card__header">
                  <div>
                    <strong>{order.code}</strong>
                    <small className="muted">{formatDate(order.createdAt)}</small>
                  </div>
                  <span className={`badge badge--${order.status}`}>
                    {ORDER_STATUS_LABEL[order.status]}
                  </span>
                  <strong className="price">{formatCurrency(order.total)}</strong>
                </header>

                <OrderStatusBar status={order.status} />

                <div className="order-card__grid">
                  <div>
                    <h4>Cliente</h4>
                    <p>{order.customer?.name}</p>
                    <p className="muted small">{order.customer?.email}</p>
                    {order.customer?.phone && (
                      <p className="muted small">{order.customer.phone}</p>
                    )}
                    {order.customer?.address && (
                      <p className="muted small">{order.customer.address}</p>
                    )}
                  </div>

                  <div>
                    <h4>Itens</h4>
                    <ul className="mini-list">
                      {order.items?.map((item) => (
                        <li key={item.productId}>
                          <span>
                            {item.quantity}× {item.name}
                          </span>
                          <span>{formatCurrency(item.price * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="muted small">
                      {PAYMENT_LABEL[order.paymentMethod]} • frete{' '}
                      {formatCurrency(order.shipping)} • desconto{' '}
                      {formatCurrency(order.discount)}
                    </p>
                    {order.notes && <p className="muted small">Obs: {order.notes}</p>}
                  </div>
                </div>

                <footer className="order-card__actions">
                  {nextStatus && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => advance(order, nextStatus)}
                    >
                      Avancar para {ORDER_STATUS_LABEL[nextStatus]}
                    </button>
                  )}

                  <select
                    value={order.status}
                    onChange={(event) => advance(order, event.target.value)}
                  >
                    {Object.values(ORDER_STATUS).map((status) => (
                      <option key={status} value={status}>
                        {ORDER_STATUS_LABEL[status]}
                      </option>
                    ))}
                  </select>

                  {order.status !== ORDER_STATUS.CANCELLED && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => advance(order, ORDER_STATUS.CANCELLED)}
                    >
                      Cancelar
                    </button>
                  )}
                </footer>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}