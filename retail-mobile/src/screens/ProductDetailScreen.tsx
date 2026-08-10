import React, { useState } from 'react'
import { Feather, Ionicons } from '@expo/vector-icons'
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRoute, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useQuery } from '@tanstack/react-query'
import { RootStackParamList } from '../navigation/AppStack'
import { productsService, ProductDto } from '../services/products.service'
import { useCart } from '../context/CartContext'
import { useCurrency } from '../context/CurrencyContext'

type ProductDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProductDetail'>
type ProductDetailScreenRouteProp = {
  key: string
  name: 'ProductDetail'
  params: { productId: string }
}

const { width } = Dimensions.get('window')

export default function ProductDetailScreen() {
  const navigation = useNavigation<ProductDetailScreenNavigationProp>()
  const route = useRoute<ProductDetailScreenRouteProp>()
  const insets = useSafeAreaInsets()
  const { productId } = route.params
  const { addToCart, getTotalItems } = useCart()
  const { formatPrice } = useCurrency()
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productsService.listPublic,
  })

  const product = products?.find(p => p.id === productId)

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCircle}>
            <Feather name="shopping-bag" size={32} color="#E8601C" />
          </View>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
        <View style={styles.loadingContainer}>
          <Feather name="alert-circle" size={48} color="#D80000" style={{ marginBottom: 12 }} />
          <Text style={styles.loadingText}>Product not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  const handleAddToCart = () => {
    if (quantity > product.stockQuantity) {
      Alert.alert('Error', 'Not enough stock available')
      return
    }

    addToCart(product, quantity)
    Alert.alert('Success', `${quantity} ${product.name} added to cart`, [
      { text: 'Continue Shopping', style: 'cancel' },
      { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
    ])
  }

  const incrementQuantity = () => {
    if (quantity < product.stockQuantity) {
      setQuantity(prev => prev + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }

  const cartItemCount = getTotalItems()

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* Header - Floating */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.headerBtnText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('Cart')}
        >
          <Feather name="shopping-cart" size={20} color="#1A1A2E" />
          {cartItemCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{cartItemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Feather name="box" size={64} color="#999" />
            </View>
          )}
          {/* Favorite */}
          <TouchableOpacity
            style={styles.favoriteBtn}
            onPress={() => setIsFavorite(!isFavorite)}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? '#D80000' : '#666'}
            />
          </TouchableOpacity>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{product.category}</Text>
          </View>

          <Text style={styles.productName}>{product.name}</Text>

          <View style={styles.priceStockRow}>
            <Text style={styles.price}>{formatPrice(product.priceKes, product.priceEtb)}</Text>
            <View style={[
              styles.stockBadge,
              product.stockQuantity === 0 && styles.stockBadgeOut
            ]}>
              <Text style={[
                styles.stockText,
                product.stockQuantity === 0 && styles.stockTextOut
              ]}>
                {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
              </Text>
            </View>
          </View>

          {product.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {/* Quantity Selector */}
          {product.stockQuantity > 0 && (
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Quantity</Text>
              <View style={styles.quantityRow}>
                <View style={styles.quantitySelector}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={decrementQuantity}
                    disabled={quantity <= 1}
                  >
                    <Text style={[styles.quantityButtonText, quantity <= 1 && { color: '#CCC' }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityValue}>{quantity}</Text>
                  <TouchableOpacity
                    style={[styles.quantityButton, styles.quantityButtonPlus]}
                    onPress={incrementQuantity}
                    disabled={quantity >= product.stockQuantity}
                  >
                    <Text style={[styles.quantityButtonText, styles.quantityButtonPlusText]}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.subtotal}>
                  {formatPrice(product.priceKes * quantity, product.priceEtb * quantity)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action */}
      {product.stockQuantity > 0 ? (
        <View style={[styles.footer, { paddingBottom: Math.max(28, insets.bottom + 16) }]}>
          <View style={styles.footerPriceCol}>
            <Text style={styles.footerLabel}>Total Price</Text>
            <Text style={styles.footerPrice}>
              {formatPrice(product.priceKes * quantity, product.priceEtb * quantity)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={handleAddToCart}
            activeOpacity={0.85}
          >
            <Feather name="shopping-cart" size={18} color="#fff" />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.footer, { paddingBottom: Math.max(28, insets.bottom + 16) }]}>
          <View style={styles.outOfStockButton}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    paddingVertical: 12,
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerBtnText: {
    fontSize: 18,
  },
  headerBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#E8601C',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },

  // Image
  imageContainer: {
    width: width,
    height: width * 0.85,
    backgroundColor: '#F0F0F0',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 64,
  },
  favoriteBtn: {
    position: 'absolute',
    bottom: 16,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  favoriteIcon: {
    fontSize: 20,
  },

  // Product Info
  productInfo: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF0EB',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E8601C',
  },
  productName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 12,
    lineHeight: 30,
  },
  priceStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: '#E8601C',
  },
  stockBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stockBadgeOut: {
    backgroundColor: '#FFEBEE',
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  stockTextOut: {
    color: '#F44336',
  },
  descriptionContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
  },

  // Quantity
  quantitySection: {
    marginBottom: 24,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    padding: 4,
  },
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  quantityButtonPlus: {
    backgroundColor: '#E8601C',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  quantityButtonPlusText: {
    color: '#fff',
  },
  quantityValue: {
    marginHorizontal: 20,
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  subtotal: {
    fontSize: 18,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  footerPriceCol: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginBottom: 4,
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  addToCartButton: {
    flexDirection: 'row',
    backgroundColor: '#E8601C',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#E8601C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  addToCartIcon: {
    fontSize: 18,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  outOfStockButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '700',
  },
})