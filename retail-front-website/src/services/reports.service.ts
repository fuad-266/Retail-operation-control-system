import api from './api'

export const reportsService = {
  sales: (from: string, to: string) =>
    api.get('/reports/sales', { params: { from, to } }).then((r) => r.data),
  revenue: (from: string, to: string) =>
    api.get('/reports/revenue', { params: { from, to } }).then((r) => r.data),
  sellers: () => api.get('/reports/sellers').then((r) => r.data),
  inventory: () => api.get('/reports/inventory').then((r) => r.data),
}
