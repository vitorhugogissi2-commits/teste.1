import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'

/** Bloqueia o painel para quem nao tem role de administrador. */
export default function RequireAdmin({ children }) {
  const { user, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner label="A validar credenciais..." />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />

  if (!isAdmin) {
    return (
      <div className="forbidden">
        <h1>Acesso restrito</h1>
        <p>A tua conta nao tem privilegios de administrador.</p>
        <p className="muted">
          Adiciona o teu e-mail a <code>VITE_ADMIN_EMAILS</code> no <code>.env.local</code>{' '}
          ou atribui a custom claim <code>role=admin</code> (ver README).
        </p>
      </div>
    )
  }

  return children
}