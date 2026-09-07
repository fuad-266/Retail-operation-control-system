import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type Language = 'en' | 'am'

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const LANGUAGE_STORAGE_KEY = '@retail_language'

const translations: Record<string, Record<string, string>> = {
    en: {
        location: 'Location',
        welcome: 'Welcome to Shop',
        logout: 'Logout',
        search: 'Search',
        find_what_you_need: 'Find What You\nNeed, Nearby',
        no_more_waiting: 'No more waiting days. Get items close to you for faster delivery or pickup.',
        category: 'Category',
        see_all: 'See All',
        near_you: 'Near you',
        no_products: 'No products found',
        try_different: 'Try a different search or category',
        loading: 'Loading products...',
        home: 'Home',
        cart: 'Cart',
        orders: 'Orders',
        favorites: 'Favorites',
        loading_orders: 'Loading orders...',
        my_orders: 'My Orders',
        no_orders_yet: 'No Orders Yet',
        start_shopping_to_place: 'Start shopping to place your first order',
        start_shopping: 'Start Shopping',
        upload_payment: 'Upload Payment',
        rejection_reason: 'Rejection Reason:',
        payment: 'Payment',
        amount_to_pay: 'Amount to Pay',
        mobile_money: 'Mobile Money',
        bank_transfer: 'Bank Transfer',
        upload_payment_screenshot: 'Upload Payment Screenshot',
        payment_reference: 'Payment Reference',
        submit_payment: 'Submit Payment',
        optional: 'Optional',
        account_name: 'Account Name',
        account_number: 'Account Number',
        // Cart
        shopping_cart: 'Shopping Cart',
        clear: 'Clear',
        items_in_cart: 'items in cart',
        item_in_cart: 'item in cart',
        total_label: 'Total',
        proceed_to_checkout: 'Proceed to Checkout',
        empty_cart_title: 'Your cart is empty',
        empty_cart_text: 'Add some products to get started',
        // Order Detail
        order_details: 'Order Details',
        order_not_found: 'Order not found',
        order_items: 'Order Items',
        qty: 'Qty:',
        total_amount: 'Total Amount',
        delivery_address: 'Delivery Address',
        order_rejected: 'Order Rejected',
        // Checkout
        checkout: 'Checkout',
        delivery_details: 'Delivery Details',
        full_name: 'Full Name',
        enter_full_name: 'Enter your full name',
        phone_number: 'Phone Number',
        enter_phone: 'Enter your phone number',
        detailed_address: 'Detailed Address',
        enter_address: 'Enter your full delivery address',
        payment_method: 'Payment Method',
        select_payment_method: 'Select your preferred payment method',
        order_summary: 'Order Summary',
        subtotal: 'Subtotal',
        delivery_fee: 'Delivery Fee',
        place_order: 'Place Order',
        free: 'Free',
        sent_by_messenger: 'Sent by Messenger',
        back: 'Back'
    },
    am: {
        location: 'አካባቢ',
        welcome: 'ወደ ሱቅ እንኳን በደህና መጡ',
        logout: 'ውጣ',
        search: 'ፈልግ',
        find_what_you_need: 'የሚፈልጉትን\nበአቅራቢያዎ ያግኙ',
        no_more_waiting: 'ከእንግዲህ መጠበቅ የለም። ፈጣን ለማድረስ በአቅራቢያዎ ያሉትን እቃዎች ያግኙ።',
        category: 'ምድብ',
        see_all: 'ሁሉንም እይ',
        near_you: 'በአቅራቢያዎ',
        no_products: 'ምንም ምርቶች አልተገኙም',
        try_different: 'የተለየ ፍለጋ ወይም ምድብ ይሞክሩ',
        loading: 'ምርቶችን በመጫን ላይ...',
        home: 'ዋና',
        cart: 'ጋሪ',
        orders: 'ትዕዛዞች',
        favorites: 'ተወዳጆች',
        loading_orders: 'ትዕዛዞችን በመጫን ላይ...',
        my_orders: 'የእኔ ትዕዛዞች',
        no_orders_yet: 'ምንም ትዕዛዞች የሉም',
        start_shopping_to_place: 'የመጀመሪያዎን ትዕዛዝ ለማድረግ ግብይት ይጀምሩ',
        start_shopping: 'ግብይት ይጀምሩ',
        upload_payment: 'ክፍያ ይስቀሉ',
        rejection_reason: 'የተቀበልበት ምክንያት:',
        payment: 'ክፍያ',
        amount_to_pay: 'የሚከፈል መጠን',
        mobile_money: 'የሞባይል ገንዘብ',
        bank_transfer: 'የባንክ ማስተላለፍ',
        upload_payment_screenshot: 'የክፍያ ቅጽበታዊ ገጽ እይታ ይስቀሉ',
        payment_reference: 'የክፍያ ማጣቀሻ',
        submit_payment: 'ክፍያ ያስገቡ',
        optional: 'አማራጭ',
        account_name: 'የመለያ ስም',
        account_number: 'የመለያ ቁጥር',
        // Cart
        shopping_cart: 'የግዢ ጋሪ',
        clear: 'አጽዳ',
        items_in_cart: 'እቃዎች በጋሪ ውስጥ',
        item_in_cart: 'እቃ በጋሪ ውስጥ',
        total_label: 'ድምር',
        proceed_to_checkout: 'ወደ ክፍያ ይቀጥሉ',
        empty_cart_title: 'ጋሪዎ ባዶ ነው',
        empty_cart_text: 'ለመጀመር አንዳንድ ምርቶችን ያክሉ',
        // Order Detail
        order_details: 'የትዕዛዝ ዝርዝሮች',
        order_not_found: 'ትዕዛዝ አልተገኘም',
        order_items: 'የትዕዛዝ እቃዎች',
        qty: 'ብዛት:',
        total_amount: 'አጠቃላይ መጠን',
        delivery_address: 'የማድረሻ አድራሻ',
        order_rejected: 'ትዕዛዝ ተቀባይነት አላገኘም',
        // Checkout
        checkout: 'ክፍያ',
        delivery_details: 'የማድረሻ ዝርዝሮች',
        full_name: 'ሙሉ ስም',
        enter_full_name: 'ሙሉ ስምዎን ያስገቡ',
        phone_number: 'ስልክ ቁጥር',
        enter_phone: 'ስልክ ቁጥርዎን ያስገቡ',
        detailed_address: 'ዝርዝር አድራሻ',
        enter_address: 'ሙሉ የማድረሻ አድራሻዎን ያስገቡ',
        payment_method: 'የክፍያ ዘዴ',
        select_payment_method: 'ተመራጭ የክፍያ ዘዴዎን ይምረጡ',
        order_summary: 'የትዕዛዝ ማጠቃለያ',
        subtotal: 'ንዑስ ድምር',
        delivery_fee: 'የማድረሻ ክፍያ',
        place_order: 'ትዕዛዝ ያስገቡ',
        free: 'ነፃ',
        sent_by_messenger: 'በመልእክተኛ የተላከ',
        back: 'ተመለስ'
    }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en')

    useEffect(() => {
        loadLanguage()
    }, [])

    const loadLanguage = async () => {
        try {
            const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
            if (saved && (saved === 'en' || saved === 'am')) {
                setLanguageState(saved as Language)
            }
        } catch (error) {
            console.error('Error loading language:', error)
        }
    }

    const setLanguage = async (newLanguage: Language) => {
        try {
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage)
            setLanguageState(newLanguage)
        } catch (error) {
            console.error('Error saving language:', error)
        }
    }

    const t = (key: string) => {
        const text = translations[language]?.[key]
        if (!text) {
            // Fallback to English if translation is missing
            return translations['en'][key] || key
        }
        return text
    }

    return (
        <LanguageContext.Provider
            value={{
                language,
                setLanguage,
                t,
            }}
        >
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}
