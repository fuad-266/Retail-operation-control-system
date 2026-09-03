import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { settingsService } from '../services/endpoints';
import {
    Sun, Moon,
    Settings,
    DollarSign,
    Receipt,
    Clock,
    Save,
    RefreshCw,
    AlertTriangle,
    CreditCard,
} from 'lucide-react';

export default function SettingsPage() {
    const { refreshRate, exchangeRate } = useAuth();
    const [theme, setTheme] = useState(() => {
        const stored = localStorage.getItem('theme');
        if (stored) return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        document.documentElement.classList.toggle('light', theme === 'light');
    }, [theme]);
    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    // ─── Exchange Rate ──────────────────────
    const [newRate, setNewRate] = useState('');
    const [rateHistory, setRateHistory] = useState([]);
    const [rateLoading, setRateLoading] = useState(false);
    const [rateMsg, setRateMsg] = useState({ type: '', text: '' });

    // ─── Shop Settings ─────────────────────
    const [shopSettings, setShopSettings] = useState({});
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [settingsMsg, setSettingsMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        settingsService.getAll()
            .then(res => setShopSettings(res.data))
            .catch(() => { })
            .finally(() => setSettingsLoading(false));

        settingsService.getRateHistory()
            .then(res => setRateHistory(res.data))
            .catch(() => { });
    }, []);

    const handleSetRate = async (e) => {
        e.preventDefault();
        setRateLoading(true);
        setRateMsg({ type: '', text: '' });

        try {
            await settingsService.setRate({ rate: parseFloat(newRate) });
            setRateMsg({ type: 'success', text: 'Exchange rate updated!' });
            setNewRate('');
            refreshRate();
            settingsService.getRateHistory().then(res => setRateHistory(res.data)).catch(() => { });
        } catch (err) {
            setRateMsg({ type: 'error', text: err.response?.data?.message || 'Failed to set rate.' });
        } finally {
            setRateLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setSettingsMsg({ type: '', text: '' });
        try {
            await settingsService.update(shopSettings);
            setSettingsMsg({ type: 'success', text: 'Settings saved!' });
        } catch (err) {
            setSettingsMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save settings.' });
        }
    };

    const previewEtb = newRate ? `1 KES = ${(1 / parseFloat(newRate)).toFixed(2)} ETB` : '';

    return (
        <div className="settings-page" id="settings-page">
            <div className="theme-toggle" style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                <button className="btn btn-outline" onClick={toggleTheme} id="theme-toggle-btn">
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
            <div className="page-header">
                <h1><Settings size={24} /> Settings</h1>
            </div>

            <div className="settings-grid">
                {/* ─── Currency / Exchange Rate ─── */}
                <div className="settings-section">
                    <h2><DollarSign size={20} /> Currency Settings</h2>

                    <div className="setting-card">
                        <div className="setting-info">
                            <label>Current Rate</label>
                            <p className="setting-value">
                                {exchangeRate
                                    ? `${exchangeRate.rate} KES = 1 ETB`
                                    : 'Not configured'}
                            </p>
                            {exchangeRate && (
                                <small className="text-muted">
                                    Last updated: {new Date(exchangeRate.createdAt).toLocaleString()}
                                </small>
                            )}
                            {exchangeRate?.staleRateWarning && (
                                <div className="inline-warning">
                                    <AlertTriangle size={14} /> Rate is stale (over 24 hours old)
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSetRate} className="rate-form">
                            <div className="form-row compact">
                                <input
                                    type="number"
                                    step="0.0001"
                                    min="0.0001"
                                    placeholder="New rate"
                                    value={newRate}
                                    onChange={(e) => setNewRate(e.target.value)}
                                    required
                                    id="new-rate-input"
                                />
                                <button type="submit" className="btn btn-primary" disabled={rateLoading} id="update-rate-btn">
                                    {rateLoading ? 'Updating…' : 'Update Rate'}
                                </button>
                            </div>
                            {previewEtb && <p className="rate-preview">Preview: {previewEtb}</p>}
                            {rateMsg.text && <div className={`alert alert-${rateMsg.type} compact`}>{rateMsg.text}</div>}
                        </form>
                    </div>

                    {/* Rate History */}
                    {rateHistory.length > 0 && (
                        <div className="setting-card">
                            <h3>Rate History</h3>
                            <div className="table-wrapper compact">
                                <table className="data-table compact">
                                    <thead>
                                        <tr>
                                            <th>Rate</th>
                                            <th>Set By</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rateHistory.slice(0, 10).map((r, i) => (
                                            <tr key={r.id} className={i === 0 ? 'row-active' : ''}>
                                                <td>{r.rate} KES = 1 ETB</td>
                                                <td>{r.setByName}</td>
                                                <td>{new Date(r.createdAt).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── Receipt & Payment Settings ─── */}
                <div className="settings-section">
                    <h2><Receipt size={20} /> Receipt Settings</h2>

                    <div className="setting-card">
                        <div className="setting-row">
                            <label>Show item prices on receipts</label>
                            <button
                                className={`toggle-switch ${shopSettings.receipt_show_item_prices === 'true' ? 'on' : 'off'}`}
                                onClick={() => setShopSettings({
                                    ...shopSettings,
                                    receipt_show_item_prices: shopSettings.receipt_show_item_prices === 'true' ? 'false' : 'true',
                                })}
                                id="receipt-prices-toggle"
                            >
                                <span className="toggle-knob" />
                                <span>{shopSettings.receipt_show_item_prices === 'true' ? 'ON' : 'OFF'}</span>
                            </button>
                        </div>
                    </div>

                    <h2><CreditCard size={20} /> Payment Instructions</h2>

                    <div className="setting-card">
                        <div className="form-group">
                            <label htmlFor="bank-account">Bank Account</label>
                            <input
                                id="bank-account"
                                value={shopSettings.payment_bank_account || ''}
                                onChange={(e) => setShopSettings({ ...shopSettings, payment_bank_account: e.target.value })}
                                placeholder="Enter bank account details"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="mobile-money">Mobile Money Number</label>
                            <input
                                id="mobile-money"
                                value={shopSettings.payment_mobile_money || ''}
                                onChange={(e) => setShopSettings({ ...shopSettings, payment_mobile_money: e.target.value })}
                                placeholder="Enter mobile money number"
                            />
                        </div>
                    </div>

                    <h2><Clock size={20} /> Reservation Settings</h2>

                    <div className="setting-card">
                        <div className="setting-row">
                            <label>Auto-cancel reservations</label>
                            <span className="setting-fixed">6 hours (fixed)</span>
                        </div>
                    </div>

                    {settingsMsg.text && <div className={`alert alert-${settingsMsg.type}`}>{settingsMsg.text}</div>}

                    <button className="btn btn-primary btn-full" onClick={handleSaveSettings} id="save-settings-btn">
                        <Save size={16} /> Save All Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
