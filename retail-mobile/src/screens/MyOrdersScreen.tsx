import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useQuery } from '@tanstack/react-query'
import { RootStackParamList } from '../navigation/AppStack'
import { ordersService, OnlineOrderDto } from '../services/orders.service'

type MyOrdersScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Orders'>

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

export default function MyOrdersScreen() {
  const navigation = useNavigation<MyOrdersScreenNavigationProp>()

  const { data: orders, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['myOrders'],
    queryFn: ordersService.getMyOrders,
  })

  const renderOrderItem = ({ item }: { item: OnlineOrderDto }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item.id.slice(0, 8)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.orderDate}>
          {new Date(item.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
        <Text style={styles.orderTotal}>KES {item.totalAmount.toLocaleString()}</Text>
      </View>

      <Text style={styles.itemCount}>{item.items.length} item(s)</Text>

      {item.status === 'PENDING' && (
        <TouchableOpacity
          style={styles.payButton}
          onPress={(e) => {
            e.stopPropagation()
            navigation.navigate('PaymentUpload', { orderId: item.id })
          }}
        >
          <Text style={styles.payButtonText}>Upload Payment</Text>
        </TouchableOpacity>
      )}

      {item.status === 'REJECTED' && item.rejectionReason && (
        <View style={styles.rejectionBox}>
          <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
          <Text style={styles.rejectionText}>{item.rejectionReason}</Text>
        </View>
      )}
    </TouchableOpacity>
  )

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading orders...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {orders && orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptyText}>Start shopping to place your first order</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  payButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectionBox: {
    backgroundColor: '#ffe6e6',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  rejectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: '#333',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  shopButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})