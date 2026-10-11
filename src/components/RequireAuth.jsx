import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner label="A verificar sessao..." />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return children
}