import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import { triggerGlobalLogout } from '../context/AuthContext'

const API_BASE_URL = 'https://adamashop.duckdns.org/api' // Live hosted backend 
export const SERVER_BASE_URL = 'https://adamashop.duckdns.org' // Base URL without /api, for images etc.

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach JWT to every request
api.interceptors.request.use(async (config) => {
  try {
    const stored = await SecureStore.getItemAsync('auth')
    if (stored) {
      const { token } = JSON.parse(stored)
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch (error) {
    console.error('Error attaching token:', error)
  }
  return config
})

// Handle authentication errors - triggers React state update via global logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // This clears SecureStore AND updates React state → navigates to Login
      triggerGlobalLogout()
    }
    return Promise.reject(error)
  }
)

export default api
