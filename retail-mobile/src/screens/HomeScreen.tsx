import React, { useState, useRef } from 'react'
import { Feather, Ionicons } from '@expo/vector-icons'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../navigation/AppStack'
import { productsService, ProductDto } from '../services/products.service'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useCurrency } from '../context/CurrencyContext'
import { useFavorites } from '../context/FavoritesContext'
import { useLanguage } from '../context/LanguageContext'
import BottomNav from '../components/BottomNav'

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>

const { width } = Dimensions.get('window')
const CARD_WIDTH = (width - 55) / 2

const CATEGORY_ICONS: Record<string, string> = {
  'Clothes': 'shirt-outline',
  'Gadgets': 'phone-portrait-outline',
  'Electronics': 'laptop-outline',
  'Household Item': 'home-outline',
  'Food': 'restaurant-outline',
  'Beverages': 'cafe-outline',
  'Beauty': 'rose-outline',
  'Sports': 'football-outline',
  'Books': 'book-outline',
  'Toys': 'game-controller-outline',
  'default': 'cube-outline',
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>()
  const { logout } = useAuth()
  const { getTotalItems, addToCart } = useCart()
  const { currency, setCurrency, formatPrice } = useCurrency()
  const { language, setLanguage, t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const { toggleFavorite, isFavorite } = useFavorites()
  const insets = useSafeAreaInsets()

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: productsService.listPublic,
  })

  const categories = products
    ? Array.from(new Set(products.map(p => p.category)))
    : []

  const filteredProducts = (products || []).filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const cartItemCount = getTotalItems()

  const handleQuickAdd = (product: ProductDto) => {
    if (product.stockQuantity > 0) {
      addToCart(product, 1)
    }
  }

  const getCategoryIcon = (category: string) => {
    return CATEGORY_ICONS[category] || CATEGORY_ICONS['default']
  }

  const renderProduct = ({ item }: { item: ProductDto }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      activeOpacity={0.85}
    >
      {/* Favorite Button */}
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => toggleFavorite(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View style={[
          styles.favoriteCircle,
          isFavorite(item.id) && styles.favoriteCircleActive
        ]}>
          <Ionicons
            name={isFavorite(item.id) ? 'heart' : 'heart-outline'}
            size={16}
            color={isFavorite(item.id) ? '#D80000' : '#666'}
          />
        </View>
      </TouchableOpacity>

      {/* Product Image */}
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
      ) : (
        <View style={styles.placeholderImage}>
          <Feather name="box" size={36} color="#999" />
        </View>
      )}

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>
            {formatPrice(item.priceKes, item.priceEtb)}
          </Text>
          {/* Add to Cart Button */}
          <TouchableOpacity
            style={[
              styles.addButton,
              item.stockQuantity === 0 && styles.addButtonDisabled
            ]}
            onPress={() => handleQuickAdd(item)}
            disabled={item.stockQuantity === 0}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <Feather name="shopping-bag" size={40} color="#E8601C" />
          </View>
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
        <View style={styles.loadingContainer}>
          <Feather name="alert-circle" size={48} color="#D80000" style={{ marginBottom: 16 }} />
          <Text style={styles.errorText}>Error loading products</Text>
          <Text style={styles.errorSubText}>Please check your connection and try again</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.headerLogo}
            />
          </View>
          <View style={styles.headerRight}>
            {/* Language Toggle */}
            <TouchableOpacity
              style={styles.iconCircleBtn}
              onPress={() => setLanguage(language === 'en' ? 'am' : 'en')}
            >
              <Ionicons name="language" size={18} color="#E8601C" />
              <Text style={styles.langIconText}>{language === 'en' ? 'EN' : 'አማ'}</Text>
            </TouchableOpacity>

            {/* Currency Toggle */}
            <View style={styles.currencyToggle}>
              <TouchableOpacity
                style={[styles.currencyBtn, currency === 'KES' && styles.currencyBtnActive]}
                onPress={() => setCurrency('KES')}
              >
                <Text style={[styles.currencyBtnText, currency === 'KES' && styles.currencyBtnTextActive]}>
                  KES
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.currencyBtn, currency === 'ETB' && styles.currencyBtnActive]}
                onPress={() => setCurrency('ETB')}
              >
                <Text style={[styles.currencyBtnText, currency === 'ETB' && styles.currencyBtnTextActive]}>
                  ETB
                </Text>
              </TouchableOpacity>
            </View>

            {/* Logout IconButton */}
            <TouchableOpacity style={styles.logoutIconButton} onPress={logout}>
              <Feather name="log-out" size={20} color="#D80000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Feather name="search" size={16} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('search')}
              placeholderTextColor="#999"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
        </View>

        {/* Hero Banner */}
        <View style={styles.bannerContainer}>
          <Image
            source={require('../../assets/hero_banner.png')}
            style={styles.heroBannerImage}
          />
        </View>

        {/* Category Section */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>{t('category')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryItem,
                    selectedCategory === cat && styles.categoryItemActive,
                  ]}
                  onPress={() => setSelectedCategory(selectedCategory === cat ? 'all' : cat)}
                >
                  <View style={[
                    styles.categoryIconContainer,
                    selectedCategory === cat && styles.categoryIconContainerActive,
                  ]}>
                    <Ionicons name={getCategoryIcon(cat) as any} size={24} color={selectedCategory === cat ? '#E8601C' : '#666'} />
                  </View>
                  <Text style={[
                    styles.categoryLabel,
                    selectedCategory === cat && styles.categoryLabelActive,
                  ]} numberOfLines={2}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Products Section */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all' ? t('near_you') : selectedCategory}
            </Text>
            {selectedCategory !== 'all' && (
              <TouchableOpacity onPress={() => setSelectedCategory('all')}>
                <Text style={styles.seeAllText}>{t('see_all')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.productsGrid}>
            {filteredProducts.map((item) => (
              <View key={item.id} style={{ width: CARD_WIDTH }}>
                {renderProduct({ item })}
              </View>
            ))}
          </View>

          {filteredProducts.length === 0 && (
            <View style={styles.emptyProducts}>
              <Feather name="search" size={48} color="#999" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyProductsTitle}>{t('no_products')}</Text>
              <Text style={styles.emptyProductsText}>
                {t('try_different')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <BottomNav activeTab="Home" />
    </SafeAreaView >
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingSpinner: {
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
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 14,
    color: '#999',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    flex: 1,
    marginLeft: -15,
  },
  headerLogo: {
    width: 120,
    height: 48,
    resizeMode: 'contain',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencyToggle: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    padding: 2,
  },
  currencyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
  },
  currencyBtnActive: {
    backgroundColor: '#E8601C',
  },
  currencyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
  },
  currencyBtnTextActive: {
    color: '#fff',
  },
  iconCircleBtn: {
    backgroundColor: '#FFE5EB', // Slight tint for language button
    width: 36,
    height: 36,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  langIconText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E8601C'
  },
  logoutIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    padding: 0,
  },

  // Banner
  bannerContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  heroBannerImage: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    resizeMode: 'cover',
  },

  // Categories
  categorySection: {
    paddingLeft: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    gap: 20,
    paddingRight: 20,
  },
  categoryItem: {
    alignItems: 'center',
    width: 72,
  },
  categoryItemActive: {},
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFF0EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryIconContainerActive: {
    borderColor: '#E8601C',
    backgroundColor: '#FFE0D3',
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: '#E8601C',
    fontWeight: '700',
  },

  // Products Section
  productsSection: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#E8601C',
    fontWeight: '600',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },

  // Product Card
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  favoriteCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  favoriteCircleActive: {
    backgroundColor: '#FFF0EB',
  },
  favoriteIcon: {
    fontSize: 14,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#F8F8F8',
  },
  placeholderImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 36,
  },
  productInfo: {
    gap: 6,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A2E',
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8601C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#DDD',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },

  // Empty state
  emptyProducts: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyProductsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  emptyProductsText: {
    fontSize: 14,
    color: '#999',
  },

})