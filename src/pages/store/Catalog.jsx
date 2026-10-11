import { useMemo, useState } from 'react'
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection'
import { COLLECTIONS, formatCurrency } from '../../lib/constants'
import ProductCard from '../../components/ProductCard'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'

export default function Catalog() {
  const { data: products, loading } = useRealtimeCollection(COLLECTIONS.products, {
    orderByField: 'createdAt',
    direction: 'desc',
  })

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('recent')

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    let list = products.filter((p) => p.active !== false)

    if (category !== 'all') list = list.filter((p) => p.category === category)
    if (term) {
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term),
      )
    }

    const sorted = [...list]
    if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price)
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name))
    return sorted
  }, [products, search, category, sort])

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(),
    [products],
  )

  const cheapest = useMemo(() => {
    if (!products.length) return null
    const active = products.filter((p) => p.active !== false)
    if (!active.length) return null
    return active.reduce((min, p) => (p.price < min.price ? p : min))
  }, [products])

  return (
    <div className="page">
      <section className="hero">
        <div className="hero__text">
          <span className="pill pill--live">● Sincronizado em tempo real</span>
          <h1>
            Tudo o que precisa para <strong>vender e gerir</strong>, num so lugar.
          </h1>
          <p className="muted">
            Servicos, pecas e acessorios. Preco e stock atualizados no painel refletem
            aqui instantaneamente — sem recarregar a pagina.
          </p>
          {cheapest && (
            <p className="hero__hint">
              A partir de <strong>{formatCurrency(cheapest.price)}</strong> em{' '}
              {cheapest.name}
            </p>
          )}
        </div>
        <div className="hero__stats">
          <div className="stat-card">
            <strong>{products.length}</strong>
            <span className="muted">Itens no catalogo</span>
          </div>
          <div className="stat-card">
            <strong>{categories.length}</strong>
            <span className="muted">Categorias ativas</span>
          </div>
        </div>
      </section>

      <section className="toolbar">
        <input
          type="search"
          placeholder="Procurar produto ou servico..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">Todas as categorias</option>
          {categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="recent">Mais recentes</option>
          <option value="price-asc">Preco: menor primeiro</option>
          <option value="price-desc">Preco: maior primeiro</option>
          <option value="name">Nome (A-Z)</option>
        </select>
      </section>

      {loading ? (
        <Spinner label="A carregar catalogo..." />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Nenhum item encontrado"
          description="Ajusta os filtros ou, se fores administrador, adiciona itens no painel."
        />
      ) : (
        <section className="product-grid">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      )}
    </div>
  )
}