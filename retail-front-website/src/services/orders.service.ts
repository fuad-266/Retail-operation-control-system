import api from './api'

export type SaleOrderStatus = 'PENDING' | 'RESERVED' | 'PAID' | 'CANCELLED'

export interface OrderItemRequest {
  productId: string
  quantity: number
}

export interface SaleOrderItemDto {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

export interface SaleOrderDto {
  id: string
  sellerId: string
  sellerName: string
  status: SaleOrderStatus
  totalAmount: number
  reservedForName: string | null
  reservedForPhone: string | null
  reservationExpiresAt: string | null
  cancellationReason: string | null
  createdAt: string
  items: SaleOrderItemDto[]
}

export const ordersService = {
  createOrder: (items: OrderItemRequest[]) =>
    api.post<SaleOrderDto>('/orders', { items }).then((r) => r.data),

  createReservedOrder: (data: {
    items: OrderItemRequest[]
    reservedForName: string
    reservedForPhone: string
  }) => api.post<SaleOrderDto>('/orders/reserve', data).then((r) => r.data),

  cancel: (id: string) => api.put(`/orders/${id}/cancel`),

  convertToPending: (id: string) =>
    api.put<SaleOrderDto>(`/orders/${id}/convert-to-pending`).then((r) => r.data),

  myOrders: () => api.get<SaleOrderDto[]>('/orders/my').then((r) => r.data),
  pending: () => api.get<SaleOrderDto[]>('/orders/pending').then((r) => r.data),
  reserved: () => api.get<SaleOrderDto[]>('/orders/reserved').then((r) => r.data),

  pendingOnlineVerification: () =>
    api.get('/orders/online/pending-verification').then((r) => r.data),
}
