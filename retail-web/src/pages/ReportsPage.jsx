import { useState } from 'react';
import { reportService } from '../services/endpoints';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import {
    Calendar,
    TrendingUp,
    DollarSign,
    Users,
    Package,
    AlertTriangle,
    Search,
} from 'lucide-react';

export default function ReportsPage() {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    const [fromDate, setFromDate] = useState(weekAgo);
    const [toDate, setToDate] = useState(today);
    const [loading, setLoading] = useState(false);

    const [sales, setSales] = useState(null);
    const [revenue, setRevenue] = useState(null);
    const [sellers, setSellers] = useState([]);
    const [inventory, setInventory] = useState(null);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const [salesRes, revenueRes, sellersRes, inventoryRes] = await Promise.all([
                reportService.sales(fromDate, toDate),
                reportService.revenue(fromDate, toDate),
                reportService.sellers(),
                reportService.inventory(),
            ]);
            setSales(salesRes.data);
            setRevenue(revenueRes.data);
            setSellers(sellersRes.data);
            setInventory(inventoryRes.data);
        } catch (err) {
            console.error('Failed to load reports:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reports-page" id="reports-page">
            <div className="page-header">
                <h1>Reports & Analytics</h1>
            </div>

            {/* Date Range */}
            <div className="report-filters">
                <div className="date-range">
                    <Calendar size={18} />
                    <label>From:</label>
                    <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} id="report-from" />
                    <label>To:</label>
                    <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} id="report-to" />
                </div>
                <button className="btn btn-primary" onClick={fetchReports} disabled={loading} id="fetch-reports-btn">
                    {loading ? 'Loading…' : <><Search size={16} /> Generate Reports</>}
                </button>
            </div>

            {sales && (
                <>
                    {/* Sales Summary */}
                    <div className="report-section">
                        <h2><TrendingUp size={20} /> Sales Summary</h2>
                        <div className="stats-grid report-stats">
                            <div className="stat-card">
                                <div className="stat-info">
                                    <span className="stat-label">Total Orders</span>
                                    <span className="stat-value">{sales.totalOrders}</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-info">
                                    <span className="stat-label">Revenue (KES)</span>
                                    <span className="stat-value">KES {Number(sales.totalRevenueKes).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-info">
                                    <span className="stat-label">Revenue (ETB)</span>
                                    <span className="stat-value">ETB {Number(sales.totalRevenueEtb).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Daily Breakdown Chart */}
                        {sales.breakdown && sales.breakdown.length > 0 && (
                            <div className="chart-container">
                                <h3>Daily Revenue</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={sales.breakdown}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                                        <YAxis stroke="#94a3b8" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="revenueKes" fill="#6366f1" name="Revenue (KES)" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="orderCount" fill="#22d3ee" name="Orders" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Revenue Analysis */}
                    {revenue && (
                        <div className="report-section">
                            <h2><DollarSign size={20} /> Revenue Analysis</h2>
                            <div className="table-wrapper">
                                <table className="data-table compact" id="revenue-table">
                                    <thead>
                                        <tr>
                                            <th>Metric</th>
                                            <th>Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Total Revenue (KES)</td>
                                            <td>KES {Number(revenue.totalRevenueKes).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                        <tr>
                                            <td>Total Revenue (ETB)</td>
                                            <td>ETB {Number(revenue.totalRevenueEtb).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                        <tr>
                                            <td>Cost of Goods Sold</td>
                                            <td>KES {Number(revenue.cogs).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                        <tr>
                                            <td>Profit</td>
                                            <td className={Number(revenue.profit) >= 0 ? 'text-success' : 'text-danger'}>
                                                KES {Number(revenue.profit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Profit Margin</td>
                                            <td className={Number(revenue.profitMarginPercent) >= 0 ? 'text-success' : 'text-danger'}>
                                                {Number(revenue.profitMarginPercent).toFixed(1)}%
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Seller Leaderboard */}
                    {sellers.length > 0 && (
                        <div className="report-section">
                            <h2><Users size={20} /> Seller Leaderboard</h2>
                            <div className="table-wrapper">
                                <table className="data-table" id="seller-leaderboard">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Seller</th>
                                            <th>Orders</th>
                                            <th>Revenue (KES)</th>
                                            <th>Revenue (ETB)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sellers.map((s, i) => (
                                            <tr key={s.sellerId}>
                                                <td className="td-rank">{i + 1}</td>
                                                <td>{s.sellerName}</td>
                                                <td>{s.orderCount}</td>
                                                <td>KES {Number(s.totalRevenueKes).toLocaleString()}</td>
                                                <td>ETB {Number(s.totalRevenueEtb).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Inventory */}
                    {inventory && (
                        <div className="report-section">
                            <h2><Package size={20} /> Inventory Overview</h2>
                            <div className="table-wrapper">
                                <table className="data-table" id="inventory-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Category</th>
                                            <th>Stock</th>
                                            <th>Min Alert</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inventory.products?.map(p => (
                                            <tr key={p.id} className={p.lowStock ? 'row-warning' : ''}>
                                                <td>{p.name}</td>
                                                <td>{p.category || '—'}</td>
                                                <td>{p.stockQuantity}</td>
                                                <td>{p.minStockAlert}</td>
                                                <td>
                                                    {p.lowStock ? (
                                                        <span className="status-badge low-stock">
                                                            <AlertTriangle size={14} /> Low Stock
                                                        </span>
                                                    ) : (
                                                        <span className="status-badge ok">OK</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {!sales && !loading && (
                <div className="empty-state large">
                    <BarChart size={64} />
                    <h3>No data yet</h3>
                    <p>Select a date range and click "Generate Reports" to view analytics.</p>
                </div>
            )}
        </div>
    );
}
