# Technical Architecture

---

## Tech Stack

| Layer | Teknologi | Status | Alasan |
|---|---|---|---|
| **Smart Contract** | Solidity + Foundry | ✅ Deployed | Mature ecosystem, tooling lengkap, audit community besar |
| **Network** | Base Sepolia (dev) / Base Mainnet (prod) | ✅ Running | ~2s finality, EVM-compatible, biaya rendah |
| **Stablecoin** | IDRX (ERC-20) | ✅ Configured | Rupiah-pegged, familiar pengguna Indonesia |
| **Work ID — Dev** | Privy WaaS (EVM embedded wallet) | ✅ Working | Email → EOA/Smart Account, EIP-191 auth, UX seamless |
| **Work ID — Prod** | ERC-4337 Smart Account + encrypted key | 📋 Planned | Stable address, key rotation, gasless native |
| **Gas Sponsor — Dev** | Faucet ETH (testnet) | ✅ Working | Gratis di Base Sepolia |
| **Gas Sponsor — Prod** | ERC-4337 Paymaster (Pimlico / Alchemy Gas Manager) | 📋 Planned | Sponsor gas untuk karyawan — zero ETH required |
| **Multi-Sig PHK** | OpenZeppelin AccessControl (HR_ROLE + LEGAL_ROLE) | ✅ Deployed | On-chain role-based — no external dependency, audit-ready |
| **Frontend** | Next.js + Tailwind v4 + Shadcn/UI | ✅ Running | SSR, performa mobile baik |
| **Web3 Adapter** | wagmi + viem | ✅ Running | Standard library EVM, type-safe |
| **Indexer** | Ponder | ✅ Running | Real-time event indexing, type-safe SQL, self-hosted |
| **Backend** | Node.js + PostgreSQL | ✅ Running | Bundler relay, off-chain data, compliance reporting |
| **Auth** | EIP-191 signature + JWT (15min/7d) | ✅ Working | Stateless, verifiable, no DB lookup per request |
| **Testing** | Foundry (forge test) + Anvil | ✅ Done | Unit test + fork simulation |
| **KYC — Prod** | Verihubs / Dukcapil API | 📋 Planned | eKYC NIK binding per UU PDP 2022 |
| **Monitoring** | Ponder logs + Alchemy webhooks | ✅ Running | Event indexing + on-chain monitoring |

---

## Contract Structure

Platform terdiri dari **4 Solidity contracts** terpisah yang berinteraksi dalam ekosistem *Multi-Tenant* (Factory Pattern):

| Contract | Storage yang Dikelola | Fungsi Utama |
|---|---|---|
| `PayrollFactory` | companyVaults (mapping), allVaults | deployVault, emergencyFreezeAll |
| `CompanyVault` | (Isolated per Tenant): employeeStreams, severanceVaults, complianceVaults, cliffVests, terminations | fundVault, startStream, claimSalary, proposeTermination, executeTermination, createCliffVest |
| `EmployeeLiquidityContract` | pools, lenderDeposits, loanRecords, totalProtocolFee | initializePool, depositToPool, borrowFromPool, repayLoan, claimProtocolFee |
| `EmploymentSBT` | tokenIdCounter, ownerOf, tokenURI | mintSBT, burnSBT (ERC-5192 soulbound) |

---

## Diagram Arsitektur Storage (Factory Pattern)

```mermaid
graph TD
  FCT["PayrollFactory\nSolidity — Deployer"]
  PC["CompanyVault (Instance)\nSolidity — logic + state"]

  subgraph Factory["SaaS Admin Layer"]
    CV["companyVaults mapping\nkey: hr_address"]
  end

  subgraph Core["Core Storage (Per Tenant)"]
    VT["vaultBalance\nERC-20 IDRX balance\nowned by vault"]
    ES["employeeStreams mapping\nkey: employee_address\nflowRate, startTs, withdrawn"]
  end

  subgraph Compliance["Compliance Storage"]
    SV["severanceVaults mapping\nkey: employee_address\nLocked | Returned | Released"]
    CP["complianceBalance\nbpjsBps, pph21Bps"]
    CF["cliffVests mapping\nkey: employee_address + vestId\ncliffTs, amount, VestStatus"]
  end

  subgraph External["External / Token"]
    IDRX["IDRX ERC-20 Token\nRupiah stablecoin"]
    WID["Work ID\nEthereum address via Privy"]
    SAFE["AccessControl\nHR_ROLE + LEGAL_ROLE\nMulti-sig PHK guard"]
    PR["Privy WaaS (EVM)\nEmail → Smart Account"]
  end

  FCT -->|Deploys & Tracks| CV
  FCT -.->|Creates| PC

  PC -->|reads / writes| VT
  PC -->|reads / writes| ES
  PC -.->|reads / writes| SV
  PC -.->|reads / writes| CP
  PC -.->|reads / writes| CF

  VT -->|holds| IDRX
  ES -->|streams to| WID
  SAFE -->|guards| SV
  PR -->|creates| WID
```

---

## Arsitektur Sistem End-to-End

```
┌──────────────────────────────────────────────────────────────┐
│                  OWNER SAAS (Platform Admin)                  │
│  - Approve/reject registrasi HR baru                          │
│  - Address dikonfirmasi via env OWNER_ADDRESS                 │
│  - Akses: GET /registration/pending, PATCH /approve, DELETE   │
└─────────────────────────┬────────────────────────────────────┘
                          │ Bearer JWT (requireOwner middleware)
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 16)                       │
│  HR Dashboard          │        Employee Dashboard             │
│  - Vault management    │        - EWA live tracker             │
│  - Employee list       │        - Severance balance            │
│  - Compliance report   │        - Koperasi (pinjam/bayar)      │
│                        │                                       │
│  /onboarding           │        Legal Dashboard                │
│  - Registrasi HR baru  │        - Approve PHK proposal         │
│  - Deteksi role otomatis│                                      │
└──────────────┬─────────┴──────────────┬─────────────────────┘
               │ HTTPS + JWT            │ HTTPS + JWT
               ▼                        ▼
┌──────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js / Express)                   │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │  Bundler    │  │  Off-chain   │  │  Alchemy           │   │
│  │  Relay      │  │  Data API    │  │  Webhook           │   │
│  │ (ERC-4337)  │  │ (PII, audit) │  │  Processor         │   │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────────┘   │
│         │                │                   │                │
│  ┌──────▼──────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                         │  │
│  │  employees | companies | transactions | audit_logs      │  │
│  │  registration_requests | refresh_tokens                 │  │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────┬───────────────────────────────────────────┘
                   │ RPC (Alchemy)
                   ▼
┌──────────────────────────────────────────────────────────────┐
│              BASE BLOCKCHAIN (Ethereum L2)                     │
│  ┌───────────────────┐                                        │
│  │  PayrollFactory   │ (Owner SaaS)                           │
│  │  - companyVaults  │─────────────┐                          │
│  └───────────────────┘             ▼                          │
│  ┌────────────────────┐  ┌──────────────────────────────┐     │
│  │  CompanyVault(s)   │  │EmployeeLiquidityContract     │     │
│  │  [Isolated state]  │  │  - pools                     │     │
│  │  - vaultBalance    │◄─┤  - loanRecords (call)        │     │
│  │  - employeeStreams │  │  - lenderDeposits             │     │
│  │  - severanceVaults │  │  - totalProtocolFee           │     │
│  │  - complianceBal   │  └──────────────────────────────┘     │
│  │  - cliffVests      │                                       │
│  └────────────────────┘  ┌──────────────────────────────┐     │
│                           │  EmploymentSBT               │    │
│                           │  - ERC-5192 soulbound token  │    │
│                           │  - Employment certificate    │    │
│                           └──────────────────────────────┘    │
│                           ┌──────────────────────────────┐    │
│                           │  External Protocols           │   │
│                           │  - Privy WaaS (EVM)           │   │
│                           │  - AccessControl PHK          │   │
│                           │  - IDRX ERC-20 Token          │   │
│                           │  - ERC-4337 EntryPoint        │   │
│                           └──────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## Auth Flow (EIP-191 + JWT + Role Detection)

Sistem autentikasi Payana menggunakan pendekatan *wallet-native* berbasis tanda tangan kriptografi, tanpa menyimpan password di server.

### 1. Login Flow (EIP-191 Signature)

```
1. Frontend (Privy embedded wallet):
   - Generate unix timestamp saat ini (detik)
   - Buat pesan: "Sign in to Payana\nTimestamp: {unix_seconds}"
   - Request personal_sign (EIP-191) ke Privy wallet
         │
         ▼
2. Backend POST /auth/login:
   - Terima: { address, message, signature, timestamp }
   - Verifikasi signature menggunakan viem (recoverMessageAddress)
   - Cek: recovered address === address yang dikirim
   - Cek replay protection: |now - timestamp| ≤ 300 detik (5 menit)
   - Issue: accessToken (JWT, expire 15 menit)
   - Issue: refreshToken (JWT, expire 7 hari, disimpan di DB)
         │
         ▼
3. Frontend simpan token:
   - accessToken → memory / state
   - refreshToken → httpOnly cookie atau localStorage
```

### 2. Token Refresh Flow

```
POST /auth/refresh
- Body: { refreshToken }
- Backend validasi refreshToken dari DB
- Issue accessToken baru (15 menit)
```

### 3. Role Detection (Client-side via useRole.ts)

Setelah login berhasil, frontend mendeteksi peran pengguna secara on-chain:

| Urutan Cek | Kondisi | Role yang Ditetapkan |
|---|---|---|
| 1 | `address === OWNER_ADDRESS` (env) | `owner` |
| 2 | `PayrollFactory.companyVaults(address) !== address(0)` | `hr` |
| 3 | `Ponder /stream/{address}` mengembalikan stream aktif | `employee` |
| 4 | `CompanyVault.hasRole(LEGAL_ROLE, address)` === true (per vault) | `legal` |
| 5 | Tidak ada kondisi di atas yang terpenuhi | `null` → redirect `/onboarding` |

### 4. Onboarding Flow (HR Baru)

```
/onboarding → POST /registration/request
   - HR calon kirim: { address, email, name }
   - Status awal: "pending"
         │
         ▼
Owner SaaS review di dashboard admin:
   GET /registration/pending
         │
   PATCH /registration/:address/approve  ── Disetujui
   DELETE /registration/:address         ── Ditolak
         │
         ▼
HR yang disetujui dapat deploy CompanyVault
via PayrollFactory.deployVault()
```

### 5. Authorization Middleware (Backend)

| Middleware | Kondisi | Digunakan Pada |
|---|---|---|
| `requireAuth` | JWT valid + tidak expired | Semua endpoint terproteksi |
| `requireOwner` | JWT valid + `req.address === OWNER_ADDRESS` | `/registration/*` (admin) |

---

## Data Flow: EWA Claim (Happy Path)

```
1. Karyawan klik "Tarik Gaji" di dashboard mobile
         │
         ▼
2. Frontend: Privy buat UserOperation (ERC-4337)
   → Silent sign oleh Smart Account karyawan (noPromptOnSignature)
         │
         ▼
3. Frontend submit UserOperation ke Backend Bundler
         │
         ▼
4. Backend Bundler:
   a. Verifikasi signature karyawan
   b. Cek rate limit (< 10 claim/jam)
   c. Attach Paymaster signature (sponsor gas ETH)
   d. Submit ke Base via Alchemy RPC (melalui ERC-4337 EntryPoint)
         │
         ▼
5. Base execution (~ 2s):
   claimSalary() function:
   ├── Verify whitelist & stream active
   ├── accrued = flowRate × (block.timestamp - lastWithdrawnTs)
   ├── External call → EmployeeLiquidityContract (auto-repay jika ada pinjaman)
   └── 3× IERC20.transfer() atomic:
       ├── 93% → Employee address
       ├──  5% → ComplianceVault balance
       └──  2% → SeveranceVault balance
         │
         ▼
6. Alchemy webhook push event ke Backend
         │
         ▼
7. Backend update PostgreSQL (audit log, off-chain cache)
         │
         ▼
8. Frontend refresh via WebSocket/polling
   Dashboard karyawan terupdate real-time
```

---

## Storage Mapping Reference

| Storage | Lokasi Kontrak | Key | Uniqueness |
|---|---|---|---|
| `companyVaults` | `PayrollFactory` | `hr_authority address` | 1 per HR wallet |
| `vaultBalance` | `CompanyVault` | (State variable) | 1 per company vault |
| `employeeStreams` | `CompanyVault` | `employee address` | 1 per employee (per company) |
| `severanceVaults` | `CompanyVault` | `employee address` | 1 per employee (per company) |
| `complianceBalance`| `CompanyVault` | (State variable) | 1 per company vault |
| `cliffVests` | `CompanyVault` | `employee address + vestId` | Multiple per employee |
| `terminations` | `CompanyVault` | `employee address` | 1 per active proposal |
| `pools` | `EmployeeLiquidityContract`| `company address` | 1 per company |
| `lenderDeposits` | `EmployeeLiquidityContract`| `lender address` | 1 per lender |
| `loanRecords` | `EmployeeLiquidityContract`| `borrower address` | 1 active per borrower |

---

## Catatan Indexer (Ponder)

> **Keterbatasan split indexing:** Event `StreamCreated` tidak meng-emit persentase split karyawan. Akibatnya, Ponder menyimpan nilai default (93/5/2) untuk semua stream di tabel `employee_stream`. Jika HR mengkonfigurasi split custom per karyawan, kolom `employeeBps / complianceBps / severanceBps` di tabel Ponder akan menampilkan default — **bukan nilai aktual**. Jumlah distribusi yang sesungguhnya tetap akurat karena event `SalaryClaimed` meng-emit `netToEmployee`, `toCompliance`, dan `toSeverance` secara langsung dari contract.

---

## Dependencies Eksternal

| Service | Tujuan | Fallback |
|---|---|---|
| **Privy** | Wallet-as-a-Service, embedded Smart Account (ERC-4337) | Custom MPC (v2 jika Privy pricing tidak scalable) |
| **Alchemy** | RPC premium + webhook event indexer | Infura / QuickNode |
| **Pimlico / Biconomy** | ERC-4337 Paymaster — sponsor gas fee karyawan | Stackup / self-hosted Bundler |
| **IDRX** | Rupiah stablecoin ERC-20 | USDC sebagai fallback MVP (Open Question #1) |
| **OpenZeppelin AccessControl** | HR_ROLE + LEGAL_ROLE multi-sig PHK guard | Built into PayrollContract — tidak butuh external protocol; Safe Protocol dipertimbangkan tapi tidak dipakai karena menambah dependency eksternal tanpa manfaat signifikan untuk 2-of-2 flow |
| **Azure App Service** | Hosting backend Node.js + Ponder di Indonesia Central | Railway / Render sebagai fallback |
| **Datadog** | APM + monitoring | Grafana + Prometheus self-hosted |

---

## Development Environment

```bash
# Prerequisites
node >= 20
foundry (forge, cast, anvil)  # Install: curl -L https://foundry.paradigm.xyz | bash

# Install dependencies
npm install
forge install

# Compile contracts
forge build

# Run local node (Base fork)
anvil --fork-url $BASE_RPC_URL

# Run tests
forge test                              # Unit tests
forge test --fork-url $BASE_RPC_URL    # Fork tests (mainnet state)

# Deploy ke Base Sepolia testnet
forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast
```

### Project Structure

```
payroll-saas/
├── finley-payroll/                     # Foundry — Solidity contracts + tests
│   ├── src/
│   │   ├── PayrollFactory.sol          # Deploys isolated CompanyVaults
│   │   ├── CompanyVault.sol            # Single-tenant isolated vault
│   │   │   ├── fundVault() / withdrawVault()
│   │   │   ├── startStream() / pauseStream() / resumeStream() / cancelStream()
│   │   │   ├── claimSalary()           # 93/5/2 auto-split
│   │   │   ├── proposeTermination() / approveTermination() / executeTermination()
│   │   │   ├── resignEmployee()
│   │   │   ├── createCliffVest() / claimCliffVest() / cancelCliffVest()
│   │   │   └── getStreamInfo()         # cross-contract read
│   │   ├── EmployeeLiquidityContract.sol
│   │   │   ├── initializePool()
│   │   │   ├── depositToPool() / withdrawDeposit()
│   │   │   ├── borrowFromPool() / repayLoanManual()
│   │   │   ├── autoRepay()             # called by CompanyVault
│   │   │   ├── liquidateLoan()         
│   │   │   └── claimProtocolFee()      # 1% Yield cut for SuperAdmin
│   │   ├── EmploymentSBT.sol           # ERC-5192 soulbound token (FR-B03)
│   │   ├── interfaces/
│   │   │   ├── IPayroll.sol
│   │   │   ├── IEmployeeLiquidity.sol
│   │   │   └── IERC5192.sol
│   │   └── libraries/
│   │       └── PayrollMath.sol
│   ├── script/                         # Foundry deploy scripts
│   └── test/
│       ├── PayrollContract.t.sol
│       ├── EmployeeLiquidityContract.t.sol
│       ├── EmploymentSBT.t.sol
│       └── PayrollMath.t.sol
├── ponder/                             # Event indexer — schema + handlers
│   ├── ponder.config.ts                # contract addresses + RPC config
│   ├── ponder.schema.ts                # onchain tables (company, stream, claim …)
│   └── src/
│       ├── PayrollContract.ts          # event handlers for PayrollContract
│       └── EmployeeLiquidityContract.ts
├── backend/                            # Node.js — bundler relay, compliance, webhook
│   └── src/
│       ├── routes/
│       │   ├── auth.ts                 # POST /auth/login, /refresh, /logout, /profile
│       │   ├── registration.ts         # HR onboarding flow
│       │   ├── bundler.ts              # POST /bundler/relay (ERC-4337)
│       │   ├── compliance.ts           # GET /compliance/summary/:hr
│       │   └── webhook.ts              # Alchemy webhook receiver
│       └── services/
│           ├── rateLimiter.ts          # max 10 claims/hour (FR-B02)
│           ├── paymasterMonitor.ts     # alert if ETH < 0.05 (FR-B02)
│           └── liquidation.ts          # cron — overdue loan liquidation (FR-E03)
└── frontend/                           # Next.js 16 — HR & employee dashboards
    └── src/
        ├── app/
        │   ├── hr/                     # HR dashboard
        │   ├── employee/               # Employee EWA dashboard
        │   ├── legal/                  # Legal dashboard (PHK approval)
        │   ├── onboarding/             # Registrasi HR baru
        │   └── login/
        ├── hooks/
        │   └── useRole.ts              # On-chain role detection
        └── components/
```

---

## Deployed Contracts (Base Sepolia Testnet)

> Network: **Base Sepolia** (Chain ID: 84532)
> Explorer: https://sepolia.basescan.org
> Redeployed: 26 Mei 2026

| Contract | Address |
|---|---|
| `PayrollFactory` | `0x0B4BDD8fF3f9a76CA67bD16d3b25A0922A3D1Fb5` |
| `EmployeeLiquidityContract` | `0x50fcAc62A081a6212BF947298a18BdC6d1BFde4A` |
| `EmploymentSBT` | `0x009a7A5E0aFC42BE1b28d5b1907F6A32b1602e3E` |
| `IDRX (Mock)` | `0x18Bc5bcC660cf2B9cE3cd51a404aFe1a0cBD3C22` |

**BaseScan links:**
- PayrollFactory: https://sepolia.basescan.org/address/0x0B4BDD8fF3f9a76CA67bD16d3b25A0922A3D1Fb5
- EmployeeLiquidityContract: https://sepolia.basescan.org/address/0x50fcAc62A081a6212BF947298a18BdC6d1BFde4A
- EmploymentSBT: https://sepolia.basescan.org/address/0x009a7A5E0aFC42BE1b28d5b1907F6A32b1602e3E
- IDRX (Mock): https://sepolia.basescan.org/address/0x18Bc5bcC660cf2B9cE3cd51a404aFe1a0cBD3C22

**Frontend env vars (`.env.local`):**
```bash
NEXT_PUBLIC_FACTORY_ADDRESS=0x0B4BDD8fF3f9a76CA67bD16d3b25A0922A3D1Fb5
NEXT_PUBLIC_LIQUIDITY_CONTRACT_ADDRESS=0x50fcAc62A081a6212BF947298a18BdC6d1BFde4A
NEXT_PUBLIC_SBT_CONTRACT_ADDRESS=0x009a7A5E0aFC42BE1b28d5b1907F6A32b1602e3E
NEXT_PUBLIC_IDRX_ADDRESS=0x18Bc5bcC660cf2B9cE3cd51a404aFe1a0cBD3C22
NEXT_PUBLIC_CHAIN_ID=84532
```

---

## Deployment (Azure App Service — Indonesia Central)

Platform Payana di-deploy pada Azure App Service di region **Indonesia Central** untuk memastikan latensi rendah bagi pengguna Indonesia.

### Layanan yang Di-deploy

| Layanan | URL | Deskripsi |
|---|---|---|
| **Backend (Node.js/Express)** | `https://backend-payroll-g4b0b3e2akbjbxf3.indonesiacentral-01.azurewebsites.net` | REST API: auth, bundler relay, compliance, webhook |
| **Ponder (Indexer/Hono)** | `https://ponder-payroll-aucxhrb3hmhfd3fh.indonesiacentral-01.azurewebsites.net` | Event indexer REST API + Swagger UI |

### Konfigurasi Azure

```
Runtime: Node.js 20 LTS
SKU: B1 (Basic) — dapat di-upgrade ke P1v3 untuk production
Region: Indonesia Central (Jakarta)
Database: PostgreSQL Flexible Server (Azure Database)
```

### Environment Variables (Azure App Service — Application Settings)

```bash
# Backend
DATABASE_URL=postgresql://...
JWT_SECRET=...
REFRESH_TOKEN_SECRET=...
ALCHEMY_API_KEY=...
ALCHEMY_WEBHOOK_SIGNING_KEY=...
OWNER_ADDRESS=0x...
AES_ENCRYPTION_KEY=...

# Ponder
PONDER_RPC_URL_84532=https://base-sepolia.g.alchemy.com/v2/...
DATABASE_URL=postgresql://...
```

### Swagger UI (Ponder)

Dokumentasi interaktif endpoint Ponder tersedia di:
```
https://ponder-payroll-aucxhrb3hmhfd3fh.indonesiacentral-01.azurewebsites.net/api-docs
```

OpenAPI JSON schema:
```
https://ponder-payroll-aucxhrb3hmhfd3fh.indonesiacentral-01.azurewebsites.net/openapi.json
```
