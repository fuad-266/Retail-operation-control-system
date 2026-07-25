import { useState } from 'react';
import { receiptService } from '../services/endpoints';
import {
    Search,
    Receipt,
    Package,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';

export default function GoodsStaffPage() {
    const [receiptNumber, setReceiptNumber] = useState('');
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fulfillLoading, setFulfillLoading] = useState(false);
    const [fulfillMsg, setFulfillMsg] = useState({ type: '', text: '' });

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!receiptNumber.trim()) return;

        setLoading(true);
        setError('');
        setReceipt(null);
        setFulfillMsg({ type: '', text: '' });

        try {
            const res = await receiptService.get(receiptNumber.trim());
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

    const handleFulfill = async () => {
        setFulfillLoading(true);
        setFulfillMsg({ type: '', text: '' });

        try {
            const res = await receiptService.fulfill(receipt.receiptNumber);
            setReceipt(res.data);
            setFulfillMsg({ type: 'success', text: 'Goods released successfully!' });
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

    return (
        <div className="goods-staff-page" id="goods-staff-page">
            <div className="page-header">
                <h1>Goods Release</h1>
                <p className="page-subtitle">Search for a receipt to release goods</p>
            </div>

            <div className="receipt-search-card">
                <form onSubmit={handleSearch} className="receipt-search-form" id="receipt-search-form">
                    <div className="search-input-group">
                        <Receipt size={20} />
                        <input
                            type="text"
                            placeholder="Enter receipt number (e.g. RCP-20260725-0001)"
                            value={receiptNumber}
                            onChange={(e) => setReceiptNumber(e.target.value)}
                            id="receipt-number-input"
                        />
                        <button type="submit" className="btn btn-primary" disabled={loading} id="receipt-search-btn">
                            {loading ? 'Searching…' : <><Search size={16} /> Search</>}
                        </button>
                    </div>
                </form>
            </div>

            {error && (
                <div className="alert alert-error" id="receipt-error">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {receipt && (
                <div className="receipt-card" id="receipt-details">
                    <div className="receipt-card-header">
                        <div>
                            <h2>{receipt.receiptNumber}</h2>
                            <p className="text-muted">Confirmed by: {receipt.confirmedByName}</p>
                        </div>
                        <span className={`status-badge ${receipt.status.toLowerCase()}`}>
                            {receipt.status === 'FULFILLED' ? (
                                <><CheckCircle size={16} /> Fulfilled</>
                            ) : (
                                <><Package size={16} /> {receipt.status}</>
                            )}
                        </span>
                    </div>

                    <div className="receipt-items">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Quantity</th>
                                    {receipt.items?.[0]?.unitPrice != null && <th>Unit Price</th>}
                                    {receipt.items?.[0]?.unitPrice != null && <th>Subtotal</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {receipt.items?.map((item, i) => (
                                    <tr key={i}>
                                        <td>{item.productName}</td>
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
                        ) : fulfillLoading ? (
                            'Releasing…'
                        ) : (
                            <><Package size={16} /> Release Goods</>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
