import api from './api'

export interface OnlineOrderItemRequest {
  productId: string
  quantity: number
}

export interface CreateOnlineOrderRequest {
  items: OnlineOrderItemRequest[]
  deliveryAddress: string
}

export interface OnlineOrderDto {
  id: string
  customerId: string
  status: string
  totalAmount: number
  deliveryAddress: string
  paymentScreenshotUrl?: string
  paymentReference?: string
  rejectionReason?: string
  createdAt: string
  items: OnlineOrderItemDto[]
  paymentInstructions?: {
    bankAccount?: string
    mobileMoneyNumber?: string
  }
}

export interface OnlineOrderItemDto {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

export interface SubmitPaymentRequest {
  paymentReference?: string
}

export const ordersService = {
  createOnlineOrder: (data: CreateOnlineOrderRequest) =>
    api.post<OnlineOrderDto>('/mobile/orders', data).then((r) => r.data),

  getMyOrders: () =>
    api.get<OnlineOrderDto[]>('/mobile/orders/my').then((r) => r.data),

  getOrder: (id: string) =>
    api.get<OnlineOrderDto>(`/mobile/orders/${id}`).then((r) => r.data),

  submitPaymentScreenshot: (orderId: string, formData: FormData) =>
    api.post(`/mobile/orders/${orderId}/submit-payment`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then((r) => r.data),
}