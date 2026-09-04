import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import { triggerGlobalLogout } from '../context/AuthContext'

const API_BASE_URL = 'http://192.168.1.2:8080/api' // Your backend running on this computer
export const SERVER_BASE_URL = 'http://192.168.1.2:8080' // Base URL without /api, for images etc.

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
