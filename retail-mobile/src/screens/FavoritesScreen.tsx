import React from 'react'
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    StatusBar,
    Dimensions,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather, Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useQuery } from '@tanstack/react-query'
import { productsService, ProductDto } from '../services/products.service'
import { useFavorites } from '../context/FavoritesContext'
import { useCurrency } from '../context/CurrencyContext'
import { useCart } from '../context/CartContext'
import { RootStackParamList } from '../navigation/AppStack'
import BottomNav from '../components/BottomNav'

type FavoritesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Favorites'>

const { width } = Dimensions.get('window')
const CARD_WIDTH = (width - 55) / 2

export default function FavoritesScreen() {
    const navigation = useNavigation<FavoritesScreenNavigationProp>()
    const insets = useSafeAreaInsets()
    const { toggleFavorite, isFavorite } = useFavorites()
    const { formatPrice } = useCurrency()
    const { addToCart } = useCart()

    const { data: products, isLoading } = useQuery({
        queryKey: ['products'],
        queryFn: productsService.listPublic,
    })

    const favoriteProducts = (products || []).filter(p => isFavorite(p.id))

    const handleQuickAdd = (product: ProductDto) => {
        if (product.stockQuantity > 0) {
            addToCart(product, 1)
        }
    }

    const renderProduct = (item: ProductDto) => (
        <TouchableOpacity
            key={item.id}
            style={styles.productCard}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            activeOpacity={0.85}
        >
            <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => toggleFavorite(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <View style={[styles.favoriteCircle, styles.favoriteCircleActive]}>
                    <Ionicons name="heart" size={16} color="#D80000" />
                </View>
            </TouchableOpacity>

            {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
            ) : (
                <View style={styles.placeholderImage}>
                    <Feather name="box" size={36} color="#999" />
                </View>
            )}

            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                    {item.name}
                </Text>
                <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>
                        {formatPrice(item.priceKes, item.priceEtb)}
                    </Text>
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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={24} color="#1A1A2E" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Favorites</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {isLoading ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                ) : favoriteProducts.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Feather name="heart" size={48} color="#999" style={{ marginBottom: 12 }} />
                        <Text style={styles.emptyTitle}>No Favorites Yet</Text>
                        <Text style={styles.emptyText}>Tap the heart icon on products to add them here.</Text>
                        <TouchableOpacity
                            style={styles.browseButton}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Text style={styles.browseButtonText}>Browse Products</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.productsGrid}>
                        {favoriteProducts.map((item) => (
                            <View key={item.id} style={{ width: CARD_WIDTH }}>
                                {renderProduct(item)}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            <BottomNav activeTab="Favorites" />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FAFAFA',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A2E',
    },
    scrollContent: {
        paddingBottom: 120, // Space for BottomNav
    },
    centerContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    loadingText: {
        fontSize: 16,
        color: '#999',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 6,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginBottom: 20,
    },
    browseButton: {
        backgroundColor: '#E8601C',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    browseButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    productsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        rowGap: 16,
    },
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
})
