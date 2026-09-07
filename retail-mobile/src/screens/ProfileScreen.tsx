import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useCurrency } from '../context/CurrencyContext'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../navigation/AppStack'
import BottomNav from '../components/BottomNav'

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>

export default function ProfileScreen() {
    const { user, logout } = useAuth()
    const { language, setLanguage, t } = useLanguage()
    const { currency, setCurrency } = useCurrency()
    const navigation = useNavigation<ProfileScreenNavigationProp>()

    const handleLanguageToggle = () => {
        setLanguage(language === 'en' ? 'am' : 'en')
    }

    const handleCurrencyToggle = () => {
        setCurrency(currency === 'KES' ? 'ETB' : 'KES')
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header Profile Section */}
            <View style={styles.header}>
                <View style={styles.userInfoContainer}>
                    <View style={styles.avatar}>
                        <Feather name="user" size={36} color="#4A2411" />
                    </View>
                    <View style={styles.userDetails}>
                        <Text style={styles.userName}>John Doe</Text>
                        <Text style={styles.userEmail}>john@example.com</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.settingsIcon}>
                    <Feather name="settings" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
                {/* My Orders */}
                <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Orders')}>
                    <View style={styles.menuLeft}>
                        <Feather name="calendar" size={20} color="#666" style={styles.menuIcon} />
                        <Text style={styles.menuText}>{t('my_orders') || 'My Orders'}</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#CCC" />
                </TouchableOpacity>

                {/* My Addresses */}
                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuLeft}>
                        <Feather name="map-pin" size={20} color="#666" style={styles.menuIcon} />
                        <Text style={styles.menuText}>{t('delivery_address') || 'My Addresses'}</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#CCC" />
                </TouchableOpacity>

                {/* Payment Methods */}
                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuLeft}>
                        <Feather name="credit-card" size={20} color="#666" style={styles.menuIcon} />
                        <Text style={styles.menuText}>{t('payment_method') || 'Payment Methods'}</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#CCC" />
                </TouchableOpacity>

                {/* Settings / Currency */}
                <TouchableOpacity style={styles.menuItem} onPress={handleCurrencyToggle}>
                    <View style={styles.menuLeft}>
                        <Feather name="dollar-sign" size={20} color="#666" style={styles.menuIcon} />
                        <Text style={styles.menuText}>Currency: {currency}</Text>
                    </View>
                    <Feather name="refresh-cw" size={16} color="#E8601C" />
                </TouchableOpacity>

                {/* Settings / Language */}
                <TouchableOpacity style={styles.menuItem} onPress={handleLanguageToggle}>
                    <View style={styles.menuLeft}>
                        <Feather name="globe" size={20} color="#666" style={styles.menuIcon} />
                        <Text style={styles.menuText}>Language: {language === 'en' ? 'English (EN)' : 'Amharic (አማ)'}</Text>
                    </View>
                    <Feather name="refresh-cw" size={16} color="#E8601C" />
                </TouchableOpacity>

                {/* Help & Support */}
                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuLeft}>
                        <Feather name="help-circle" size={20} color="#666" style={styles.menuIcon} />
                        <Text style={styles.menuText}>Help & Support</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#CCC" />
                </TouchableOpacity>

                {/* About Adama Shop */}
                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuLeft}>
                        <Feather name="info" size={20} color="#666" style={styles.menuIcon} />
                        <Text style={styles.menuText}>About Adama Shop</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#CCC" />
                </TouchableOpacity>

                {/* Log Out */}
                <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={logout}>
                    <View style={styles.menuLeft}>
                        <Feather name="log-out" size={20} color="#D80000" style={styles.menuIcon} />
                        <Text style={[styles.menuText, { color: '#D80000', fontWeight: 'bold' }]}>{t('logout')}</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#CCC" />
                </TouchableOpacity>

                {/* Spacer for bottom nav */}
                <View style={{ height: 100 }} />
            </ScrollView>

            <BottomNav activeTab="Profile" />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    header: {
        backgroundColor: '#4A2411', // Dark Brown to match the mock
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    userInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FFAD66', // Orange theme avatar background
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    userDetails: {
        justifyContent: 'center',
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#FFF',
        opacity: 0.8,
    },
    settingsIcon: {
        padding: 8,
    },
    menuContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuIcon: {
        marginRight: 15,
    },
    menuText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    logoutItem: {
        marginTop: 20,
        backgroundColor: '#FFF5F5',
    },
})
