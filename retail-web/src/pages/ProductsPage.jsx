import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { productService, uploadService } from '../services/endpoints';
import {
    Plus,
    Edit3,
    Trash2,
    AlertTriangle,
    Search,
    X,
    Package,
    Upload,
    Image as ImageIcon,
} from 'lucide-react';

export default function ProductsPage() {
    const { currency, exchangeRate } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '', category: '', description: '',
        buyingPrice: '', price: '',
        stockQuantity: '', minStockAlert: '', imageUrl: '',
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchProducts = async () => {
        try {
            const res = await productService.list();
            setProducts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(search.toLowerCase())
    );

    const openAdd = () => {
        setEditingProduct(null);
        setFormData({ name: '', category: '', description: '', buyingPrice: '', price: '', stockQuantity: '', minStockAlert: '', imageUrl: '' });
        setImageFile(null);
        setImagePreview('');
        setFormError('');
        setModalOpen(true);
    };

    const openEdit = (p) => {
        setEditingProduct(p);
        setFormData({
            name: p.name,
            category: p.category || '',
            description: p.description || '',
            buyingPrice: p.buyingPrice ?? '',
            price: p.priceKes,
            stockQuantity: p.stockQuantity,
            minStockAlert: p.minStockAlert,
            imageUrl: p.imageUrl || '',
        });
        setImageFile(null);
        setImagePreview(p.imageUrl ? `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${p.imageUrl}` : '');
        setFormError('');
        setModalOpen(true);
    };

    const handleImageSelect = (file) => {
        if (!file) return;
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowed.includes(file.type)) {
            setFormError('Invalid image type. Use JPG, PNG, WebP, or GIF.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setFormError('Image too large. Max 5 MB.');
            return;
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setFormError('');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files[0];
        if (file) handleImageSelect(file);
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview('');
        setFormData({ ...formData, imageUrl: '' });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setSubmitting(true);

        try {
            let finalImageUrl = formData.imageUrl || null;

            // Upload new image if one was selected
            if (imageFile) {
                setUploading(true);
                const uploadRes = await uploadService.productImage(imageFile);
                finalImageUrl = uploadRes.data.imageUrl;
                setUploading(false);
            }

            const payload = {
                name: formData.name,
                category: formData.category,
                description: formData.description,
                price: parseFloat(formData.price),
                buyingPrice: formData.buyingPrice ? parseFloat(formData.buyingPrice) : null,
                stockQuantity: parseInt(formData.stockQuantity, 10),
                minStockAlert: parseInt(formData.minStockAlert, 10) || 0,
                imageUrl: finalImageUrl,
            };

            if (editingProduct) {
                await productService.update(editingProduct.id, payload);
            } else {
                await productService.create(payload);
            }
            setModalOpen(false);
            fetchProducts();
        } catch (err) {
            setUploading(false);
            setFormError(err.response?.data?.message || 'Failed to save product');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeactivate = async (id) => {
        if (!confirm('Are you sure you want to deactivate this product?')) return;
        try {
            await productService.deactivate(id);
            fetchProducts();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to deactivate product');
        }
    };

    const formatPrice = (kes, etb) => {
        if (currency === 'ETB') return `ETB ${Number(etb || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        return `KES ${Number(kes || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    };

    return (
        <div className="products-page" id="products-page">
            <div className="page-header">
                <div>
                    <h1>Products</h1>
                    <p className="page-subtitle">Manage your product inventory</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd} id="add-product-btn">
                    <Plus size={18} /> Add Product
                </button>
            </div>

            <div className="table-toolbar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search products…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        id="product-search"
                    />
                </div>
                <span className="result-count">{filtered.length} products</span>
            </div>

            {loading ? (
                <div className="table-skeleton">
                    {[...Array(5)].map((_, i) => <div key={i} className="skeleton-row" />)}
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="data-table" id="products-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Buying Price (KES)</th>
                                <th>Selling Price</th>
                                <th>Profit</th>
                                <th>Margin %</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => (
                                <tr key={p.id} className={p.lowStock ? 'row-warning' : ''}>
                                    <td className="td-name">
                                        <Package size={16} />
                                        {p.name}
                                    </td>
                                    <td>{p.category || '—'}</td>
                                    <td>{p.buyingPrice != null ? `KES ${Number(p.buyingPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}</td>
                                    <td>{formatPrice(p.priceKes, p.priceEtb)}</td>
                                    <td>{p.profitKes != null ? `KES ${Number(p.profitKes).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}</td>
                                    <td>{p.profitMarginPercent != null ? `${Number(p.profitMarginPercent).toFixed(1)}%` : '—'}</td>
                                    <td>
                                        <span className={`stock-badge ${p.lowStock ? 'low' : 'ok'}`}>
                                            {p.stockQuantity}
                                            {p.lowStock && <AlertTriangle size={14} />}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${p.active ? 'active' : 'inactive'}`}>
                                            {p.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="td-actions">
                                        <button className="btn-icon" onClick={() => openEdit(p)} title="Edit">
                                            <Edit3 size={16} />
                                        </button>
                                        {p.active && (
                                            <button className="btn-icon btn-danger" onClick={() => handleDeactivate(p.id)} title="Deactivate">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="td-empty">No products found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Product Form Modal */}
            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} id="product-modal">
                        <div className="modal-header">
                            <h2>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                            <button className="btn-icon" onClick={() => setModalOpen(false)}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            {formError && <div className="alert alert-error">{formError}</div>}

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="prod-name">Name *</label>
                                    <input id="prod-name" required value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="prod-category">Category</label>
                                    <input id="prod-category" value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="prod-desc">Description</label>
                                <textarea id="prod-desc" rows={2} value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="prod-buying">Buying Price (KES)</label>
                                    <input id="prod-buying" type="number" step="0.01" min="0"
                                        value={formData.buyingPrice}
                                        onChange={(e) => setFormData({ ...formData, buyingPrice: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="prod-price">Selling Price (KES) *</label>
                                    <input id="prod-price" type="number" step="0.01" min="0.01" required
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="prod-stock">Stock Quantity *</label>
                                    <input id="prod-stock" type="number" min="0" required
                                        value={formData.stockQuantity}
                                        onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="prod-alert">Min Stock Alert</label>
                                    <input id="prod-alert" type="number" min="0"
                                        value={formData.minStockAlert}
                                        onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Product Image</label>
                                <div
                                    className="image-upload-area"
                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    id="image-upload-area"
                                >
                                    {imagePreview ? (
                                        <div className="image-preview-container">
                                            <img src={imagePreview} alt="Preview" className="image-preview" />
                                            <button
                                                type="button"
                                                className="btn-icon image-remove-btn"
                                                onClick={(e) => { e.stopPropagation(); removeImage(); }}
                                                title="Remove image"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="image-upload-placeholder">
                                            <Upload size={32} />
                                            <p>Click or drag an image here</p>
                                            <small>JPG, PNG, WebP, GIF — max 5 MB</small>
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        style={{ display: 'none' }}
                                        onChange={(e) => handleImageSelect(e.target.files[0])}
                                        id="prod-image-input"
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting || uploading} id="product-save-btn">
                                    {uploading ? 'Uploading image…' : submitting ? 'Saving…' : editingProduct ? 'Update Product' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
