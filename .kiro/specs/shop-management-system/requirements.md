# Requirements Document

## Introduction

The Shop Management System is a dual-application platform consisting of a **Shop Management Web App** (React.js + Tailwind) and a **Customer E-Commerce Mobile App** (React Native / Expo), both served by a single **Spring Boot 3 REST API** backed by **PostgreSQL 15**. The system supports an in-store retail workflow (Seller → Cashier/Owner → Goods Staff) as well as an online ordering workflow with a screenshot-based manual payment verification flow (no automated payment gateway). Five roles govern access: OWNER, CASHIER, SELLER, GOODS_STAFF, and CUSTOMER. All monetary values are stored in KES and converted to ETB at display time using a configurable exchange rate.

---

## Glossary

- **System**: The Spring Boot 3 REST API backend shared by both client applications.
- **Web_App**: The React.js shop management front-end used by staff roles.
- **Mobile_App**: The React Native / Expo application used exclusively by CUSTOMER role.
- **OWNER**: A staff user with full administrative privileges.
- **CASHIER**: A staff user who confirms payments and issues receipts.
- **SELLER**: A staff user who creates in-store sale orders and reservations.
- **GOODS_STAFF**: A staff user who verifies receipts and releases goods.
- **CUSTOMER**: An end-user who browses products and places online orders via the Mobile_App.
- **Auth_Module**: The authentication component of the System.
- **Product_Module**: The product catalogue management component.
- **Order_Module**: The in-store sale order management component.
- **Payment_Module**: The in-store payment confirmation and receipt generation component.
- **Online_Order_Module**: The customer-facing e-commerce order and screenshot-payment component.
- **Report_Module**: The financial and inventory analytics component (OWNER only).
- **Settings_Module**: The exchange rate and shop configuration management component.
- **User_Module**: The user account management component.
- **Scheduler**: The background job component that auto-cancels expired reservations.
- **KES**: Kenyan Shilling — the canonical storage currency.
- **ETB**: Ethiopian Birr — the display currency computed from KES using the active exchange rate.
- **Exchange_Rate**: The divisor applied in the formula `ETB = KES ÷ rate`; stored as an append-only record.
- **Receipt**: A digital payment confirmation document with a unique number, status PAID or FULFILLED.
- **SaleOrder**: An in-store order created by a SELLER; statuses: PENDING, RESERVED, PAID, CANCELLED.
- **OnlineOrder**: An order placed by a CUSTOMER via Mobile_App; statuses: PENDING_PAYMENT, SCREENSHOT_SUBMITTED, PAYMENT_REJECTED, PAID, PROCESSING, READY, DELIVERED, CANCELLED.
- **Reservation**: A SaleOrder with status RESERVED that holds stock for up to 6 hours.
- **Screenshot**: A JPG or PNG image uploaded by a CUSTOMER as proof of external payment.
- **BCrypt**: The password hashing algorithm used for credential storage.
- **JWT**: JSON Web Token used for stateless authentication on every protected request.

---

## Requirements

### Requirement 1: User Account Management

**User Story:** As an OWNER, I want to create and manage staff and customer accounts, so that only authorised users can access the system in their designated role.

#### Acceptance Criteria

1. THE System SHALL NOT expose a public self-registration endpoint; `POST /api/auth/register` SHALL return `404 Not Found` for all callers.
2. WHEN an OWNER submits a valid create-user request to `POST /api/users`, THE User_Module SHALL create a new account with the specified role (OWNER, CASHIER, SELLER, GOODS_STAFF, or CUSTOMER), hash the password with BCrypt, and return the new `UserDto`.
3. WHEN a SELLER submits a create-customer request to `POST /api/customers`, THE User_Module SHALL create the account with `role` forced to CUSTOMER regardless of any role value in the request body.
4. WHEN an OWNER submits a create-customer request to `POST /api/customers`, THE User_Module SHALL create the account with `role` forced to CUSTOMER.
5. WHEN a user with role SELLER calls `GET /api/users`, THE User_Module SHALL return `403 Forbidden`.
6. WHEN an OWNER calls `PUT /api/users/{id}/deactivate`, THE User_Module SHALL set the target user's `is_active` to `false`.
7. WHEN a deactivated user (`is_active = false`) attempts to log in, THE Auth_Module SHALL return `403 Forbidden`.
8. THE User_Module SHALL store passwords exclusively as BCrypt hashes; plaintext passwords SHALL NOT be persisted.
9. THE System SHALL enforce that `phoneNumber` is unique across all user accounts; attempting to create a duplicate phone number SHALL return `409 Conflict`.
10. WHEN any authenticated user calls `PUT /api/users/me/currency-preference` with a valid currency (`KES` or `ETB`), THE User_Module SHALL update that user's `preferred_currency` field.

---

### Requirement 2: Authentication and Session Management

**User Story:** As a user, I want to log in securely with my phone number or email and receive a JWT, so that I can access system features appropriate for my role.

#### Acceptance Criteria

1. WHEN a user submits valid credentials (phone number or email + matching password) for an active account, THE Auth_Module SHALL return an `AuthResponse` containing a signed JWT (HS256) and the user's `role`.
2. THE Auth_Module SHALL include `sub` (userId), `role`, `iat`, and `exp` claims in every issued JWT payload.
3. IF the provided credentials do not match any active user, THEN THE Auth_Module SHALL return `401 Unauthorized` with the message `"Invalid credentials"` without indicating which field failed.
4. WHEN a valid JWT is presented on a protected request, THE System SHALL resolve the caller's identity and role from the token without querying the database for authentication.
5. WHEN an expired or tampered JWT is presented, THE System SHALL return `401 Unauthorized` with the message `"Token invalid or expired"`.
6. WHEN a caller exceeds 5 login attempts per minute from the same IP address, THE Auth_Module SHALL return `429 Too Many Requests` for subsequent attempts until the window resets.

---

### Requirement 3: Product Catalogue Management

**User Story:** As an OWNER, I want to manage the product catalogue with dual-currency prices and buying cost, so that staff can reference accurate prices and I can track profitability.

#### Acceptance Criteria

1. WHEN an OWNER calls `POST /api/products` with valid product data, THE Product_Module SHALL persist the product with `price` stored in KES and return a `ProductResponseDto` that includes `price_kes`, `price_etb`, `buying_price`, `stock_quantity`, `min_stock_alert`, and `current_exchange_rate`.
2. WHEN any authenticated user calls `GET /api/products`, THE Product_Module SHALL return a list of active products; the response for callers with role other than OWNER SHALL omit `buying_price`.
3. WHILE the caller's role is OWNER, THE Product_Module SHALL include `buying_price` in every product response.
4. THE Product_Module SHALL compute `price_etb = price_kes / active_exchange_rate` rounded to 2 decimal places on every product query.
5. WHEN an OWNER calls `PUT /api/products/{id}` with valid data, THE Product_Module SHALL update the product and return the updated `ProductResponseDto`.
6. WHEN an OWNER calls `DELETE /api/products/{id}`, THE Product_Module SHALL perform a soft delete by setting `is_active = false`; the product SHALL no longer appear in standard product listings.
7. WHEN an OWNER calls `GET /api/products/low-stock`, THE Product_Module SHALL return all products where `stock_quantity <= min_stock_alert`.
8. THE System SHALL enforce `price > 0` and `stock_quantity >= 0` on all product writes; violations SHALL return `400 Bad Request`.
9. WHEN a CUSTOMER calls `GET /api/mobile/products`, THE Product_Module SHALL return only active products without `buying_price`, formatted for mobile display.

---

### Requirement 4: In-Store Sale Order Lifecycle

**User Story:** As a SELLER, I want to create and manage in-store sale orders, so that customers can be served and their purchases tracked through to payment and goods release.

#### Acceptance Criteria

1. WHEN a SELLER calls `POST /api/orders` with a non-empty list of valid order items, THE Order_Module SHALL create a `SaleOrder` with `status = PENDING`, snapshot `unit_price` from `product.price` at creation time, compute `totalAmount = Σ(unit_price × quantity)`, and NOT deduct stock.
2. WHEN a SELLER calls `POST /api/orders/reserve` and all items have sufficient stock, THE Order_Module SHALL create a `SaleOrder` with `status = RESERVED`, deduct stock immediately for each item, and set `reservationExpiresAt = NOW() + 6 hours`.
3. IF any item in a reservation request has `product.stockQuantity < item.quantity`, THEN THE Order_Module SHALL reject the entire request with `409 Conflict` and leave all stock quantities unchanged.
4. WHEN a SELLER calls `PUT /api/orders/{id}/cancel` on their own PENDING or RESERVED order, THE Order_Module SHALL set `status = CANCELLED`; IF the order was RESERVED, THE Order_Module SHALL restore `stock_quantity` for each item.
5. WHEN a SELLER calls `GET /api/orders/my`, THE Order_Module SHALL return only the orders created by that SELLER.
6. WHEN a CASHIER or OWNER calls `GET /api/orders/pending`, THE Order_Module SHALL return all orders with `status = PENDING`.
7. WHEN a CASHIER or OWNER calls `GET /api/orders/reserved`, THE Order_Module SHALL return all orders with `status = RESERVED`.
8. WHEN a SELLER or CASHIER calls `PUT /api/orders/{id}/convert-to-pending` on a RESERVED order, THE Order_Module SHALL update `status = PENDING` without modifying stock quantities.
9. THE System SHALL enforce that only a SELLER can create sale orders; any other role calling `POST /api/orders` SHALL receive `403 Forbidden`.
10. THE System SHALL enforce that a SELLER can only cancel their own orders; attempting to cancel another seller's order SHALL return `403 Forbidden`.

---

### Requirement 5: In-Store Payment Confirmation and Receipt Generation

**User Story:** As a CASHIER or OWNER, I want to confirm payment for a pending order and generate a digital receipt, so that Goods Staff can verify and release the goods.

#### Acceptance Criteria

1. WHEN a CASHIER or OWNER calls `POST /api/payments/confirm/{orderId}` for an order with `status = PENDING`, THE Payment_Module SHALL verify stock availability for all items, deduct stock atomically, update `order.status = PAID`, generate a unique receipt number in the format `RCP-{YYYYMMDD}-{4-digit-zero-padded-sequence}`, persist the receipt with `status = PAID`, and return the `ReceiptDto`.
2. IF any item in the order has insufficient stock at confirmation time, THEN THE Payment_Module SHALL roll back the entire transaction, leave `order.status = PENDING`, and return `409 Conflict` with the message `"Insufficient stock for product: [name]. Available: [n], Requested: [m]"`.
3. THE Payment_Module SHALL record `exchange_rate_used` (the active rate at the time of confirmation) in the receipt row for audit; this field SHALL NOT appear in the `ReceiptDto` response.
4. WHEN `payment_currency = KES`, THE Payment_Module SHALL set `receipt.amount = order.totalAmount`; WHEN `payment_currency = ETB`, THE Payment_Module SHALL set `receipt.amount = order.totalAmount / exchange_rate_used` rounded to 2 decimal places.
5. THE System SHALL ensure receipt numbers are globally unique; concurrent generation of receipt numbers SHALL use a database-level lock or sequence to prevent collisions.
6. WHEN a GOODS_STAFF member calls `GET /api/receipts/{receiptNumber}`, THE Payment_Module SHALL return the receipt with its items and status.
7. WHEN a GOODS_STAFF member calls `PUT /api/receipts/{receiptNumber}/fulfill` on a receipt with `status = PAID`, THE Payment_Module SHALL update `status = FULFILLED` and return the updated `ReceiptDto`.
8. IF a GOODS_STAFF member calls `PUT /api/receipts/{receiptNumber}/fulfill` on a receipt with `status = FULFILLED`, THEN THE Payment_Module SHALL return `409 Conflict` with the message `"Receipt already fulfilled."` and leave the receipt unchanged.
9. THE Payment_Module SHALL prevent double-confirmation; calling `POST /api/payments/confirm/{orderId}` on an order already in `PAID` status SHALL return `409 Conflict`.
10. THE Receipt SHALL display item prices only when the `receipt_show_item_prices` shop setting is `true`.

---

### Requirement 6: Reservation Auto-Cancellation

**User Story:** As a system operator, I want expired reservations to be automatically cancelled and stock restored, so that inventory is never permanently locked by uncollected reservations.

#### Acceptance Criteria

1. THE Scheduler SHALL execute `cancelExpiredReservations()` at a fixed interval of 15 minutes.
2. WHEN the Scheduler runs, THE Scheduler SHALL identify all orders with `status = RESERVED AND reservationExpiresAt < NOW()`.
3. FOR each expired reservation found, THE Scheduler SHALL restore `stock_quantity` for every order item (`product.stockQuantity += item.quantity`), set `order.status = CANCELLED`, and set `order.cancellationReason = "Auto-cancelled: reservation expired after 6 hours"`.
4. THE Scheduler SHALL process all expired reservations in a single database transaction; IF the transaction fails, no partial state changes SHALL be committed.
5. WHEN a SELLER or CASHIER attempts to convert or confirm an order that the Scheduler has just cancelled, THE System SHALL return `409 Conflict` with the message `"Order is no longer in RESERVED/PENDING status"`.

---

### Requirement 7: Online Order Placement (Customer Mobile App)

**User Story:** As a CUSTOMER, I want to place orders through the mobile app and receive payment instructions, so that I can purchase products and pay externally.

#### Acceptance Criteria

1. WHEN a CUSTOMER calls `POST /api/mobile/orders` with a non-empty list of valid items, THE Online_Order_Module SHALL create an `OnlineOrder` with `status = PENDING_PAYMENT`, compute `totalAmount` in KES, and return the order details including payment instructions (bank account or mobile money number from shop settings).
2. THE Online_Order_Module SHALL ensure a CUSTOMER sees only their own orders; `GET /api/mobile/orders/my` SHALL return only orders where `onlineOrder.customer.id = authenticatedUser.id`.
3. WHEN a CUSTOMER calls `GET /api/mobile/orders/{id}` for an order belonging to a different customer, THE Online_Order_Module SHALL return `403 Forbidden`.
4. THE Online_Order_Module SHALL accept delivery address as part of the order creation request.

---

### Requirement 8: Screenshot-Based Payment Submission

**User Story:** As a CUSTOMER, I want to upload a screenshot of my external payment as proof, so that a cashier can verify and approve my online order.

#### Acceptance Criteria

1. WHEN a CUSTOMER calls `POST /api/mobile/orders/{id}/submit-payment` with a valid image file and optional payment reference, THE Online_Order_Module SHALL store the file with a UUID-based filename, save `paymentScreenshotUrl` on the order, update `status = SCREENSHOT_SUBMITTED`, and return the updated order.
2. THE System SHALL accept only `image/jpeg` and `image/png` files for screenshot upload; other formats SHALL return `400 Bad Request` with the message `"Invalid file. Please upload a JPG or PNG image under 5MB."`.
3. THE System SHALL enforce a maximum file size of 5 MB for screenshot uploads; files exceeding this limit SHALL return `400 Bad Request` with the same message as above.
4. WHEN a CUSTOMER re-submits a screenshot after a `PAYMENT_REJECTED` status, THE Online_Order_Module SHALL overwrite the previous screenshot URL, update `status = SCREENSHOT_SUBMITTED`, and clear `rejectionReason`.
5. IF a CUSTOMER calls `POST /api/mobile/orders/{id}/submit-payment` for an order not in `PENDING_PAYMENT` or `PAYMENT_REJECTED` status, THEN THE Online_Order_Module SHALL return `409 Conflict`.
6. THE System SHALL use UUID-based filenames for stored screenshots to prevent path traversal attacks; original customer filenames SHALL NOT be used as storage keys.
7. THE System SHALL require CASHIER or OWNER role to access `GET /api/mobile/orders/{id}/screenshot`; unauthenticated or lower-privileged callers SHALL receive `403 Forbidden`.

---

### Requirement 9: Online Payment Verification by Cashier

**User Story:** As a CASHIER or OWNER, I want to review submitted payment screenshots and approve or reject them, so that only verified payments result in fulfilled orders.

#### Acceptance Criteria

1. WHEN a CASHIER or OWNER calls `GET /api/orders/online/pending-verification`, THE Online_Order_Module SHALL return all online orders with `status = SCREENSHOT_SUBMITTED`.
2. WHEN a CASHIER or OWNER calls `GET /api/mobile/orders/{id}/screenshot`, THE Online_Order_Module SHALL return the screenshot image file for the specified order.
3. WHEN a CASHIER or OWNER calls `POST /api/payments/confirm-online/{orderId}` for an order with `status = SCREENSHOT_SUBMITTED`, THE Online_Order_Module SHALL verify stock for all items, deduct stock atomically, update `onlineOrder.status = PAID`, generate a receipt, and return the `ReceiptDto`.
4. IF any item in an online order has insufficient stock at online payment confirmation, THEN THE Online_Order_Module SHALL roll back the transaction and return `409 Conflict`.
5. WHEN a CASHIER or OWNER calls `POST /api/payments/reject-online/{orderId}` with a reason, THE Online_Order_Module SHALL update `onlineOrder.status = PAYMENT_REJECTED` and persist `rejectionReason`.
6. IF `POST /api/payments/confirm-online/{orderId}` or `POST /api/payments/reject-online/{orderId}` is called for an order not in `SCREENSHOT_SUBMITTED` status, THEN THE System SHALL return `409 Conflict`.
7. THE Online_Order_Module SHALL support `payment_method` values of `CASH`, `BANK_TRANSFER`, and `MOBILE_MONEY` for online payment confirmation.
8. WHEN an online order status transitions to `PAID`, THE System SHALL send the CUSTOMER a push notification with the receipt number.
9. WHEN an online order status transitions to `PAYMENT_REJECTED`, THE System SHALL send the CUSTOMER a push notification with the rejection reason.

---

### Requirement 10: Online Order Fulfilment Progression

**User Story:** As an OWNER or CASHIER, I want to progress a paid online order through processing, readiness, and delivery stages, so that the customer is kept informed of their order status.

#### Acceptance Criteria

1. THE System SHALL enforce the following valid status transitions for OnlineOrder: `PENDING_PAYMENT → SCREENSHOT_SUBMITTED`, `SCREENSHOT_SUBMITTED → PAID`, `SCREENSHOT_SUBMITTED → PAYMENT_REJECTED`, `PAYMENT_REJECTED → SCREENSHOT_SUBMITTED`, `PAID → PROCESSING`, `PROCESSING → READY`, `READY → DELIVERED`, and any non-terminal status → `CANCELLED`.
2. WHEN an online order reaches `DELIVERED` or `CANCELLED`, THE System SHALL treat it as a terminal state; no further status transitions SHALL be allowed.

---

### Requirement 11: Dual-Currency Display and Exchange Rate Management

**User Story:** As an OWNER, I want to manage the exchange rate and have all prices displayed in both KES and ETB, so that staff and customers always see accurate local prices.

#### Acceptance Criteria

1. THE Settings_Module SHALL compute `price_etb = price_kes / active_exchange_rate` rounded to 2 decimal places for every product and order total display.
2. WHEN an OWNER calls `POST /api/settings/exchange-rate` with a valid rate (`rate > 0`), THE Settings_Module SHALL insert a new `ExchangeRateSetting` record (append-only) and treat it as the new active rate; historical records SHALL be preserved.
3. THE Settings_Module SHALL define the active exchange rate as the most recently inserted record.
4. WHEN any authenticated user calls `GET /api/settings/exchange-rate`, THE Settings_Module SHALL return the current active rate.
5. WHEN an OWNER calls `GET /api/settings/exchange-rate/history`, THE Settings_Module SHALL return all historical exchange rate records.
6. WHEN the active exchange rate was last set more than 24 hours ago, THE System SHALL include a `staleRateWarning: true` flag in relevant API responses; this flag SHALL NOT block any functionality.
7. IF no exchange rate has been configured in the system, THEN THE System SHALL throw an `IllegalStateException` and return `500 Internal Server Error` for any request that requires currency conversion.
8. THE Product_Module SHALL include `current_exchange_rate` in every product response to allow clients to display the rate applied.
9. WHILE the caller is OWNER, THE System SHALL display monetary values in both KES and ETB; other roles SHALL display the value in the currency matching their `preferred_currency` setting.

---

### Requirement 12: Shop Settings Management

**User Story:** As an OWNER, I want to configure shop-level settings such as receipt format and payment instructions, so that the system behaviour matches my shop's operational policies.

#### Acceptance Criteria

1. WHEN an OWNER calls `PUT /api/settings` with a valid key-value map, THE Settings_Module SHALL persist each setting in the `shop_settings` table, keyed by `settingKey`.
2. WHEN an OWNER calls `GET /api/settings`, THE Settings_Module SHALL return all current shop settings.
3. THE System SHALL seed a default value of `receipt_show_item_prices = 'true'` on first start.
4. WHEN `receipt_show_item_prices = 'false'`, THE Payment_Module SHALL omit line-item prices from all generated receipts.
5. THE Online_Order_Module SHALL include payment instructions (bank account or mobile money number) sourced from `shop_settings` in every `OnlineOrder` creation response.

---

### Requirement 13: Financial and Inventory Reports

**User Story:** As an OWNER, I want access to sales, revenue, and inventory reports, so that I can monitor business performance and make informed decisions.

#### Acceptance Criteria

1. WHEN an OWNER calls `GET /api/reports/sales?from=&to=`, THE Report_Module SHALL return a sales summary covering the specified date range.
2. WHEN an OWNER calls `GET /api/reports/revenue?from=&to=`, THE Report_Module SHALL return total revenue in both KES and ETB, COGS (`Σ buying_price × quantity`), gross profit, and profit margin percentage for the specified date range.
3. WHEN an OWNER calls `GET /api/reports/sellers`, THE Report_Module SHALL return a per-seller performance breakdown.
4. WHEN an OWNER calls `GET /api/reports/inventory`, THE Report_Module SHALL return current stock levels for all products.
5. THE Report_Module SHALL be accessible exclusively to the OWNER role; any other role calling report endpoints SHALL receive `403 Forbidden`.
6. IF `buying_price` is null for a product, THEN THE Report_Module SHALL exclude that product from COGS and profit calculations without returning an error.

---

### Requirement 14: Role-Based Access Control

**User Story:** As a system administrator, I want all endpoints to enforce strict role-based access, so that users can only perform actions permitted by their role.

#### Acceptance Criteria

1. THE System SHALL enforce role checks at the service layer using `@PreAuthorize` annotations in addition to any URL-level filters; a misconfigured URL filter SHALL NOT bypass service-level security.
2. WHEN a user calls an endpoint for which their role is not authorised, THE System SHALL return `403 Forbidden` with the message `"Access denied"`.
3. THE System SHALL enforce the following endpoint-role matrix:
   - `POST /api/orders`, `POST /api/orders/reserve`: SELLER only
   - `POST /api/payments/confirm/{orderId}`, `POST /api/payments/confirm-online/{orderId}`, `POST /api/payments/reject-online/{orderId}`: OWNER, CASHIER
   - `PUT /api/receipts/{receiptNumber}/fulfill`: GOODS_STAFF only
   - `GET /api/reports/**`: OWNER only
   - `POST /api/settings/exchange-rate`, `PUT /api/settings`: OWNER only
   - `POST /api/users`: OWNER only
   - `POST /api/customers`: OWNER, SELLER
   - `POST /api/mobile/orders`, `POST /api/mobile/orders/{id}/submit-payment`: CUSTOMER only
4. THE System SHALL use two separate DTO projections for products — `ProductOwnerDto` (includes `buying_price`) and `ProductPublicDto` (excludes `buying_price`) — never relying on runtime conditional nulling of the field.

---

### Requirement 15: Security and Infrastructure

**User Story:** As a system operator, I want the application to follow security best practices, so that user data and business information are protected against common threats.

#### Acceptance Criteria

1. THE System SHALL store the JWT signing secret exclusively as an environment variable (`JWT_SECRET`); it SHALL NOT appear in source code or configuration files committed to version control.
2. THE System SHALL use a BCrypt cost factor of at least 10 for all password hashes.
3. THE System SHALL validate screenshot MIME type (`image/jpeg` or `image/png`) and file size (≤ 5 MB) server-side before storing the file.
4. THE System SHALL store screenshots outside the public web root using UUID-based filenames; serving them SHALL require CASHIER or OWNER authentication.
5. THE System SHALL use exclusively Spring Data JPA / JPQL / named parameters for all database queries; string-concatenated SQL SHALL NOT be used.
6. THE System SHALL mask `password`, `phone_number`, and `payment_reference` fields in all application log outputs.
7. THE System SHALL configure CORS to allow only the specific production domain of the React Web_App; wildcard `*` origins SHALL NOT be used in production.
8. THE System SHALL use optimistic locking (`@Version` on the `Product` entity) to handle concurrent stock deductions; a detected conflict SHALL trigger one automatic retry before returning `409 Conflict`.
9. WHEN rate limiting is active and a caller exceeds 5 login requests per minute, THE Auth_Module SHALL return `429 Too Many Requests`.

---

### Requirement 16: Parser and Serializer Correctness (Data Transfer)

**User Story:** As a developer, I want all data serialisation and deserialisation between client and server to be reliable and reversible, so that no data is lost or corrupted in transit.

#### Acceptance Criteria

1. WHEN the System serialises a domain object (Product, SaleOrder, OnlineOrder, Receipt, User) to a JSON response DTO, THE System SHALL include all required fields as specified in the interface contracts in the design document.
2. WHEN the System deserialises an incoming JSON request body, THE System SHALL validate all required fields and return `400 Bad Request` with field-level error details for any constraint violations.
3. FOR ALL valid domain objects, serialising to JSON and then deserialising back SHALL produce an equivalent object (round-trip property).
4. THE System SHALL use consistent date-time serialisation format (ISO 8601) across all endpoints and both client applications.
