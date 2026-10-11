import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useRealtimeDoc } from '../../hooks/useRealtimeDoc'
import { COLLECTIONS, LOW_STOCK_THRESHOLD, formatCurrency } from '../../lib/constants'
import { useCart } from '../../context/CartContext'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { data: product, loading } = useRealtimeDoc(COLLECTIONS.products, id)
  const [quantity, setQuantity] = useState(1)

  if (loading) return <Spinner label="A carregar item..." />

  if (!product) {
    return (
      <EmptyState
        icon="❓"
        title="Item nao encontrado"
        description="Este produto pode ter sido removido do catalogo."
      >
        <Link to="/" className="btn btn-primary">
          Voltar ao catalogo
        </Link>
      </EmptyState>
    )
  }

  const isService = product.type === 'service'
  const soldOut = !isService && Number(product.stock) <= 0
  const lowStock = !isService && !soldOut && Number(product.stock) <= LOW_STOCK_THRESHOLD

  return (
    <div className="page">
      <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
        ← Voltar
      </button>

      <div className="detail">
        <div className="detail__media">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} />
          ) : (
            <span className="product-card__placeholder">Nexus</span>
          )}
        </div>

        <div className="detail__info">
          <small className="muted">{product.category}</small>
          <h1>{product.name}</h1>
          <p className="detail__desc">{product.description || 'Sem descricao.'}</p>

          <p className="price price--lg">{formatCurrency(product.price)}</p>

          <div className="detail__meta">
            <span className={`tag ${isService ? 'tag--service' : 'tag--product'}`}>
              {isService ? 'Servico' : 'Produto'}
            </span>
            {!isService && (
              <span className={`tag ${lowStock ? 'tag--low' : ''}`}>
                {soldOut ? 'Esgotado' : `${product.stock} em stock`}
              </span>
            )}
          </div>

          <div className="detail__buy">
            <label>
              Quantidade
              <input
                type="number"
                min="1"
                max={isService ? 99 : Math.max(1, Number(product.stock))}
                value={quantity}
                onChange={(event) =>
                  setQuantity(Math.max(1, Number(event.target.value) || 1))
                }
              />
            </label>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              disabled={soldOut}
              onClick={() => {
                addItem(product, quantity)
                navigate('/checkout')
              }}
            >
              {soldOut ? 'Esgotado' : 'Adicionar e ir ao checkout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}