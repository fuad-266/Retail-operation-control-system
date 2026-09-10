import { useEffect, useState, useMemo, useRef } from 'react';
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
    TrendingUp,
    Hash,
    DollarSign,
    ArrowRight,
    Zap,
    BarChart3,
    Eye,
} from 'lucide-react';

export default function SellerDashboard() {
    const { currency } = useAuth();

    // ─── View Tab ───────────────────────────
    const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'history' | 'insights'

    // ─── Product Catalog ────────────────────
    const [products, setProducts] = useState([]);
    const [prodSearch, setProdSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [prodLoading, setProdLoading] = useState(true);

    // ─── Inline Add / Edit State ────────────────
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [itemQty, setItemQty] = useState(1);
    const [itemUnitPrice, setItemUnitPrice] = useState('');
    const [editModal, setEditModal] = useState(false);

    // ─── Cart State ─────────────────────────
    const [cart, setCart] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitMsg, setSubmitMsg] = useState({ type: '', text: '' });

    // ─── My Orders State ────────────────────
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [orderFilter, setOrderFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'PAID' | 'CANCELLED'

    // ─── Add Customer Modal State ───────────
    const [customerModal, setCustomerModal] = useState(false);
    const [custForm, setCustForm] = useState({ fullName: '', phoneNumber: '', email: '', password: '' });
    const [custMsg, setCustMsg] = useState({ type: '', text: '' });
    const [custLoading, setCustLoading] = useState(false);

    // ─── Refs ───────────────────────────────
    const searchRef = useRef(null);

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

    // ─── Filtered Orders ────────────────────
    const filteredOrders = useMemo(() => {
        if (orderFilter === 'ALL') return orders;
        return orders.filter(o => o.status === orderFilter);
    }, [orders, orderFilter]);

    // ─── Insights ───────────────────────────
    const insights = useMemo(() => {
        const today = new Date().toDateString();
        const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
        const paidOrders = orders.filter(o => o.status === 'PAID');
        const pendingOrders = orders.filter(o => o.status === 'PENDING');
        const todayRevenue = todayOrders
            .filter(o => o.status === 'PAID')
            .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        const totalItems = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0);

        return {
            totalOrders: orders.length,
            todayOrders: todayOrders.length,
            paidOrders: paidOrders.length,
            pendingOrders: pendingOrders.length,
            todayRevenue,
            totalItems,
        };
    }, [orders]);

    // ─── Select Product Inline ──────────────
    const handleSelectProduct = (product) => {
        if (!product.active || product.stockQuantity <= 0) return;

        const existing = cart.find(c => c.productId === product.id);
        setSelectedProduct(product);
        if (existing) {
            setItemQty(existing.quantity);
            setItemUnitPrice(existing.unitPrice.toString());
        } else {
            setItemQty(1);
            setItemUnitPrice(product.priceKes.toString());
        }
    };

    // ─── Quick Add to Cart (inline from search bar) ────
    const handleQuickAdd = () => {
        if (!selectedProduct) return;
        const parsedQty = Math.max(1, Math.min(parseInt(itemQty, 10) || 1, selectedProduct.stockQuantity));
        const parsedPrice = Number(selectedProduct.priceKes);

        setCart(prev => {
            const existing = prev.find(c => c.productId === selectedProduct.id);
            if (existing) {
                return prev.map(c =>
                    c.productId === selectedProduct.id
                        ? { ...c, quantity: parsedQty, unitPrice: parsedPrice, isOverride: false }
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
                isOverride: false,
                quantity: parsedQty,
                maxStock: selectedProduct.stockQuantity,
            }];
        });

        setSelectedProduct(null);
        setItemQty(1);
    };

    // ─── Confirm Add/Update from Edit Modal ────
    const handleConfirmCartItem = () => {
        if (!selectedProduct) return;
        const parsedQty = Math.max(1, Math.min(parseInt(itemQty, 10) || 1, selectedProduct.stockQuantity));
        const parsedPrice = Math.max(0, parseFloat(itemUnitPrice) || Number(selectedProduct.priceKes));
        const priceChanged = parsedPrice !== selectedProduct.priceKes;

        setCart(prev => {
            const existing = prev.find(c => c.productId === selectedProduct.id);
            if (existing) {
                return prev.map(c =>
                    c.productId === selectedProduct.id
                        ? { ...c, quantity: parsedQty, unitPrice: parsedPrice, isOverride: priceChanged }
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
                isOverride: priceChanged,
                quantity: parsedQty,
                maxStock: selectedProduct.stockQuantity,
            }];
        });

        setSelectedProduct(null);
        setEditModal(false);
        setItemQty(1);
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
        const totalEtb = cart.reduce((sum, item) => {
            const etbComponent = item.isOverride ? 0 : (item.priceEtb * item.quantity);
            return sum + etbComponent;
        }, 0);

        const hasOverrides = cart.some(c => c.isOverride);

        if (currency === 'ETB' && !hasOverrides) {
            return `Br ${totalEtb.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (currency === 'ETB' && hasOverrides) {
            return `Br (Manual Override)`;
        }
        return `Br ${cartTotalKes.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }, [cart, currency, cartTotalKes]);

    const formatPrice = (priceKes, priceEtb) => {
        if (currency === 'ETB' && priceEtb != null) {
            return `Br ${Number(priceEtb).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        }
        return `Br ${Number(priceKes).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    };

    // ─── Order Submission ───────────────────
    const handleSubmitOrder = async (orderType = 'CASH') => {
        if (cart.length === 0) return;
        if (!customerName.trim()) {
            setSubmitMsg({ type: 'error', text: 'Please enter the Customer Name so the Cashier can identify this order.' });
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

            if (orderType === 'MOBILE') {
                await orderService.createReserved({
                    items,
                    reservedForName: customerName.trim(),
                    reservedForPhone: '', // Optional in backend
                });
            } else {
                await orderService.create({
                    items,
                    customerName: customerName.trim(),
                });
            }

            const successText = orderType === 'MOBILE'
                ? `Mobile payment order reserved for "${customerName.trim()}"!`
                : `Order created for "${customerName.trim()}" & sent to Cashier!`;

            setSubmitMsg({ type: 'success', text: successText });

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
            case 'PENDING': return <span className="sd-status-badge sd-status-pending"><Clock size={13} /> Pending</span>;
            case 'PAID': return <span className="sd-status-badge sd-status-paid"><CheckCircle size={13} /> Paid</span>;
            case 'CANCELLED': return <span className="sd-status-badge sd-status-cancelled"><XCircle size={13} /> Cancelled</span>;
            default: return <span className="sd-status-badge">{status}</span>;
        }
    };

    const cartItemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

    return (
        <div className="sd-root" id="seller-dashboard">
            {/* ─── Top Header Bar ─── */}
            <header className="sd-topbar">
                <div className="sd-topbar-left">
                    <div className="sd-topbar-icon">
                        <Zap size={22} />
                    </div>
                    <div>
                        <h1 className="sd-topbar-title">Seller Terminal</h1>
                        <p className="sd-topbar-sub">Build order → Send to cashier → Track status</p>
                    </div>
                </div>

                <nav className="sd-tab-nav">
                    <button
                        className={`sd-tab ${activeTab === 'pos' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pos')}
                        id="tab-pos"
                    >
                        <Grid size={16} />
                        <span>Create Sale</span>
                        {cart.length > 0 && <span className="sd-tab-badge">{cartItemCount}</span>}
                    </button>
                    <button
                        className={`sd-tab ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('history'); fetchOrders(); }}
                        id="tab-history"
                    >
                        <History size={16} />
                        <span>My Orders</span>
                        {orders.filter(o => o.status === 'PENDING').length > 0 && (
                            <span className="sd-tab-badge warn">
                                {orders.filter(o => o.status === 'PENDING').length}
                            </span>
                        )}
                    </button>
                    <button
                        className={`sd-tab ${activeTab === 'insights' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('insights'); fetchOrders(); }}
                        id="tab-insights"
                    >
                        <BarChart3 size={16} />
                        <span>Insights</span>
                    </button>
                </nav>

                <button
                    className="sd-add-customer-btn"
                    onClick={() => { setCustomerModal(true); setCustMsg({ type: '', text: '' }); }}
                    id="add-customer-btn"
                >
                    <UserPlus size={16} />
                    <span>New Customer</span>
                </button>
            </header>

            {/* ═══════════════════════════════════════ */}
            {/* ─── POS TAB ─── */}
            {/* ═══════════════════════════════════════ */}
            {activeTab === 'pos' && (
                <div className="sd-pos-layout">
                    {/* LEFT: Product Catalog */}
                    <section className="sd-catalog">
                        {/* Search Bar with Qty + Add */}
                        <div className="sd-search-card">
                            <div className="sd-search-top-row">
                                <div className="sd-search-row">
                                    <Search size={18} className="sd-search-icon" />
                                    <input
                                        ref={searchRef}
                                        id="seller-product-search"
                                        type="text"
                                        value={prodSearch}
                                        onChange={(e) => setProdSearch(e.target.value)}
                                        placeholder={selectedProduct ? selectedProduct.name : 'Type product name or category to search (e.g. Teff, Berbere, Coffee, Oil)…'}
                                        className="sd-search-input"
                                    />
                                    {prodSearch && (
                                        <button className="sd-search-clear" onClick={() => { setProdSearch(''); searchRef.current?.focus(); }}>
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>

                                <input
                                    type="number"
                                    min="1"
                                    max={selectedProduct?.stockQuantity || 999}
                                    value={itemQty}
                                    onChange={(e) => setItemQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                    className="sd-inline-qty"
                                    id="inline-qty-input"
                                />

                                <button
                                    className="sd-inline-add-btn"
                                    onClick={handleQuickAdd}
                                    disabled={!selectedProduct}
                                    id="inline-add-btn"
                                >
                                    <Plus size={18} /> Add
                                </button>
                            </div>

                            <div className="sd-categories">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        className={`sd-cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                                        onClick={() => setSelectedCategory(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Listing */}
                        <div className="sd-catalog-header">
                            <h3>Available Inventory <span className="sd-count-badge">{filteredProducts.length} items</span></h3>
                            <span className="sd-catalog-hint">Search and set a quantity above, or tap + to add one</span>
                        </div>

                        <div className="sd-product-list">
                            {prodLoading ? (
                                <div className="sd-skeleton-list">
                                    {[...Array(6)].map((_, i) => <div key={i} className="sd-skeleton-row" />)}
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="sd-empty">
                                    <Package size={48} />
                                    <h3>No products found</h3>
                                    <p>Try searching for a different item name or category.</p>
                                </div>
                            ) : (
                                filteredProducts.map(product => {
                                    const inCart = cart.find(c => c.productId === product.id);
                                    const isOutOfStock = product.stockQuantity <= 0;

                                    return (
                                        <div
                                            key={product.id}
                                            className={`sd-product-row ${isOutOfStock ? 'disabled' : ''} ${inCart ? 'in-cart' : ''} ${selectedProduct?.id === product.id ? 'selected' : ''}`}
                                            onClick={() => !isOutOfStock && handleSelectProduct(product)}
                                            id={`product-row-${product.id}`}
                                        >
                                            <div className="sd-prod-left">
                                                <div className="sd-prod-thumb">
                                                    {product.imageUrl ? (
                                                        <img src={product.imageUrl} alt={product.name} />
                                                    ) : (
                                                        <Package size={20} />
                                                    )}
                                                </div>
                                                <div className="sd-prod-info">
                                                    <span className="sd-prod-name">{product.name}</span>
                                                    <span className="sd-prod-meta">
                                                        {product.unitSize || ''}{product.unitSize ? ' · ' : ''}{product.stockQuantity} in stock · {product.category || 'General'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="sd-prod-right">
                                                <span className="sd-prod-price">
                                                    {formatPrice(product.priceKes, product.priceEtb)}
                                                </span>

                                                {inCart ? (
                                                    <span className="sd-in-cart-tag">
                                                        <Check size={12} /> {inCart.quantity} in cart
                                                    </span>
                                                ) : (
                                                    <button
                                                        className="sd-add-btn"
                                                        disabled={isOutOfStock}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelectProduct(product);
                                                        }}
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>

                    {/* RIGHT: Order Cart */}
                    <aside className="sd-cart-panel">
                        <div className="sd-cart-top">
                            <div className="sd-cart-title-row">
                                <ShoppingCart size={20} />
                                <h2>Order ticket</h2>
                            </div>
                            <div className="sd-cart-meta">
                                {cart.length > 0 && (
                                    <>
                                        <span className="sd-cart-stat">{cartItemCount} items</span>
                                        <span className="sd-cart-stat">· Order #{Math.floor(Math.random() * 9000 + 1000)}</span>
                                        <span className="sd-cart-stat">· {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {cart.length === 0 ? (
                            <div className="sd-cart-empty">
                                <div className="sd-cart-empty-icon">
                                    <ShoppingBag size={40} />
                                </div>
                                <p>Search and set a quantity above, or tap + to add one</p>
                            </div>
                        ) : (
                            <div className="sd-cart-body">
                                {/* Cart Items */}
                                <div className="sd-cart-items">
                                    {cart.map(item => (
                                        <div key={item.productId} className="sd-cart-item">
                                            <div className="sd-ci-top">
                                                <div className="sd-ci-info">
                                                    <span className="sd-ci-name">{item.name}</span>
                                                    <span className="sd-ci-subtotal">
                                                        {item.isOverride
                                                            ? `Br ${(item.unitPrice * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                                            : formatPrice(item.unitPrice * item.quantity, item.priceEtb * item.quantity)
                                                        }
                                                    </span>
                                                </div>
                                                <button
                                                    className="sd-ci-remove"
                                                    onClick={() => removeFromCart(item.productId)}
                                                    title="Remove"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            <div className="sd-ci-bottom">
                                                <div className="sd-ci-qty-control">
                                                    <button
                                                        className="sd-qty-btn"
                                                        onClick={() => updateQuantity(item.productId, -1)}
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="sd-qty-display">{item.quantity}</span>
                                                    <button
                                                        className="sd-qty-btn"
                                                        onClick={() => updateQuantity(item.productId, 1)}
                                                        disabled={item.quantity >= item.maxStock}
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                <button
                                                    className="sd-ci-edit"
                                                    onClick={() => {
                                                        const prod = products.find(p => p.id === item.productId) || item;
                                                        handleSelectProduct(prod);
                                                        setEditModal(true);
                                                    }}
                                                    title="Edit price & qty"
                                                >
                                                    <Edit2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Customer Name */}
                                <div className="sd-customer-box">
                                    <label htmlFor="order-customer-name">
                                        <User size={14} /> Customer Name *
                                    </label>
                                    <input
                                        id="order-customer-name"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="e.g. John Doe"
                                        required
                                    />
                                    <small>Required for cashier identification. Auto-cancel after 6 hours.</small>
                                </div>

                                {submitMsg.text && (
                                    <div className={`sd-alert sd-alert-${submitMsg.type}`}>{submitMsg.text}</div>
                                )}

                                {/* Footer / Total */}
                                <div className="sd-cart-footer">
                                    <div className="sd-total-row">
                                        <span>Total</span>
                                        <span className="sd-total-amount">{displayTotal}</span>
                                    </div>
                                    <div className="sd-submit-row">
                                        <button
                                            className="sd-submit-btn sd-btn-cash"
                                            onClick={() => handleSubmitOrder('CASH')}
                                            disabled={submitLoading || cart.length === 0}
                                        >
                                            {submitLoading ? (
                                                <span className="sd-btn-loading">Sending…</span>
                                            ) : (
                                                <>
                                                    <Send size={16} /> Cash Sale
                                                </>
                                            )}
                                        </button>
                                        <button
                                            className="sd-submit-btn sd-btn-mobile"
                                            onClick={() => handleSubmitOrder('MOBILE')}
                                            disabled={submitLoading || cart.length === 0}
                                            title="Reserves stock instantly"
                                        >
                                            {submitLoading ? (
                                                <span className="sd-btn-loading">Reserving…</span>
                                            ) : (
                                                <>
                                                    <CheckCircle size={16} /> Mobile (Reserve)
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <button className="sd-clear-btn" onClick={clearCart}>
                                        Clear cart
                                    </button>
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            )}

            {/* ═══════════════════════════════════════ */}
            {/* ─── HISTORY TAB ─── */}
            {/* ═══════════════════════════════════════ */}
            {activeTab === 'history' && (
                <div className="sd-history">
                    <div className="sd-history-header">
                        <div className="sd-history-title">
                            <h2><History size={22} /> My Orders</h2>
                            <span className="sd-history-count">{orders.length} total</span>
                        </div>
                        <div className="sd-history-actions">
                            <div className="sd-order-filters">
                                {['ALL', 'PENDING', 'PAID', 'CANCELLED'].map(f => (
                                    <button
                                        key={f}
                                        className={`sd-filter-pill ${orderFilter === f ? 'active' : ''}`}
                                        onClick={() => setOrderFilter(f)}
                                    >
                                        {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                                        {f !== 'ALL' && (
                                            <span className="sd-filter-count">
                                                {orders.filter(o => f === 'ALL' || o.status === f).length}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <button className="btn btn-outline" onClick={fetchOrders}>
                                <RefreshCw size={15} /> Refresh
                            </button>
                        </div>
                    </div>

                    {ordersLoading ? (
                        <div className="sd-skeleton-list">
                            {[...Array(4)].map((_, i) => <div key={i} className="sd-skeleton-row large" />)}
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="sd-empty large">
                            <History size={52} />
                            <h3>No orders found</h3>
                            <p>{orderFilter === 'ALL' ? 'No orders created yet. Start selling!' : `No ${orderFilter.toLowerCase()} orders.`}</p>
                        </div>
                    ) : (
                        <div className="sd-order-grid">
                            {filteredOrders.map(order => (
                                <div key={order.id} className={`sd-order-card status-${order.status.toLowerCase()}`}>
                                    <div className="sd-oc-header">
                                        <div className="sd-oc-id">
                                            <Hash size={14} />
                                            <span>{order.id.slice(0, 8)}</span>
                                        </div>
                                        {statusBadge(order.status)}
                                    </div>

                                    <div className="sd-oc-customer">
                                        <User size={14} />
                                        <span>{order.reservedForName || order.customerName || 'Walk-in'}</span>
                                    </div>

                                    <div className="sd-oc-items">
                                        {order.items?.map((item, i) => (
                                            <span key={i} className="sd-oc-item-tag">
                                                {item.productName} × {item.quantity}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="sd-oc-footer">
                                        <div className="sd-oc-details">
                                            <span className="sd-oc-total">
                                                Br {Number(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                            <span className="sd-oc-date">
                                                {new Date(order.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        {order.status === 'PENDING' && (
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleCancelOrder(order.id)}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════ */}
            {/* ─── INSIGHTS TAB ─── */}
            {/* ═══════════════════════════════════════ */}
            {activeTab === 'insights' && (
                <div className="sd-insights">
                    <div className="sd-insights-header">
                        <h2><BarChart3 size={22} /> Sales Insights</h2>
                        <button className="btn btn-outline" onClick={fetchOrders}>
                            <RefreshCw size={15} /> Refresh
                        </button>
                    </div>

                    <div className="sd-insight-cards">
                        <div className="sd-insight-card sd-ic-primary">
                            <div className="sd-ic-icon"><ShoppingCart size={24} /></div>
                            <div className="sd-ic-data">
                                <span className="sd-ic-value">{insights.totalOrders}</span>
                                <span className="sd-ic-label">Total Orders</span>
                            </div>
                        </div>
                        <div className="sd-insight-card sd-ic-success">
                            <div className="sd-ic-icon"><CheckCircle size={24} /></div>
                            <div className="sd-ic-data">
                                <span className="sd-ic-value">{insights.paidOrders}</span>
                                <span className="sd-ic-label">Paid Orders</span>
                            </div>
                        </div>
                        <div className="sd-insight-card sd-ic-warning">
                            <div className="sd-ic-icon"><Clock size={24} /></div>
                            <div className="sd-ic-data">
                                <span className="sd-ic-value">{insights.pendingOrders}</span>
                                <span className="sd-ic-label">Pending Orders</span>
                            </div>
                        </div>
                        <div className="sd-insight-card sd-ic-info">
                            <div className="sd-ic-icon"><TrendingUp size={24} /></div>
                            <div className="sd-ic-data">
                                <span className="sd-ic-value">{insights.todayOrders}</span>
                                <span className="sd-ic-label">Today's Orders</span>
                            </div>
                        </div>
                    </div>

                    <div className="sd-insight-detail-card">
                        <h3><DollarSign size={18} /> Today's Revenue</h3>
                        <span className="sd-revenue-big">
                            Br {insights.todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <p className="sd-revenue-sub">From {insights.todayOrders} order{insights.todayOrders !== 1 ? 's' : ''} today</p>
                    </div>

                    {/* Recent Orders Quick-view */}
                    <div className="sd-insight-recent">
                        <h3><Eye size={18} /> Recent Activity</h3>
                        <div className="sd-recent-list">
                            {orders.slice(0, 5).map(order => (
                                <div key={order.id} className="sd-recent-row">
                                    <div className="sd-recent-left">
                                        <span className="sd-recent-id">#{order.id.slice(0, 6)}</span>
                                        <span className="sd-recent-customer">{order.reservedForName || order.customerName || 'Walk-in'}</span>
                                    </div>
                                    <div className="sd-recent-right">
                                        <span className="sd-recent-amount">
                                            Br {Number(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                        {statusBadge(order.status)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════ */}
            {/* ─── EDIT ITEM MODAL (price override) ─── */}
            {/* ═══════════════════════════════════════ */}
            {editModal && selectedProduct && (
                <div className="modal-overlay" onClick={() => { setEditModal(false); setSelectedProduct(null); }}>
                    <div className="modal item-config-modal" onClick={(e) => e.stopPropagation()} id="item-config-modal">
                        <div className="modal-header">
                            <h2>Edit Item</h2>
                            <button className="btn-icon" onClick={() => { setEditModal(false); setSelectedProduct(null); }}><X size={20} /></button>
                        </div>

                        <div className="item-config-body">
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
                                    <p className="item-stock-info">Available: <strong>{selectedProduct.stockQuantity}</strong></p>
                                </div>
                            </div>

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
                                <label htmlFor="modal-unit-price">Selling Unit Price (Br) *</label>
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

                            <div className="item-subtotal-banner">
                                <span>Line Subtotal:</span>
                                <strong>
                                    Br {((parseFloat(itemUnitPrice) || 0) * itemQty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </strong>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="btn btn-outline" onClick={() => { setEditModal(false); setSelectedProduct(null); }}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary btn-lg"
                                onClick={handleConfirmCartItem}
                                id="confirm-add-item-btn"
                            >
                                <ShoppingCart size={18} /> Update Item
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════ */}
            {/* ─── ADD CUSTOMER MODAL ─── */}
            {/* ═══════════════════════════════════════ */}
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
