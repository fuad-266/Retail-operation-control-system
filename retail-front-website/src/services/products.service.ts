import api from './api'

export interface ProductOwnerDto {
  id: string
  name: string
  description: string
  category: string
  priceKes: number
  priceEtb: number
  buyingPrice: number | null
  profitKes: number | null
  profitMarginPercent: number | null
  stockQuantity: number
  minStockAlert: number
  lowStock: boolean
  imageUrl: string | null
  isActive: boolean
  currentExchangeRate: number
  createdAt: string
}

export interface ProductPublicDto {
  id: string
  name: string
  description: string
  category: string
  priceKes: number
  priceEtb: number
  stockQuantity: number
  minStockAlert: number
  lowStock: boolean
  imageUrl: string | null
  isActive: boolean
  currentExchangeRate: number
  createdAt: string
}

export interface ProductRequest {
  name: string
  description?: string
  category?: string
  price: number
  buyingPrice?: number
  stockQuantity: number
  minStockAlert: number
  imageUrl?: string
}

export const productsService = {
  list: () => api.get<ProductOwnerDto[] | ProductPublicDto[]>('/products').then((r) => r.data),
  listOwner: () => api.get<ProductOwnerDto[]>('/products').then((r) => r.data),
  lowStock: () => api.get<ProductOwnerDto[]>('/products/low-stock').then((r) => r.data),
  create: (data: ProductRequest) => api.post<ProductOwnerDto>('/products', data).then((r) => r.data),
  update: (id: string, data: ProductRequest) =>
    api.put<ProductOwnerDto>(`/products/${id}`, data).then((r) => r.data),
  deactivate: (id: string) => api.delete(`/products/${id}`),
}
