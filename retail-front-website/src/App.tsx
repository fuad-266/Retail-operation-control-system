import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useState, createContext, useContext } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import NavBar from './components/NavBar'
import type { ReactNode } from 'react'

// Pages
import LoginPage from './pages/LoginPage'
import OwnerDashboard from './pages/owner/OwnerDashboard'
import ProductsPage from './pages/owner/ProductsPage'
import ReportsPage from './pages/owner/ReportsPage'
import SettingsPage from './pages/owner/SettingsPage'
import UserManagementPage from './pages/owner/UserManagementPage'
import SellerDashboard from './pages/seller/SellerDashboard'
import CashierDashboard from './pages/cashier/CashierDashboard'
import GoodsStaffPage from './pages/goods/GoodsStaffPage'

// Currency context shared across the authenticated layout
const CurrencyContext = createContext<'KES' | 'ETB'>('ETB')
export const useCurrency = () => useContext(CurrencyContext)

// Helper to inject currency into pages
function CurrencyPage({ render }: { render: (currency: 'KES' | 'ETB') => ReactNode }) {
  const currency = useCurrency()
  return <>{render(currency)}</>
}

// Authenticated shell: NavBar + currency state + outlet
function AuthenticatedLayout() {
  const [currency, setCurrency] = useState<'KES' | 'ETB'>('ETB')
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar currency={currency} onCurrencyChange={setCurrency} />
      <main>
        <CurrencyContext.Provider value={currency}>
          <Outlet />
        </CurrencyContext.Provider>
      </main>
    </div>
  )
}

// Redirect to role-specific dashboard after login
function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  const routes: Record<string, string> = {
    OWNER: '/owner',
    CASHIER: '/cashier',
    SELLER: '/seller',
    GOODS_STAFF: '/goods',
  }
  return <Navigate to={routes[user.role] ?? '/login'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RoleRedirect />} />

          {/* All authenticated routes share the layout */}
          <Route element={<AuthenticatedLayout />}>
            {/* Owner */}
            <Route path="/owner" element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <CurrencyPage render={(c) => <OwnerDashboard currency={c} />} />
              </ProtectedRoute>
            } />
            <Route path="/owner/products" element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <CurrencyPage render={(c) => <ProductsPage currency={c} />} />
              </ProtectedRoute>
            } />
            <Route path="/owner/reports" element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <CurrencyPage render={(c) => <ReportsPage currency={c} />} />
              </ProtectedRoute>
            } />
            <Route path="/owner/settings" element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/owner/users" element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <UserManagementPage />
              </ProtectedRoute>
            } />

            {/* Seller */}
            <Route path="/seller" element={
              <ProtectedRoute allowedRoles={['SELLER']}>
                <CurrencyPage render={(c) => <SellerDashboard currency={c} />} />
              </ProtectedRoute>
            } />

            {/* Cashier */}
            <Route path="/cashier" element={
              <ProtectedRoute allowedRoles={['CASHIER', 'OWNER']}>
                <CurrencyPage render={(c) => <CashierDashboard currency={c} />} />
              </ProtectedRoute>
            } />

            {/* Goods Staff */}
            <Route path="/goods" element={
              <ProtectedRoute allowedRoles={['GOODS_STAFF']}>
                <GoodsStaffPage />
              </ProtectedRoute>
            } />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
