# FLOW — Technical & Architectural Blueprint
### Premium Fintech Operating System: *“Finance that simply flows.”*

This document outlines the complete production-grade system architecture, database schema, module structure, and logical workflows for **FLOW**. It is designed to scale dynamically from MVP to a high-throughput, compliant global financial super app.

---

## 1. Complete System Architecture

FLOW uses a decoupled, hybrid architecture. It starts with a unified, modular monolith (NestJS / Express + PostgreSQL) and is designed to transition into a robust microservices model (with Go-centric high-performance engines for high-throughput ledgers, fraud checks, and FX calculations).

### 1.1 Architecture Diagram

```
[ MOBILE CLIENT (React Native) ]             [ WEB PORTAL / ADMIN (Next.js) ]
               │                                            │
               └──────────────────────┬─────────────────────┘
                                      ▼
                        [ INGRESS CONTROLLER / NGINX ]
                        (SSL, CORS, DDoS Rate-Limiting)
                                      │
                                      ▼
                    [ CENTRAL GATEWAY / REVERSE PROXY ]
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
  [ AUTH & USER API ]        [ WALLET & TRANS ENGINE ]    [ AI COGNITIVE SHIELD ]
  (MFA, Identity, KYC)       (Double-entry, Atomic FX)    (Insights, Support Agent)
          │                           │                           │
          ├───────────────────────────┴───────────────────────────┤
          ▼                                                       ▼
[ REDIS RECOVERY CACHE ]                                [ POSTGRESQL PRIMARY ]
- Session Blacklists                                    - Users, Wallets, Ledgers
- Rate-Limit Counters                                   - Row-level lock state
- Real-time WS PubSub                                   - Relational constraints
          │                                                       │
          ▼                                                       ▼
[ SECURE METADATA S3 ]                                  [ SYSTEM AUDIT ENGINES ]
- KYC Documents (Encrypted)                             - Ledger integrity check
- Signed Invoice PDFs                                   - Anti-Money Laundering
```

### 1.2 Component Specifications

1. **Ingress & Security Layer (Gateway):** Handles SSL termination, early DDoS detection, path routing, and JSON body inspection. Includes a CORS whitelist and hard rate limits verified via Redis.
2. **Main Application Layer (Modular Monolith):** Encapsulated into distinct domain modules with compile-time dependency isolation. It ensures that services communicate via clean interface models, enabling later extraction.
3. **Transaction Execution Engine:** Uses SQL execution blocks at the highest database isolation levels (`SERIALIZABLE` or `READ COMMITTED` with explicit row locks) to guarantee that double-entry ledgers never record phantom updates.
4. **AI Cognitive Shield:** Sandboxed processing layer communicating via gRPC. Integrates with the Gemini API to formulate smart spending insights and process natural language queries over pre-aggregated data buffers.

---

## 2. Frontend Folder Structure

FLOW utilizes clean, modular separation of components, features, types, and presentation styles.

### 2.1 Mobile Application (React Native / Expo / TypeScript)

```txt
/apps/mobile
├── App.tsx                     # App entry point
├── app.json                    # Expo configuration
├── tsconfig.json               # TypeScript path mappings
└── /src
    ├── /api                    # Secure HTTP Client (Axios wrapper with interceptors)
    │   ├── client.ts           # Automatic token injection & expiry interceptor
    │   └── endpoints.ts        # Fully-typed API calls mapping backend routes
    ├── /assets                 # Premium vectors, design icons, custom fonts (Mono / Sans)
    ├── /components             # Stateless presentation components grouped by category
    │   ├── /common             # Buttons, input fields, custom sheet modals, loaders
    │   ├── /cards              # Credit card visuals, tactile toggles, security overlays
    │   ├── /wallet             # Wallet selectors, current balance counters, FX fields
    │   └── /analytics          # Interactive charts, bento cells, spending breakdowns
    ├── /screens                # Screen controllers handling user actions and screen state
    │   ├── /auth               # Sign In, Sign Up, OTP Verification, FaceID Setup
    │   ├── /wallet             # Balance breakdowns, exchange forms, funds injection
    │   ├── /payments           # Send flow, Quick-Select list, QR scanner, split controller
    │   ├── /cards              # Spending controls, Virtual card visualizer, freeze toggle
    │   ├── /analytics          # High-fidelity d3 charts, budget controls, insight feeds
    │   └── /support            # AI Advisor portal, compliance messaging, ticket lists
    ├── /navigation             # Shared route manifests, custom tab-bar styling
    ├── /store                  # Light client-side state engine (Zustand with encrypter)
    ├── /hooks                  # custom useAuth, useWebSocket, useHardwareSensors
    ├── /theme                  # Tailwind config, design tokens, colors (Midnight Obsidian, Teal)
    ├── /utils                  # Crypto wrappers, IBAN validators, amount formatters
    └── /types                  # Strictly defined TS Interfaces (User, Card, Wallet)
```

### 2.2 Web Dashboard & Admin Portal (Next.js / TypeScript)

```txt
/apps/web
├── next.config.js              # Next.js configurations
├── tailwind.config.js          # Premium style theme configurations
└── /src
    ├── /app                    # Next.js App Router hierarchy Layouts
    │   ├── layout.tsx          # Master layout with root theme context
    │   ├── page.tsx            # Initial landing page
    │   ├── (dashboard)         # Logged-in dashboard modules
    │   │   ├── /wallet
    │   │   ├── /cards
    │   │   └── /analytics
    │   └── (admin)             # Compliance admin interface panels
    │       ├── /kyc-reviews
    │       └── /audit-logs
    ├── /components             # Modular high-fidelity web widgets
    ├── /hooks                  # Web-specific lifecycle controls
    └── /types                  # Shared domain contracts (matching database models)
```

---

## 3. Backend Module Structure

The backend application uses clean encapsulation interfaces so each domain component can be moved to its own service if needed.

```txt
/services/api/src/modules
├── /auth                       # Session registration, OTP check, MFA validator
├── /user                       # Profile database operations, custom preferences
├── /kyc                        # Upload stream interceptor, status update webhook
├── /wallet                     # Currency wallets, transaction executors, FX conversion
├── /transaction                # Unified ledger system, receipts generator, CSV export
├── /card                       # Virtual card creation, limit modification, tactile switches
├── /analytics                  # Pre-aggregators for category graphs, subscription lists
├── /invoice                    # Freelancer invoices, SEPA tracker, PDF template compiler
├── /security                   # Session termination pipeline, suspicious event logger
├── /support                    # AI tickets, support agents routing, chat websockets
├── /notification               # Push notifications, Email dispatch, SMS queues
└── /ai                         # Flow AI sandboxed interface, pre-aggregation pipeline
```

---

## 4. Solid Database Schema

FLOW relies on PostgreSQL as its core data source of truth. All key transaction actions are relational, highly constrained, and strictly normalized.

```sql
-- Enums for state machine integrity
CREATE TYPE kyc_status_enum AS ENUM ('unverified', 'pending', 'approved', 'rejected');
CREATE TYPE account_status_enum AS ENUM ('active', 'suspended', 'restricted', 'closed');
CREATE TYPE currency_enum AS ENUM ('MAD', 'EUR', 'USD');
CREATE TYPE transaction_status_enum AS ENUM ('pending', 'processing', 'success', 'failed', 'cancelled', 'reversed');
CREATE TYPE transaction_type_enum AS ENUM ('internal_transfer', 'bank_transfer', 'card_payment', 'qr_payment', 'wallet_topup', 'withdrawal', 'currency_exchange', 'invoice_payment');
CREATE TYPE card_type_enum AS ENUM ('visa', 'mastercard');
CREATE TYPE card_status_enum AS ENUM ('active', 'frozen', 'blocked', 'expired', 'pending');
CREATE TYPE user_role_enum AS ENUM ('user', 'super_admin', 'compliance_admin', 'support_agent', 'risk_agent');

-- USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    country VARCHAR(100) NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'en',
    kyc_status kyc_status_enum DEFAULT 'unverified',
    account_status account_status_enum DEFAULT 'active',
    role user_role_enum DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- USER PROFILES TABLE
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    avatar_url VARCHAR(1024),
    occupation VARCHAR(100),
    user_type VARCHAR(50) DEFAULT 'individual',
    address TEXT,
    city VARCHAR(150),
    country VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- WALLETS TABLE
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    currency currency_enum NOT NULL,
    balance DECIMAL(18, 4) NOT NULL DEFAULT 0.0000 CHECK (balance >= 0),
    available_balance DECIMAL(18, 4) NOT NULL DEFAULT 0.0000 CHECK (available_balance >= 0),
    status VARCHAR(50) DEFAULT 'active',
    daily_limit DECIMAL(18, 4) DEFAULT 50000.0000,
    monthly_limit DECIMAL(18, 4) DEFAULT 200000.0000,
    version INT NOT NULL DEFAULT 1, -- For optimistic locking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, currency)
);

-- TRANSACTIONS / DOUBLE_ENTRY LEDGER TABLE
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_reference VARCHAR(100) UNIQUE NOT NULL,
    sender_wallet_id UUID REFERENCES wallets(id) ON DELETE RESTRICT,
    receiver_wallet_id UUID REFERENCES wallets(id) ON DELETE RESTRICT,
    amount DECIMAL(18, 4) NOT NULL CHECK (amount > 0),
    currency currency_enum NOT NULL,
    fee DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    exchange_rate DECIMAL(12, 6) DEFAULT 1.000000,
    transaction_type transaction_type_enum NOT NULL,
    status transaction_status_enum NOT NULL DEFAULT 'pending',
    description VARCHAR(255),
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CARDS TABLE
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    card_type card_type_enum NOT NULL,
    masked_number VARCHAR(19) NOT NULL,
    encrypted_details TEXT NOT NULL, -- Encrypted CVV/Full Number/Expiry payload
    status card_status_enum DEFAULT 'pending',
    spending_limit DECIMAL(18, 4) NOT NULL DEFAULT 5000.0000,
    spent_this_month DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    is_virtual BOOLEAN DEFAULT TRUE,
    online_enabled BOOLEAN DEFAULT TRUE,
    offline_enabled BOOLEAN DEFAULT FALSE,
    atm_withdrawals_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- DEVICES AND SECURITY MONITORING
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(100),
    device_type VARCHAR(50),
    device_fingerprint VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    is_trusted BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AUDIT LOGS FOR ACCONTABILITY
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    ip_address VARCHAR(45),
    device_fingerprint VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning fast operations
CREATE INDEX idx_transactions_ref ON transactions(transaction_reference);
CREATE INDEX idx_transactions_wallets ON transactions(sender_wallet_id, receiver_wallet_id);
CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
```

---

## 5. API Route Specifications

Each API endpoint requires strict authentication, validation controls, and specific request/response models.

| Method | Route | Description | Auth Requirement | Core Params/Payload |
|:---|:---|:---|:---|:---|
| **POST** | `/api/auth/register` | Register user account | Public | `phone`, `email`, `fullName`, `password` |
| **POST** | `/api/auth/login` | Log in and issue HTTP-only Cookie JWT | Public | `phone/email`, `password`, `deviceFingerprint` |
| **POST** | `/api/auth/verify-otp` | Validate registration check or login MFA | Public / Handshake | `userId`, `otpCode` |
| **POST** | `/api/auth/refresh-token` | Rotate JWT using custom refresh-token | Refresh Required | Secure Http-Only Cookie matching session |
| **GET** | `/api/users/me` | Retreive current active session profile | JWT User | None |
| **PATCH** | `/api/users/me` | Edit preferences / default settings | JWT User | `preferredLanguage`, `occupation` |
| **POST** | `/api/kyc/submit` | Upload identity cards and verified images | JWT User | `documentType`, Mulipart payload elements |
| **GET** | `/api/wallets` | Retreive MAD/EUR/USD wallets positions | JWT User | None |
| **POST** | `/api/wallets/exchange` | Perform real-time currency conversion | JWT User | `fromWalletId`, `toWalletId`, `amount` |
| **POST** | `/api/transactions/send` | Send money to another active customer account | JWT User / Pin Verification | `receiverId`, `sourceWalletId`, `amount`, `pin` |
| **GET** | `/api/transactions` | Query multi-currency transaction log | JWT User | `limit` (int), `offset` (int), `searchQuery` |
| **GET** | `/api/cards` | Retrieve issued card controllers | JWT User | None |
| **PATCH** | `/api/cards/:id/freeze`| Temporarily suspend card payments | JWT User | None |
| **PATCH** | `/api/cards/:id/limits`| Adjust card limits parameters | JWT User / Pin Verification | `spendingLimit` (decimal) |
| **GET** | `/api/analytics/overview`| Fetch categorized spending breakdowns | JWT User | `startDate` (ISO), `endDate` (ISO) |
| **POST** | `/api/ai/search` | Dynamic natural language ledger search | JWT User | `queryString` ("How much did I spend on food?") |

---

## 6. Authentication Workflows

Authentication must follow cryptographic verification principles to guard user parameters against unauthorized session changes.

### 6.1 User Registration & Verification Flow

```
[ User Registers ]
        │
        ▼
   [ Generate User ] ──────► Status: 'unverified'
        │
        ▼
[ Generate 6-digit OTP ] ──► Store in Redis with 5min TTL
        │
        ▼
   [ Send OTP SMS ] ───► Delivery via safe service (e.g. Twilio)
        │
        ▼
 [ User Enters OTP ]
        │
        ├─► [ Valid CODE ] ────► Create WALLETS (MAD, EUR, USD)
        │                        Status set to 'active'
        │                        Create Session
        │                        Issue JWT Tokens
        │
        └─► [ Expired/Invalid ] ─► Return Code 401 (MIME Error)
```

### 6.2 Token Rotation Logic (MFA Integrity)

1. **Rotation Cycle:** Access Tokens are valid for `15 minutes`. Refresh Tokens are rotated each time they are evaluated to prevent replay.
2. **Revocation Strategy:** Access tokens are checked against a Redis blocklist containing revoked user identities. Refresh tokens are tracked in the database and linked to specific device configurations. If a mismatch is discovered, the entire device segment is logged out.

---

## 7. Wallet Transaction Logic

The financial system must manage balances securely to maintain accurate and consistent account values.

### 7.1 Double-Entry Atomic Settlement

All ledger mutations occur inside explicit database transactions. This ensures balances are adjusted correctly, and transactions are securely saved.

```sql
-- Atomicity Verification Block
BEGIN;

-- 1. Lock Sender Wallet exclusively to prevent concurrent double spend
SELECT balance, status 
FROM wallets 
WHERE id = 'SENDER_WALLET_UUID' AND status = 'active'
FOR UPDATE;

-- 2. Validate sufficient liquidity
-- If Sender balance < requested amount -> ROLLBACK immediately with error.

-- 3. Lock Receiver Wallet exclusively
SELECT balance, status 
FROM wallets 
WHERE id = 'RECEIVER_WALLET_UUID' AND status = 'active'
FOR UPDATE;

-- 4. Deduct amount from Sender Wallet
UPDATE wallets 
SET balance = balance - 1000.0000, updated_at = CURRENT_TIMESTAMP 
WHERE id = 'SENDER_WALLET_UUID';

-- 5. Credit Receiver Wallet
UPDATE wallets 
SET balance = balance + 1000.0000, updated_at = CURRENT_TIMESTAMP 
WHERE id = 'RECEIVER_WALLET_UUID';

-- 6. Insert double-entry ledger verification line
INSERT INTO transactions (transaction_reference, sender_wallet_id, receiver_wallet_id, amount, currency, transaction_type, status)
VALUES ('TXT-FLOW-9482522', 'SENDER_WALLET_UUID', 'RECEIVER_WALLET_UUID', 1000.0000, 'MAD', 'internal_transfer', 'success');

-- 7. Audit Logging Mutation record
INSERT INTO audit_logs (action, entity_type, entity_id, metadata)
VALUES ('INTERNAL_TRANSFER', 'TRANSACTION', 'INSERTED_TRANSACTION_UUID', '{"source": "mobile-app"}');

COMMIT;
```

---

## 8. Payment Flow (Split & QR Codes)

FLOW uses specialized engines to support QR code sharing and group split transfers in real-time.

### 8.1 Offline QR Code Verification

1. **QR Code Structure:** Contains a signed cryptographic payload containing:
   `{"issuer": "FLOW", "target_wallet_uuid": "...", "amount": 100.00, "signature": "HMAC-SHA256"}`
2. **On-Device Cryptographic Checks:** The user's device decrypts and validates the signature on the QR code instantly.
3. **Execution Block:** Verified transfers request an internal transfer to clear the transaction without unnecessary middle layers.

### 8.2 Real-Time Bill Splits

```
[ Initiate Split Request ] ────► Set Total Amount (e.g., 300 MAD)
           │
           ▼
 [ Assign Counterparties ] ───► Select 3 contacts (100 MAD each)
           │
           ▼
[ Generate Split Records ] ───► Insert transaction with status: 'pending'
           │
           ├─ Notification ──► Recipient gets custom Push alerts
           │
           ├─ Action ────────► Recipient approves checkout
           │
           ▼
 [ Update Flow Records ] ────► Atomic execution settles remaining balance
```

---

## 9. Robust Security System

Fintech applications require strong, built-in security architecture to defend assets and maintain customer trust.

### 9.1 Multi-Layer Defense

* **Transit and Resting Guard:** Strict HTTPS only. Encryption uses `AES-256GCM` to protect confidential client records, transaction ledger details, and private keys.
* **Rate-Limit Gatekeeping:** Layered limits are checked at the Ingress controller. Authentication lines are protected via sliding-window limit algorithms:
  ```txt
  /api/auth/login ──► Max 5 operations / 10 Minutes per IP / Account
  /api/tx/*       ──► Max 120 calls / Minute per User Session
  ```
* **Anti-Fraud Evaluation Algorithm:**
  ```txt
  If Location_Mismatched (e.g. login from London 2 mins after Casablanca)
  OR Daily_Tx_Accumulation > Regular_Profile_Average_By_300%
  Then Trigger Emergency Session Restriction + SMS OTP Check
  ```

---

## 10. Sandboxed AI System Boundaries

Flow AI operates strictly within secure, pre-defined functional limits to ensure safety and system reliability.

```
                    ┌───────────────────────────┐
                    │      USER INPUT PILES     │
                    └─────────────┬─────────────┘
                                  ▼
                    ┌───────────────────────────┐
                    │    COGNITIVE FIREWALL     │
                    │   - Prompt Injection Blk  │
                    │   - Sensitive Data Strip  │
                    └─────────────┬─────────────┘
                                  ▼
                    ┌───────────────────────────┐
                    │    PRE-AGGREGATED DATA    │
                    │    (Limited access logs)  │
                    └─────────────┬─────────────┘
                                  ▼
                    ┌───────────────────────────┐
                    │        GEMINI API         │
                    │   - Parse Insights        │
                    │   - Handle Search query   │
                    └─────────────┬─────────────┘
                                  ▼
                    ┌───────────────────────────┐
                    │        OUTPUT LOGIC       │
                    │   (Can NOT execute code)  │
                    └───────────────────────────┘
```

* **No Write Capabilities:** Flow AI cannot write database statements, modify account states, or execute financial transactions.
* **Prompt Protection:** Input validators strip internal database parameters from LLM structures to prevent security leaks.
* **Support Escalation Escort:** Underperforming or complex support topics are routed to human operators with an integrated escalation path.

---

## 11. Custom Compliance Admin Portal

Admin tools empower compliance teams to perform checks and monitor system health effectively.

### 11.1 Access Levels

* `super_admin`: Configuration changes, system variables management, database settings.
* `compliance_admin`: KYC review panels, status assessment, transaction tracking.
* `support_agent`: System ticket resolution, review and respond to user messages, view transaction statuses.
* `risk_agent`: Fraud evaluation queues, manage restricted user lists, review suspicious activity.

### 11.2 Auditing Capabilities

* **Immutable Log Stream:** Every KYC change, limit modification, and admin action writes a persistent record containing the user ID, active IP, and a payload hash.
* **Transaction Screening Queue:** Flagged transfers appear instantly on the Compliance screen for manual verification.

---

## 12. Infrastructure Plan

FLOW utilizes a scalable, cloud-first infrastructure designed for reliability and uptime.

* **High-Efficiency Scaling:** Containers run on AWS ECS or AWS EKS. Automatic scale rules expand container density when CPU usage exceeds `60%`.
* **High Database Uptime:** Implemented managed database structures (Amazon RDS PostgreSQL) using a primary database for writes alongside distributed Read Replicas. Implemented `PgBouncer` to optimize connection pooling under heavy load.
* **Redis Performance Optimizations:** Employs persistent Redis instances to store login keys, verify session blacklists, track system rate limiters, and manage global cache buffers.

---

## 13. MVP Formulation Roadmap

The initial release focuses on core, high-value financial features for individual and freelance accounts.

### 13.1 Included in MVP

* User registration with secure 2-Factor authentication.
* Customer profile builder and documentation upload workflow (selfie, ID verification).
* Virtual/Physical Cards widget (supports card visual, spending controls, tactile freeze).
* Fast MAD / USD / EUR financial wallet dashboards.
* Seamless transfers between FLOW users instantly.
* Basic interactive category breakdowns and spending visualizations.

### 13.2 Deferred Beyond MVP

* Cryptocurrency exchanges, derivative trading, or options portfolios.
* Complex algorithmic insurance calculations.
* Cross-border traditional banking rails integration or high-risk payroll automation engines.

---

## 14. Construction Order Strategy

This step-by-step development sequence minimizes deployment friction and ensures a smooth launch process.

```
 PHASE 1: SYSTEM FOUNDATION
 ├── 1. Build relational schema (users, wallets) & initialize PostgreSQL DB
 └── 2. Implement Core Auth engine with JWT sessions and Redis lock lists
           │
           ▼
 PHASE 2: TRANSACTION BASICS
 ├── 1. Write double-entry ledger transactions with row-level locking
 └── 2. Build internal transfer service, fee calculator, and audit logging
           │
           ▼
 PHASE 3: FRONTEND AND INTERFACE INTEGRATION
 ├── 1. Code wallet pages, balance visualizers, and transactions history
 └── 2. Integrate on-screen card features and tactile freeze controls
           │
           ▼
 PHASE 4: STRENGTHENING COMPLIANCE AND LOGISTICS
 ├── 1. Complete admin KYC evaluation screen and setup secure s3 pipelines
 └── 2. Configure rate limiting and set up performance monitoring
```

---

##### *“Finance that simply flows.” Designed for the future of global money management.*
