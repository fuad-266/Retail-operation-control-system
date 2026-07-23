import { ReactNode, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface Props {
  children: ReactNode
}

export default function SellerLayout({ children }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const menuItems = [
    { path: '/seller', label: 'Dashboard', icon: '📊' },
    { path: '/seller/pos', label: 'New Sale (POS)', icon: '🛒' },
    { path: '/seller/orders', label: 'Orders', icon: '📋' },
    { path: '/seller/reserved', label: 'Reserved Orders', icon: '🔖' },
    { path: '/seller/customers', label: 'Customers', icon: '👥' },
    { path: '/seller/products', label: 'Products', icon: '📦' },
    { path: '/seller/inventory', label: 'Inventory', icon: '📊' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const currentTime = new Date().toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">Retail OCS</h1>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Profile & Logout */}
        <div className="p-3 border-t border-gray-200 space-y-1">
          <Link
            to="/seller/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <span className="text-lg">👤</span>
            <span>My Profile</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <span className="text-lg">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          {/* Search Bar */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products, orders, customers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4 ml-6">
            {/* Current Date & Time */}
            <div className="text-sm text-gray-600 hidden md:block">
              {currentTime}
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user?.fullName?.charAt(0) || 'S'}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden md:block">
                  {user?.fullName || 'Seller'}
                </span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
                  <Link
                    to="/seller/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/seller/change-password"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    Change Password
                  </Link>
                  <hr className="my-2 border-gray-200" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>

        {/* Footer */}
        <footer className="h-12 bg-white border-t border-gray-200 flex items-center justify-between px-6 text-xs text-gray-500">
          <div>© 2026 Retail OCS. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span>Version 1.0.0</span>
            <span>•</span>
            <a href="#" className="text-blue-600 hover:underline">
              Help & Support
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
