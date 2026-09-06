import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { RootStackParamList } from '../navigation/AppStack';

type TabName = 'Home' | 'Cart' | 'Favorites' | 'Orders';

interface BottomNavProps {
    activeTab: TabName;
}

export default function BottomNav({ activeTab }: BottomNavProps) {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const insets = useSafeAreaInsets();
    const { getTotalItems } = useCart();
    const cartItemCount = getTotalItems();

    const navigateTo = (tab: TabName) => {
        if (activeTab === tab) return;
        if (tab === 'Home') navigation.navigate('Home');
        if (tab === 'Cart') navigation.navigate('Cart');
        if (tab === 'Orders') navigation.navigate('Orders');
        if (tab === 'Favorites') navigation.navigate('Favorites');
    };

    return (
        <View style={[styles.bottomBar, { bottom: Math.max(20, insets.bottom + 10) }]}>
            <TouchableOpacity style={styles.tabItem} onPress={() => navigateTo('Home')}>
                <View style={activeTab === 'Home' ? styles.tabActiveIndicator : undefined}>
                    <Feather name="home" size={20} color={activeTab === 'Home' ? '#fff' : '#666'} />
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => navigateTo('Cart')}>
                <View style={activeTab === 'Cart' ? styles.tabActiveIndicator : undefined}>
                    <Feather name="shopping-cart" size={20} color={activeTab === 'Cart' ? '#fff' : '#666'} />
                </View>
                {cartItemCount > 0 && (
                    <View style={styles.tabBadge}>
                        <Text style={styles.tabBadgeText}>{cartItemCount}</Text>
                    </View>
                )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => navigateTo('Favorites')}>
                <View style={activeTab === 'Favorites' ? styles.tabActiveIndicator : undefined}>
                    <Feather name="heart" size={20} color={activeTab === 'Favorites' ? '#fff' : '#666'} />
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tabItem} onPress={() => navigateTo('Orders')}>
                <View style={activeTab === 'Orders' ? styles.tabActiveIndicator : undefined}>
                    <Feather name="list" size={20} color={activeTab === 'Orders' ? '#fff' : '#666'} />
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    bottomBar: {
        position: 'absolute',
        left: 20,
        right: 20,
        height: 60,
        backgroundColor: '#1A1A2E',
        borderRadius: 30,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 12,
    },
    tabItem: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    tabActiveIndicator: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E8601C',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabBadge: {
        position: 'absolute',
        top: 2,
        right: -2,
        backgroundColor: '#E8601C',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#1A1A2E',
    },
    tabBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
});
