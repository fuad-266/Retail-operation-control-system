# Retail Mobile App

React Native mobile app for customers to browse products and place online orders.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd retail-mobile
   npm install
   ```

2. **Update Backend URL**
   - Open `src/services/api.ts`
   - Replace `192.168.1.100:8080` with your backend server IP and port

3. **Run the App**
   ```bash
   # Start Metro bundler
   npm start

   # Run on Android (with device/emulator connected)
   npm run android

   # Run on iOS (Mac only, with simulator)
   npm run ios
   ```

## Features

### Implemented
- ✅ Login screen (customers only)
- ✅ Product browsing with search and categories
- ✅ Navigation structure
- ✅ JWT authentication with SecureStore
- ✅ API service setup

### To Be Implemented
- 🔄 Product detail screen
- 🔄 Shopping cart
- 🔄 Checkout flow
- 🔄 Payment screenshot upload
- 🔄 Order history
- 🔄 Order tracking

## Project Structure

```
retail-mobile/
├── src/
│   ├── context/
│   │   └── AuthContext.tsx      # Authentication state management
│   ├── navigation/
│   │   └── AppStack.tsx         # Navigation configuration
│   ├── screens/
│   │   ├── LoginScreen.tsx      # Customer login
│   │   ├── HomeScreen.tsx       # Product browsing
│   │   └── ...                  # Other screens (placeholders)
│   └── services/
│       ├── api.ts               # Axios configuration
│       ├── auth.service.ts      # Authentication API
│       ├── products.service.ts  # Products API
│       └── orders.service.ts    # Orders API
├── App.tsx                      # Root component
├── package.json
└── app.json                     # Expo configuration
```

## Customer Flow

1. **Login** → Customer enters phone + password
2. **Browse** → View products with search/filter
3. **Cart** → Add products to cart
4. **Checkout** → Enter delivery address
5. **Payment** → Upload payment screenshot
6. **Orders** → Track order status

## Notes

- Only customers can access the mobile app
- Staff roles (OWNER, CASHIER, SELLER, GOODS_STAFF) are redirected to use the web interface
- All API calls include JWT authentication
- Uses Expo SecureStore for secure token storage