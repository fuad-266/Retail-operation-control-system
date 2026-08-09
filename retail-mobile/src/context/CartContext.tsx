import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ProductDto } from '../services/products.service'

export interface CartItem extends ProductDto {
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addToCart: (product: ProductDto, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalPrice: (currency: 'KES' | 'ETB') => number
  getTotalItems: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = '@retail_cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load cart from storage on app start
  useEffect(() => {
    loadCart()
  }, [])

  // Save cart to storage whenever items change
  useEffect(() => {
    saveCart()
  }, [items])

  const loadCart = async () => {
    try {
      const saved = await AsyncStorage.getItem(CART_STORAGE_KEY)
      if (saved) {
        setItems(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    }
  }

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
      console.error('Error saving cart:', error)
    }
  }

  const addToCart = (product: ProductDto, quantity = 1) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.id === product.id)
      if (existingIndex >= 0) {
        // Update quantity of existing item
        const updated = [...prev]
        updated[existingIndex].quantity += quantity
        return updated
      } else {
        // Add new item
        return [...prev, { ...product, quantity }]
      }
    })
  }

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    
    setItems(prev => 
      prev.map(item => 
        item.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const getTotalPrice = (currency: 'KES' | 'ETB' = 'KES') => {
    return items.reduce((total, item) => {
      const price = currency === 'KES' ? item.priceKes : item.priceEtb
      return total + (price * item.quantity)
    }, 0)
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}