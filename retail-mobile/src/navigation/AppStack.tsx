import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { useAuth } from '../context/AuthContext'

// Screens
import LoadingScreen from '../screens/LoadingScreen'
import LoginScreen from '../screens/LoginScreen'
import HomeScreen from '../screens/HomeScreen'
import ProductDetailScreen from '../screens/ProductDetailScreen'
import CartScreen from '../screens/CartScreen'
import CheckoutScreen from '../screens/CheckoutScreen'
import PaymentUploadScreen from '../screens/PaymentUploadScreen'
import MyOrdersScreen from '../screens/MyOrdersScreen'
import OrderDetailScreen from '../screens/OrderDetailScreen'
import FavoritesScreen from '../screens/FavoritesScreen'

export type RootStackParamList = {
  Login: undefined
  Home: undefined
  ProductDetail: { productId: string }
  Cart: undefined
  Checkout: undefined
  PaymentUpload: { orderId: string }
  Orders: undefined
  OrderDetail: { orderId: string }
  Favorites: undefined
}

const Stack = createStackNavigator<RootStackParamList>()

export function AppStack() {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={(!isAuthenticated || user?.role !== 'CUSTOMER') ? "Login" : "Home"}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : user?.role === 'CUSTOMER' ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="PaymentUpload" component={PaymentUploadScreen} />
          <Stack.Screen name="Orders" component={MyOrdersScreen} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
          <Stack.Screen name="Favorites" component={FavoritesScreen} />
        </>
      ) : (
        // Non-customer roles should use web interface
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  )
}