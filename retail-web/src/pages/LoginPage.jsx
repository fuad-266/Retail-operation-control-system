import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store, Eye, EyeOff } from 'lucide-react';

const ROLE_ROUTES = {
    OWNER: '/owner',
    CASHIER: '/cashier',
    SELLER: '/seller',
    GOODS_STAFF: '/goods',
};

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Determine if identifier is email or phone
        const cleanIdentifier = identifier.trim();
        const isEmail = cleanIdentifier.includes('@');
        const credentials = {
            password,
            ...(isEmail ? { email: cleanIdentifier } : { phoneNumber: cleanIdentifier }),
        };

        try {
            const role = await login(credentials);
            navigate(ROLE_ROUTES[role] || '/');
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page" id="login-page">
            <div className="login-container">
                {/* Decorative elements */}
                <div className="login-decoration">
                    <div className="decoration-circle circle-1" />
                    <div className="decoration-circle circle-2" />
                    <div className="decoration-circle circle-3" />
                </div>

                <div className="login-card">
                    <div className="login-header">
                        <div className="login-logo" style={{ background: 'transparent', width: 'auto', height: 'auto', marginBottom: '16px' }}>
                            <img src="/assets/logo.png" alt="Adama Shop Logo" style={{ height: '80px', objectFit: 'contain' }} />
                        </div>
                        <h1>Adama Shop</h1>
                        <p className="login-subtitle">Retail Operations Control System</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form" id="login-form">
                        {error && (
                            <div className="alert alert-error" id="login-error">
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="identifier">Phone number or Email</label>
                            <input
                                type="text"
                                id="identifier"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="Enter phone number or email"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-full"
                            disabled={loading}
                            id="login-submit"
                        >
                            {loading ? (
                                <span className="btn-loading">
                                    <span className="loading-dots" />
                                    Signing in…
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <p className="login-footer">
                        Don't have an account? Contact the shop owner to get your login credentials.
                    </p>
                </div>
            </div>
        </div>
    );
}
