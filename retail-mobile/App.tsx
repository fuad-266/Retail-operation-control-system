import 'react-native-gesture-handler'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './src/context/AuthContext'
import { CartProvider } from './src/context/CartContext'
import { AppStack } from './src/navigation/AppStack'

const queryClient = new QueryClient()
const Stack = createStackNavigator()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <NavigationContainer>
            <AppStack />
            <StatusBar style="auto" />
          </NavigationContainer>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}