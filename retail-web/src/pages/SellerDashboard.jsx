import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { productService, orderService, userService } from '../services/endpoints';
import {
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    Search,
    ToggleLeft,
    ToggleRight,
    UserPlus,
    X,
    Send,
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    RefreshCw,
} from 'lucide-react';

export default function SellerDashboard() {
    const { currency, exchangeRate } = useAuth();

    // ─── Product catalog ────────────────────
    const [products, setProducts] = useState([]);
    const [prodSearch, setProdSearch] = useState('');
    const [prodLoading, setProdLoading] = useState(true);

    // ─── Cart ───────────────────────────────
    const [cart, setCart] = useState([]);
    const [reserve, setReserve] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitMsg, setSubmitMsg] = useState({ type: '', text: '' });

    // ─── My Orders ──────────────────────────
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);

    // ─── Add Customer Modal ─────────────────
    const [customerModal, setCustomerModal] = useState(false);
    const [custForm, setCustForm] = useState({ fullName: '', phoneNumber: '', email: '', password: '' });
    const [custMsg, setCustMsg] = useState({ type: '', text: '' });
    const [custLoading, setCustLoading] = useState(false);

    useEffect(() => {
        productService.list()
            .then(res => setProducts(res.data))
            .catch(() => { })
            .finally(() => setProdLoading(false));
        fetchOrders();
    }, []);

    const fetchOrders = () => {
        setOrdersLoading(true);
        orderService.myOrders()
            .then(res => setOrders(res.data))
            .catch(() => { })
            .finally(() => setOrdersLoading(false));
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(prodSearch.toLowerCase())
    );

    // ─── Cart helpers ───────────────────────
    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(c => c.productId === product.id);
            if (existing) return prev;
            return [...prev, {
                productId: product.id,
                name: product.name,
                priceKes: product.priceKes,
                priceEtb: product.priceEtb,
                unitPrice: Number(product.priceKes),
                quantity: 1,
                maxStock: product.stockQuantity,
            }];
        });
    };

    const updateCartItem = (productId, field, value) => {
        setCart(prev => prev.map(item =>
            item.productId === productId ? { ...item, [field]: value } : item
        ));
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(c => c.productId !== productId));
    };

    const cartTotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    }, [cart]);

    const displayTotal = currency === 'ETB' && exchangeRate
        ? `ETB ${(cartTotal / exchangeRate.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        : `KES ${cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    // ─── Submit Order ───────────────────────
    const handleSubmitOrder = async () => {
        if (cart.length === 0) return;
        if (reserve && !customerName.trim()) {
            setSubmitMsg({ type: 'error', text: 'Customer name is required for reservations.' });
            return;
        }
        setSubmitMsg({ type: '', text: '' });
        setSubmitLoading(true);

        try {
            const items = cart.map(c => ({ productId: c.productId, quantity: c.quantity }));

            if (reserve) {
                await orderService.createReserved({
                    items,
                    reservedForName: customerName.trim(),
                });
                setSubmitMsg({ type: 'success', text: 'Reservation created successfully!' });
            } else {
                await orderService.create({ items });
                setSubmitMsg({ type: 'success', text: 'Order created successfully!' });
            }

            setCart([]);
            setCustomerName('');
            setReserve(false);
            fetchOrders();
            // Refresh product stock
            productService.list().then(res => setProducts(res.data)).catch(() => { });
        } catch (err) {
            setSubmitMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create order.' });
        } finally {
            setSubmitLoading(false);
        }
    };

    // ─── Cancel Order ───────────────────────
    const handleCancel = async (id) => {
        if (!confirm('Cancel this order?')) return;
        try {
            await orderService.cancel(id);
            fetchOrders();
            productService.list().then(res => setProducts(res.data)).catch(() => { });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to cancel order');
        }
    };

    // ─── Convert to Sale ───────────────────
    const handleConvert = async (id) => {
        try {
            await orderService.convertToPending(id);
            fetchOrders();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to convert order');
        }
    };

    // ─── Add Customer ──────────────────────
    const handleAddCustomer = async (e) => {
        e.preventDefault();
        setCustMsg({ type: '', text: '' });
        setCustLoading(true);
        try {
            await userService.createCustomer({
                ...custForm,
                role: 'CUSTOMER',
            });
            setCustMsg({ type: 'success', text: `Customer created! Phone: ${custForm.phoneNumber}, Password: ${custForm.password}` });
            setCustForm({ fullName: '', phoneNumber: '', email: '', password: '' });
        } catch (err) {
            setCustMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create customer' });
        } finally {
            setCustLoading(false);
        }
    };

    const statusIcon = (status) => {
        switch (status) {
            case 'PENDING': return <Clock size={16} className="status-icon pending" />;
            case 'RESERVED': return <AlertCircle size={16} className="status-icon reserved" />;
            case 'PAID': return <CheckCircle size={16} className="status-icon paid" />;
            case 'CANCELLED': return <XCircle size={16} className="status-icon cancelled" />;
            default: return null;
        }
    };

    return (
        <div className="seller-dashboard" id="seller-dashboard">
            <div className="page-header">
                <h1>Seller Dashboard</h1>
                <button className="btn btn-outline" onClick={() => { setCustomerModal(true); setCustMsg({ type: '', text: '' }); }} id="add-customer-btn">
                    <UserPlus size={18} /> Add Customer
                </button>
            </div>

            <div className="seller-layout">
                {/* ─── Left: Create Order ─── */}
                <div className="seller-order-section">
                    <div className="section-card">
                        <h2><ShoppingCart size={20} /> Create Order</h2>

                        {/* Product Search */}
                        <div className="search-box compact">
                            <Search size={16} />
                            <input
                                placeholder="Search products…"
                                value={prodSearch}
                                onChange={(e) => setProdSearch(e.target.value)}
                                id="seller-product-search"
                            />
                        </div>

                        <div className="product-list-compact">
                            {prodLoading ? (
                                <p className="text-muted">Loading products…</p>
                            ) : filteredProducts.length === 0 ? (
                                <p className="text-muted">No products found</p>
                            ) : (
                                filteredProducts.slice(0, 20).map(p => (
                                    <div key={p.id} className="product-row-compact">
                                        <span className="product-name-compact">{p.name}</span>
                                        <span className="product-price-compact">
                                            {currency === 'ETB'
                                                ? `ETB ${Number(p.priceEtb).toFixed(2)}`
                                                : `KES ${Number(p.priceKes).toFixed(2)}`}
                                        </span>
                                        <span className="product-stock-compact">Stock: {p.stockQuantity}</span>
                                        <button className="btn-icon btn-add" onClick={() => addToCart(p)} title="Add to cart">
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Cart */}
                        {cart.length > 0 && (
                            <div className="cart-section">
                                <h3>Cart ({cart.length} items)</h3>
                                <div className="cart-items">
                                    {cart.map(item => (
                                        <div key={item.productId} className="cart-item">
                                            <span className="cart-item-name">{item.name}</span>
                                            <div className="cart-item-controls">
                                                <label className="cart-label">Qty:</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={item.maxStock}
                                                    value={item.quantity}
                                                    onChange={(e) => updateCartItem(item.productId, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                                    className="cart-qty-input"
                                                />
                                                <label className="cart-label">Price:</label>
                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateCartItem(item.productId, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                    className="cart-price-input"
                                                />
                                                <span className="cart-item-subtotal">
                                                    = KES {(item.unitPrice * item.quantity).toFixed(2)}
                                                </span>
                                                <button className="btn-icon btn-danger" onClick={() => removeFromCart(item.productId)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="cart-total">
                                    <span>Total:</span>
                                    <strong>{displayTotal}</strong>
                                </div>

                                {/* Reserve Toggle */}
                                <div className="reserve-toggle-section">
                                    <button
                                        className={`reserve-toggle-btn ${reserve ? 'on' : 'off'}`}
                                        onClick={() => setReserve(!reserve)}
                                        id="reserve-toggle"
                                    >
                                        {reserve ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                        <span>Reserve for Customer</span>
                                    </button>

                                    {reserve && (
                                        <div className="reserve-fields">
                                            <div className="form-group">
                                                <label htmlFor="reserve-name">Customer Name *</label>
                                                <input
                                                    id="reserve-name"
                                                    value={customerName}
                                                    onChange={(e) => setCustomerName(e.target.value)}
                                                    placeholder="Enter customer name"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {submitMsg.text && (
                                    <div className={`alert alert-${submitMsg.type}`}>{submitMsg.text}</div>
                                )}

                                <button
                                    className="btn btn-primary btn-full"
                                    onClick={handleSubmitOrder}
                                    disabled={submitLoading || cart.length === 0}
                                    id="submit-order-btn"
                                >
                                    {submitLoading ? 'Submitting…' : (
                                        <>
                                            <Send size={16} />
                                            {reserve ? 'Reserve Order' : 'Submit Order'}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Right: My Orders ─── */}
                <div className="seller-orders-section">
                    <div className="section-card">
                        <div className="section-header">
                            <h2>My Orders</h2>
                            <button className="btn-icon" onClick={fetchOrders} title="Refresh">
                                <RefreshCw size={16} />
                            </button>
                        </div>

                        {ordersLoading ? (
                            <p className="text-muted">Loading orders…</p>
                        ) : orders.length === 0 ? (
                            <p className="text-muted">No orders yet</p>
                        ) : (
                            <div className="orders-list">
                                {orders.map(order => (
                                    <div key={order.id} className={`order-card order-${order.status.toLowerCase()}`}>
                                        <div className="order-card-header">
                                            <span className="order-status-badge">
                                                {statusIcon(order.status)}
                                                {order.status}
                                            </span>
                                            <span className="order-date">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="order-items-preview">
                                            {order.items?.map((item, i) => (
                                                <span key={i} className="order-item-tag">
                                                    {item.productName} × {item.quantity}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="order-card-footer">
                                            <span className="order-total">
                                                KES {Number(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>

                                            {order.reservedForName && (
                                                <span className="order-reserved-for">
                                                    Reserved: {order.reservedForName}
                                                </span>
                                            )}

                                            <div className="order-actions">
                                                {(order.status === 'PENDING' || order.status === 'RESERVED') && (
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleCancel(order.id)}>
                                                        Cancel
                                                    </button>
                                                )}
                                                {order.status === 'RESERVED' && (
                                                    <button className="btn btn-sm btn-outline" onClick={() => handleConvert(order.id)}>
                                                        Convert to Sale
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {order.status === 'CANCELLED' && order.cancellationReason && (
                                            <p className="order-cancel-reason">{order.cancellationReason}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Add Customer Modal ─── */}
            {customerModal && (
                <div className="modal-overlay" onClick={() => setCustomerModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} id="customer-modal">
                        <div className="modal-header">
                            <h2>Add Customer</h2>
                            <button className="btn-icon" onClick={() => setCustomerModal(false)}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleAddCustomer} className="modal-form">
                            {custMsg.text && <div className={`alert alert-${custMsg.type}`}>{custMsg.text}</div>}

                            <div className="form-group">
                                <label htmlFor="cust-name">Full Name *</label>
                                <input id="cust-name" required value={custForm.fullName}
                                    onChange={(e) => setCustForm({ ...custForm, fullName: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="cust-phone">Phone Number *</label>
                                <input id="cust-phone" required value={custForm.phoneNumber}
                                    onChange={(e) => setCustForm({ ...custForm, phoneNumber: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="cust-email">Email (optional)</label>
                                <input id="cust-email" type="email" value={custForm.email}
                                    onChange={(e) => setCustForm({ ...custForm, email: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="cust-pw">Temporary Password *</label>
                                <input id="cust-pw" required value={custForm.password}
                                    onChange={(e) => setCustForm({ ...custForm, password: e.target.value })} />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setCustomerModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={custLoading} id="save-customer-btn">
                                    {custLoading ? 'Creating…' : 'Create Customer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
