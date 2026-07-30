import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_BASE_URL = 'http://localhost:8080/api' // Replace with your backend IP

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

// Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth')
      // Navigation will be handled by the auth context
    }
    return Promise.reject(error)
  }
)

export default api