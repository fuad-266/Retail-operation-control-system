import React from 'react'
import { Feather } from '@expo/vector-icons'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../navigation/AppStack'
import { useCart, CartItem } from '../context/CartContext'
import { useCurrency } from '../context/CurrencyContext'
import BottomNav from '../components/BottomNav'

type CartScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Cart'>

export default function CartScreen() {
  const navigation = useNavigation<CartScreenNavigationProp>()
  const insets = useSafeAreaInsets()
  const { items, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart()
  const { currency, formatPrice } = useCurrency()

  const handleRemoveItem = (productId: string, productName: string) => {
    Alert.alert(
      'Remove Item',
      `Remove ${productName} from cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(productId) },
      ]
    )
  }

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Remove all items from cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearCart },
      ]
    )
  }

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Add some items to your cart first')
      return
    }
    navigation.navigate('Checkout')
  }

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      ) : (
        <View style={styles.placeholderImage}>
          <Feather name="box" size={28} color="#999" />
        </View>
      )}

      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemCategory}>{item.category}</Text>
        <Text style={styles.itemPrice}>{formatPrice(item.priceKes, item.priceEtb)}</Text>

        <View style={styles.quantityRow}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, item.quantity - 1)}
            >
              <Text style={styles.quantityButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantity}>{item.quantity}</Text>
            <TouchableOpacity
              style={[styles.quantityButton, styles.quantityButtonPlus]}
              onPress={() => updateQuantity(item.id, item.quantity + 1)}
            >
              <Text style={[styles.quantityButtonText, styles.quantityButtonPlusText]}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item.id, item.name)}
          >
            <Feather name="trash-2" size={20} color="#D80000" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.itemTotalContainer}>
        <Text style={styles.itemTotal}>
          {formatPrice(item.priceKes * item.quantity, item.priceEtb * item.quantity)}
        </Text>
      </View>
    </View>
  )

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.emptyCart}>
          <View style={styles.emptyCartIconContainer}>
            <Feather name="shopping-cart" size={44} color="#E8601C" />
          </View>
          <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
          <Text style={styles.emptyCartText}>Add some products to get started</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.85}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
        <BottomNav activeTab="Cart" />
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
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <TouchableOpacity onPress={handleClearCart}>
          <Text style={styles.clearButton}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Item Count */}
      <View style={styles.itemCountBar}>
        <Text style={styles.itemCountText}>{items.length} item{items.length !== 1 ? 's' : ''} in cart</Text>
      </View>

      <FlatList
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        style={styles.cartList}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(28, insets.bottom + 16), marginBottom: 80 }]}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{formatPrice(getTotalPrice('KES'), getTotalPrice('ETB'))}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
          activeOpacity={0.85}
        >
          <Text style={styles.checkoutButtonText}>
            Proceed to Checkout
          </Text>
          <View style={styles.checkoutArrow}>
            <Text style={styles.checkoutArrowText}>→</Text>
          </View>
        </TouchableOpacity>
      </View>
      <BottomNav activeTab="Cart" />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
  clearButton: {
    fontSize: 14,
    color: '#E8601C',
    fontWeight: '600',
  },

  // Item Count Bar
  itemCountBar: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  itemCountText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },

  // Cart List
  cartList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
  },
  placeholderImage: {
    width: 72,
    height: 72,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 28,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 3,
  },
  itemCategory: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 13,
    color: '#E8601C',
    fontWeight: '600',
    marginBottom: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 2,
  },
  quantityButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  quantityButtonPlus: {
    backgroundColor: '#E8601C',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  quantityButtonPlusText: {
    color: '#fff',
  },
  quantity: {
    marginHorizontal: 14,
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  removeButton: {
    padding: 4,
  },
  removeButtonText: {
    fontSize: 16,
  },
  itemTotalContainer: {
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A2E',
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 28,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  checkoutButton: {
    backgroundColor: '#E8601C',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E8601C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  checkoutArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutArrowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Empty state
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyCartIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF0EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyCartIcon: {
    fontSize: 44,
  },
  emptyCartTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyCartText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 28,
    textAlign: 'center',
  },
  shopButton: {
    backgroundColor: '#E8601C',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#E8601C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})