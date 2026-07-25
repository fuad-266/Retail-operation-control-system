import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportService, orderService, productService } from '../services/endpoints';
import {
    DollarSign,
    ShoppingBag,
    AlertTriangle,
    Package,
    Users,
    BarChart3,
    Settings,
    TrendingUp,
    Clock,
} from 'lucide-react';

export default function OwnerDashboard() {
    const { exchangeRate, currency } = useAuth();
    const [stats, setStats] = useState({
        todayRevenue: 0,
        pendingCount: 0,
        lowStockCount: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const today = new Date().toISOString().split('T')[0];
                const [salesRes, pendingRes, lowStockRes] = await Promise.all([
                    reportService.sales(today, today).catch(() => ({ data: { totalRevenueKes: 0, totalRevenueEtb: 0 } })),
                    orderService.pendingOrders().catch(() => ({ data: [] })),
                    productService.lowStock().catch(() => ({ data: [] })),
                ]);

                setStats({
                    todayRevenueKes: salesRes.data.totalRevenueKes || 0,
                    todayRevenueEtb: salesRes.data.totalRevenueEtb || 0,
                    pendingCount: pendingRes.data.length || 0,
                    lowStockCount: lowStockRes.data.length || 0,
                });
            } catch (err) {
                console.error('Failed to load dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const displayRevenue = currency === 'KES'
        ? `KES ${Number(stats.todayRevenueKes || 0).toLocaleString()}`
        : `ETB ${Number(stats.todayRevenueEtb || 0).toLocaleString()}`;

    return (
        <div className="dashboard-page" id="owner-dashboard">
            <div className="page-header">
                <h1>Owner Dashboard</h1>
                <p className="page-subtitle">Welcome back! Here's your store overview.</p>
            </div>

            {exchangeRate?.staleRateWarning && (
                <div className="alert alert-warning" id="stale-rate-warning">
                    <AlertTriangle size={20} />
                    <span>
                        Exchange rate is stale (last updated more than 24 hours ago).{' '}
                        <Link to="/owner/settings">Update now →</Link>
                    </span>
                </div>
            )}

            {loading ? (
                <div className="stats-skeleton">
                    <div className="skeleton-card" />
                    <div className="skeleton-card" />
                    <div className="skeleton-card" />
                </div>
            ) : (
                <div className="stats-grid">
                    <div className="stat-card stat-revenue">
                        <div className="stat-icon">
                            <DollarSign size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Today's Revenue</span>
                            <span className="stat-value">{displayRevenue}</span>
                        </div>
                        <TrendingUp size={20} className="stat-trend" />
                    </div>

                    <div className="stat-card stat-pending">
                        <div className="stat-icon">
                            <Clock size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Pending Orders</span>
                            <span className="stat-value">{stats.pendingCount}</span>
                        </div>
                        <ShoppingBag size={20} className="stat-trend" />
                    </div>

                    <div className="stat-card stat-low-stock">
                        <div className="stat-icon">
                            <AlertTriangle size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Low Stock Items</span>
                            <span className="stat-value">{stats.lowStockCount}</span>
                        </div>
                        <Package size={20} className="stat-trend" />
                    </div>
                </div>
            )}

            <div className="quick-nav">
                <h2>Quick Navigation</h2>
                <div className="quick-nav-grid">
                    <Link to="/owner/products" className="quick-nav-card" id="quick-products">
                        <Package size={28} />
                        <span>Products</span>
                        <small>Manage your inventory</small>
                    </Link>
                    <Link to="/owner/users" className="quick-nav-card" id="quick-users">
                        <Users size={28} />
                        <span>Users</span>
                        <small>Staff & customer accounts</small>
                    </Link>
                    <Link to="/owner/reports" className="quick-nav-card" id="quick-reports">
                        <BarChart3 size={28} />
                        <span>Reports</span>
                        <small>Sales analytics & insights</small>
                    </Link>
                    <Link to="/owner/settings" className="quick-nav-card" id="quick-settings">
                        <Settings size={28} />
                        <span>Settings</span>
                        <small>Exchange rate & shop config</small>
                    </Link>
                </div>
            </div>
        </div>
    );
}
