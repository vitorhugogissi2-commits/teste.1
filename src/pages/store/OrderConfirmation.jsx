import { Link, useParams } from 'react-router-dom'
import { useRealtimeDoc } from '../../hooks/useRealtimeDoc'
import { COLLECTIONS, PAYMENT_LABEL, formatCurrency, formatDate } from '../../lib/constants'
import OrderStatusBar from '../../components/OrderStatusBar'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'

/** Comprovativo do pedido + acompanhamento em tempo real. */
export default function OrderConfirmation() {
  const { id } = useParams()
  const { data: order, loading } = useRealtimeDoc(COLLECTIONS.orders, id)

  if (loading) return <Spinner label="A carregar pedido..." />

  if (!order) {
    return (
      <EmptyState icon="🧾" title="Pedido nao encontrado">
        <Link to="/" className="btn btn-primary">
          Voltar a loja
        </Link>
      </EmptyState>
    )
  }

  return (
    <div className="page page--narrow">
      <div className="receipt">
        <header className="receipt__header">
          <div>
            <span className="pill pill--live">● Atualiza em tempo real</span>
            <h1>Pedido {order.code}</h1>
            <p className="muted">Criado em {formatDate(order.createdAt)}</p>
          </div>
          <img src="/nexus.svg" alt="" width="44" height="44" />
        </header>

        <OrderStatusBar status={order.status} />

        <section className="receipt__section">
          <h2>Itens</h2>
          <ul className="cart-list">
            {order.items?.map((item) => (
              <li key={item.productId} className="cart-item cart-item--readonly">
                <div className="cart-item__info">
                  <strong>{item.name}</strong>
                  <small className="muted">
                    {item.quantity} × {formatCurrency(item.price)}
                  </small>
                </div>
                <strong>{formatCurrency(item.price * item.quantity)}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="receipt__section">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Desconto</span>
            <span className="text-success">- {formatCurrency(order.discount)}</span>
          </div>
          <div className="summary-row">
            <span>Frete</span>
            <span>{order.shipping === 0 ? 'Gratis' : formatCurrency(order.shipping)}</span>
          </div>
          <div className="summary-row summary-row--total">
            <span>Total</span>
            <strong>{formatCurrency(order.total)}</strong>
          </div>
          <p className="muted">
            Pagamento: <strong>{PAYMENT_LABEL[order.paymentMethod]}</strong>
          </p>
        </section>

        <section className="receipt__section">
          <h2>Entrega</h2>
          <p className="muted">
            {order.customer?.name} • {order.customer?.email}
            {order.customer?.phone && ` • ${order.customer.phone}`}
          </p>
          {order.customer?.address && <p className="muted">{order.customer.address}</p>}
        </section>

        <div className="receipt__actions">
          <Link to="/minha-conta" className="btn btn-primary">
            Ver os meus pedidos
          </Link>
          <Link to="/" className="btn btn-ghost">
            Continuar a comprar
          </Link>
        </div>
      </div>
    </div>
  )
}