import api from './api'

export interface ExchangeRateDto {
  id: string
  rate: number
  label: string
  setById: string | null
  setByName: string | null
  createdAt: string
  staleRateWarning: boolean
}

export const settingsService = {
  getRate: () => api.get<ExchangeRateDto>('/settings/exchange-rate').then((r) => r.data),
  setRate: (rate: number) =>
    api.post<ExchangeRateDto>('/settings/exchange-rate', { rate }).then((r) => r.data),
  getRateHistory: () =>
    api.get<ExchangeRateDto[]>('/settings/exchange-rate/history').then((r) => r.data),
  getAll: () => api.get<Record<string, string>>('/settings').then((r) => r.data),
  update: (settings: Record<string, string>) => api.put('/settings', settings),
}
