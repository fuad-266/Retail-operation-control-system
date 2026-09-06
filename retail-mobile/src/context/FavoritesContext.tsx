import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface FavoritesContextType {
    favorites: Set<string>
    toggleFavorite: (productId: string) => void
    isFavorite: (productId: string) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

const FAVORITES_STORAGE_KEY = '@retail_favorites'

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const [favorites, setFavorites] = useState<Set<string>>(new Set())

    // Load favorites from storage on app start
    useEffect(() => {
        loadFavorites()
    }, [])

    // Save favorites to storage whenever they change
    useEffect(() => {
        saveFavorites()
    }, [favorites])

    const loadFavorites = async () => {
        try {
            const saved = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY)
            if (saved) {
                setFavorites(new Set(JSON.parse(saved)))
            }
        } catch (error) {
            console.error('Error loading favorites:', error)
        }
    }

    const saveFavorites = async () => {
        try {
            await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favorites)))
        } catch (error) {
            console.error('Error saving favorites:', error)
        }
    }

    const toggleFavorite = (productId: string) => {
        setFavorites(prev => {
            const newFavs = new Set(prev)
            if (newFavs.has(productId)) {
                newFavs.delete(productId)
            } else {
                newFavs.add(productId)
            }
            return newFavs
        })
    }

    const isFavorite = (productId: string) => {
        return favorites.has(productId)
    }

    return (
        <FavoritesContext.Provider
            value={{
                favorites,
                toggleFavorite,
                isFavorite,
            }}
        >
            {children}
        </FavoritesContext.Provider>
    )
}

export function useFavorites() {
    const context = useContext(FavoritesContext)
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider')
    }
    return context
}
