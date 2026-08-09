import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type Currency = 'KES' | 'ETB'

interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
  getPrice: (priceKes: number, priceEtb: number) => number
  formatPrice: (priceKes: number, priceEtb: number) => string
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

const CURRENCY_STORAGE_KEY = '@retail_currency'

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('KES')

  // Load currency preference from storage on app start
  useEffect(() => {
    loadCurrency()
  }, [])

  const loadCurrency = async () => {
    try {
      const saved = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY)
      if (saved && (saved === 'KES' || saved === 'ETB')) {
        setCurrencyState(saved as Currency)
      }
    } catch (error) {
      console.error('Error loading currency:', error)
    }
  }

  const setCurrency = async (newCurrency: Currency) => {
    try {
      await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency)
      setCurrencyState(newCurrency)
      // TODO: Call API to update user preference
      // userService.updateCurrencyPreference(newCurrency)
    } catch (error) {
      console.error('Error saving currency:', error)
    }
  }

  const getPrice = (priceKes: number, priceEtb: number): number => {
    return currency === 'KES' ? priceKes : priceEtb
  }

  const formatPrice = (priceKes: number, priceEtb: number): string => {
    const price = getPrice(priceKes, priceEtb)
    return `${currency} ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        getPrice,
        formatPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
