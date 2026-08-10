import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useMutation } from '@tanstack/react-query'
import { RootStackParamList } from '../navigation/AppStack'
import { useCart } from '../context/CartContext'
import { useCurrency } from '../context/CurrencyContext'
import { ordersService } from '../services/orders.service'

type CheckoutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Checkout'>

type PaymentMethod = 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'MESSENGER'

export default function CheckoutScreen() {
  const navigation = useNavigation<CheckoutScreenNavigationProp>()
  const insets = useSafeAreaInsets()
  const { items, getTotalPrice, clearCart } = useCart()
  const { currency, formatPrice, getPrice } = useCurrency()
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MOBILE_MONEY')

  const createOrderMutation = useMutation({
    mutationFn: ordersService.createOrder,
    onSuccess: (order) => {
      clearCart()

      // If payment method requires screenshot, navigate to payment upload
      if (paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'MOBILE_MONEY') {
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
      } else {
        // Messenger payment - no screenshot required
        Alert.alert(
          'Order Created!',
          'Your order has been placed successfully. Our team will contact you via messenger for payment details.',
          [
            {
              text: 'View Orders',
              onPress: () => navigation.navigate('Orders'),
            },
          ]
        )
      }
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
      paymentMethod,
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
                {formatPrice(item.priceKes * item.quantity, item.priceEtb * item.quantity)}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <View>
              <Text style={styles.totalAmount}>
                {formatPrice(getTotalPrice('KES'), getTotalPrice('ETB'))}
              </Text>
              <Text style={styles.totalSecondary}>
                {currency === 'KES'
                  ? `ETB ${getTotalPrice('ETB').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : `KES ${getTotalPrice('KES').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
              </Text>
            </View>
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

        {/* Payment Method Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <Text style={styles.helperText}>Select how you will pay for this order</Text>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'BANK_TRANSFER' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('BANK_TRANSFER')}
          >
            <View style={styles.radioButton}>
              {paymentMethod === 'BANK_TRANSFER' && <View style={styles.radioButtonInner} />}
            </View>
            <View style={styles.paymentOptionContent}>
              <Text style={styles.paymentOptionTitle}>Bank Transfer</Text>
              <Text style={styles.paymentOptionDescription}>
                Transfer to our bank account and upload proof of payment
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'MOBILE_MONEY' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('MOBILE_MONEY')}
          >
            <View style={styles.radioButton}>
              {paymentMethod === 'MOBILE_MONEY' && <View style={styles.radioButtonInner} />}
            </View>
            <View style={styles.paymentOptionContent}>
              <Text style={styles.paymentOptionTitle}>Mobile Money</Text>
              <Text style={styles.paymentOptionDescription}>
                Pay via M-PESA or similar and upload confirmation screenshot
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'MESSENGER' && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod('MESSENGER')}
          >
            <View style={styles.radioButton}>
              {paymentMethod === 'MESSENGER' && <View style={styles.radioButtonInner} />}
            </View>
            <View style={styles.paymentOptionContent}>
              <Text style={styles.paymentOptionTitle}>Sent by Messenger</Text>
              <Text style={styles.paymentOptionDescription}>
                We'll contact you via messenger for payment arrangement
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Payment Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What happens next?</Text>
          <View style={styles.infoBox}>
            {paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'MOBILE_MONEY' ? (
              <>
                <Text style={styles.infoText}>
                  After placing your order, you will be directed to the payment instructions screen.
                </Text>
                <Text style={styles.infoText}>
                  You'll need to make the payment and upload a screenshot of the confirmation.
                </Text>
                <Text style={styles.infoText}>
                  Our cashier will verify your payment and process your order.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.infoText}>
                  After placing your order, our team will contact you via messenger.
                </Text>
                <Text style={styles.infoText}>
                  We'll arrange the payment details and delivery schedule with you directly.
                </Text>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(16, insets.bottom + 16) }]}>
        <TouchableOpacity
          style={[styles.placeOrderButton, createOrderMutation.isPending && styles.buttonDisabled]}
          onPress={handlePlaceOrder}
          disabled={createOrderMutation.isPending}
        >
          {createOrderMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.placeOrderButtonText}>
              Place Order - {formatPrice(getTotalPrice('KES'), getTotalPrice('ETB'))}
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
    textAlign: 'right',
  },
  totalSecondary: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  helperText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  paymentOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  paymentOptionContent: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  paymentOptionDescription: {
    fontSize: 14,
    color: '#666',
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