import React from 'react'
import { Feather } from '@expo/vector-icons'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
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
    case 'PENDING': return '#FFA726'
    case 'PAYMENT_SUBMITTED': return '#42A5F5'
    case 'APPROVED': return '#66BB6A'
    case 'REJECTED': return '#EF5350'
    case 'DELIVERED': return '#2E7D32'
    case 'MESSENGER_PENDING': return '#AB47BC'
    default: return '#999'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'PENDING': return 'Pending Payment'
    case 'PAYMENT_SUBMITTED': return 'Payment Submitted'
    case 'APPROVED': return 'Approved'
    case 'REJECTED': return 'Rejected'
    case 'DELIVERED': return 'Delivered'
    case 'MESSENGER_PENDING': return 'Messenger Pending'
    default: return status
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
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E8601C" />
        </View>
      </SafeAreaView>
    )
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
        <View style={styles.loadingContainer}>
          <Feather name="alert-circle" size={48} color="#D80000" style={{ marginBottom: 12 }} />
          <Text style={styles.loadingText}>Order not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Status Header Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusIconCircle, { backgroundColor: getStatusColor(order.status) + '20' }]}>
            <Feather name="clipboard" size={26} color={getStatusColor(order.status)} />
          </View>
          <Text style={styles.statusOrderId}>Order #{order.id.slice(0, 8)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(order.status) }]} />
            <Text style={[styles.statusBadgeText, { color: getStatusColor(order.status) }]}>
              {getStatusText(order.status)}
            </Text>
          </View>
          <Text style={styles.statusDate}>
            {new Date(order.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Order Items Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="shopping-cart" size={18} color="#E8601C" style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Order Items</Text>
          </View>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <View style={styles.itemIconCircle}>
                  <Feather name="box" size={16} color="#E8601C" />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemQty}>Qty: {item.quantity} × KES {item.unitPrice.toLocaleString()}</Text>
                </View>
              </View>
              <Text style={styles.itemTotal}>
                KES {(item.unitPrice * item.quantity).toLocaleString()}
              </Text>
            </View>
          ))}

          <View style={styles.totalDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>KES {order.totalAmount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Delivery Address Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="map-pin" size={18} color="#E8601C" style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Delivery Address</Text>
          </View>
          <View style={styles.addressBox}>
            <Text style={styles.addressText}>{order.deliveryAddress}</Text>
          </View>
        </View>

        {/* Payment Reference */}
        {order.paymentReference && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="file-text" size={18} color="#E8601C" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>Payment Reference</Text>
            </View>
            <View style={styles.refBox}>
              <Text style={styles.refText}>{order.paymentReference}</Text>
            </View>
          </View>
        )}

        {/* Rejection Reason */}
        {order.status === 'REJECTED' && order.rejectionReason && (
          <View style={styles.rejectionCard}>
            <View style={styles.cardHeader}>
              <Feather name="alert-triangle" size={18} color="#EF5350" style={{ marginRight: 8 }} />
              <Text style={[styles.cardTitle, { color: '#EF5350' }]}>Order Rejected</Text>
            </View>
            <Text style={styles.rejectionText}>{order.rejectionReason}</Text>
          </View>
        )}

        {/* Action Button */}
        {order.status === 'PENDING' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('PaymentUpload', { orderId: order.id })}
            activeOpacity={0.85}
          >
            <Feather name="upload" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Upload Payment Screenshot</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FAFAFA',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 18,
    color: '#1A1A2E',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Status Card
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statusIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIconText: {
    fontSize: 26,
  },
  statusOrderId: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 8,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusDate: {
    fontSize: 13,
    color: '#999',
  },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  cardIcon: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
  },

  // Items
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  itemIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF0EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemIconText: {
    fontSize: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 2,
  },
  itemQty: {
    fontSize: 12,
    color: '#999',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E8601C',
  },
  totalDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 14,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#E8601C',
  },

  // Address
  addressBox: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 14,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#444',
  },

  // Reference
  refBox: {
    backgroundColor: '#FFF0EB',
    borderRadius: 12,
    padding: 14,
  },
  refText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8601C',
  },

  // Rejection
  rejectionCard: {
    backgroundColor: '#FFF8F8',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  rejectionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // Action
  actionButton: {
    backgroundColor: '#E8601C',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    shadowColor: '#E8601C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  actionIcon: {
    fontSize: 16,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})