import api from './api'

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY'
export type ReceiptStatus = 'PAID' | 'FULFILLED'

export interface ReceiptItemDto {
  productId: string
  productName: string
  quantity: number
  unitPrice: number | null
}

export interface ReceiptDto {
  id: string
  receiptNumber: string
  orderId: string | null
  onlineOrderId: string | null
  confirmedById: string
  confirmedByName: string
  totalAmount: number
  amount: number
  paymentCurrency: string
  paymentMethod: PaymentMethod
  status: ReceiptStatus
  items: ReceiptItemDto[]
  createdAt: string
}

export const paymentsService = {
  confirmPayment: (
    orderId: string,
    data: { paymentMethod: PaymentMethod; paymentCurrency: 'KES' | 'ETB' },
  ) => api.post<ReceiptDto>(`/payments/confirm/${orderId}`, data).then((r) => r.data),

  confirmOnline: (
    orderId: string,
    data: { paymentMethod: PaymentMethod; paymentCurrency: 'KES' | 'ETB' },
  ) => api.post<ReceiptDto>(`/payments/confirm-online/${orderId}`, data).then((r) => r.data),

  rejectOnline: (orderId: string, reason: string) =>
    api.post(`/payments/reject-online/${orderId}`, { reason }),

  getReceipt: (receiptNumber: string) =>
    api.get<ReceiptDto>(`/receipts/${receiptNumber}`).then((r) => r.data),

  fulfillReceipt: (receiptNumber: string) =>
    api.put<ReceiptDto>(`/receipts/${receiptNumber}/fulfill`).then((r) => r.data),
}
