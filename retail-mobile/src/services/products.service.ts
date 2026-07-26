import api from './api'

export interface ProductDto {
  id: string
  name: string
  description: string
  category: string
  priceKes: number
  priceEtb: number
  stockQuantity: number
  imageUrl: string
  isActive: boolean
  currentExchangeRate: number
}

export const productsService = {
  listPublic: () => api.get<ProductDto[]>('/mobile/products').then((r) => r.data),
}