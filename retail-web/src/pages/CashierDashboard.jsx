import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { orderService, paymentService } from '../services/endpoints';
import {
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    CreditCard,
    Image,
    X,
    RefreshCw,
    ShoppingBag,
    Globe,
} from 'lucide-react';

export default function CashierDashboard() {
    const { currency, exchangeRate } = useAuth();
    const [tab, setTab] = useState('pending');

    // ─── Pending Orders ─────────────────────
    const [pendingOrders, setPendingOrders] = useState([]);
    const [pendingLoading, setPendingLoading] = useState(true);

    // ─── Reserved Orders ────────────────────
    const [reservedOrders, setReservedOrders] = useState([]);
    const [reservedLoading, setReservedLoading] = useState(true);

    // ─── Online Orders ──────────────────────
    const [onlineOrders, setOnlineOrders] = useState([]);
    const [onlineLoading, setOnlineLoading] = useState(true);

    // ─── Payment Modal ──────────────────────
    const [payModal, setPayModal] = useState(null);
    const [payForm, setPayForm] = useState({ paymentMethod: 'CASH', paymentCurrency: 'KES' });
    const [payLoading, setPayLoading] = useState(false);
    const [payMsg, setPayMsg] = useState({ type: '', text: '' });

    // ─── Reject Modal ──────────────────────
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectLoading, setRejectLoading] = useState(false);

    const fetchAll = () => {
        setPendingLoading(true);
        setReservedLoading(true);
        setOnlineLoading(true);

        orderService.pendingOrders()
            .then(res => setPendingOrders(res.data))
            .catch(() => { })
            .finally(() => setPendingLoading(false));

        orderService.reservedOrders()
            .then(res => setReservedOrders(res.data))
            .catch(() => { })
            .finally(() => setReservedLoading(false));

        orderService.onlinePendingVerification()
            .then(res => setOnlineOrders(res.data))
            .catch(() => { })
            .finally(() => setOnlineLoading(false));
    };

    useEffect(() => { fetchAll(); }, []);

    // ─── Confirm Payment ───────────────────
    const handleConfirmPayment = async (e) => {
        e.preventDefault();
        setPayLoading(true);
        setPayMsg({ type: '', text: '' });

        try {
            const orderId = payModal.id;
            const isOnline = payModal.isOnline;

            if (isOnline) {
                await paymentService.confirmOnline(orderId, payForm);
            } else {
                await paymentService.confirm(orderId, payForm);
            }

            setPayMsg({ type: 'success', text: 'Payment confirmed! Receipt generated.' });
            setTimeout(() => {
                setPayModal(null);
                fetchAll();
            }, 1500);
        } catch (err) {
            setPayMsg({ type: 'error', text: err.response?.data?.message || 'Failed to confirm payment.' });
        } finally {
            setPayLoading(false);
        }
    };

    // ─── Reject Online ─────────────────────
    const handleReject = async () => {
        if (!rejectReason.trim()) return;
        setRejectLoading(true);
        try {
            await paymentService.rejectOnline(rejectModal.id, rejectReason);
            setRejectModal(null);
            setRejectReason('');
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reject');
        } finally {
            setRejectLoading(false);
        }
    };

    // ─── Convert Reserved → Pending ────────
    const handleConvert = async (id) => {
        try {
            await orderService.convertToPending(id);
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to convert');
        }
    };

    const isExpired = (expiresAt) => expiresAt && new Date(expiresAt) < new Date();

    const formatAmount = (amount) => {
        const num = Number(amount || 0);
        if (currency === 'ETB' && exchangeRate) {
            return `ETB ${(num / exchangeRate.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        }
        return `KES ${num.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    };

    return (
        <div className="cashier-dashboard" id="cashier-dashboard">
            <div className="page-header">
                <h1>Cashier Dashboard</h1>
                <button className="btn btn-outline" onClick={fetchAll}>
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="tab-bar" id="cashier-tabs">
                <button className={`tab-btn ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>
                    <ShoppingBag size={16} /> Pending Orders
                    {pendingOrders.length > 0 && <span className="tab-badge">{pendingOrders.length}</span>}
                </button>
                <button className={`tab-btn ${tab === 'reserved' ? 'active' : ''}`} onClick={() => setTab('reserved')}>
                    <Clock size={16} /> Reserved Orders
                    {reservedOrders.length > 0 && <span className="tab-badge">{reservedOrders.length}</span>}
                </button>
                <button className={`tab-btn ${tab === 'online' ? 'active' : ''}`} onClick={() => setTab('online')}>
                    <Globe size={16} /> Online Payments
                    {onlineOrders.length > 0 && <span className="tab-badge">{onlineOrders.length}</span>}
                </button>
            </div>

            {/* Pending Tab */}
            {tab === 'pending' && (
                <div className="tab-content">
                    {pendingLoading ? (
                        <p className="text-muted">Loading…</p>
                    ) : pendingOrders.length === 0 ? (
                        <div className="empty-state">
                            <ShoppingBag size={48} />
                            <p>No pending orders</p>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table" id="pending-orders-table">
                                <thead>
                                    <tr>
                                        <th>Customer / Owner</th>
                                        <th>Seller</th>
                                        <th>Items</th>
                                        <th>Total</th>
                                        <th>Created Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingOrders.map(order => (
                                        <tr key={order.id}>
                                            <td>
                                                <strong className="text-accent-info">
                                                    {order.reservedForName || order.customerName || 'In-store Walk-in'}
                                                </strong>
                                            </td>
                                            <td>{order.sellerName}</td>
                                            <td className="td-items">
                                                {order.items?.map((item, i) => (
                                                    <span key={i} className="order-item-tag">{item.productName} × {item.quantity}</span>
                                                ))}
                                            </td>
                                            <td>{formatAmount(order.totalAmount)}</td>
                                            <td>
                                                <div>{new Date(order.createdAt).toLocaleString()}</div>
                                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>Expires in 6h if unpaid</span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => {
                                                        setPayModal({ ...order, isOnline: false });
                                                        setPayMsg({ type: '', text: '' });
                                                    }}
                                                    id={`confirm-pay-${order.id}`}
                                                >
                                                    <CreditCard size={14} /> Confirm Payment
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Reserved Tab */}
            {tab === 'reserved' && (
                <div className="tab-content">
                    {reservedLoading ? (
                        <p className="text-muted">Loading…</p>
                    ) : reservedOrders.length === 0 ? (
                        <div className="empty-state">
                            <Clock size={48} />
                            <p>No reserved orders</p>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table" id="reserved-orders-table">
                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Seller</th>
                                        <th>Items</th>
                                        <th>Total</th>
                                        <th>Expires</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reservedOrders.map(order => (
                                        <tr key={order.id} className={isExpired(order.reservationExpiresAt) ? 'row-expired' : ''}>
                                            <td>
                                                {order.reservedForName || '—'}
                                            </td>
                                            <td>{order.sellerName}</td>
                                            <td className="td-items">
                                                {order.items?.map((item, i) => (
                                                    <span key={i} className="order-item-tag">{item.productName} × {item.quantity}</span>
                                                ))}
                                            </td>
                                            <td>{formatAmount(order.totalAmount)}</td>
                                            <td>
                                                {isExpired(order.reservationExpiresAt) ? (
                                                    <span className="status-badge expired">
                                                        <AlertTriangle size={14} /> Expired
                                                    </span>
                                                ) : (
                                                    <span className="text-muted">
                                                        {order.reservationExpiresAt
                                                            ? new Date(order.reservationExpiresAt).toLocaleString()
                                                            : '—'}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {!isExpired(order.reservationExpiresAt) && (
                                                    <button className="btn btn-sm btn-outline" onClick={() => handleConvert(order.id)}>
                                                        Convert to Sale
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Online Payments Tab */}
            {tab === 'online' && (
                <div className="tab-content">
                    {onlineLoading ? (
                        <p className="text-muted">Loading…</p>
                    ) : onlineOrders.length === 0 ? (
                        <div className="empty-state">
                            <Globe size={48} />
                            <p>No online orders awaiting verification</p>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table" id="online-orders-table">
                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Items</th>
                                        <th>Total</th>
                                        <th>Reference</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {onlineOrders.map(order => (
                                        <tr key={order.id}>
                                            <td>{order.customerName || '—'}</td>
                                            <td className="td-items">
                                                {order.items?.map((item, i) => (
                                                    <span key={i} className="order-item-tag">{item.productName} × {item.quantity}</span>
                                                ))}
                                            </td>
                                            <td>{formatAmount(order.totalAmount)}</td>
                                            <td>{order.paymentReference || '—'}</td>
                                            <td>{new Date(order.createdAt).toLocaleString()}</td>
                                            <td className="td-actions">
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => {
                                                        setPayModal({ ...order, isOnline: true });
                                                        setPayMsg({ type: '', text: '' });
                                                    }}
                                                >
                                                    <CheckCircle size={14} /> Approve
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => {
                                                        setRejectModal(order);
                                                        setRejectReason('');
                                                    }}
                                                >
                                                    <XCircle size={14} /> Reject
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Payment Confirmation Modal ─── */}
            {payModal && (
                <div className="modal-overlay" onClick={() => setPayModal(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} id="payment-modal">
                        <div className="modal-header">
                            <h2>Confirm Payment</h2>
                            <button className="btn-icon" onClick={() => setPayModal(null)}><X size={20} /></button>
                        </div>

                        <div className="payment-summary">
                            <p><strong>Total: </strong>KES {Number(payModal.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            {payModal.sellerName && <p><strong>Seller: </strong>{payModal.sellerName}</p>}
                        </div>

                        <form onSubmit={handleConfirmPayment} className="modal-form">
                            {payMsg.text && <div className={`alert alert-${payMsg.type}`}>{payMsg.text}</div>}

                            <div className="form-group">
                                <label htmlFor="pay-method">Payment Method</label>
                                <select id="pay-method" value={payForm.paymentMethod}
                                    onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}>
                                    <option value="CASH">Cash</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="MOBILE_MONEY">Mobile Money</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="pay-currency">Payment Currency</label>
                                <select id="pay-currency" value={payForm.paymentCurrency}
                                    onChange={(e) => setPayForm({ ...payForm, paymentCurrency: e.target.value })}>
                                    <option value="KES">KES</option>
                                    <option value="ETB">ETB</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setPayModal(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={payLoading} id="confirm-payment-submit">
                                    {payLoading ? 'Processing…' : 'Confirm Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Reject Modal ─── */}
            {rejectModal && (
                <div className="modal-overlay" onClick={() => setRejectModal(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} id="reject-modal">
                        <div className="modal-header">
                            <h2>Reject Payment</h2>
                            <button className="btn-icon" onClick={() => setRejectModal(null)}><X size={20} /></button>
                        </div>

                        <div className="modal-form">
                            <div className="form-group">
                                <label htmlFor="reject-reason">Reason for rejection *</label>
                                <textarea
                                    id="reject-reason"
                                    rows={3}
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Enter reason…"
                                    required
                                />
                            </div>

                            <div className="modal-actions">
                                <button className="btn btn-outline" onClick={() => setRejectModal(null)}>Cancel</button>
                                <button
                                    className="btn btn-danger"
                                    onClick={handleReject}
                                    disabled={rejectLoading || !rejectReason.trim()}
                                    id="reject-submit"
                                >
                                    {rejectLoading ? 'Rejecting…' : 'Reject Payment'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
