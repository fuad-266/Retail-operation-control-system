import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { productService, orderService, userService } from '../services/endpoints';
import {
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    Search,
    UserPlus,
    X,
    Send,
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    RefreshCw,
    Package,
    Check,
    ShoppingBag,
    History,
    Grid,
    Edit2,
    User,
} from 'lucide-react';

export default function SellerDashboard() {
    const { currency, exchangeRate } = useAuth();

    // ─── View Tab ───────────────────────────
    const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'history'

    // ─── Product Catalog ────────────────────
    const [products, setProducts] = useState([]);
    const [prodSearch, setProdSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [prodLoading, setProdLoading] = useState(true);

    // ─── Add Item Modal State ────────────────
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [itemQty, setItemQty] = useState(1);
    const [itemUnitPrice, setItemUnitPrice] = useState('');

    // ─── Cart State ─────────────────────────
    const [cart, setCart] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitMsg, setSubmitMsg] = useState({ type: '', text: '' });

    // ─── My Orders State ────────────────────
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);

    // ─── Add Customer Modal State ───────────
    const [customerModal, setCustomerModal] = useState(false);
    const [custForm, setCustForm] = useState({ fullName: '', phoneNumber: '', email: '', password: '' });
    const [custMsg, setCustMsg] = useState({ type: '', text: '' });
    const [custLoading, setCustLoading] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchOrders();
    }, []);

    const fetchProducts = () => {
        setProdLoading(true);
        productService.list()
            .then(res => setProducts(res.data))
            .catch(() => { })
            .finally(() => setProdLoading(false));
    };

    const fetchOrders = () => {
        setOrdersLoading(true);
        orderService.myOrders()
            .then(res => setOrders(res.data))
            .catch(() => { })
            .finally(() => setOrdersLoading(false));
    };

    // ─── Categories ─────────────────────────
    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category).filter(Boolean));
        return ['ALL', ...Array.from(cats)];
    }, [products]);

    // ─── Filtered Products ──────────────────
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchSearch = p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
                (p.category || '').toLowerCase().includes(prodSearch.toLowerCase());
            const matchCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
            return matchSearch && matchCategory;
        });
    }, [products, prodSearch, selectedCategory]);

    // ─── Open Item Configuration Modal ──────
    const handleOpenItemModal = (product) => {
        if (!product.active || product.stockQuantity <= 0) return;

        const existing = cart.find(c => c.productId === product.id);
        setSelectedProduct(product);
        const rate = (exchangeRate && exchangeRate.rate) ? Number(exchangeRate.rate) : 1;

        if (existing) {
            setItemQty(existing.quantity);
            const val = currency === 'ETB' ? (existing.unitPrice / rate) : existing.unitPrice;
            setItemUnitPrice(val.toFixed(2));
        } else {
            setItemQty(1);
            if (currency === 'ETB') {
                const etbVal = product.priceEtb != null ? Number(product.priceEtb) : (Number(product.priceKes) / rate);
                setItemUnitPrice(etbVal.toFixed(2));
            } else {
                setItemUnitPrice(Number(product.priceKes).toFixed(2));
            }
        }
    };

    // ─── Confirm Add/Update Item in Cart ────
    const handleConfirmCartItem = () => {
        if (!selectedProduct) return;
        const parsedQty = Math.max(1, Math.min(parseInt(itemQty, 10) || 1, selectedProduct.stockQuantity));
        const inputVal = parseFloat(itemUnitPrice) || 0;
        const rate = (exchangeRate && exchangeRate.rate) ? Number(exchangeRate.rate) : 1;
        const baseKesPrice = currency === 'ETB' ? (inputVal * rate) : inputVal;
        const parsedPrice = Math.max(0, baseKesPrice);

        setCart(prev => {
            const existing = prev.find(c => c.productId === selectedProduct.id);
            if (existing) {
                return prev.map(c =>
                    c.productId === selectedProduct.id
                        ? { ...c, quantity: parsedQty, unitPrice: parsedPrice }
                        : c
                );
            }
            return [...prev, {
                productId: selectedProduct.id,
                name: selectedProduct.name,
                category: selectedProduct.category,
                imageUrl: selectedProduct.imageUrl,
                priceKes: selectedProduct.priceKes,
                priceEtb: selectedProduct.priceEtb,
                unitPrice: parsedPrice,
                quantity: parsedQty,
                maxStock: selectedProduct.stockQuantity,
            }];
        });

        setSelectedProduct(null);
    };

    const updateQuantity = (productId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.productId === productId) {
                const newQty = item.quantity + delta;
                if (newQty <= 0) return null;
                if (newQty > item.maxStock) return item;
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(Boolean));
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(c => c.productId !== productId));
    };

    const clearCart = () => {
        setCart([]);
        setCustomerName('');
        setSubmitMsg({ type: '', text: '' });
    };

    // ─── Total Calculation ──────────────────
    const cartTotalKes = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    }, [cart]);

    const displayTotal = useMemo(() => {
        if (currency === 'ETB') {
            const rate = (exchangeRate && exchangeRate.rate) ? Number(exchangeRate.rate) : 1;
            const etb = cartTotalKes / rate;
            return `ETB ${etb.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `KES ${cartTotalKes.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }, [cartTotalKes, currency, exchangeRate]);

    const formatPrice = (priceKes, priceEtb) => {
        if (currency === 'ETB') {
            if (priceEtb != null) {
                return `ETB ${Number(priceEtb).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
            }
            const rate = (exchangeRate && exchangeRate.rate) ? Number(exchangeRate.rate) : 1;
            return `ETB ${Number(priceKes / rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        }
        return `KES ${Number(priceKes).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    };

    const formatCartPrice = (amountInKes) => {
        const num = Number(amountInKes || 0);
        if (currency === 'ETB') {
            const rate = (exchangeRate && exchangeRate.rate) ? Number(exchangeRate.rate) : 1;
            const etbVal = num / rate;
            return `ETB ${etbVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `KES ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // ─── Order Submission ───────────────────
    const handleSubmitOrder = async () => {
        if (cart.length === 0) return;
        if (!customerName.trim()) {
            setSubmitMsg({ type: 'error', text: 'Please enter the Customer Name / Identifier so the Cashier can identify this order.' });
            return;
        }
        setSubmitMsg({ type: '', text: '' });
        setSubmitLoading(true);

        try {
            const items = cart.map(c => ({
                productId: c.productId,
                quantity: c.quantity,
                unitPrice: c.unitPrice,
            }));

            await orderService.create({
                items,
                customerName: customerName.trim(),
            });

            setSubmitMsg({ type: 'success', text: `✅ Order created for "${customerName.trim()}" & sent to Cashier!` });

            setTimeout(() => {
                clearCart();
                fetchProducts();
                fetchOrders();
            }, 1400);
        } catch (err) {
            setSubmitMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit order.' });
        } finally {
            setSubmitLoading(false);
        }
    };

    // ─── Cancel Order ───────────────────────
    const handleCancelOrder = async (id) => {
        if (!confirm('Cancel this order?')) return;
        try {
            await orderService.cancel(id);
            fetchOrders();
            fetchProducts();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to cancel order');
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
            setCustMsg({ type: 'success', text: `Customer created! Phone: ${custForm.phoneNumber}` });
            setCustForm({ fullName: '', phoneNumber: '', email: '', password: '' });
            setTimeout(() => {
                setCustomerModal(false);
            }, 1500);
        } catch (err) {
            setCustMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create customer' });
        } finally {
            setCustLoading(false);
        }
    };

    const statusBadge = (status) => {
        switch (status) {
            case 'PENDING': return <span className="status-badge pending"><Clock size={14} /> Pending Payment</span>;
            case 'PAID': return <span className="status-badge paid"><CheckCircle size={14} /> Paid</span>;
            case 'CANCELLED': return <span className="status-badge cancelled"><XCircle size={14} /> Cancelled</span>;
            default: return <span className="status-badge">{status}</span>;
        }
    };

    return (
        <div className="pos-dashboard" id="seller-dashboard">
            {/* Top POS Header */}
            <div className="pos-header">
                <div className="pos-header-title">
                    <h1>Seller POS Terminal</h1>
                    <p className="page-subtitle">Add items, set customer name, and send order directly to Cashier</p>
                </div>

                {/* View Switcher */}
                <div className="pos-tab-switcher">
                    <button
                        className={`pos-tab-btn ${activeTab === 'pos' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pos')}
                        id="tab-pos"
                    >
                        <Grid size={18} />
                        <span>Create Sale</span>
                    </button>
                    <button
                        className={`pos-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('history'); fetchOrders(); }}
                        id="tab-history"
                    >
                        <History size={18} />
                        <span>My Orders</span>
                        {orders.filter(o => o.status === 'PENDING').length > 0 && (
                            <span className="pos-badge">
                                {orders.filter(o => o.status === 'PENDING').length}
                            </span>
                        )}
                    </button>
                </div>

                <button
                    className="btn btn-outline"
                    onClick={() => { setCustomerModal(true); setCustMsg({ type: '', text: '' }); }}
                    id="add-customer-btn"
                >
                    <UserPlus size={18} /> Add Customer Account
                </button>
            </div>

            {activeTab === 'pos' ? (
                /* ─── Full Page POS Layout ─── */
                <div className="wholesale-workspace">
                    {/* Top Bar: Goods / Products Search Bar */}
                    <div className="wholesale-search-bar">
                        <div className="search-input-box">
                            <label htmlFor="seller-product-search">
                                <Search size={20} className="text-accent-primary" />
                                <span>SEARCH GOODS / PRODUCTS *</span>
                            </label>
                            <div className="search-field-wrapper">
                                <input
                                    id="seller-product-search"
                                    type="text"
                                    value={prodSearch}
                                    onChange={(e) => setProdSearch(e.target.value)}
                                    placeholder="Type product name or category to search (e.g. Maize, Flour, Sugar, Wireless Mouse)…"
                                    className="wholesale-search-input"
                                />
                                {prodSearch && (
                                    <button className="btn-icon clear-search-btn" onClick={() => setProdSearch('')}>
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Category Filter Pills in Top Bar */}
                        <div className="category-pills top-pills">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Workspace: Left Catalog List Rows | Right Order Cart */}
                    <div className="wholesale-grid">
                        {/* Left Column: Horizontal Row List of Goods (Not Box Cards) */}
                        <div className="wholesale-catalog-col">
                            <div className="catalog-header-info">
                                <h3>Available Inventory ({filteredProducts.length} items)</h3>
                                <span className="subtitle">Click any row to configure quantity and add to order sheet</span>
                            </div>

                            {/* Goods Row List (Diagonal / Horizontal Rows, NOT Grid Boxes) */}
                            <div className="pos-product-row-list">
                                {prodLoading ? (
                                    <div className="table-skeleton">
                                        {[...Array(6)].map((_, i) => <div key={i} className="skeleton-row" />)}
                                    </div>
                                ) : filteredProducts.length === 0 ? (
                                    <div className="empty-state">
                                        <Package size={48} />
                                        <h3>No goods found matching search</h3>
                                        <p>Try searching for a different item name or category.</p>
                                    </div>
                                ) : (
                                    filteredProducts.map(product => {
                                        const inCart = cart.find(c => c.productId === product.id);
                                        const isOutOfStock = product.stockQuantity <= 0;

                                        return (
                                            <div
                                                key={product.id}
                                                className={`pos-product-row-item ${isOutOfStock ? 'out-of-stock' : ''} ${inCart ? 'in-cart' : ''}`}
                                                onClick={() => !isOutOfStock && handleOpenItemModal(product)}
                                                id={`product-row-${product.id}`}
                                            >
                                                <div className="row-item-left">
                                                    <div className="row-item-icon">
                                                        {product.imageUrl ? (
                                                            <img src={product.imageUrl} alt={product.name} />
                                                        ) : (
                                                            <Package size={22} />
                                                        )}
                                                    </div>
                                                    <div className="row-item-details">
                                                        <h4 className="row-item-name">{product.name}</h4>
                                                        <span className="row-item-category">{product.category || 'General'}</span>
                                                    </div>
                                                </div>

                                                <div className="row-item-middle">
                                                    <span className="row-item-price">
                                                        {formatPrice(product.priceKes, product.priceEtb)}
                                                    </span>
                                                    <span className={`row-stock-badge ${product.stockQuantity < 5 ? 'low' : ''}`}>
                                                        {isOutOfStock ? 'Out of Stock' : `${product.stockQuantity} in stock`}
                                                    </span>
                                                </div>

                                                <div className="row-item-right">
                                                    {inCart ? (
                                                        <span className="in-cart-pill">
                                                            <Check size={14} /> {inCart.quantity} in cart
                                                        </span>
                                                    ) : (
                                                        <button
                                                            className="btn btn-sm btn-primary row-add-btn"
                                                            disabled={isOutOfStock}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenItemModal(product);
                                                            }}
                                                        >
                                                            <Plus size={16} /> Add Goods
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Right Panel: Order Summary & Cart Terminal */}
                        <div className="pos-cart-panel full-page-cart">
                            <div className="pos-cart-header">
                                <div className="cart-header-title">
                                    <ShoppingCart size={24} />
                                    <h2>Order Cart</h2>
                                </div>
                                {cart.length > 0 && (
                                    <button className="btn-link-danger" onClick={clearCart} title="Clear Cart">
                                        Clear All
                                    </button>
                                )}
                            </div>

                            {cart.length === 0 ? (
                                <div className="pos-cart-empty">
                                    <ShoppingBag size={56} />
                                    <h3>Cart is empty</h3>
                                    <p>Click any product on the left to set its quantity, price, and add it to this sale.</p>
                                </div>
                            ) : (
                                <div className="pos-cart-content">
                                    {/* Cart Line Items Table */}
                                    <div className="pos-cart-items-table">
                                        <div className="cart-table-header">
                                            <span>Product</span>
                                            <span>Qty</span>
                                            <span>Price</span>
                                            <span>Subtotal</span>
                                            <span>Action</span>
                                        </div>

                                        {cart.map(item => (
                                            <div key={item.productId} className="cart-table-row">
                                                <div className="cart-col-name">
                                                    <strong>{item.name}</strong>
                                                </div>

                                                <div className="cart-col-qty">
                                                    <button className="btn-icon-xs" onClick={() => updateQuantity(item.productId, -1)}>
                                                        <Minus size={12} />
                                                    </button>
                                                    <span>{item.quantity}</span>
                                                    <button
                                                        className="btn-icon-xs"
                                                        onClick={() => updateQuantity(item.productId, 1)}
                                                        disabled={item.quantity >= item.maxStock}
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>

                                                <div className="cart-col-price">
                                                    {formatCartPrice(item.unitPrice)}
                                                </div>

                                                <div className="cart-col-subtotal">
                                                    {formatCartPrice(item.unitPrice * item.quantity)}
                                                </div>

                                                <div className="cart-col-actions">
                                                    <button
                                                        className="btn-icon btn-sm"
                                                        onClick={() => handleOpenItemModal(products.find(p => p.id === item.productId) || item)}
                                                        title="Edit Quantity/Price"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        className="btn-icon btn-danger btn-sm"
                                                        onClick={() => removeFromCart(item.productId)}
                                                        title="Remove item"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Customer Name Input (Required for Cashier Identification) */}
                                    <div className="pos-reserve-box">
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label htmlFor="order-customer-name" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                                                <User size={16} /> Customer Name / Owner *
                                            </label>
                                            <input
                                                id="order-customer-name"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                placeholder="e.g. John Doe / Customer Name"
                                                required
                                                style={{ marginTop: '0.4rem' }}
                                            />
                                            <small className="text-muted" style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                                                Required so Cashier can identify who is paying. Unpaid orders auto-cancel after 6 hours.
                                            </small>
                                        </div>
                                    </div>

                                    {/* Alert Notification */}
                                    {submitMsg.text && (
                                        <div className={`alert alert-${submitMsg.type}`}>{submitMsg.text}</div>
                                    )}

                                    {/* Total & Submit Panel */}
                                    <div className="pos-cart-footer">
                                        <div className="pos-total-row">
                                            <span>Total Amount:</span>
                                            <span className="pos-total-amount">{displayTotal}</span>
                                        </div>

                                        <button
                                            className="btn btn-primary btn-full pos-submit-btn"
                                            onClick={handleSubmitOrder}
                                            disabled={submitLoading || cart.length === 0}
                                            id="submit-order-btn"
                                        >
                                            {submitLoading ? (
                                                <span className="btn-loading">Sending to Cashier…</span>
                                            ) : (
                                                <>
                                                    <Send size={20} /> Complete Sale Order
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* ─── My Orders History ─── */
                <div className="pos-history-workspace">
                    <div className="section-card">
                        <div className="section-header">
                            <h2><History size={20} /> My Orders History</h2>
                            <button className="btn btn-outline" onClick={fetchOrders}>
                                <RefreshCw size={16} /> Refresh Orders
                            </button>
                        </div>

                        {ordersLoading ? (
                            <div className="table-skeleton">
                                {[...Array(4)].map((_, i) => <div key={i} className="skeleton-row" />)}
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="empty-state">
                                <History size={48} />
                                <p>No orders created yet.</p>
                            </div>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table" id="seller-orders-table">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Date</th>
                                            <th>Customer / Owner</th>
                                            <th>Items</th>
                                            <th>Total Amount</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(order => (
                                            <tr key={order.id} className={`order-row status-${order.status.toLowerCase()}`}>
                                                <td className="td-id">#{order.id.slice(0, 8)}</td>
                                                <td>{new Date(order.createdAt).toLocaleString()}</td>
                                                <td>
                                                    <strong className="text-accent-info">
                                                        {order.reservedForName || order.customerName || 'In-store Walk-in'}
                                                    </strong>
                                                </td>
                                                <td className="td-items">
                                                    {order.items?.map((item, i) => (
                                                        <span key={i} className="order-item-tag">
                                                            {item.productName} × {item.quantity}
                                                        </span>
                                                    ))}
                                                </td>
                                                <td>
                                                    <strong>
                                                        KES {Number(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </strong>
                                                </td>
                                                <td>{statusBadge(order.status)}</td>
                                                <td className="td-actions">
                                                    {order.status === 'PENDING' && (
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleCancelOrder(order.id)}
                                                        >
                                                            Cancel
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
                </div>
            )}

            {/* ─── Configure Item Modal (Quantity & Unit Price Step) ─── */}
            {selectedProduct && (
                <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
                    <div className="modal item-config-modal" onClick={(e) => e.stopPropagation()} id="item-config-modal">
                        <div className="modal-header">
                            <h2>Add Item to Cart</h2>
                            <button className="btn-icon" onClick={() => setSelectedProduct(null)}><X size={20} /></button>
                        </div>

                        <div className="item-config-body">
                            {/* Product Overview Card */}
                            <div className="item-summary-card">
                                <div className="item-summary-icon">
                                    {selectedProduct.imageUrl ? (
                                        <img src={selectedProduct.imageUrl} alt={selectedProduct.name} />
                                    ) : (
                                        <Package size={32} />
                                    )}
                                </div>
                                <div className="item-summary-info">
                                    <h3>{selectedProduct.name}</h3>
                                    <p className="item-category-tag">{selectedProduct.category || 'General'}</p>
                                    <p className="item-stock-info">Available Stock: <strong>{selectedProduct.stockQuantity}</strong></p>
                                </div>
                            </div>

                            {/* Form Inputs: Quantity & Unit Price */}
                            <div className="form-group large-input-group">
                                <label htmlFor="modal-qty">Quantity *</label>
                                <div className="qty-modal-stepper">
                                    <button
                                        type="button"
                                        className="btn-stepper-lg"
                                        onClick={() => setItemQty(prev => Math.max(1, prev - 1))}
                                    >
                                        <Minus size={20} />
                                    </button>
                                    <input
                                        id="modal-qty"
                                        type="number"
                                        min="1"
                                        max={selectedProduct.stockQuantity}
                                        value={itemQty}
                                        onChange={(e) => setItemQty(Math.max(1, Math.min(parseInt(e.target.value, 10) || 1, selectedProduct.stockQuantity)))}
                                        className="modal-qty-input"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        className="btn-stepper-lg"
                                        onClick={() => setItemQty(prev => Math.min(selectedProduct.stockQuantity, prev + 1))}
                                        disabled={itemQty >= selectedProduct.stockQuantity}
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="form-group large-input-group">
                                <label htmlFor="modal-unit-price">Selling Unit Price ({currency}) *</label>
                                <input
                                    id="modal-unit-price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={itemUnitPrice}
                                    onChange={(e) => setItemUnitPrice(e.target.value)}
                                    placeholder="Enter unit price"
                                    className="modal-price-input"
                                />
                            </div>

                            {/* Subtotal Preview */}
                            <div className="item-subtotal-banner">
                                <span>Line Subtotal:</span>
                                <strong>
                                    {formatCartPrice((parseFloat(itemUnitPrice) || 0) * itemQty)}
                                </strong>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="btn btn-outline" onClick={() => setSelectedProduct(null)}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary btn-lg"
                                onClick={handleConfirmCartItem}
                                id="confirm-add-item-btn"
                            >
                                <ShoppingCart size={18} /> Add to Order Cart
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Add Customer Modal ─── */}
            {customerModal && (
                <div className="modal-overlay" onClick={() => setCustomerModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} id="customer-modal">
                        <div className="modal-header">
                            <h2><UserPlus size={20} /> Add New Customer</h2>
                            <button className="btn-icon" onClick={() => setCustomerModal(false)}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleAddCustomer} className="modal-form">
                            {custMsg.text && <div className={`alert alert-${custMsg.type}`}>{custMsg.text}</div>}

                            <div className="form-group">
                                <label htmlFor="cust-name">Full Name *</label>
                                <input
                                    id="cust-name"
                                    required
                                    value={custForm.fullName}
                                    onChange={(e) => setCustForm({ ...custForm, fullName: e.target.value })}
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="cust-phone">Phone Number *</label>
                                <input
                                    id="cust-phone"
                                    required
                                    value={custForm.phoneNumber}
                                    onChange={(e) => setCustForm({ ...custForm, phoneNumber: e.target.value })}
                                    placeholder="e.g. 0712345678"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="cust-email">Email (optional)</label>
                                <input
                                    id="cust-email"
                                    type="email"
                                    value={custForm.email}
                                    onChange={(e) => setCustForm({ ...custForm, email: e.target.value })}
                                    placeholder="e.g. customer@example.com"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="cust-pw">Temporary Password *</label>
                                <input
                                    id="cust-pw"
                                    required
                                    value={custForm.password}
                                    onChange={(e) => setCustForm({ ...custForm, password: e.target.value })}
                                    placeholder="Set initial password"
                                />
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
