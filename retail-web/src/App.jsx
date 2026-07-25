import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import OwnerDashboard from './pages/OwnerDashboard';
import ProductsPage from './pages/ProductsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import UserManagementPage from './pages/UserManagementPage';
import SellerDashboard from './pages/SellerDashboard';
import CashierDashboard from './pages/CashierDashboard';
import GoodsStaffPage from './pages/GoodsStaffPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Owner routes */}
            <Route
              element={
                <ProtectedRoute roles={['OWNER']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/owner" element={<OwnerDashboard />} />
              <Route path="/owner/products" element={<ProductsPage />} />
              <Route path="/owner/users" element={<UserManagementPage />} />
              <Route path="/owner/reports" element={<ReportsPage />} />
              <Route path="/owner/settings" element={<SettingsPage />} />
            </Route>

            {/* Cashier routes */}
            <Route
              element={
                <ProtectedRoute roles={['CASHIER', 'OWNER']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/cashier" element={<CashierDashboard />} />
            </Route>

            {/* Seller routes */}
            <Route
              element={
                <ProtectedRoute roles={['SELLER']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/seller" element={<SellerDashboard />} />
            </Route>

            {/* Goods Staff routes */}
            <Route
              element={
                <ProtectedRoute roles={['GOODS_STAFF']}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/goods" element={<GoodsStaffPage />} />
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
