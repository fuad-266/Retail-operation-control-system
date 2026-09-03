import api from './api'
import { SERVER_BASE_URL } from './api'

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

const resolveImageUrl = (url: string | null): string => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${SERVER_BASE_URL}${url}`
}

export const productsService = {
  listPublic: () =>
    api.get<ProductDto[]>('/mobile/products').then((r) =>
      r.data.map((p) => ({ ...p, imageUrl: resolveImageUrl(p.imageUrl) }))
    ),
}