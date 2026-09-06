import 'react-native-gesture-handler'
import { StatusBar } from 'expo-status-bar'
import { LogBox } from 'react-native'

// Ignore third-party deprecation warnings (e.g. from React Navigation v6 in SDK 57)
LogBox.ignoreLogs(['InteractionManager has been deprecated'])
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './src/context/AuthContext'
import { CartProvider } from './src/context/CartContext'
import { CurrencyProvider } from './src/context/CurrencyContext'
import { FavoritesProvider } from './src/context/FavoritesContext'
import { AppStack } from './src/navigation/AppStack'
import { SafeAreaProvider } from 'react-native-safe-area-context'

const queryClient = new QueryClient()
const Stack = createStackNavigator()

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <FavoritesProvider>
                <NavigationContainer>
                  <AppStack />
                  <StatusBar style="auto" />
                </NavigationContainer>
              </FavoritesProvider>
            </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}