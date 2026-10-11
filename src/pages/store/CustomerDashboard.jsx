import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection'
import {
  COLLECTIONS,
  ORDER_STATUS,
  ORDER_STATUS_LABEL,
  formatCurrency,
  formatDate,
} from '../../lib/constants'
import OrderStatusBar from '../../components/OrderStatusBar'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'

export default function CustomerDashboard() {
  const { user, profile, updateProfileData } = useAuth()
  const { data: orders, loading } = useRealtimeCollection(COLLECTIONS.orders, {
    orderByField: 'createdAt',
    direction: 'desc',
    whereClauses: user ? [['userId', '==', user.uid]] : [],
    enabled: Boolean(user),
  })

  const [form, setForm] = useState({
    phone: profile?.phone || '',
    address: profile?.address || '',
  })
  const [saved, setSaved] = useState(false)
  const [expanded, setExpanded] = useState(null)

  const activeOrders = orders.filter(
    (order) =>
      ![ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED].includes(order.status),
  )
  const totalSpent = orders
    .filter((order) => order.status !== ORDER_STATUS.CANCELLED)
    .reduce((sum, order) => sum + Number(order.total || 0), 0)

  async function handleSave(event) {
    event.preventDefault()
    await updateProfileData(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="page">
      <h1>Ola, {profile?.name || 'Cliente'} 👋</h1>

      <div className="stat-grid">
        <div className="stat-card">
          <strong>{orders.length}</strong>
          <span className="muted">Pedidos totais</span>
        </div>
        <div className="stat-card">
          <strong>{activeOrders.length}</strong>
          <span className="muted">Em andamento</span>
        </div>
        <div className="stat-card">
          <strong>{formatCurrency(totalSpent)}</strong>
          <span className="muted">Total gasto</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="card">
          <h2>Historico de pedidos</h2>

          {loading ? (
            <Spinner label="A carregar pedidos..." />
          ) : orders.length === 0 ? (
            <EmptyState icon="📦" title="Ainda nao tens pedidos">
              <Link to="/" className="btn btn-primary">
                Comecar a comprar
              </Link>
            </EmptyState>
          ) : (
            <ul className="order-list">
              {orders.map((order) => (
                <li key={order.id} className="order-row">
                  <button
                    type="button"
                    className="order-row__head"
                    onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  >
                    <div>
                      <strong>{order.code}</strong>
                      <small className="muted">{formatDate(order.createdAt)}</small>
                    </div>
                    <span className={`badge badge--${order.status}`}>
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                    <strong>{formatCurrency(order.total)}</strong>
                  </button>

                  {expanded === order.id && (
                    <div className="order-row__detail">
                      <OrderStatusBar status={order.status} />
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
                      <Link to={`/pedido/${order.id}`} className="btn btn-ghost">
                        Ver comprovativo
                      </Link>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="card">
          <h2>Os meus dados</h2>
          <form onSubmit={handleSave} className="form">
            <label className="field">
              Nome
              <input value={profile?.name || ''} disabled />
            </label>
            <label className="field">
              E-mail
              <input value={user?.email || ''} disabled />
            </label>
            <label className="field">
              Telefone
              <input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="+55 11 90000-0000"
              />
            </label>
            <label className="field">
              Morada de entrega
              <textarea
                rows="3"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
                placeholder="Rua, numero, cidade, CEP"
              />
            </label>
            <button type="submit" className="btn btn-primary">
              Guardar dados
            </button>
            {saved && <p className="text-success">Dados atualizados.</p>}
          </form>
        </aside>
      </div>
    </div>
  )
}