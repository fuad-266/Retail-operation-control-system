import api from './api';

// ─── Auth ────────────────────────────────
export const authService = {
    login: (credentials) => api.post('/api/auth/login', credentials),
    refresh: (refreshToken) => api.post('/api/auth/refresh', { refreshToken }),
};

// ─── Products ────────────────────────────
export const productService = {
    list: () => api.get('/api/products'),
    create: (data) => api.post('/api/products', data),
    update: (id, data) => api.put(`/api/products/${id}`, data),
    deactivate: (id) => api.delete(`/api/products/${id}`),
    lowStock: () => api.get('/api/products/low-stock'),
};

// ─── Sale Orders ─────────────────────────
export const orderService = {
    create: (data) => api.post('/api/orders', data),
    createReserved: (data) => api.post('/api/orders/reserve', data),
    cancel: (id) => api.put(`/api/orders/${id}/cancel`),
    convertToPending: (id) => api.put(`/api/orders/${id}/convert-to-pending`),
    myOrders: () => api.get('/api/orders/my'),
    pendingOrders: () => api.get('/api/orders/pending'),
    reservedOrders: () => api.get('/api/orders/reserved'),
    onlinePendingVerification: () => api.get('/api/orders/online/pending-verification'),
    messengerPending: () => api.get('/api/mobile/orders/messenger-pending'),
};

// ─── Payments ────────────────────────────
export const paymentService = {
    confirm: (orderId, data) => api.post(`/api/payments/confirm/${orderId}`, data),
    confirmOnline: (orderId, data) => api.post(`/api/payments/confirm-online/${orderId}`, data),
    rejectOnline: (orderId, reason) => api.post(`/api/payments/reject-online/${orderId}`, { reason }),
    confirmMessenger: (orderId, data) => api.post(`/api/mobile/orders/${orderId}/confirm-messenger`, data),
};


// ─── Receipts ────────────────────────────
export const receiptService = {
    today: () => api.get('/api/receipts/today'),
    get: (receiptNumber) => api.get(`/api/receipts/${receiptNumber}`),
    fulfill: (receiptNumber) => api.put(`/api/receipts/${receiptNumber}/fulfill`),
};

// ─── Users ───────────────────────────────
export const userService = {
    list: () => api.get('/api/users'),
    create: (data) => api.post('/api/users', data),
    createCustomer: (data) => api.post('/api/customers', data),
    deactivate: (id) => api.put(`/api/users/${id}/deactivate`),
    updateCurrency: (currency) => api.put('/api/users/me/currency-preference', { currency }),
};

// ─── Settings ────────────────────────────
export const settingsService = {
    getRate: () => api.get('/api/settings/exchange-rate'),
    setRate: (data) => api.post('/api/settings/exchange-rate', data),
    getRateHistory: () => api.get('/api/settings/exchange-rate/history'),
    getAll: () => api.get('/api/settings'),
    update: (data) => api.put('/api/settings', data),
};

// ─── Reports ─────────────────────────────
export const reportService = {
    sales: (from, to) => api.get('/api/reports/sales', { params: { from, to } }),
    revenue: (from, to) => api.get('/api/reports/revenue', { params: { from, to } }),
    sellers: () => api.get('/api/reports/sellers'),
    inventory: () => api.get('/api/reports/inventory'),
};
