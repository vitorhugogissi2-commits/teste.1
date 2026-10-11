import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection'
import { COLLECTIONS, ORDER_STATUS, formatCurrency } from '../../lib/constants'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'

const DAY = 24 * 60 * 60 * 1000

function toDate(value) {
  if (!value) return null
  return value?.toDate ? value.toDate() : new Date(value)
}

export default function AdminMetrics() {
  const { data: orders, loading } = useRealtimeCollection(COLLECTIONS.orders, {
    orderByField: 'createdAt',
    direction: 'desc',
  })
  const { data: products } = useRealtimeCollection(COLLECTIONS.products, {
    orderByField: 'createdAt',
  })

  const [range, setRange] = useState('7')

  const validOrders = useMemo(
    () => orders.filter((order) => order.status !== ORDER_STATUS.CANCELLED),
    [orders],
  )

  const now = Date.now()
  const rangeStart = now - Number(range) * DAY

  const inRange = useMemo(
    () =>
      validOrders.filter((order) => {
        const date = toDate(order.createdAt)
        return date && date.getTime() >= rangeStart
      }),
    [validOrders, rangeStart],
  )

  const revenue = inRange.reduce((sum, order) => sum + Number(order.total || 0), 0)
  const ticket = inRange.length ? revenue / inRange.length : 0
  const totalAllTime = validOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)

  const series = useMemo(() => {
    const buckets = Number(range)
    const map = new Map()
    for (let i = buckets - 1; i >= 0; i -= 1) {
      const date = new Date(now - i * DAY)
      const key = date.toISOString().slice(0, 10)
      map.set(key, { dia: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), vendas: 0, pedidos: 0 })
    }
    inRange.forEach((order) => {
      const date = toDate(order.createdAt)
      if (!date) return
      const key = date.toISOString().slice(0, 10)
      const bucket = map.get(key)
      if (bucket) {
        bucket.vendas += Number(order.total || 0)
        bucket.pedidos += 1
      }
    })
    return [...map.values()]
  }, [inRange, now, range])

  const topProducts = useMemo(() => {
    const map = new Map()
    inRange.forEach((order) => {
      order.items?.forEach((item) => {
        const entry = map.get(item.name) || { name: item.name, qtd: 0, receita: 0 }
        entry.qtd += Number(item.quantity)
        entry.receita += Number(item.price) * Number(item.quantity)
        map.set(item.name, entry)
      })
    })
    return [...map.values()].sort((a, b) => b.qtd - a.qtd).slice(0, 5)
  }, [inRange])

  const byStatus = useMemo(
    () =>
      Object.values(ORDER_STATUS).map((status) => ({
        status,
        count: orders.filter((order) => order.status === status).length,
      })),
    [orders],
  )

  const lowStock = products.filter(
    (p) => p.type !== 'service' && Number(p.stock) <= 5,
  )

  if (loading) return <Spinner label="A calcular metricas..." />

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Metricas &amp; Graficos</h1>
          <p className="muted">Dados atualizados em tempo real conforme os pedidos entram.</p>
        </div>
        <select value={range} onChange={(event) => setRange(event.target.value)}>
          <option value="7">Ultimos 7 dias</option>
          <option value="15">Ultimos 15 dias</option>
          <option value="30">Ultimos 30 dias</option>
        </select>
      </header>

      <div className="stat-grid">
        <div className="stat-card">
          <strong>{formatCurrency(revenue)}</strong>
          <span className="muted">Faturacao no periodo</span>
        </div>
        <div className="stat-card">
          <strong>{inRange.length}</strong>
          <span className="muted">Pedidos no periodo</span>
        </div>
        <div className="stat-card">
          <strong>{formatCurrency(ticket)}</strong>
          <span className="muted">Ticket medio</span>
        </div>
        <div className="stat-card">
          <strong>{formatCurrency(totalAllTime)}</strong>
          <span className="muted">Faturacao total</span>
        </div>
      </div>

      <section className="card">
        <h2>Vendas por dia</h2>
        {series.every((point) => point.vendas === 0) ? (
          <EmptyState icon="📈" title="Ainda sem vendas no periodo" />
        ) : (
          <div className="chart">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#26304a" />
                <XAxis dataKey="dia" stroke="#8b9bb4" />
                <YAxis stroke="#8b9bb4" />
                <Tooltip
                  contentStyle={{ background: '#101828', border: '1px solid #26304a', borderRadius: 10 }}
                  formatter={(value, name) =>
                    name === 'vendas' ? formatCurrency(value) : value
                  }
                />
                <Line type="monotone" dataKey="vendas" stroke="#22d3ee" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <div className="metrics-grid">
        <section className="card">
          <h2>Produtos mais vendidos</h2>
          {topProducts.length === 0 ? (
            <EmptyState icon="🏆" title="Sem dados suficientes" />
          ) : (
            <div className="chart">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#26304a" />
                  <XAxis dataKey="name" stroke="#8b9bb4" hide />
                  <YAxis stroke="#8b9bb4" />
                  <Tooltip
                    contentStyle={{ background: '#101828', border: '1px solid #26304a', borderRadius: 10 }}
                  />
                  <Bar dataKey="qtd" fill="#a855f7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <ul className="mini-list">
            {topProducts.map((item) => (
              <li key={item.name}>
                <span>{item.name}</span>
                <span>
                  {item.qtd} un • {formatCurrency(item.receita)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2>Pedidos por estado</h2>
          <ul className="mini-list">
            {byStatus.map((entry) => (
              <li key={entry.status}>
                <span className={`badge badge--${entry.status}`}>{entry.status}</span>
                <strong>{entry.count}</strong>
              </li>
            ))}
          </ul>

          <h3>Stock critico</h3>
          {lowStock.length === 0 ? (
            <p className="muted">Nenhum item em falta. 👍</p>
          ) : (
            <ul className="mini-list">
              {lowStock.map((product) => (
                <li key={product.id}>
                  <span>{product.name}</span>
                  <span className="text-warn">{product.stock} un</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}