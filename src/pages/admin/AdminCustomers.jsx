import { useMemo, useState } from 'react'
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection'
import { COLLECTIONS, ORDER_STATUS, formatCurrency, formatDate } from '../../lib/constants'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'

export default function AdminCustomers() {
  const { data: users, loading } = useRealtimeCollection(COLLECTIONS.users, {
    orderByField: 'createdAt',
    direction: 'desc',
  })
  const { data: orders } = useRealtimeCollection(COLLECTIONS.orders, {
    orderByField: 'createdAt',
    direction: 'desc',
  })

  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const customers = useMemo(() => {
    const term = search.trim().toLowerCase()
    return users
      .filter((user) => user.role !== 'admin')
      .filter(
        (user) =>
          !term ||
          user.name?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term) ||
          user.phone?.includes(term),
      )
      .map((user) => {
        const own = orders.filter((order) => order.userId === user.uid)
        return {
          ...user,
          orderCount: own.length,
          spent: own
            .filter((order) => order.status !== ORDER_STATUS.CANCELLED)
            .reduce((sum, order) => sum + Number(order.total || 0), 0),
        }
      })
  }, [users, orders, search])

  const selectedOrders = selected
    ? orders.filter((order) => order.userId === selected.uid)
    : []

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Gestao de Clientes</h1>
          <p className="muted">{customers.length} cliente(s) registado(s).</p>
        </div>
        <input
          type="search"
          placeholder="Procurar por nome, e-mail ou telefone..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </header>

      {loading ? (
        <Spinner label="A carregar clientes..." />
      ) : customers.length === 0 ? (
        <EmptyState icon="👥" title="Sem clientes registados" />
      ) : (
        <section className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contacto</th>
                <th>Pedidos</th>
                <th>Total gasto</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.uid}>
                  <td>
                    <div className="table__item">
                      <span className="avatar">
                        {(customer.name || customer.email || 'N')[0].toUpperCase()}
                      </span>
                      <div>
                        <strong>{customer.name}</strong>
                        <small className="muted">
                          Desde {formatDate(customer.createdAt)}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>{customer.email}</div>
                    <small className="muted">{customer.phone || 'sem telefone'}</small>
                  </td>
                  <td>{customer.orderCount}</td>
                  <td>{formatCurrency(customer.spent)}</td>
                  <td className="table__actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setSelected(customer)}
                    >
                      Ver historico
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {selected && (
        <div className="drawer-backdrop" onClick={() => setSelected(null)}>
          <aside className="drawer" onClick={(event) => event.stopPropagation()}>
            <header className="drawer__header">
              <div>
                <h2>{selected.name}</h2>
                <p className="muted small">{selected.email}</p>
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>
                ✕
              </button>
            </header>

            <p className="muted small">
              {selected.phone || 'Sem telefone'}
              {selected.address && ` • ${selected.address}`}
            </p>

            <h3>Pedidos ({selectedOrders.length})</h3>
            {selectedOrders.length === 0 ? (
              <p className="muted">Este cliente ainda nao fez pedidos.</p>
            ) : (
              <ul className="order-list">
                {selectedOrders.map((order) => (
                  <li key={order.id} className="order-row order-row--static">
                    <div>
                      <strong>{order.code}</strong>
                      <small className="muted">{formatDate(order.createdAt)}</small>
                    </div>
                    <span className={`badge badge--${order.status}`}>{order.status}</span>
                    <strong>{formatCurrency(order.total)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}