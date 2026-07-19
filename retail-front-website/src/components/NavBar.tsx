import { useAuth } from '../context/AuthContext'
import { usersService } from '../services/users.service'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

interface Props {
  currency: 'KES' | 'ETB'
  onCurrencyChange: (c: 'KES' | 'ETB') => void
}

export default function NavBar({ currency, onCurrencyChange }: Props) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const { mutate: updateCurrency } = useMutation({
    mutationFn: (c: 'KES' | 'ETB') => usersService.updateCurrency(c),
  })

  function handleCurrency(c: 'KES' | 'ETB') {
    onCurrencyChange(c)
    updateCurrency(c)
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between shadow">
      <span className="font-bold text-lg tracking-wide">Retail OCS</span>

      <div className="flex items-center gap-4">
        {/* Currency toggle */}
        <div className="flex bg-gray-700 rounded-lg overflow-hidden text-sm">
          <button
            onClick={() => handleCurrency('KES')}
            className={`px-3 py-1 transition-colors ${
              currency === 'KES' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'
            }`}
          >
            KES
          </button>
          <button
            onClick={() => handleCurrency('ETB')}
            className={`px-3 py-1 transition-colors ${
              currency === 'ETB' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'
            }`}
          >
            ETB
          </button>
        </div>

        <span className="text-sm text-gray-400">{user?.role}</span>

        <button
          onClick={handleLogout}
          className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
