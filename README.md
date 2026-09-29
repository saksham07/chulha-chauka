# Chulha Chauka

React + Vite frontend + Spring Boot backend for the Chulha Chauka pure-vegetarian cloud kitchen in Saharsa, Bihar.

---

## Phase 1 — Frontend (Complete)

### Included
- Homely earthy visual design (DM Sans + Playfair Display + Kalam)
- Responsive desktop/mobile single-page app
- Sticky navbar with scroll-spy active-link highlighting
- Menu categories (Combos, Thali, Meals, Starter, Main Course, Bread, Rice, Snacks, Desserts)
- Full menu grid with live search and category filtering
- Bestseller badges, veg dot indicators
- Add-to-cart with in-card quantity stepper
- Cart drawer: per-item subtotal, delivery fee, total
- 3-step checkout modal: Delivery details → Order review → Payment method selection (UPI / COD / Card)
- About / Reviews / Contact sections
- Local prototype imagery (replace with real photos before launch)

### Run locally

Requirements: Node.js 18+.

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

### Build for production

```bash
npm run build
npm run preview
```

> **Important:** The food images included here are prototype/mockup imagery. Replace them with real Chulha Chauka food photographs before launch.

---

## Phase 2 — Backend Implementation Plan

> **Status:** Planning. This section is the authoritative implementation guide for the Spring Boot backend.

---

## 1. Frontend Analysis Summary

### Pages / Sections Observed

| Section | ID | Backend Implications |
|---|---|---|
| Hero | `#home` | Static — no backend needed |
| Menu + Search | `#menu` | `GET /api/menu/items`, category & search filters |
| Cart drawer | (state) | Client-side in Phase 1; server-side cart in Phase 2 |
| Checkout modal | (modal) | `POST /api/orders`, `POST /api/payments/create-order` |
| About | `#about` | Static |
| Reviews | `#reviews` | Future: `GET /api/reviews`, `POST /api/reviews` |
| Contact / CTA | `#contact` | Static |

### Components and Data Fields Observed

**Menu item** (from `src/main.jsx`):
```
id, name, desc, price, category, image (URL), best (boolean)
```

**Cart item** (client state):
```
id, name, price, qty, image
```

**Checkout form fields:**
```
name, phone (10-digit), address, pincode (6-digit), note (optional)
```

**Payment methods presented:**
```
UPI / QR Code | Cash on Delivery | Debit / Credit Card (Razorpay)
```

**Delivery fee:** ₹30 (currently hardcoded — must come from backend config)

### Frontend → Backend Gaps Identified
- Menu data is currently hardcoded in `main.jsx` — must be fetched from API
- Cart state is in-memory — must be persisted server-side for logged-in users
- Payment is a UI placeholder — Razorpay server order creation required
- Login button exists in code (hidden) — auth system needed for both roles
- No order history page yet — needs `GET /api/orders/me`
- No admin panel yet — separate route/app needed

---

## 2. Recommended Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| **Backend framework** | Spring Boot 3.x (Java 25) | Mentioned in project README; mature, production-ready, strong security ecosystem |
| **Database** | PostgreSQL 16 | Relational, strong JSON support, widely hosted |
| **ORM** | Spring Data JPA + Hibernate | Native Spring integration |
| **Auth** | Spring Security + JWT (stateless) | Scales horizontally; no session storage needed |
| **Password hashing** | BCrypt (Spring Security default) | Industry standard |
| **Payment** | Razorpay Java SDK | Explicitly required |
| **File storage** | Cloudinary or AWS S3 (via Spring) | Menu item images |
| **API style** | REST JSON | Matches frontend fetch pattern |
| **Validation** | Jakarta Bean Validation (Hibernate Validator) | Declarative, keeps controllers clean |
| **Logging** | SLF4J + Logback | Spring Boot default |
| **Testing** | JUnit 5, Mockito, Spring Boot Test | Standard Spring testing stack |
| **Migration** | Flyway | Version-controlled schema changes |
| **Env config** | `application.yml` + `.env` via Spring dotenv | Keeps secrets out of source |
| **Frontend** | React + Vite (existing) | No change |

---

## 3. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         BROWSER                             │
│  React + Vite SPA                                           │
│  ┌──────────┐  ┌─────────┐  ┌──────────────────────────┐  │
│  │  Menu UI │  │ Cart UI │  │ Checkout / Razorpay flow  │  │
│  └────┬─────┘  └────┬────┘  └────────────┬─────────────┘  │
└───────┼─────────────┼────────────────────┼─────────────────┘
        │  REST/JSON  │                    │
        ▼             ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   Spring Boot API Server                    │
│                                                             │
│  AuthController  MenuController  CartController             │
│  OrderController PaymentController AdminController          │
│                                                             │
│  Spring Security (JWT filter)  ──  Role: USER / ADMIN       │
│  Service layer  ──  Business logic                          │
│  Repository layer  ──  Spring Data JPA                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
              ┌─────────────┼───────────────┐
              ▼             ▼               ▼
        PostgreSQL     Cloudinary /      Razorpay
        (primary DB)   S3 (images)       (payments)
                                          │
                                          │ Webhook POST
                                          ▼
                               /api/payments/webhook
                               (signature verify →
                                update order status)
```

---

## 4. Database Schema

### 4.1 `users`
```sql
id            BIGSERIAL PRIMARY KEY,
name          VARCHAR(120) NOT NULL,
phone         VARCHAR(15)  UNIQUE NOT NULL,   -- primary login identifier
email         VARCHAR(200) UNIQUE,
password_hash VARCHAR(255) NOT NULL,
role          VARCHAR(20)  NOT NULL DEFAULT 'USER',  -- USER | ADMIN
created_at    TIMESTAMPTZ  DEFAULT now(),
updated_at    TIMESTAMPTZ  DEFAULT now()
```

### 4.2 `categories`
```sql
id         BIGSERIAL PRIMARY KEY,
name       VARCHAR(80) UNIQUE NOT NULL,   -- Combos, Thali, Meals …
icon       VARCHAR(20),                   -- emoji
sort_order INT DEFAULT 0,
active     BOOLEAN DEFAULT true
```

### 4.3 `menu_items`
```sql
id           BIGSERIAL PRIMARY KEY,
category_id  BIGINT REFERENCES categories(id),
name         VARCHAR(200) NOT NULL,
description  TEXT,
price        INT NOT NULL,               -- in paise (₹1 = 100 paise) OR rupees integer — choose one, document it
image_url    TEXT,
is_veg       BOOLEAN DEFAULT true,
is_available BOOLEAN DEFAULT true,
is_bestseller BOOLEAN DEFAULT false,
sort_order   INT DEFAULT 0,
created_at   TIMESTAMPTZ DEFAULT now(),
updated_at   TIMESTAMPTZ DEFAULT now()
```

> **Assumption:** All items are pure-veg (`is_veg = true` always). Column kept for future flexibility.

### 4.4 `addresses`
```sql
id         BIGSERIAL PRIMARY KEY,
user_id    BIGINT REFERENCES users(id) ON DELETE CASCADE,
name       VARCHAR(120),
phone      VARCHAR(15),
line1      TEXT NOT NULL,
pincode    VARCHAR(10) NOT NULL,
is_default BOOLEAN DEFAULT false,
created_at TIMESTAMPTZ DEFAULT now()
```

### 4.5 `carts`
```sql
id         BIGSERIAL PRIMARY KEY,
user_id    BIGINT REFERENCES users(id) ON DELETE CASCADE UNIQUE,
updated_at TIMESTAMPTZ DEFAULT now()
```

### 4.6 `cart_items`
```sql
id           BIGSERIAL PRIMARY KEY,
cart_id      BIGINT REFERENCES carts(id) ON DELETE CASCADE,
menu_item_id BIGINT REFERENCES menu_items(id),
quantity     INT NOT NULL DEFAULT 1,
UNIQUE(cart_id, menu_item_id)
```

### 4.7 `orders`
```sql
id               BIGSERIAL PRIMARY KEY,
user_id          BIGINT REFERENCES users(id),
address_snapshot JSONB NOT NULL,           -- snapshot of delivery address at order time
status           VARCHAR(30) DEFAULT 'PENDING',
                 -- PENDING | CONFIRMED | PREPARING | OUT_FOR_DELIVERY | DELIVERED | CANCELLED
subtotal_paise   BIGINT NOT NULL,
delivery_fee_paise BIGINT NOT NULL,
total_paise      BIGINT NOT NULL,
payment_method   VARCHAR(20),             -- UPI | COD | CARD
special_note     TEXT,
created_at       TIMESTAMPTZ DEFAULT now(),
updated_at       TIMESTAMPTZ DEFAULT now()
```

### 4.8 `order_items`
```sql
id              BIGSERIAL PRIMARY KEY,
order_id        BIGINT REFERENCES orders(id) ON DELETE CASCADE,
menu_item_id    BIGINT REFERENCES menu_items(id),
name_snapshot   VARCHAR(200) NOT NULL,    -- item name at time of order
price_snapshot  INT NOT NULL,            -- price at time of order
quantity        INT NOT NULL
```

### 4.9 `payments`
```sql
id                    BIGSERIAL PRIMARY KEY,
order_id              BIGINT REFERENCES orders(id) UNIQUE,
razorpay_order_id     VARCHAR(100) UNIQUE,   -- order_XXXX from Razorpay
razorpay_payment_id   VARCHAR(100),          -- pay_XXXX after capture
razorpay_signature    VARCHAR(255),
amount_paise          BIGINT NOT NULL,
currency              VARCHAR(10) DEFAULT 'INR',
status                VARCHAR(30) DEFAULT 'CREATED',
                      -- CREATED | CAPTURED | FAILED | REFUNDED
method                VARCHAR(20),          -- upi | card | cod
created_at            TIMESTAMPTZ DEFAULT now(),
updated_at            TIMESTAMPTZ DEFAULT now()
```

### 4.10 `delivery_config` (admin-configurable)
```sql
id                 BIGSERIAL PRIMARY KEY,
delivery_fee_paise BIGINT NOT NULL DEFAULT 3000,   -- ₹30
min_order_paise    BIGINT DEFAULT 0,
estimated_minutes  INT DEFAULT 40
```

---

## 5. API Endpoint Plan

### Legend
- 🔓 Public (no auth)
- 🔑 User JWT required
- 👑 Admin JWT required

---

### 5.1 Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | 🔓 | Register new user (phone + password) |
| POST | `/api/auth/login` | 🔓 | Login → returns JWT access token + refresh token |
| POST | `/api/auth/refresh` | 🔓 | Exchange refresh token → new access token |
| POST | `/api/auth/logout` | 🔑 | Invalidate refresh token |

**Register request:**
```json
{ "name": "Ramesh Kumar", "phone": "9876543210", "password": "secure123" }
```
**Login response:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "...",
  "expiresIn": 900,
  "user": { "id": 1, "name": "Ramesh Kumar", "role": "USER" }
}
```

---

### 5.2 Menu (public read, admin write)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/menu/categories` | 🔓 | List all active categories |
| GET | `/api/menu/items` | 🔓 | List all available items (supports `?category=Combos&search=paneer&bestseller=true`) |
| GET | `/api/menu/items/{id}` | 🔓 | Single item detail |
| POST | `/api/admin/menu/items` | 👑 | Create menu item |
| PUT | `/api/admin/menu/items/{id}` | 👑 | Update item (name, desc, price, image, availability) |
| PATCH | `/api/admin/menu/items/{id}/availability` | 👑 | Toggle is_available |
| PATCH | `/api/admin/menu/items/{id}/price` | 👑 | Update price only |
| DELETE | `/api/admin/menu/items/{id}` | 👑 | Soft-delete (set is_available=false) |
| POST | `/api/admin/menu/categories` | 👑 | Create category |
| PUT | `/api/admin/menu/categories/{id}` | 👑 | Update category |
| DELETE | `/api/admin/menu/categories/{id}` | 👑 | Delete category |

**GET /api/menu/items response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Matar Paneer with Ghee Roti",
      "description": "Rich matar paneer served with 4 soft ghee rotis.",
      "price": 229,
      "category": { "id": 1, "name": "Combos", "icon": "🍱" },
      "imageUrl": "https://cdn.example.com/items/matar-paneer.jpg",
      "isVeg": true,
      "isAvailable": true,
      "isBestseller": true
    }
  ],
  "total": 36
}
```

---

### 5.3 Cart (logged-in users)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/cart` | 🔑 | Get current user's cart |
| POST | `/api/cart/items` | 🔑 | Add item or increment quantity |
| PUT | `/api/cart/items/{menuItemId}` | 🔑 | Set exact quantity |
| DELETE | `/api/cart/items/{menuItemId}` | 🔑 | Remove item from cart |
| DELETE | `/api/cart` | 🔑 | Clear entire cart |

**GET /api/cart response:**
```json
{
  "items": [
    { "menuItemId": 1, "name": "Matar Paneer with Ghee Roti", "price": 229, "quantity": 2, "imageUrl": "..." }
  ],
  "subtotal": 458,
  "deliveryFee": 30,
  "total": 488,
  "estimatedMinutes": 40
}
```

---

### 5.4 Orders

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/orders` | 🔑 | Place order (validates cart, locks prices, creates payment record) |
| GET | `/api/orders/me` | 🔑 | Order history for logged-in user |
| GET | `/api/orders/me/{orderId}` | 🔑 | Single order status |
| GET | `/api/admin/orders` | 👑 | All orders (filter by status, date, user) |
| GET | `/api/admin/orders/{id}` | 👑 | Full order detail |
| PATCH | `/api/admin/orders/{id}/status` | 👑 | Update order status |

**POST /api/orders request:**
```json
{
  "deliveryAddress": {
    "name": "Ramesh Kumar",
    "phone": "9876543210",
    "line1": "House no. 12, Gandhi Nagar",
    "pincode": "852201"
  },
  "paymentMethod": "UPI",
  "specialNote": "Less spicy please"
}
```

**POST /api/orders response:**
```json
{
  "orderId": 42,
  "razorpayOrderId": "order_PQ1234XYZ",  // null for COD
  "amount": 488,
  "currency": "INR",
  "keyId": "rzp_live_XXXX"               // safe to expose to frontend
}
```

---

### 5.5 Payments (Razorpay)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/payments/verify` | 🔑 | Verify Razorpay signature after payment |
| POST | `/api/payments/webhook` | 🔓 (HMAC-verified) | Razorpay webhook receiver |

**POST /api/payments/verify request:**
```json
{
  "razorpayOrderId": "order_PQ1234XYZ",
  "razorpayPaymentId": "pay_ABCDEF123",
  "razorpaySignature": "abc123..."
}
```

---

### 5.6 Delivery Config (admin)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/config/delivery` | 🔓 | Get delivery fee + ETA (frontend uses this) |
| PUT | `/api/admin/config/delivery` | 👑 | Update fee / ETA |

---

### 5.7 Admin — User Management

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/users` | 👑 | List users (paginated) |
| PATCH | `/api/admin/users/{id}/role` | 👑 | Promote/demote user role |

---

## 6. Authentication & Authorization Plan

### JWT Strategy
- **Access token:** short-lived (15 min), signed with `HS256`, payload: `{ sub: userId, role, iat, exp }`
- **Refresh token:** long-lived (30 days), stored in `HttpOnly` cookie, hashed and stored in DB for revocation
- All protected endpoints: Spring Security `JwtAuthenticationFilter` validates `Authorization: Bearer <token>` header

### RBAC
```
ROLE_USER  → can access /api/auth/**, /api/menu/** (read), /api/cart/**, /api/orders/me/**, /api/payments/verify
ROLE_ADMIN → all of the above + /api/admin/**
```

### Password
- BCrypt with cost factor 12
- Login via **phone number** (unique) + password
- Phone number validated as exactly 10 digits

### Spring Security Config sketch
```java
http
  .csrf(csrf -> csrf
      .ignoringRequestMatchers("/api/payments/webhook"))   // HMAC-verified separately
  .authorizeHttpRequests(auth -> auth
      .requestMatchers("/api/auth/**", "/api/menu/**", "/api/config/**").permitAll()
      .requestMatchers("/api/payments/webhook").permitAll()
      .requestMatchers("/api/admin/**").hasRole("ADMIN")
      .anyRequest().authenticated())
  .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
```

---

## 7. Admin Features

### Menu Management
- Create / edit / delete categories (with icon, sort order, active flag)
- Create / edit menu items: name, description, price, image upload (→ Cloudinary/S3), category, availability, bestseller flag
- Toggle item availability (e.g. "sold out today") without deleting
- Bulk price update endpoint (future)

### Order Management
- View all orders with filters: `status`, `date`, `payment_method`
- Update order status through lifecycle:
  ```
  PENDING → CONFIRMED → PREPARING → OUT_FOR_DELIVERY → DELIVERED
                                   ↘ CANCELLED (from PENDING or CONFIRMED only)
  ```
- View full order detail: items, prices, delivery address, payment record

### Dashboard (future Phase 3)
- Total orders today / this week
- Revenue summary
- Most ordered items

---

## 8. Normal User Flow

```
1. Guest visits site → sees menu (public API)
2. Adds items to cart → stored client-side until login
3. Clicks "Proceed to Checkout" → prompted to login/register
4. After login → client cart merged with server cart (POST /api/cart/merge)
5. Fills delivery form → selects payment method
6. Submits → POST /api/orders
   - Backend validates items are still available
   - Backend re-prices cart (never trusts client amount)
   - Creates Order + Payment records
   - If UPI/Card → creates Razorpay order, returns order ID + key
   - If COD → order confirmed immediately
7. UPI/Card: Razorpay checkout opens in browser
8. User pays → Razorpay calls success callback
9. Frontend POSTs /api/payments/verify with 3 Razorpay fields
10. Backend verifies HMAC signature → marks payment CAPTURED, order CONFIRMED
11. Cart is cleared
12. User sees order confirmation with ETA
13. User can view order status at /api/orders/me/{id}
```

---

## 9. Razorpay Integration Plan

### 9.1 Flow Diagram

```
Frontend                    Backend                     Razorpay
   │                           │                            │
   │──POST /api/orders─────────▶                            │
   │                           │──Create Razorpay Order────▶│
   │                           │◀──{ id, amount, currency }─│
   │◀──{ razorpayOrderId, ─────│                            │
   │     keyId, amount }       │                            │
   │                           │                            │
   │ [Opens Razorpay checkout] │                            │
   │────────────────────────────────────────────────────────▶
   │                           │                            │ User pays
   │◀────────────────────────────────────────────────────────
   │  { razorpayPaymentId,     │                            │
   │    razorpayOrderId,       │                            │
   │    razorpaySignature }    │                            │
   │                           │                            │
   │──POST /api/payments/verify▶                            │
   │                           │ HMAC-SHA256 verify         │
   │                           │ signature                  │
   │◀──{ success: true }───────│                            │
   │                           │──Webhook (async)───────────│
   │                           │◀ payment.captured event ───│
   │                           │  (double-confirmation)     │
```

### 9.2 Backend Order Creation
```java
// Never trust client amount — always compute server-side
long amountPaise = computeTotal(cart) + deliveryFeePaise;

RazorpayClient client = new RazorpayClient(KEY_ID, KEY_SECRET);
JSONObject orderRequest = new JSONObject();
orderRequest.put("amount", amountPaise);
orderRequest.put("currency", "INR");
orderRequest.put("receipt", "order_" + internalOrderId);
orderRequest.put("payment_capture", 1);   // auto-capture

Order razorpayOrder = client.orders.create(orderRequest);
// Store razorpayOrder.get("id") in payments table
```

### 9.3 Signature Verification
```java
// POST /api/payments/verify
String payload = razorpayOrderId + "|" + razorpayPaymentId;
String expectedSig = HmacUtils.hmacSha256Hex(KEY_SECRET, payload);
if (!expectedSig.equals(razorpaySignature)) {
    throw new PaymentVerificationException("Signature mismatch");
}
// Mark payment CAPTURED, order CONFIRMED, clear cart
```

### 9.4 Webhook Handler
- Endpoint: `POST /api/payments/webhook`
- Razorpay signs webhook payload with `X-Razorpay-Signature` header using webhook secret
- Verify independently of payment verify endpoint
- Handle events: `payment.captured`, `payment.failed`, `order.paid`
- Idempotent: check if payment already CAPTURED before processing
- Return `200 OK` quickly; process async if needed

### 9.5 Security Rules
| Rule | Implementation |
|---|---|
| Never trust client amount | Always compute total server-side from DB prices |
| Secrets in env vars | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` — never in code |
| Verify signature before confirming | HMAC-SHA256 check mandatory |
| Webhook secret separate from API secret | Use Razorpay dashboard webhook secret |
| Idempotent webhook | Check `payments.razorpay_payment_id` before updating |
| Amount mismatch check | If webhook amount ≠ DB amount → flag for manual review, do not confirm |

### 9.6 Order Status Transitions (payment-driven)
```
POST /api/orders created     → Order: PENDING,   Payment: CREATED
Razorpay order created       → Payment: CREATED (razorpay_order_id stored)
/api/payments/verify success → Order: CONFIRMED, Payment: CAPTURED
payment.failed webhook       → Order: PENDING,   Payment: FAILED (allow retry)
COD order placed             → Order: CONFIRMED, Payment: COD (no Razorpay record)
```

---

## 10. Backend Folder Structure

```
chulha-chauka-backend/
├── src/
│   └── main/
│       ├── java/com/chulhachauka/
│       │   ├── ChulhachaukaApplication.java
│       │   ├── config/
│       │   │   ├── SecurityConfig.java
│       │   │   ├── RazorpayConfig.java
│       │   │   └── CorsConfig.java
│       │   ├── auth/
│       │   │   ├── AuthController.java
│       │   │   ├── AuthService.java
│       │   │   ├── JwtService.java
│       │   │   ├── JwtAuthenticationFilter.java
│       │   │   └── dto/
│       │   │       ├── RegisterRequest.java
│       │   │       ├── LoginRequest.java
│       │   │       └── AuthResponse.java
│       │   ├── user/
│       │   │   ├── User.java              (entity)
│       │   │   ├── UserRepository.java
│       │   │   └── UserService.java
│       │   ├── menu/
│       │   │   ├── Category.java
│       │   │   ├── MenuItem.java
│       │   │   ├── CategoryRepository.java
│       │   │   ├── MenuItemRepository.java
│       │   │   ├── MenuController.java    (public)
│       │   │   ├── MenuService.java
│       │   │   └── dto/
│       │   │       ├── MenuItemResponse.java
│       │   │       └── MenuItemRequest.java
│       │   ├── cart/
│       │   │   ├── Cart.java
│       │   │   ├── CartItem.java
│       │   │   ├── CartRepository.java
│       │   │   ├── CartController.java
│       │   │   ├── CartService.java
│       │   │   └── dto/CartResponse.java
│       │   ├── order/
│       │   │   ├── Order.java
│       │   │   ├── OrderItem.java
│       │   │   ├── OrderStatus.java       (enum)
│       │   │   ├── OrderRepository.java
│       │   │   ├── OrderController.java
│       │   │   ├── OrderService.java
│       │   │   └── dto/
│       │   │       ├── PlaceOrderRequest.java
│       │   │       └── OrderResponse.java
│       │   ├── payment/
│       │   │   ├── Payment.java
│       │   │   ├── PaymentRepository.java
│       │   │   ├── PaymentController.java
│       │   │   ├── PaymentService.java
│       │   │   ├── RazorpayService.java
│       │   │   └── dto/
│       │   │       ├── VerifyPaymentRequest.java
│       │   │       └── PaymentResponse.java
│       │   ├── admin/
│       │   │   ├── AdminMenuController.java
│       │   │   ├── AdminOrderController.java
│       │   │   └── AdminUserController.java
│       │   ├── config_/                   (delivery config)
│       │   │   ├── DeliveryConfig.java
│       │   │   ├── DeliveryConfigRepository.java
│       │   │   └── DeliveryConfigController.java
│       │   └── common/
│       │       ├── exception/
│       │       │   ├── GlobalExceptionHandler.java
│       │       │   ├── ResourceNotFoundException.java
│       │       │   ├── PaymentVerificationException.java
│       │       │   └── BusinessException.java
│       │       ├── dto/ApiResponse.java   (standard envelope)
│       │       └── util/HmacUtil.java
│       └── resources/
│           ├── application.yml
│           ├── application-dev.yml
│           ├── application-prod.yml
│           └── db/migration/             (Flyway)
│               ├── V1__create_users.sql
│               ├── V2__create_menu.sql
│               ├── V3__create_cart_order.sql
│               └── V4__create_payment.sql
└── src/test/
    └── java/com/chulhachauka/
        ├── auth/AuthServiceTest.java
        ├── menu/MenuServiceTest.java
        ├── order/OrderServiceTest.java
        └── payment/PaymentServiceTest.java
```

---

## 11. Environment Variables

```yaml
# application-prod.yml (never commit)

spring:
  datasource:
    url: ${DB_URL}                          # jdbc:postgresql://host:5432/chulha
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate                   # Flyway manages schema

app:
  jwt:
    secret: ${JWT_SECRET}                  # min 256-bit random string
    access-expiry-seconds: 900             # 15 min
    refresh-expiry-seconds: 2592000        # 30 days

razorpay:
  key-id: ${RAZORPAY_KEY_ID}
  key-secret: ${RAZORPAY_KEY_SECRET}
  webhook-secret: ${RAZORPAY_WEBHOOK_SECRET}

cloudinary:                                # if using Cloudinary for images
  cloud-name: ${CLOUDINARY_CLOUD_NAME}
  api-key: ${CLOUDINARY_API_KEY}
  api-secret: ${CLOUDINARY_API_SECRET}

cors:
  allowed-origins: ${CORS_ALLOWED_ORIGINS} # https://chulhachauka.in
```

---

## 12. Validation, Error Handling & Logging

### Validation
- Jakarta Bean Validation annotations on all DTOs: `@NotBlank`, `@Pattern`, `@Min`, `@Size`
- Phone: `@Pattern(regexp = "^[6-9]\\d{9}$")` (Indian mobile format)
- Pincode: `@Pattern(regexp = "^\\d{6}$")`
- Prices stored in paise (integer) — no floating-point arithmetic

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_VERIFICATION_FAILED",
    "message": "Signature does not match",
    "timestamp": "2026-09-24T09:00:00Z"
  }
}
```

### `GlobalExceptionHandler` covers:
| Exception | HTTP status |
|---|---|
| `ResourceNotFoundException` | 404 |
| `MethodArgumentNotValidException` | 400 (with field errors) |
| `PaymentVerificationException` | 400 |
| `BusinessException` | 422 |
| `AccessDeniedException` | 403 |
| `AuthenticationException` | 401 |
| All others | 500 (sanitized message) |

### Logging Strategy
- `INFO`: every API request (method, path, userId, duration) — via request filter
- `WARN`: validation failures, payment mismatches
- `ERROR`: uncaught exceptions, Razorpay errors (with stack trace)
- **Never log**: passwords, JWT secrets, Razorpay key secrets, raw card data

---

## 13. Security Considerations

| Risk | Mitigation |
|---|---|
| Client tampers with cart total | Backend always recomputes price from DB |
| JWT stolen | Short access token (15 min), HttpOnly refresh cookie |
| Webhook spoofing | HMAC-SHA256 signature verification with webhook secret |
| SQL injection | Spring Data JPA parameterized queries |
| Mass assignment | Explicit DTOs, never expose entity directly |
| Brute force login | Rate limiting on `/api/auth/login` (Spring + Bucket4j or nginx) |
| CORS | Whitelist only production frontend origin |
| Admin endpoint exposure | `hasRole("ADMIN")` at method + config level |
| Secrets in code | All secrets via env vars; `.env` in `.gitignore` |
| Image upload abuse | Validate file type, max size (2MB), sanitize filename |

---

## 14. Testing Plan

### Unit Tests
- `AuthService`: register duplicate phone, weak password, login wrong password
- `OrderService`: out-of-stock item, price re-computation accuracy, status transition guards
- `PaymentService`: valid signature, tampered signature, amount mismatch
- `CartService`: add item, update quantity, clear cart

### Integration Tests (Spring Boot Test + H2 / Testcontainers)
- Full auth flow: register → login → access protected endpoint
- Full order flow: add to cart → place order → verify payment → check order status
- Admin creates menu item → public API returns it
- Admin updates price → new order uses new price

### API Tests (Postman / REST Assured)
- Happy paths for all endpoints
- 401 without token, 403 for wrong role, 400 for invalid input

### Payment Tests
- Razorpay test mode keys in dev
- Simulate `payment.captured` and `payment.failed` webhooks with correct HMAC

---

## 15. Implementation Phases / Milestones

### Phase 2A — Foundation (Week 1–2)
- [ ] Spring Boot project scaffold (Spring Initializr)
- [ ] PostgreSQL setup + Flyway migrations V1–V4
- [ ] User entity + BCrypt registration + JWT login
- [ ] Spring Security config (JWT filter, RBAC)
- [ ] `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`

### Phase 2B — Menu API (Week 2–3)
- [ ] Category + MenuItem entities and repositories
- [ ] Seed DB with current 36 menu items + 9 categories
- [ ] `GET /api/menu/items` with category/search filter
- [ ] Admin CRUD: create/update/delete/toggle item
- [ ] Image upload to Cloudinary
- [ ] **Frontend integration:** replace hardcoded `menu` array with fetch from API

### Phase 2C — Cart & Orders (Week 3–4)
- [ ] Cart entity + server-side cart endpoints
- [ ] `POST /api/orders` — place order, validate, price-lock items
- [ ] Delivery config endpoint (dynamic fee replaces hardcoded ₹30)
- [ ] `GET /api/orders/me` — order history
- [ ] **Frontend integration:** cart persisted to server after login

### Phase 2D — Razorpay (Week 4–5)
- [ ] Razorpay Java SDK integration
- [ ] `POST /api/orders` creates Razorpay order for UPI/Card
- [ ] Frontend Razorpay checkout (`razorpay.open()`)
- [ ] `POST /api/payments/verify` HMAC verification
- [ ] `POST /api/payments/webhook` with idempotency
- [ ] Order status → CONFIRMED after successful payment
- [ ] **Frontend integration:** replace checkout placeholder with real flow

### Phase 2E — Admin Panel (Week 5–6)
- [ ] Admin order list + status update endpoints
- [ ] Admin user management endpoints
- [ ] Simple admin React page (separate route `/admin`, behind login + role check)

### Phase 2F — Hardening & Launch (Week 6–7)
- [ ] Rate limiting (Bucket4j) on auth endpoints
- [ ] CORS locked to production domain
- [ ] Structured logging (JSON format for prod)
- [ ] All env vars documented + `.env.example` committed
- [ ] Deploy backend (Railway / Render / EC2)
- [ ] Deploy frontend (Vercel / Netlify)
- [ ] DNS setup for `chulhachauka.in`
- [ ] Replace mock food images with real photos
- [ ] End-to-end smoke test in production with Razorpay live keys

---

## 16. Assumptions & Open Questions

| # | Assumption / Question | Status |
|---|---|---|
| 1 | Login is by **phone number** (not email) — consistent with Indian food delivery norms | ✅ Assumed |
| 2 | All menu items are **pure vegetarian** — `is_veg` column kept for schema flexibility only | ✅ Assumed |
| 3 | Delivery is **Saharsa city only** — single flat delivery fee (₹30), no zone-based pricing | ✅ Assumed |
| 4 | No OTP/SMS verification at registration yet — password-based auth only in Phase 2 | ✅ Assumed |
| 5 | **Guest checkout** (no login required) — open question: require login before placing order? | ❓ Needs decision |
| 6 | Order history page — not yet in frontend; needs a new `/orders` route | ❓ Frontend work needed |
| 7 | Prices stored in **rupees as integers** or **paise as BIGINT**? | ❓ Team to decide — plan uses paise |
| 8 | WhatsApp notification after order placed — Razorpay sends payment link via SMS; additional WhatsApp via Twilio/WATI is optional | ❓ Future enhancement |
| 9 | Admin panel as same-domain React route or separate app? | ❓ Needs decision |
| 10 | Review/rating system — currently shows hardcoded reviews; real review API is future scope | 📋 Phase 3 |
| 11 | Refund flow — Razorpay supports refunds; backend refund endpoint is Phase 3 | 📋 Phase 3 |
| 12 | Multiple delivery addresses per user | ✅ Schema supports it |
| 13 | Menu item images — currently local `.png` prototype assets; must be hosted on CDN before Phase 2B | ⚠️ Action needed |