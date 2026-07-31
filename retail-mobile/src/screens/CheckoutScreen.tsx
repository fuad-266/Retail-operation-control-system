import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useMutation } from '@tanstack/react-query'
import { RootStackParamList } from '../navigation/AppStack'
import { useCart } from '../context/CartContext'
import { ordersService } from '../services/orders.service'

type CheckoutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Checkout'>

export default function CheckoutScreen() {
  const navigation = useNavigation<CheckoutScreenNavigationProp>()
  const { items, getTotalPrice, clearCart } = useCart()
  const [deliveryAddress, setDeliveryAddress] = useState('')

  const createOrderMutation = useMutation({
    mutationFn: ordersService.createOrder,
    onSuccess: (order) => {
      clearCart()
      Alert.alert(
        'Order Created!',
        'Your order has been placed successfully. Please proceed to payment.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('PaymentUpload', { orderId: order.id }),
          },
        ]
      )
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create order')
    },
  })

  const handlePlaceOrder = () => {
    if (!deliveryAddress.trim()) {
      Alert.alert('Missing Information', 'Please enter your delivery address')
      return
    }

    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty')
      return
    }

    const orderRequest = {
      items: items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
      })),
      deliveryAddress: deliveryAddress.trim(),
    }

    createOrderMutation.mutate(orderRequest)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {items.map(item => (
            <View key={item.id} style={styles.summaryItem}>
              <Text style={styles.summaryItemName}>
                {item.name} x {item.quantity}
              </Text>
              <Text style={styles.summaryItemPrice}>
                KES {(item.priceKes * item.quantity).toLocaleString()}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalAmount}>KES {getTotalPrice().toLocaleString()}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <TextInput
            style={styles.addressInput}
            placeholder="Enter your full delivery address"
            multiline
            numberOfLines={4}
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            textAlignVertical="top"
          />
        </View>

        {/* Payment Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Instructions</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              After placing your order, you will need to make payment and upload a screenshot of
              the payment confirmation.
            </Text>
            <Text style={styles.infoText}>
              Payment details will be provided on the next screen.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, createOrderMutation.isPending && styles.buttonDisabled]}
          onPress={handlePlaceOrder}
          disabled={createOrderMutation.isPending}
        >
          {createOrderMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.placeOrderButtonText}>
              Place Order - KES {getTotalPrice().toLocaleString()}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryItemName: {
    fontSize: 16,
    color: '#333',
  },
  summaryItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  infoBox: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  placeOrderButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  placeOrderButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
})