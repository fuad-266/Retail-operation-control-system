import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { receiptService } from '../services/endpoints';
import {
    Search,
    Receipt,
    Package,
    CheckCircle,
    AlertCircle,
    Camera,
    CameraOff,
    X,
    RotateCcw,
    Scan,
} from 'lucide-react';

// ─── QR Scanner Component ────────────────────────────────────────────────────
function QrScanner({ onDetected, onClose }) {
    const scannerRef = useRef(null);
    const html5QrRef = useRef(null);
    const [camError, setCamError] = useState('');
    const [cameras, setCameras] = useState([]);
    const [activeCamId, setActiveCamId] = useState(null);
    const hasStarted = useRef(false);

    const startCamera = useCallback(async (camId) => {
        if (!html5QrRef.current || hasStarted.current) return;
        hasStarted.current = true;
        try {
            await html5QrRef.current.start(
                camId,
                { fps: 10, qrbox: { width: 240, height: 240 } },
                (decodedText) => {
                    onDetected(decodedText);
                },
                undefined
            );
        } catch (err) {
            setCamError('Could not access camera: ' + (err?.message || err));
            hasStarted.current = false;
        }
    }, [onDetected]);

    useEffect(() => {
        const el = document.getElementById('qr-reader');
        if (!el) return;
        html5QrRef.current = new Html5Qrcode('qr-reader');

        Html5Qrcode.getCameras()
            .then((devices) => {
                if (!devices.length) { setCamError('No cameras found on this device.'); return; }
                setCameras(devices);
                // Prefer rear camera
                const rear = devices.find(d =>
                    /back|rear|environment/i.test(d.label)
                ) || devices[devices.length - 1];
                setActiveCamId(rear.id);
                startCamera(rear.id);
            })
            .catch(() => setCamError('Camera permission denied or unavailable.'));

        return () => {
            if (html5QrRef.current && hasStarted.current) {
                html5QrRef.current.stop().catch(() => { });
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const switchCamera = async (newCamId) => {
        if (!html5QrRef.current) return;
        if (hasStarted.current) {
            await html5QrRef.current.stop().catch(() => { });
            hasStarted.current = false;
        }
        setActiveCamId(newCamId);
        setTimeout(() => startCamera(newCamId), 300);
    };

    return (
        <div className="qr-scanner-overlay" id="qr-scanner-overlay">
            <div className="qr-scanner-modal">
                {/* Header */}
                <div className="qr-scanner-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Scan size={20} style={{ color: 'var(--accent-primary)' }} />
                        <span style={{ fontWeight: 600 }}>Scan Receipt QR Code</span>
                    </div>
                    <button className="qr-close-btn" onClick={onClose} id="qr-close-btn">
                        <X size={20} />
                    </button>
                </div>

                {/* Camera viewport */}
                <div className="qr-viewport-wrapper">
                    <div id="qr-reader" className="qr-reader" ref={scannerRef}></div>
                    {/* Animated corner brackets overlay */}
                    <div className="qr-corners">
                        <div className="qr-corner tl" />
                        <div className="qr-corner tr" />
                        <div className="qr-corner bl" />
                        <div className="qr-corner br" />
                    </div>
                    {/* Scan line animation */}
                    <div className="qr-scan-line" />
                </div>

                {camError && (
                    <div className="alert alert-error" style={{ margin: '1rem', fontSize: '0.85rem' }}>
                        <AlertCircle size={16} /> {camError}
                    </div>
                )}

                <p className="qr-hint">Point the camera at the QR code on the receipt</p>

                {/* Camera selector */}
                {cameras.length > 1 && (
                    <div className="qr-cam-select">
                        {cameras.map(cam => (
                            <button
                                key={cam.id}
                                className={`btn btn-sm ${activeCamId === cam.id ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => switchCamera(cam.id)}
                            >
                                {cam.label || `Camera ${cam.id.slice(0, 5)}`}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function GoodsStaffPage() {
    const [mode, setMode] = useState('idle'); // 'idle' | 'scanning' | 'manual'
    const [receiptNumber, setReceiptNumber] = useState('');
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fulfillLoading, setFulfillLoading] = useState(false);
    const [fulfillMsg, setFulfillMsg] = useState({ type: '', text: '' });

    const loadReceipt = async (num) => {
        const clean = num.trim();
        if (!clean) return;
        setLoading(true);
        setError('');
        setReceipt(null);
        setFulfillMsg({ type: '', text: '' });
        try {
            const res = await receiptService.get(clean);
            setReceipt(res.data);
        } catch (err) {
            if (err.response?.status === 404) {
                setError('Receipt not found. Please check the receipt number and try again.');
            } else {
                setError(err.response?.data?.message || 'Failed to load receipt.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleQrDetected = (text) => {
        setMode('idle');
        // QR codes contain the full receipt number (e.g. RCP-20260810-0001)
        setReceiptNumber(text);
        loadReceipt(text);
    };

    const handleManualSearch = (e) => {
        e.preventDefault();
        loadReceipt(receiptNumber);
    };

    const handleFulfill = async () => {
        setFulfillLoading(true);
        setFulfillMsg({ type: '', text: '' });
        try {
            const res = await receiptService.fulfill(receipt.receiptNumber);
            setReceipt(res.data);
            setFulfillMsg({ type: 'success', text: '✅ Goods released successfully!' });
        } catch (err) {
            if (err.response?.status === 409) {
                setFulfillMsg({ type: 'error', text: 'Receipt already fulfilled.' });
            } else {
                setFulfillMsg({ type: 'error', text: err.response?.data?.message || 'Failed to release goods.' });
            }
        } finally {
            setFulfillLoading(false);
        }
    };

    const reset = () => {
        setReceipt(null);
        setError('');
        setReceiptNumber('');
        setFulfillMsg({ type: '', text: '' });
        setMode('idle');
    };

    return (
        <div className="goods-staff-page" id="goods-staff-page">
            {mode === 'scanning' && (
                <QrScanner
                    onDetected={handleQrDetected}
                    onClose={() => setMode('idle')}
                />
            )}

            <div className="page-header">
                <h1>Goods Release</h1>
                <p className="page-subtitle">Scan the receipt QR code or search manually to release goods</p>
            </div>

            {/* Action Cards */}
            {!receipt && !loading && (
                <div className="goods-action-grid">
                    {/* Scan QR Card */}
                    <button
                        className={`goods-action-card ${mode === 'scanning' ? 'active' : ''}`}
                        onClick={() => setMode('scanning')}
                        id="open-qr-scanner-btn"
                    >
                        <div className="goods-action-icon" style={{ background: 'var(--accent-primary-glow)', color: 'var(--accent-primary)' }}>
                            <Camera size={32} />
                        </div>
                        <div>
                            <h3>Scan QR Code</h3>
                            <p>Use camera to scan the receipt</p>
                        </div>
                    </button>

                    {/* Manual Search Card */}
                    <button
                        className={`goods-action-card ${mode === 'manual' ? 'active' : ''}`}
                        onClick={() => setMode('manual')}
                        id="open-manual-search-btn"
                    >
                        <div className="goods-action-icon" style={{ background: 'var(--accent-info-bg)', color: 'var(--accent-info)' }}>
                            <Search size={32} />
                        </div>
                        <div>
                            <h3>Manual Search</h3>
                            <p>Type the receipt number</p>
                        </div>
                    </button>
                </div>
            )}

            {/* Manual Input */}
            {mode === 'manual' && !receipt && (
                <div className="receipt-search-card">
                    <form onSubmit={handleManualSearch} className="receipt-search-form" id="receipt-search-form">
                        <div className="search-input-group">
                            <Receipt size={20} />
                            <input
                                type="text"
                                placeholder="e.g. RCP-20260810-0001"
                                value={receiptNumber}
                                onChange={(e) => setReceiptNumber(e.target.value)}
                                id="receipt-number-input"
                                autoFocus
                            />
                            <button type="submit" className="btn btn-primary" disabled={loading} id="receipt-search-btn">
                                {loading ? 'Searching…' : <><Search size={16} /> Search</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Loading Spinner */}
            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <div className="spinner" />
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="alert alert-error" id="receipt-error">
                    <AlertCircle size={20} /> {error}
                    <button className="btn btn-sm btn-outline" onClick={reset} style={{ marginLeft: 'auto' }}>
                        <RotateCcw size={14} /> Try Again
                    </button>
                </div>
            )}

            {/* Receipt Card */}
            {receipt && (
                <div className="receipt-card" id="receipt-details">
                    <div className="receipt-card-header">
                        <div>
                            <h2>{receipt.receiptNumber}</h2>
                            <p className="text-muted">Confirmed by: {receipt.confirmedByName}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span className={`status-badge ${receipt.status?.toLowerCase()}`}>
                                {receipt.status === 'FULFILLED' ? (
                                    <><CheckCircle size={14} /> Fulfilled</>
                                ) : (
                                    <><Package size={14} /> {receipt.status}</>
                                )}
                            </span>
                            <button className="btn btn-sm btn-outline" onClick={reset} title="Search again">
                                <RotateCcw size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="receipt-items">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Qty</th>
                                    {receipt.items?.[0]?.unitPrice != null && <th>Unit Price</th>}
                                    {receipt.items?.[0]?.unitPrice != null && <th>Subtotal</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {receipt.items?.map((item, i) => (
                                    <tr key={i}>
                                        <td><strong>{item.productName}</strong></td>
                                        <td>{item.quantity}</td>
                                        {item.unitPrice != null && (
                                            <>
                                                <td>{receipt.paymentCurrency} {Number(item.unitPrice).toFixed(2)}</td>
                                                <td>{receipt.paymentCurrency} {(item.unitPrice * item.quantity).toFixed(2)}</td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="receipt-footer">
                        <div className="receipt-total">
                            <span>Total:</span>
                            <strong>{receipt.paymentCurrency} {Number(receipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                        </div>
                        <div className="receipt-meta">
                            <span>Payment: {receipt.paymentMethod?.replace('_', ' ')}</span>
                            <span>Currency: {receipt.paymentCurrency}</span>
                            <span>Date: {new Date(receipt.createdAt).toLocaleString()}</span>
                        </div>
                    </div>

                    {fulfillMsg.text && (
                        <div className={`alert alert-${fulfillMsg.type}`}>{fulfillMsg.text}</div>
                    )}

                    <button
                        className="btn btn-primary btn-full"
                        onClick={handleFulfill}
                        disabled={fulfillLoading || receipt.status === 'FULFILLED'}
                        id="release-goods-btn"
                    >
                        {receipt.status === 'FULFILLED' ? (
                            <><CheckCircle size={16} /> Already Fulfilled</>
                        ) : fulfillLoading ? 'Releasing…' : (
                            <><Package size={16} /> Release Goods</>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
