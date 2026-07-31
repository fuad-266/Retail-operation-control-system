import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useQuery } from '@tanstack/react-query'
import { RootStackParamList } from '../navigation/AppStack'
import { ordersService } from '../services/orders.service'

type OrderDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OrderDetail'>
type OrderDetailScreenRouteProp = {
  key: string
  name: 'OrderDetail'
  params: { orderId: string }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return '#FFA500'
    case 'PAYMENT_SUBMITTED':
      return '#007AFF'
    case 'APPROVED':
      return '#34C759'
    case 'REJECTED':
      return '#FF3B30'
    case 'DELIVERED':
      return '#34C759'
    default:
      return '#666'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'Pending Payment'
    case 'PAYMENT_SUBMITTED':
      return 'Payment Submitted'
    case 'APPROVED':
      return 'Approved'
    case 'REJECTED':
      return 'Rejected'
    case 'DELIVERED':
      return 'Delivered'
    default:
      return status
  }
}

export default function OrderDetailScreen() {
  const navigation = useNavigation<OrderDetailScreenNavigationProp>()
  const route = useRoute<OrderDetailScreenRouteProp>()
  const { orderId } = route.params

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersService.getOrder(orderId),
  })

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    )
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Order not found</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Order ID:</Text>
            <Text style={styles.value}>{order.id.slice(0, 8)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>
              {new Date(order.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Status:</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
              </View>
              <View style={styles.itemPricing}>
                <Text style={styles.itemPrice}>
                  KES {item.unitPrice.toLocaleString()} each
                </Text>
                <Text style={styles.itemTotal}>
                  KES {(item.unitPrice * item.quantity).toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalAmount}>KES {order.totalAmount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Text style={styles.addressText}>{order.deliveryAddress}</Text>
        </View>

        {/* Payment Info */}
        {order.paymentReference && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Reference</Text>
            <Text style={styles.value}>{order.paymentReference}</Text>
          </View>
        )}

        {/* Rejection Reason */}
        {order.status === 'REJECTED' && order.rejectionReason && (
          <View style={styles.section}>
            <View style={styles.rejectionBox}>
              <Text style={styles.rejectionTitle}>Order Rejected</Text>
              <Text style={styles.rejectionReason}>{order.rejectionReason}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        {order.status === 'PENDING' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('PaymentUpload', { orderId: order.id })}
            >
              <Text style={styles.actionButtonText}>Upload Payment Screenshot</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemPricing: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
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
  addressText: {
    fontSize: 16,
    lineHeight: 24,
  },
  rejectionBox: {
    backgroundColor: '#ffe6e6',
    padding: 12,
    borderRadius: 8,
  },
  rejectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 8,
  },
  rejectionReason: {
    fontSize: 14,
    color: '#333',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
})