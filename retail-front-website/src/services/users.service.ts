import api from './api'
import type { Role } from '../context/AuthContext'

export interface UserDto {
  id: string
  fullName: string
  phoneNumber: string
  email: string | null
  role: Role
  isActive: boolean
  preferredCurrency: string
  createdAt: string
}

export interface CreateUserRequest {
  fullName: string
  phoneNumber: string
  email?: string
  password: string
  role: Role
}

export const usersService = {
  list: () => api.get<UserDto[]>('/users').then((r) => r.data),
  create: (data: CreateUserRequest) => api.post<UserDto>('/users', data).then((r) => r.data),
  createCustomer: (data: Omit<CreateUserRequest, 'role'>) =>
    api.post<UserDto>('/customers', { ...data, role: 'CUSTOMER' }).then((r) => r.data),
  deactivate: (id: string) => api.put(`/users/${id}/deactivate`),
  updateCurrency: (currency: 'KES' | 'ETB') =>
    api.put('/users/me/currency-preference', { currency }),
}
