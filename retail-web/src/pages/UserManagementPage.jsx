import { useEffect, useState } from 'react';
import { userService } from '../services/endpoints';
import {
    Users,
    UserPlus,
    Shield,
    ShoppingBag,
    X,
    Search,
    UserX,
} from 'lucide-react';

export default function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalType, setModalType] = useState(null); // 'staff' | 'customer'
    const [formData, setFormData] = useState({
        fullName: '', phoneNumber: '', email: '', password: '', role: 'SELLER',
    });
    const [formMsg, setFormMsg] = useState({ type: '', text: '' });
    const [formLoading, setFormLoading] = useState(false);

    const fetchUsers = () => {
        setLoading(true);
        userService.list()
            .then(res => setUsers(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchUsers(); }, []);

    const staff = users.filter(u => ['CASHIER', 'SELLER', 'GOODS_STAFF'].includes(u.role));
    const customers = users.filter(u => u.role === 'CUSTOMER');

    const filteredStaff = staff.filter(u =>
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.phoneNumber.includes(search)
    );

    const filteredCustomers = customers.filter(u =>
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.phoneNumber.includes(search)
    );

    const openModal = (type) => {
        setModalType(type);
        setFormData({
            fullName: '', phoneNumber: '', email: '', password: '',
            role: type === 'staff' ? 'SELLER' : 'CUSTOMER',
        });
        setFormMsg({ type: '', text: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormMsg({ type: '', text: '' });
        setFormLoading(true);

        try {
            if (modalType === 'customer') {
                await userService.createCustomer(formData);
                setFormMsg({ type: 'success', text: `Customer created! Phone: ${formData.phoneNumber}, Password: ${formData.password}` });
            } else {
                await userService.create(formData);
                setFormMsg({ type: 'success', text: `Staff member created successfully!` });
            }
            fetchUsers();
        } catch (err) {
            setFormMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create user.' });
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeactivate = async (id) => {
        if (!confirm('Are you sure you want to deactivate this user?')) return;
        try {
            await userService.deactivate(id);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to deactivate user');
        }
    };

    const roleLabel = (role) => {
        switch (role) {
            case 'CASHIER': return 'Cashier';
            case 'SELLER': return 'Seller';
            case 'GOODS_STAFF': return 'Goods Staff';
            case 'CUSTOMER': return 'Customer';
            case 'OWNER': return 'Owner';
            default: return role;
        }
    };

    return (
        <div className="user-management-page" id="user-management-page">
            <div className="page-header">
                <h1><Users size={24} /> User Management</h1>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={() => openModal('staff')} id="add-staff-btn">
                        <Shield size={16} /> Add Staff
                    </button>
                    <button className="btn btn-outline" onClick={() => openModal('customer')} id="add-customer-btn">
                        <UserPlus size={16} /> Add Customer
                    </button>
                </div>
            </div>

            <div className="table-toolbar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        placeholder="Search users…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        id="user-search"
                    />
                </div>
            </div>

            {/* Staff Section */}
            <div className="user-section">
                <h2><Shield size={20} /> Staff ({filteredStaff.length})</h2>
                {loading ? (
                    <div className="table-skeleton">
                        {[...Array(3)].map((_, i) => <div key={i} className="skeleton-row" />)}
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table" id="staff-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStaff.map(u => (
                                    <tr key={u.id} className={!u.active ? 'row-inactive' : ''}>
                                        <td>{u.fullName}</td>
                                        <td>{u.phoneNumber}</td>
                                        <td>{u.email || '—'}</td>
                                        <td>
                                            <span className={`role-badge role-${u.role.toLowerCase()}`}>{roleLabel(u.role)}</span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${u.active ? 'active' : 'inactive'}`}>
                                                {u.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            {u.active && (
                                                <button className="btn btn-sm btn-danger" onClick={() => handleDeactivate(u.id)}>
                                                    <UserX size={14} /> Deactivate
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredStaff.length === 0 && (
                                    <tr><td colSpan={6} className="td-empty">No staff found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Customer Section */}
            <div className="user-section">
                <h2><ShoppingBag size={20} /> Customers ({filteredCustomers.length})</h2>
                <div className="table-wrapper">
                    <table className="data-table" id="customer-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map(u => (
                                <tr key={u.id} className={!u.active ? 'row-inactive' : ''}>
                                    <td>{u.fullName}</td>
                                    <td>{u.phoneNumber}</td>
                                    <td>{u.email || '—'}</td>
                                    <td>
                                        <span className={`status-badge ${u.active ? 'active' : 'inactive'}`}>
                                            {u.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        {u.active && (
                                            <button className="btn btn-sm btn-danger" onClick={() => handleDeactivate(u.id)}>
                                                <UserX size={14} /> Deactivate
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <tr><td colSpan={6} className="td-empty">No customers found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {modalType && (
                <div className="modal-overlay" onClick={() => setModalType(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} id="user-modal">
                        <div className="modal-header">
                            <h2>Add {modalType === 'staff' ? 'Staff' : 'Customer'}</h2>
                            <button className="btn-icon" onClick={() => setModalType(null)}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            {formMsg.text && <div className={`alert alert-${formMsg.type}`}>{formMsg.text}</div>}

                            <div className="form-group">
                                <label htmlFor="user-name">Full Name *</label>
                                <input id="user-name" required value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="user-phone">Phone Number *</label>
                                <input id="user-phone" required value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="user-email">Email (optional)</label>
                                <input id="user-email" type="email" value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="user-password">Password *</label>
                                <input id="user-password" required value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                            </div>

                            {modalType === 'staff' && (
                                <div className="form-group">
                                    <label htmlFor="user-role">Role *</label>
                                    <select id="user-role" value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                                        <option value="SELLER">Seller</option>
                                        <option value="CASHIER">Cashier</option>
                                        <option value="GOODS_STAFF">Goods Staff</option>
                                    </select>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setModalType(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading} id="save-user-btn">
                                    {formLoading ? 'Creating…' : `Create ${modalType === 'staff' ? 'Staff' : 'Customer'}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
