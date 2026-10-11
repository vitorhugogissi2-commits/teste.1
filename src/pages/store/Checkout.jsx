import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { createOrder } from '../../services/orders'
import {
  PAYMENT_LABEL,
  PAYMENT_METHODS,
  SHIPPING,
  calculateTotals,
  formatCurrency,
} from '../../lib/constants'
import EmptyState from '../../components/EmptyState'

export default function Checkout() {
  const { items, setQuantity, removeItem, clear } = useCart()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.PIX)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const totals = useMemo(() => calculateTotals(items, paymentMethod), [items, paymentMethod])
  const missingAddress = Boolean(user) && !profile?.address

  async function handleSubmit() {
    setError('')
    setSubmitting(true)
    try {
      const order = await createOrder({ user, profile, items, paymentMethod, notes })
      clear()
      navigate(`/pedido/${order.id}`, { state: { justCreated: true } })
    } catch (err) {
      console.error(err)
      setError(err.message || 'Nao foi possivel finalizar o pedido.')
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState icon="🛒" title="O carrinho esta vazio" description="Adiciona itens para continuar.">
        <Link to="/" className="btn btn-primary">
          Ver catalogo
        </Link>
      </EmptyState>
    )
  }

  return (
    <div className="page">
      <h1>Finalizar compra</h1>

      <div className="checkout">
        <section className="card">
          <h2>Itens ({items.length})</h2>
          <ul className="cart-list">
            {items.map((item) => (
              <li key={item.id} className="cart-item">
                <div className="cart-item__thumb">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} />
                  ) : (
                    <span>Nexus</span>
                  )}
                </div>
                <div className="cart-item__info">
                  <strong>{item.name}</strong>
                  <small className="muted">{formatCurrency(item.price)} un.</small>
                </div>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) => setQuantity(item.id, Number(event.target.value) || 0)}
                />
                <strong className="cart-item__total">
                  {formatCurrency(item.price * item.quantity)}
                </strong>
                <button type="button" className="btn btn-ghost" onClick={() => removeItem(item.id)}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>

        <aside className="card checkout__summary">
          <h2>Resumo</h2>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Desconto ({PAYMENT_LABEL[paymentMethod]})</span>
            <span className="text-success">- {formatCurrency(totals.discount)}</span>
          </div>
          <div className="summary-row">
            <span>Frete</span>
            <span>
              {totals.shipping === 0 ? (
                <span className="text-success">Gratis</span>
              ) : (
                formatCurrency(totals.shipping)
              )}
            </span>
          </div>
          <small className="muted">Frete gratis em compras acima de {formatCurrency(SHIPPING.freeAbove)}.</small>

          <hr />

          <div className="summary-row summary-row--total">
            <span>Total</span>
            <strong>{formatCurrency(totals.total)}</strong>
          </div>

          <h3>Forma de pagamento</h3>
          <div className="payment-options">
            {Object.values(PAYMENT_METHODS).map((method) => (
              <label
                key={method}
                className={`payment-option ${paymentMethod === method ? 'is-active' : ''}`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)}
                />
                <span>{PAYMENT_LABEL[method]}</span>
                {method === PAYMENT_METHODS.PIX && <em>-5%</em>}
              </label>
            ))}
          </div>

          <label className="field">
            Observacoes (opcional)
            <textarea
              rows="2"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ex: entregar apos as 18h"
            />
          </label>

          {!user && (
            <p className="alert alert--info">
              Precisas de iniciar sessao para concluir. <Link to="/login">Entrar agora</Link>.
            </p>
          )}
          {missingAddress && (
            <p className="alert alert--warn">
              Completa a tua morada em <Link to="/minha-conta">Minha Conta</Link> para agilizar
              a entrega.
            </p>
          )}
          {error && <p className="alert alert--error">{error}</p>}

          <button
            type="button"
            className="btn btn-primary btn-lg btn-block"
            disabled={!user || submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'A processar...' : `Confirmar pedido • ${formatCurrency(totals.total)}`}
          </button>
        </aside>
      </div>
    </div>
  )
}