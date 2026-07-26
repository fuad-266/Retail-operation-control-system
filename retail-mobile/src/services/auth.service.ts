import api from './api'

export interface LoginRequest {
  phoneNumber: string
  password: string
}

export interface AuthResponse {
  token: string
  role: string
  userId: string
}

export const authService = {
  login: (credentials: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', credentials).then((r) => r.data),
}