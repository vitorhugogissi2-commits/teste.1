import { Link } from 'react-router-dom'
import { LOW_STOCK_THRESHOLD, formatCurrency } from '../lib/constants'
import { useCart } from '../context/CartContext'

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const isService = product.type === 'service'
  const soldOut = !isService && Number(product.stock) <= 0
  const lowStock =
    !isService && !soldOut && Number(product.stock) <= LOW_STOCK_THRESHOLD

  return (
    <article className="product-card">
      <Link to={`/produto/${product.id}`} className="product-card__media">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <span className="product-card__placeholder">Nexus</span>
        )}
        <span className={`tag ${isService ? 'tag--service' : 'tag--product'}`}>
          {isService ? 'Servico' : 'Produto'}
        </span>
        {soldOut && <span className="tag tag--soldout">Esgotado</span>}
        {lowStock && <span className="tag tag--low">Stock baixo</span>}
      </Link>

      <div className="product-card__body">
        <small className="muted">{product.category}</small>
        <h3>
          <Link to={`/produto/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="product-card__desc">{product.description}</p>

        <div className="product-card__footer">
          <strong className="price">{formatCurrency(product.price)}</strong>
          <button
            type="button"
            className="btn btn-primary"
            disabled={soldOut}
            onClick={() => addItem(product, 1)}
          >
            {soldOut ? 'Esgotado' : 'Adicionar'}
          </button>
        </div>
      </div>
    </article>
  )
}