import { NavLink, Outlet, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/admin/pedidos', label: 'Pedidos', icon: '📦' },
  { to: '/admin/catalogo', label: 'Catalogo', icon: '🛠️' },
  { to: '/admin/metricas', label: 'Metricas', icon: '📊' },
  { to: '/admin/clientes', label: 'Clientes', icon: '👥' },
]

export default function AdminLayout() {
  const { profile, user, logout } = useAuth()

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <img src="/nexus.svg" alt="" width="30" height="30" />
          <div>
            <strong>Nexus Admin</strong>
            <small className="muted">Painel em tempo real</small>
          </div>
        </div>

        <nav className="sidebar__nav">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to}>
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="user-box">
            <span className="avatar">
              {(profile?.name || user?.email || 'A')[0].toUpperCase()}
            </span>
            <div>
              <div className="user-box__name">{profile?.name || 'Administrador'}</div>
              <small className="muted">{user?.email}</small>
            </div>
          </div>
          <Link to="/" className="btn btn-ghost btn-block">
            Ver a loja
          </Link>
          <button type="button" className="btn btn-ghost btn-block" onClick={logout}>
            Sair
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}