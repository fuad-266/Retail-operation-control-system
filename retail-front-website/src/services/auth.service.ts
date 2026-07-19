import api from './api'

export interface LoginRequest {
  phoneNumber?: string
  email?: string
  password: string
}

export interface AuthResponse {
  token: string
  role: string
  userId: string
}

export const authService = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),
}
