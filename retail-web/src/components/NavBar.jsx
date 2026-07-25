import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LogOut,
    LayoutDashboard,
    Package,
    Users,
    Settings,
    BarChart3,
    ShoppingCart,
    Receipt,
    ClipboardList,
} from 'lucide-react';

const ROLE_NAV = {
    OWNER: [
        { to: '/owner', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/owner/products', label: 'Products', icon: Package },
        { to: '/owner/users', label: 'Users', icon: Users },
        { to: '/owner/reports', label: 'Reports', icon: BarChart3 },
        { to: '/owner/settings', label: 'Settings', icon: Settings },
    ],
    CASHIER: [
        { to: '/cashier', label: 'Dashboard', icon: LayoutDashboard },
    ],
    SELLER: [
        { to: '/seller', label: 'Dashboard', icon: ShoppingCart },
    ],
    GOODS_STAFF: [
        { to: '/goods', label: 'Receipts', icon: Receipt },
    ],
};

export default function NavBar() {
    const { role, currency, switchCurrency, logout, exchangeRate } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const navItems = ROLE_NAV[role] || [];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar" id="main-navbar">
            <div className="navbar-brand">
                <ClipboardList size={24} />
                <span className="navbar-title">RetailOps</span>
            </div>

            <div className="navbar-links">
                {navItems.map(({ to, label, icon: Icon }) => (
                    <Link
                        key={to}
                        to={to}
                        className={`nav-link ${location.pathname === to ? 'active' : ''}`}
                        id={`nav-${label.toLowerCase()}`}
                    >
                        <Icon size={18} />
                        <span>{label}</span>
                    </Link>
                ))}
            </div>

            <div className="navbar-actions">
                <div className="currency-toggle" id="currency-toggle">
                    <button
                        className={`currency-btn ${currency === 'KES' ? 'active' : ''}`}
                        onClick={() => switchCurrency('KES')}
                        id="currency-kes"
                    >
                        KES
                    </button>
                    <button
                        className={`currency-btn ${currency === 'ETB' ? 'active' : ''}`}
                        onClick={() => switchCurrency('ETB')}
                        id="currency-etb"
                    >
                        ETB
                    </button>
                </div>

                {exchangeRate?.staleRateWarning && (
                    <span className="stale-rate-badge" title="Exchange rate is stale — update it">
                        ⚠ Rate stale
                    </span>
                )}

                <button className="logout-btn" onClick={handleLogout} id="logout-btn">
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </nav>
    );
}
