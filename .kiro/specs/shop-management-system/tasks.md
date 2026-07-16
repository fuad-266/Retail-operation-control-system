# Implementation Plan

## Phase 1 — Backend Foundation

- [ ] 1. Initialize Spring Boot 3 project and configure PostgreSQL
  - Create a new Spring Boot 3 project with dependencies: spring-boot-starter-web, spring-boot-starter-security, spring-boot-starter-data-jpa, spring-boot-starter-validation, postgresql, jjwt-api, jjwt-impl, bucket4j-core
  - Configure `application.yml` with PostgreSQL datasource, JPA/Hibernate DDL auto, and JWT secret loaded from environment variable `JWT_SECRET`
  - Verify the application starts and connects to the database
  - **Requirements**: 15.1, 15.5

- [ ] 2. Create all JPA entities and repositories
  - Create `User` entity with fields: id (UUID), fullName, phoneNumber (unique), email (nullable), password, role (enum: OWNER, CASHIER, SELLER, GOODS_STAFF, CUSTOMER), isActive (default true), preferredCurrency (default ETB), createdAt
  - Create `Product` entity with fields: id, name, description, category, price (KES), buyingPrice (nullable, KES), stockQuantity, minStockAlert, imageUrl, isActive, createdAt; add `@Version` field for optimistic locking
  - Create `SaleOrder` entity with fields: id, seller (FK→User), status (enum: RESERVED, PENDING, PAID, CANCELLED), totalAmount, reservedForName, reservedForPhone, reservationExpiresAt, cancellationReason, createdAt; with `@OneToMany` to SaleOrderItem
  - Create `SaleOrderItem` entity with fields: id, order (FK→SaleOrder), product (FK→Product), quantity, unitPrice
  - Create `Receipt` entity with fields: id, receiptNumber (unique), order (FK→SaleOrder nullable), onlineOrder (FK→OnlineOrder nullable), confirmedBy (FK→User), totalAmount, amount, paymentCurrency, paymentMethod (enum: CASH, BANK_TRANSFER, MOBILE_MONEY), exchangeRateUsed, status (enum: PAID, FULFILLED), createdAt
  - Create `OnlineOrder` entity with fields: id, customer (FK→User), status (enum: PENDING_PAYMENT, SCREENSHOT_SUBMITTED, PAYMENT_REJECTED, PAID, PROCESSING, READY, DELIVERED, CANCELLED), totalAmount, deliveryAddress, paymentScreenshotUrl, paymentReference, rejectionReason, createdAt; with `@OneToMany` to OnlineOrderItem
  - Create `OnlineOrderItem` entity with fields: id, onlineOrder, product, quantity, unitPrice
  - Create `ExchangeRateSetting` entity with fields: id, rate, label, setBy (FK→User), createdAt
  - Create `ShopSetting` entity with fields: id, settingKey (unique), settingValue, updatedBy (FK→User), updatedAt
  - Create Spring Data JPA repositories for all entities with necessary query methods
  - Seed default `ShopSetting` row: `receipt_show_item_prices = 'true'` on first start using `CommandLineRunner`
  - **Requirements**: 1.8, 3.8, 11.2, 12.3, 15.8

- [ ] 3. Implement JWT authentication (login only — no register)
  - Implement `AuthService.login()`: accept phoneNumber or email + password, verify BCrypt, check isActive, generate signed JWT (HS256) with claims: sub=userId, role, iat, exp (24h)
  - Implement `JwtFilter` extending `OncePerRequestFilter`: extract Bearer token, validate signature and expiry, set `SecurityContext`
  - Configure `SecurityFilterChain`: permit `POST /api/auth/login` only; require authentication on all other routes; explicitly return 404 for `POST /api/auth/register`
  - Implement rate limiting on `/api/auth/login`: max 5 requests per 60-second window per IP using bucket4j
  - **Requirements**: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 15.1

---

## Phase 2 — Products and Sale Orders

- [ ] 4. Implement Product CRUD API
  - Implement `ProductService` with methods: createProduct (OWNER), updateProduct (OWNER), deactivateProduct (OWNER — soft delete, return 404 if not found, 409 if already inactive), listActiveProducts, listLowStockProducts
  - Compute `price_etb = price / activeRate` rounded to 2 dp on every product query; include `current_exchange_rate` in every response
  - Create two DTO projections: `ProductOwnerDto` (includes buyingPrice, profit, margin) and `ProductPublicDto` (excludes buyingPrice); select projection at service layer based on caller's role
  - Implement `ProductController` mapping GET /api/products, POST /api/products, PUT /api/products/{id}, DELETE /api/products/{id}, GET /api/products/low-stock
  - Validate: price > 0, stockQuantity >= 0, buyingPrice >= 0 if provided, minStockAlert >= 0; return 400 on violations
  - **Requirements**: 3.1–3.9, 11.1, 11.8, 14.4

- [ ] 5. Implement Sale Order API (in-store)
  - Implement `SaleOrderService.createOrder()`: SELLER only; validate items non-empty, products active; snapshot unitPrice from product.price; compute totalAmount; set status=PENDING; do NOT deduct stock
  - Implement `SaleOrderService.createReservedOrder()`: SELLER only; validate all items have sufficient stock (reject entire request atomically if any item fails); deduct stock immediately; set status=RESERVED, reservationExpiresAt=NOW()+6h
  - Implement cancel: SELLER can cancel own PENDING or RESERVED orders only (403 for other sellers' orders, 404 for not found); restore stock if was RESERVED
  - Implement convert-to-pending: SELLER or CASHIER; validate order is currently RESERVED; update status=PENDING; no stock change; return 409 if not RESERVED
  - Implement list endpoints: GET /api/orders/my (SELLER — own only), GET /api/orders/pending (OWNER, CASHIER), GET /api/orders/reserved (OWNER, CASHIER)
  - **Requirements**: 4.1–4.10, 14.3

- [ ] 6. Implement Reservation Auto-Cancellation Scheduler
  - Implement `ReservationScheduler` bean with `@Scheduled(fixedRate = 900_000)` method `cancelExpiredReservations()`
  - Query all orders with status=RESERVED and reservationExpiresAt < NOW()
  - For each: restore stockQuantity for all items, set status=CANCELLED, set cancellationReason="Auto-cancelled: reservation expired after 6 hours"
  - Wrap entire batch in a single `@Transactional`; if transaction fails, roll back all changes
  - Enable scheduling with `@EnableScheduling` on the application class
  - **Requirements**: 6.1–6.5

---

## Phase 3 — Payment, Receipts, and Online Orders

- [ ] 7. Implement in-store payment confirmation and receipt generation
  - Implement `PaymentService.confirmPayment()`: OWNER or CASHIER only; order must be PENDING (409 if already PAID); validate stock for all items (409 with detail message if any item insufficient); deduct stock atomically; update order.status=PAID; record exchangeRateUsed from active rate
  - Generate receipt number: format `RCP-{YYYYMMDD}-{4-digit zero-padded sequence per day}` using a pessimistic DB lock to prevent collisions; sequence resets each calendar day
  - Compute receipt.amount: if paymentCurrency=KES → totalAmount; if ETB → totalAmount / exchangeRateUsed rounded to 2 dp
  - Do NOT include exchangeRateUsed in ReceiptDto response
  - Implement GET /api/receipts/{receiptNumber}: GOODS_STAFF, OWNER; return 404 if not found
  - Implement PUT /api/receipts/{receiptNumber}/fulfill: GOODS_STAFF only; must be status=PAID; set status=FULFILLED; return 409 "Receipt already fulfilled." if already FULFILLED
  - Apply receipt_show_item_prices shop setting: if false, omit unit prices from receipt line items in response
  - **Requirements**: 5.1–5.10, 12.4

- [ ] 8. Implement Online Order placement and screenshot upload
  - Implement `OnlineOrderService.createOrder()`: CUSTOMER only; validate items non-empty, delivery address present, products active; set status=PENDING_PAYMENT; include payment instructions from shop_settings in response
  - Implement `OnlineOrderService.submitPaymentScreenshot()`: CUSTOMER only, own order only; accept multipart/form-data with image file + optional paymentReference; validate MIME type (image/jpeg or image/png only) and file size (≤5 MB) server-side; generate UUID-based filename; store file outside web root; save paymentScreenshotUrl on order; update status=SCREENSHOT_SUBMITTED; clear rejectionReason if re-submitting; reject with 409 if order not in PENDING_PAYMENT or PAYMENT_REJECTED
  - Implement GET /api/mobile/orders/my (CUSTOMER — own only), GET /api/mobile/orders/{id} (CUSTOMER — own only, 403 for other customers' orders)
  - Implement GET /api/mobile/products (CUSTOMER — active products, no buyingPrice)
  - **Requirements**: 7.1–7.4, 8.1–8.7, 12.5

- [ ] 9. Implement online payment verification (cashier review)
  - Implement GET /api/orders/online/pending-verification: OWNER, CASHIER; return all OnlineOrders with status=SCREENSHOT_SUBMITTED
  - Implement GET /api/mobile/orders/{id}/screenshot: CASHIER, OWNER only (403 for others); return screenshot image file
  - Implement POST /api/payments/confirm-online/{orderId}: CASHIER, OWNER; order must be SCREENSHOT_SUBMITTED (409 otherwise); validate and deduct stock atomically; update onlineOrder.status=PAID; generate receipt; return ReceiptDto; support paymentMethod values CASH, BANK_TRANSFER, MOBILE_MONEY
  - Implement POST /api/payments/reject-online/{orderId}: CASHIER, OWNER; order must be SCREENSHOT_SUBMITTED; set status=PAYMENT_REJECTED, persist rejectionReason
  - Implement status progression endpoints for OWNER/CASHIER: PAID→PROCESSING, PROCESSING→READY, READY→DELIVERED; enforce state machine (reject invalid transitions with 409)
  - **Requirements**: 9.1–9.9, 10.1–10.2

---

## Phase 4 — User Management, Settings, and Reports

- [ ] 10. Implement User Management API
  - Implement POST /api/users (OWNER only): create any role account; hash password with BCrypt cost 10; validate required fields (fullName, phoneNumber, role); return 409 on duplicate phoneNumber; return 400 on missing required fields or unrecognised role
  - Implement POST /api/customers (OWNER and SELLER): always force role=CUSTOMER regardless of request body; same validation as above
  - Implement GET /api/users (OWNER only): return all users; SELLER and other non-OWNER roles get 403
  - Implement PUT /api/users/{id}/deactivate (OWNER only): set isActive=false; return 404 if not found; prevent OWNER from deactivating their own account (409)
  - Implement PUT /api/users/me/currency-preference (any authenticated): accept KES or ETB; return 400 for invalid values
  - **Requirements**: 1.1–1.10

- [ ] 11. Implement Exchange Rate and Shop Settings API
  - Implement POST /api/settings/exchange-rate (OWNER only): validate rate > 0 (400 otherwise); insert new ExchangeRateSetting record (append-only, never update); compute label e.g. "1 KES = X ETB"
  - Implement GET /api/settings/exchange-rate (all authenticated): return active rate (most recent record) plus staleRateWarning=true if createdAt < NOW()-24h; return 500 if no rate configured
  - Implement GET /api/settings/exchange-rate/history (OWNER only): return all records ordered by createdAt desc
  - Implement GET /api/settings (OWNER only): return all shop_settings key-value pairs
  - Implement PUT /api/settings (OWNER only): upsert key-value pairs in shop_settings; persist updatedBy and updatedAt
  - Add payment instructions settings keys: `payment_bank_account` and `payment_mobile_money` to shop_settings
  - **Requirements**: 11.2–11.7, 12.1–12.5

- [ ] 12. Implement Reports API
  - Implement GET /api/reports/sales?from=&to= (OWNER only): validate date params (400 if malformed or missing); return total orders count, total revenue (KES and ETB), breakdown by day; exclude CANCELLED orders
  - Implement GET /api/reports/revenue?from=&to= (OWNER only): return totalRevenueKes, totalRevenueEtb (using current rate), COGS (Σ buyingPrice×quantity for products where buyingPrice != null), profit, profitMarginPercent; exclude products with null buyingPrice from COGS silently
  - Implement GET /api/reports/sellers (OWNER only): return per-seller breakdown: sellerId, sellerName, orderCount, totalRevenue (KES and ETB)
  - Implement GET /api/reports/inventory (OWNER only): return all products with stockQuantity, minStockAlert, isLowStock flag
  - All report endpoints return 403 for non-OWNER roles
  - **Requirements**: 13.1–13.6

---

## Phase 5 — React Web App

- [ ] 13. Set up React web app project
  - Create React app with Vite, install and configure Tailwind CSS
  - Install dependencies: axios, react-router-dom v6, @tanstack/react-query, react-hook-form, recharts
  - Set up folder structure: pages/, components/, hooks/, services/, context/
  - Implement JWT storage in localStorage; implement axios interceptor to attach Bearer token to all requests and redirect to login on 401
  - Implement `AuthContext` with login/logout and user role state
  - Create `ProtectedRoute` component that checks role before rendering; redirect to login if no token
  - **Requirements**: 2.4, 2.5, 14.1

- [ ] 14. Build Login screen and role-based routing
  - Build `LoginPage`: form with phone/email + password fields; call POST /api/auth/login; store JWT and role; redirect to role-specific dashboard
  - No register link anywhere on the page
  - Implement role-based routing: OWNER → /owner, CASHIER → /cashier, SELLER → /seller, GOODS_STAFF → /goods
  - Implement shared `NavBar` with currency toggle (KES / ETB buttons); active button highlighted; switch updates displayed prices instantly; persist preference via PUT /api/users/me/currency-preference
  - **Requirements**: 1.1, 11.9

- [ ] 15. Build Owner dashboard and Products page
  - Build `OwnerDashboard`: cards for today's revenue, pending orders count, low stock count; display warning banner if exchange rate stale (staleRateWarning=true from API); quick nav links to all sections
  - Build `ProductsPage`: table with columns Name, Category, Buying Price (KES), Selling Price (KES + ETB), Profit, Margin%, Stock, Status; low-stock badge; Add / Edit / Deactivate buttons
  - Build `ProductForm` modal: fields name, category, buyingPrice (KES), price (KES), stockQuantity, minStockAlert, imageUrl; client-side validation matching backend rules
  - **Requirements**: 3.1–3.7, 11.6, 13.4

- [ ] 16. Build Seller dashboard
  - Build `SellerDashboard`: two sections — Create Order and My Orders
  - Create Order form: product search/select, quantity input, add to cart; cart summary with totals in selected currency; "Create Order" and "Reserve for Customer" buttons
  - Reserve form: same cart + customer name (required), customer phone (required)
  - My Orders list: table showing order status (PENDING / RESERVED / PAID / CANCELLED), cancellation reason if CANCELLED; Cancel button on PENDING and RESERVED orders; Convert to Sale button on RESERVED
  - Add Customer button: opens form with fullName (required), phoneNumber (required), email (optional), temporaryPassword (required); on success show confirmation with credentials
  - **Requirements**: 4.1–4.10, 1.3

- [ ] 17. Build Cashier dashboard
  - Build `CashierDashboard` with two tabs: Pending Orders and Reserved Orders
  - Pending tab: table of PENDING orders with seller name, items, total in selected currency; "Confirm Payment" button
  - Reserved tab: table of RESERVED orders with customer name, phone, expiry time; expired rows highlighted red with "Expired" badge; "Convert to Sale" button
  - Online Payments tab: list of SCREENSHOT_SUBMITTED online orders; click to open screenshot viewer; "Approve" and "Reject" buttons
  - Confirm Payment modal: payment method selector (Cash / Bank Transfer / Mobile Money), currency selector (KES / ETB), amount field; submit calls confirm endpoint
  - Reject modal: reason text field; submit calls reject endpoint
  - **Requirements**: 5.1, 9.1–9.5, 10.1

- [ ] 18. Build Goods Staff screen
  - Build `GoodsStaffPage`: search box for receipt number; on submit call GET /api/receipts/{receiptNumber}; display receipt details: items (with or without prices per setting), total in payment currency, status
  - "Release Goods" button: calls PUT /api/receipts/{receiptNumber}/fulfill; disabled if status is FULFILLED; show error message "Receipt already fulfilled." on 409
  - Show 404 error clearly if receipt not found
  - **Requirements**: 5.6–5.8

- [ ] 19. Build Owner Reports and Settings pages
  - Build `ReportsPage`: date range picker (from/to); Sales Summary table; Revenue table with COGS, profit, margin; Seller Leaderboard table; Inventory table with low-stock badges; Revenue by product bar chart using recharts
  - Build `SettingsPage` with three sections:
    - Receipt Settings: toggle for receipt_show_item_prices (ON/OFF)
    - Currency Settings: display current rate, last updated time, stale warning; "Update Rate" button opens form with live preview of conversion; rate history table
    - Payment Instructions: fields for bank account and mobile money number
    - Reservation Settings: display "Auto-cancel: 6 hours (fixed)"
  - Build `UserManagementPage`: Section 1 Staff table (CASHIER, SELLER, GOODS_STAFF) with Add/Edit/Deactivate; Section 2 Customer table with Created By column; Add Staff and Add Customer forms
  - **Requirements**: 12.1–12.5, 13.1–13.6, 11.2–11.6, 1.6

---

## Phase 6 — React Native Mobile App

- [ ] 20. Set up React Native (Expo) project
  - Create Expo project with expo-router v3 for file-based routing
  - Install: axios, @tanstack/react-query, expo-secure-store, expo-image-picker, expo-file-system
  - Implement JWT storage using expo-secure-store
  - Implement axios interceptor for Bearer token and 401 redirect
  - Implement auth context with login/logout
  - **Requirements**: 2.4, 15.4

- [ ] 21. Build Login screen (no register)
  - Build `LoginScreen`: phone number input + password input + "Log In" button
  - No register link; display static text: "Don't have an account? Contact the shop to get your login credentials."
  - On success store JWT in SecureStore, navigate to Home
  - **Requirements**: 1.1, 2.1

- [ ] 22. Build Product catalog screens
  - Build `HomeScreen`: search bar, horizontal category scroll, product grid (name, image, price in preferred currency, Add to Cart button)
  - Build `ProductDetailScreen`: product image, name, description, price in preferred currency, stock status, quantity selector, Add to Cart button
  - Currency toggle in header: switch between KES and ETB; updates all displayed prices using API-returned price_kes and price_etb values; persist via PUT /api/users/me/currency-preference
  - **Requirements**: 3.9, 7.1, 11.9

- [ ] 23. Build Cart, Checkout, and Payment screens
  - Build `CartScreen`: list of cart items with quantity controls and remove button; order total in preferred currency; delivery address text input; "Proceed to Checkout" button
  - Build `CheckoutScreen`: order summary showing total in both currencies; "Place Order" button calls POST /api/mobile/orders; on success show payment instructions from response
  - Build `PaymentSubmissionScreen`: display payment instructions (bank account / mobile money); "Upload Payment Screenshot" button opens image picker (camera or gallery); preview selected image; optional payment reference field; "Submit Payment" button uploads via POST /api/mobile/orders/{id}/submit-payment; show success screen with "Awaiting cashier verification" message
  - Show appropriate errors for invalid file type or size
  - **Requirements**: 8.1–8.6, 7.1, 7.4, 12.5

- [ ] 24. Build My Orders and Order Detail screens
  - Build `MyOrdersScreen`: list of customer's own orders with status badge; tap to navigate to detail
  - Build `OrderDetailScreen`: items ordered, total in preferred currency, payment method, current status with visual status tracker (PENDING_PAYMENT → SCREENSHOT_SUBMITTED → PAID → PROCESSING → READY → DELIVERED); receipt number if PAID; rejection reason and "Re-submit Screenshot" button if PAYMENT_REJECTED
  - **Requirements**: 7.2, 7.3, 10.1, 9.8, 9.9

---

## Phase 7 — Integration and Testing

- [ ] 25. Write unit and integration tests for backend
  - Unit tests (JUnit 5 + Mockito): AuthService (valid login, wrong password, inactive user, rate limit), SaleOrderService (PENDING creation — stock not touched, RESERVED creation — stock deducted, cancel RESERVED — stock restored, insufficient stock rejected atomically), PaymentService (confirm success, insufficient stock rollback, double confirm blocked), ReceiptService (fulfill PAID, 409 on double fulfill), ExchangeRateService (ETB conversion formula correctness, stale rate detection), ReservationScheduler (expired orders cancelled, stock restored, non-expired orders untouched)
  - Integration tests (Spring Boot Test + Testcontainers PostgreSQL): full in-store flow (create order → confirm → receipt → fulfill → 409 on second fulfill), full reservation flow (create reserved → scheduler cancels → stock restored), screenshot payment flow (place order → submit screenshot → cashier approves → receipt generated), role-based access matrix (each endpoint tested with each role — confirm 200 vs 403), receipt number uniqueness under concurrent requests
  - **Requirements**: 5.5, 5.8, 6.4, 8.5, 15.8

- [ ] 26. End-to-end integration and bug fixing
  - Connect React web app to running backend; verify all API calls use correct base URL and JWT headers
  - Connect React Native app to running backend; verify screenshot upload multipart form works on device
  - Test full in-store workflow end-to-end: SELLER creates order → CASHIER confirms → GOODS_STAFF releases
  - Test full online workflow: CUSTOMER places order → uploads screenshot → CASHIER approves → CUSTOMER sees receipt
  - Test reserved order expiry: create reservation → wait for scheduler → verify stock restored in DB
  - Test dual-currency display: update exchange rate → verify all price displays update immediately
  - Fix any bugs discovered during integration
  - **Requirements**: All
