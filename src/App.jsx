import { Navigate, Route, Routes } from 'react-router-dom'
import StoreLayout from './components/layout/StoreLayout'
import AdminLayout from './components/layout/AdminLayout'
import RequireAuth from './components/RequireAuth'
import RequireAdmin from './components/RequireAdmin'
import ConfigWarning from './components/ConfigWarning'
import Catalog from './pages/store/Catalog'
import ProductDetail from './pages/store/ProductDetail'
import Checkout from './pages/store/Checkout'
import OrderConfirmation from './pages/store/OrderConfirmation'
import CustomerDashboard from './pages/store/CustomerDashboard'
import Login from './pages/auth/Login'
import AdminOrders from './pages/admin/AdminOrders'
import AdminCatalog from './pages/admin/AdminCatalog'
import AdminMetrics from './pages/admin/AdminMetrics'
import AdminCustomers from './pages/admin/AdminCustomers'

export default function App() {
  return (
    <>
      <ConfigWarning />
      <Routes>
        {/* Frente de loja (publica) */}
        <Route element={<StoreLayout />}>
          <Route index element={<Catalog />} />
          <Route path="produto/:id" element={<ProductDetail />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="pedido/:id" element={<OrderConfirmation />} />
          <Route
            path="minha-conta"
            element={
              <RequireAuth>
                <CustomerDashboard />
              </RequireAuth>
            }
          />
        </Route>

        <Route path="/login" element={<Login />} />

        {/* Painel administrativo (protegido) */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Navigate to="pedidos" replace />} />
          <Route path="pedidos" element={<AdminOrders />} />
          <Route path="catalogo" element={<AdminCatalog />} />
          <Route path="metricas" element={<AdminMetrics />} />
          <Route path="clientes" element={<AdminCustomers />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}