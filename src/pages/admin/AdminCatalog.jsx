import { useMemo, useState } from 'react'
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection'
import {
  createProduct,
  removeProduct,
  updateProduct,
  uploadProductImage,
} from '../../services/products'
import { seedDemoData } from '../../lib/seed'
import { COLLECTIONS, LOW_STOCK_THRESHOLD, formatCurrency } from '../../lib/constants'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'

const EMPTY_FORM = {
  name: '',
  type: 'product',
  category: '',
  price: '',
  stock: '',
  description: '',
  imageUrl: '',
  active: true,
}

export default function AdminCatalog() {
  const { data: products, loading } = useRealtimeCollection(COLLECTIONS.products, {
    orderByField: 'createdAt',
    direction: 'desc',
  })

  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  const criticalStock = useMemo(
    () =>
      products.filter(
        (p) => p.type !== 'service' && Number(p.stock) <= LOW_STOCK_THRESHOLD,
      ),
    [products],
  )

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setUploadProgress(null)
  }

  function startEdit(product) {
    setEditingId(product.id)
    setForm({
      name: product.name || '',
      type: product.type || 'product',
      category: product.category || '',
      price: String(product.price ?? ''),
      stock: String(product.stock ?? ''),
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      active: product.active !== false,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleImage(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const url = await uploadProductImage(file, setUploadProgress)
      setForm((prev) => ({ ...prev, imageUrl: url }))
    } catch (error) {
      console.error(error)
      setMessage({ type: 'error', text: 'Falha no upload da imagem.' })
    } finally {
      setUploadProgress(null)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      if (editingId) {
        await updateProduct(editingId, form)
        setMessage({ type: 'success', text: 'Item atualizado em tempo real.' })
      } else {
        await createProduct(form)
        setMessage({ type: 'success', text: 'Item adicionado ao catalogo.' })
      }
      resetForm()
    } catch (error) {
      console.error(error)
      setMessage({ type: 'error', text: error.message || 'Erro ao guardar.' })
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Remover "${product.name}"?`)) return
    await removeProduct(product.id)
  }

  async function handleSeed() {
    try {
      const count = await seedDemoData()
      setMessage({ type: 'success', text: `${count} itens de exemplo adicionados.` })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Gestao de Catalogo</h1>
          <p className="muted">
            {products.length} itens • {criticalStock.length} com stock critico.
          </p>
        </div>
        {products.length === 0 && (
          <button type="button" className="btn btn-outline" onClick={handleSeed}>
            Carregar dados de exemplo
          </button>
        )}
      </header>

      {criticalStock.length > 0 && (
        <div className="alert alert--warn">
          <strong>Alerta de stock critico:</strong>{' '}
          {criticalStock.map((p) => `${p.name} (${p.stock})`).join(', ')}
        </div>
      )}

      {message && <div className={`alert alert--${message.type}`}>{message.text}</div>}

      <div className="catalog-admin">
        <section className="card">
          <h2>{editingId ? 'Editar item' : 'Novo item'}</h2>
          <form className="form" onSubmit={handleSubmit}>
            <label className="field">
              Nome
              <input
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </label>

            <div className="form-row">
              <label className="field">
                Tipo
                <select
                  value={form.type}
                  onChange={(event) => setForm({ ...form, type: event.target.value })}
                >
                  <option value="product">Produto</option>
                  <option value="service">Servico</option>
                </select>
              </label>
              <label className="field">
                Categoria
                <input
                  required
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  placeholder="Ex: Pecas"
                />
              </label>
            </div>

            <div className="form-row">
              <label className="field">
                Preco (R$)
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => setForm({ ...form, price: event.target.value })}
                />
              </label>
              <label className="field">
                Stock
                <input
                  type="number"
                  min="0"
                  disabled={form.type === 'service'}
                  value={form.type === 'service' ? '' : form.stock}
                  onChange={(event) => setForm({ ...form, stock: event.target.value })}
                />
              </label>
            </div>

            <label className="field">
              Descricao
              <textarea
                rows="3"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>

            <label className="field">
              Imagem
              <input type="file" accept="image/*" onChange={handleImage} />
            </label>

            <label className="field">
              URL da imagem
              <input
                value={form.imageUrl}
                onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                placeholder="https://..."
              />
            </label>

            {uploadProgress !== null && (
              <div className="progress">
                <div className="progress__bar" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}

            {form.imageUrl && (
              <img className="form-preview" src={form.imageUrl} alt="Pre-visualizacao" />
            )}

            <label className="switch">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm({ ...form, active: event.target.checked })}
              />
              <span>Visivel na loja</span>
            </label>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'A guardar...' : editingId ? 'Guardar alteracoes' : 'Adicionar item'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-ghost" onClick={resetForm}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="card">
          <h2>Itens ({products.length})</h2>

          {loading ? (
            <Spinner label="A carregar catalogo..." />
          ) : products.length === 0 ? (
            <EmptyState icon="🛠️" title="Catalogo vazio" description="Adiciona o primeiro item." />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Categoria</th>
                  <th>Preco</th>
                  <th>Stock</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const low =
                    product.type !== 'service' &&
                    Number(product.stock) <= LOW_STOCK_THRESHOLD
                  return (
                    <tr key={product.id} className={low ? 'row--warn' : ''}>
                      <td>
                        <div className="table__item">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt="" />
                          ) : (
                            <span className="table__thumb-fallback">N</span>
                          )}
                          <div>
                            <strong>{product.name}</strong>
                            <small className="muted">
                              {product.type === 'service' ? 'Servico' : 'Produto'}
                              {product.active === false && ' • inativo'}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>{product.category}</td>
                      <td>{formatCurrency(product.price)}</td>
                      <td>
                        {product.type === 'service' ? (
                          <span className="muted">—</span>
                        ) : (
                          <span className={low ? 'text-warn' : ''}>{product.stock}</span>
                        )}
                      </td>
                      <td className="table__actions">
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => startEdit(product)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-danger"
                          onClick={() => handleDelete(product)}
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  )
}