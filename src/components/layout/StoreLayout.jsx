import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

export default function StoreLayout() {
  const { user, isAdmin, logout } = useAuth()
  const { count } = useCart()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <img src="/nexus.svg" alt="" width="34" height="34" />
          <span>
            Nexus <strong>Dash &amp; Store</strong>
          </span>
        </Link>

        <nav className="topbar__nav">
          <NavLink to="/" end>
            Catalogo
          </NavLink>
          {user && <NavLink to="/minha-conta">Minha Conta</NavLink>}
          {isAdmin && (
            <NavLink to="/admin/pedidos" className="link-admin">
              Painel Admin
            </NavLink>
          )}
        </nav>

        <div className="topbar__actions">
          <Link to="/checkout" className="cart-button" aria-label="Carrinho">
            🛒 <span className="cart-badge">{count}</span>
          </Link>
          {user ? (
            <div className="user-chip">
              <span className="avatar">
                {(user.displayName || user.email || 'N')[0].toUpperCase()}
              </span>
              <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                Sair
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Entrar
            </Link>
          )}
        </div>
      </header>

      <main className="content">
        <Outlet />
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} Nexus Dash &amp; Store</span>
        <span className="muted">Dados sincronizados em tempo real via Firestore</span>
      </footer>
    </div>
  )
}