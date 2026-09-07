import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/auth.service'

// Clears all stored data (token, cart, etc.) for dev/debug purposes
const clearAllData = async () => {
  try {
    await SecureStore.deleteItemAsync('auth')
  } catch (e) {
    console.warn('clearAllData error:', e)
  }
}

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()

  const { mutate: loginMutation, isPending } = useMutation({
    mutationFn: authService.login,
    onSuccess: async (data) => {
      if (data.role !== 'CUSTOMER') {
        Alert.alert(
          'Access Restricted',
          'This mobile app is only for customers. Please use the web interface for staff accounts.'
        )
        return
      }
      await login(data.token, data.role as any, data.userId)
    },
    onError: (error: any) => {
      Alert.alert(
        'Login Failed',
        error.response?.data?.message || 'Invalid credentials'
      )
    },
  })

  const handleLogin = () => {
    if (!phoneNumber.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both phone number and password')
      return
    }
    loginMutation({ phoneNumber: phoneNumber.trim(), password })
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          Sign in to your Adama account
        </Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isPending && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isPending}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>
              {isPending ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.noAccountText}>
          Don't have an account? Contact the shop to get your login credentials.
        </Text>

        {/* Development Helper - Remove in production */}
        <TouchableOpacity
          style={styles.clearDataButton}
          onPress={async () => {
            await clearAllData()
            Alert.alert('Success', 'All stored data cleared. App will now show login screen on next launch.')
          }}
        >
          <Text style={styles.clearDataButtonText}>Clear Stored Data</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 4,
  },
  logo: {
    width: 220,
    height: 160,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 36,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  loginButton: {
    backgroundColor: '#E8601C',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: '#E8601C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  noAccountText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  clearDataButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 16,
    alignSelf: 'center',
  },
  clearDataButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
})