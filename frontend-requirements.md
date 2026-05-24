# Frontend Requirements — Payroll SaaS Web3

> **Platform:** Next.js + Tailwind v4 + Shadcn/UI
> **Auth Dev:** Self-hosted embedded wallet + EIP-191 + JWT
> **Auth Prod:** Email OTP / Google SSO + ERC-4337 Smart Account
> **Web3:** wagmi + viem
> **Target:** Base Sepolia (Chain ID: 84532) → Base Mainnet (prod)
> **Sprint:** Sprint 6 (4 minggu) — bergantung pada Sprint 1–5 selesai

---

## 1. Tech Stack Frontend

| Layer | Library | Status | Catatan |
|---|---|---|---|
| Framework | Next.js App Router | ✅ | SSR, file-based routing |
| Styling | Tailwind CSS v4 | ✅ | |
| UI Components | Shadcn/UI | ✅ | |
| Auth — Dev | Self-hosted embedded wallet (viem) | ✅ | EOA key + EIP-191 |
| Auth — Prod | Email OTP / Google SSO + ERC-4337 | 📋 | Lihat module-b-work-id.md |
| Web3 Adapter | wagmi + viem | ✅ | |
| State | React Query (@tanstack/react-query) | ✅ | |
| Charts | Recharts | 📋 | EWA history chart |
| Language | TypeScript ≥ 5.x | ✅ | |

---

## 2. Routing & Halaman

```
/                        → Landing / Redirect ke /login
/login                   → Auth page (email OTP, Google SSO, SMS)
/hr/                     → HR Dashboard root (hanya HR_ROLE)
  /hr/onboarding         → Setup vault pertama kali
  /hr/vault              → Vault management & top-up
  /hr/employees          → Daftar karyawan aktif + stream
  /hr/employees/add      → Tambah karyawan baru
  /hr/employees/[id]     → Detail & aksi per karyawan
  /hr/phk                → Proses PHK (propose, approve, execute)
  /hr/compliance         → ComplianceVault BPJS/PPh21 & export CSV
  /hr/vesting            → Cliff vesting management
  /hr/koperasi           → Pool koperasi management (HR view)
/employee/               → Employee Dashboard root
  /employee/ewa          → EWA live tracker & claim
  /employee/severance    → Saldo pesangon on-chain
  /employee/vesting      → Cliff vest & countdown bonus
  /employee/koperasi     → Pinjam / deposit koperasi
  /employee/transfer     → Transfer IDRX ke wallet eksternal
```

---

## 3. UX Principles (Wajib Diterapkan di Semua Halaman)

- **Zero Web3 jargon** — tidak ada kata "wallet", "private key", "gas", "transaction hash" yang ditampilkan tanpa penjelasan kontekstual
- **Silent signing** — semua transaksi EWA claim dilakukan via Privy `noPromptOnSignature: true`; tidak ada popup "approve tx"
- **IDRX selalu ditampilkan dalam Rupiah** — format: `Rp 1.666.667` bukan `1666667e18`
- **Mobile-first** — layout responsif, aksi utama (Tarik Gaji, Pinjam) harus accessible dengan 1 tap di layar HP
- **Real-time feedback** — setelah setiap aksi on-chain, UI refresh via polling atau WebSocket tanpa reload halaman
- **Status transaksi** — setiap aksi on-chain wajib tampilkan loading state → success/error state dengan pesan yang dapat dimengerti non-teknis

---

## 4. Auth Flow (`/login`)

### Deskripsi
Halaman login tunggal untuk semua role (HR, Karyawan, Legal). Setelah login, sistem mendeteksi role via on-chain mapping dan redirect ke dashboard yang sesuai.

### Requirements — Dev Build (Implemented)

| ID | Requirement | Status |
|---|---|---|
| FE-AUTH-01 | Generate EOA key di browser (localStorage) jika belum ada | ✅ |
| FE-AUTH-02 | Sign EIP-191 challenge → POST /auth/login → dapat JWT | ✅ |
| FE-AUTH-03 | Check `HR_ROLE` on-chain → redirect /hr | ✅ |
| FE-AUTH-04 | Fallback ke "employee" jika bukan HR | ✅ |
| FE-AUTH-05 | **[BUG]** LEGAL_ROLE tidak dicek — legal officer mendaratkan di /employee | ❌ Fix needed |
| FE-AUTH-06 | Menampilkan Work ID address (disingkat) di login page | ✅ |

### Requirements — Production

| ID | Requirement | Priority |
|---|---|---|
| FE-AUTH-P01 | Tampilkan 3 opsi login: Email OTP, Google SSO, WhatsApp OTP | P0 |
| FE-AUTH-P02 | Fix LEGAL_ROLE detection di `useRole.ts` — tambahkan check setelah HR | P0 |
| FE-AUTH-P03 | Redirect priority: HR → /hr, Legal → /legal, Employee → /employee | P0 |
| FE-AUTH-P04 | Jika address tidak terdaftar → tampilkan "Akun belum terdaftar, hubungi HR" | P0 |
| FE-AUTH-P05 | Work ID dibuat otomatis via key generation — tidak ditampilkan kecuali diminta | P0 |
| FE-AUTH-P06 | 2FA prompt (TOTP) setelah login berhasil, jika user sudah setup 2FA | P1 |

### State yang Perlu Dihandle

```
Unauthenticated → Landing di /login
Authenticated → Cek role on-chain
  ├── HR_ROLE on-chain → /hr
  ├── LEGAL_ROLE on-chain → /legal           ← [production fix]
  ├── employeeStreams[address].flowRate > 0 → /employee
  └── Tidak dikenali → "Akun belum terdaftar, hubungi HR"
```

---

## 5. HR Dashboard

### 5.1 Onboarding Vault (`/hr/onboarding`)

Halaman ini hanya muncul jika HR belum pernah deploy vault (companies mapping kosong).

| ID | Requirement | Priority |
|---|---|---|
| FE-HR-OB-01 | Form input: Nama Perusahaan, NPWP, Email PIC | P0 |
| FE-HR-OB-02 | Form konfigurasi: BPJS Bps (default 500), PPh21 Bps (default 200), Severance Bps (default 200), Low Balance Alert Bps | P0 |
| FE-HR-OB-03 | Tombol "Deploy Vault" → call `initializeVault()` via UserOperation (ERC-4337, gasless) | P0 |
| FE-HR-OB-04 | Setelah deploy berhasil, tampilkan form deposit IDRX (minimal = estimasi gaji 1 bulan) | P0 |
| FE-HR-OB-05 | Tombol "Deposit IDRX" → call `IERC20.approve()` lalu `fundVault()` | P0 |
| FE-HR-OB-06 | Progress stepper: Registrasi → Deploy Vault → Deposit IDRX → Konfigurasi → Selesai | P1 |
| FE-HR-OB-07 | Validasi form: NPWP format 15 digit, semua Bps harus integer, totalSplitBps ≠ 10000 → error | P0 |

---

### 5.2 Vault Management (`/hr/vault`)

Halaman utama HR setelah onboarding selesai.

| ID | Requirement | Priority |
|---|---|---|
| FE-HR-VT-01 | Tampilkan saldo vault saat ini dalam Rupiah (Rp xxx.xxx.xxx) | P0 |
| FE-HR-VT-02 | Tampilkan estimasi waktu vault habis berdasarkan burn rate (total flowRate × detik/hari) | P1 |
| FE-HR-VT-03 | Banner peringatan kuning jika vault balance < 20% kebutuhan bulanan | P0 |
| FE-HR-VT-04 | Banner peringatan merah jika vault balance < 10% kebutuhan bulanan | P0 |
| FE-HR-VT-05 | Tombol "Top Up Vault" → input amount → `IERC20.approve()` + `fundVault()` | P0 |
| FE-HR-VT-06 | Tombol "Pause Vault" → konfirmasi modal → `pauseVault()` | P1 |
| FE-HR-VT-07 | Tombol "Resume Vault" (jika paused) → `resumeVault()` | P1 |
| FE-HR-VT-08 | Tampilkan status vault: Active / Paused / Frozen dengan badge warna | P0 |
| FE-HR-VT-09 | Form "Edit Konfigurasi" untuk update bpjsBps dan pph21Bps → `setCompanyConfig()` | P1 |
| FE-HR-VT-10 | Riwayat top-up: tanggal, jumlah, tx hash (link ke Basescan) | P1 |

---

### 5.3 Manajemen Karyawan (`/hr/employees`)

| ID | Requirement | Priority |
|---|---|---|
| FE-HR-EMP-01 | Tabel karyawan aktif: nama, email, gaji/bulan (Rp), status stream, saldo terakru saat ini | P0 |
| FE-HR-EMP-02 | Search & filter tabel: cari nama/email, filter status (Active, Paused, Cancelled) | P1 |
| FE-HR-EMP-03 | Tombol "Tambah Karyawan" → modal form: email, gaji bulanan, tanggal mulai, split custom (opsional) | P0 |
| FE-HR-EMP-04 | Submit tambah karyawan → sistem hitung flowRate (gaji / 2.592.000) → `startStream()` | P0 |
| FE-HR-EMP-05 | Di tabel, per baris ada tombol: Pause Stream, Resume Stream, Edit Gaji, PHK | P0 |
| FE-HR-EMP-06 | Tombol "Pause Stream" → konfirmasi → `pauseStream(employee)` | P0 |
| FE-HR-EMP-07 | Tombol "Resume Stream" → `resumeStream(employee)` | P0 |
| FE-HR-EMP-08 | Tombol "Edit Gaji" → modal input nominal baru → tampilkan flowRate baru → `updateFlowRate()` | P1 |
| FE-HR-EMP-09 | Saldo terakru per karyawan dihitung di frontend: `flowRate × (now - lastWithdrawnTs)` | P0 |
| FE-HR-EMP-10 | Tampilkan saldo pesangon (severanceVault.amount) per karyawan di tabel | P1 |

#### Halaman Detail Karyawan (`/hr/employees/[id]`)

| ID | Requirement | Priority |
|---|---|---|
| FE-HR-EMP-11 | Info lengkap: nama, email, Work ID address (dapat disalin), tanggal mulai, gaji, tenure months | P0 |
| FE-HR-EMP-12 | Grafik akumulasi gaji vs waktu (line chart, 30 hari terakhir) | P1 |
| FE-HR-EMP-13 | Riwayat claim gaji: tanggal, jumlah gross, distribusi 93/5/2, tx hash | P1 |
| FE-HR-EMP-14 | Daftar cliff vest aktif milik karyawan ini | P1 |
| FE-HR-EMP-15 | Tombol "Resign Karyawan" → konfirmasi → `resignEmployee()` → severance state RETURNED | P0 |

---

### 5.4 Proses PHK (`/hr/phk`)

| ID | Requirement | Priority |
|---|---|---|
| FE-HR-PHK-01 | Daftar proposal PHK aktif: nama karyawan, tanggal propose, status approval HR, status approval Legal, countdown expire | P0 |
| FE-HR-PHK-02 | Tombol "Buat Proposal PHK" → pilih karyawan dari dropdown → input alasan (disimpan off-chain) → `proposeTermination()` | P0 |
| FE-HR-PHK-03 | Tombol "Setujui (HR)" → `approveTermination()` via HR address | P0 |
| FE-HR-PHK-04 | Jika msg.sender adalah LEGAL_ROLE, tampilkan tombol "Setujui (Legal)" → `approveTermination()` | P0 |
| FE-HR-PHK-05 | Setelah hrApproved AND legalApproved → tampilkan tombol "Eksekusi PHK" → `executeTermination()` | P0 |
| FE-HR-PHK-06 | Badge status visual: Menunggu HR / Menunggu Legal / Siap Eksekusi / Expired | P0 |
| FE-HR-PHK-07 | Countdown timer live sampai proposal expired (7 hari dari propose) | P1 |
| FE-HR-PHK-08 | Setelah execute, tampilkan konfirmasi: "Pesangon Rp X cair ke karyawan. Tx: [link Basescan]" | P0 |

---

### 5.5 Compliance Report (`/hr/compliance`)

| ID | Requirement | Priority |
|---|---|---|
| FE-HR-COMP-01 | Total akumulasi ComplianceVault bulan ini (Rp) | P0 |
| FE-HR-COMP-02 | Breakdown estimasi: BPJS Kesehatan, BPJS Ketenagakerjaan, PPh21 (sesuai konfigurasi Bps) | P0 |
| FE-HR-COMP-03 | Tabel per karyawan: nama, total claim bulan ini, estimasi BPJS, estimasi PPh21 | P0 |
| FE-HR-COMP-04 | Tombol "Export CSV" → download laporan bulan berjalan (via backend endpoint `GET /compliance/export/:hr`) | P0 |
| FE-HR-COMP-05 | Filter bulan (dropdown) untuk melihat data historis | P1 |
| FE-HR-COMP-06 | Catatan jelas: "Transfer ke DJP/BPJS dilakukan manual. Gunakan laporan ini sebagai referensi." | P0 |

---

### 5.6 Cliff Vesting (`/hr/vesting`)

| ID | Requirement | Priority |
|---|---|---|
| FE-HR-VEST-01 | Tabel semua cliff vest aktif: karyawan, tipe vest, jumlah (Rp), cliff date, status (LOCKED/VESTED/CLAIMED/FORFEITED) | P1 |
| FE-HR-VEST-02 | Tombol "Buat Cliff Vest" → form: pilih karyawan, jumlah IDRX, cliff date, tipe (Retention/Probation/ESOP) → `createCliffVest()` | P1 |
| FE-HR-VEST-03 | Validasi: jumlah ≤ saldo vault, cliff date > hari ini | P1 |
| FE-HR-VEST-04 | Tombol "Batalkan Vest" (jika karyawan resign/PHK) → konfirmasi → `cancelCliffVest()` | P1 |
| FE-HR-VEST-05 | Tampilkan notifikasi jika ada vest yang statusnya VESTED (cliff sudah terlewat, belum di-claim karyawan) | P1 |

---

### 5.7 Koperasi — HR View (`/hr/koperasi`)

| ID | Requirement | Priority |
|---|---|---|
| FE-HR-KOP-01 | Tampilkan status pool: total deposit, total pinjaman outstanding, likuiditas tersedia | P1 |
| FE-HR-KOP-02 | Tombol "Inisiasi Pool" (jika pool belum ada) → input interest rate Bps (default 150 = 1.5%) → `initializePool()` | P1 |
| FE-HR-KOP-03 | Tabel pinjaman aktif: nama peminjam, jumlah pinjaman, due date, status repayment | P1 |
| FE-HR-KOP-04 | Tombol "Liquidasi" (jika loan overdue > 7 hari) → konfirmasi → call backend `/liquidation` | P1 |

---

## 6. Employee Dashboard

### 6.1 EWA Live Tracker (`/employee/ewa`)

Ini adalah halaman utama karyawan — paling sering diakses.

| ID | Requirement | Priority |
|---|---|---|
| FE-EMP-EWA-01 | Angka besar di tengah: saldo EWA terakru saat ini (update setiap detik via JS interval) | P0 |
| FE-EMP-EWA-02 | Sub-teks di bawah angka: "~Rp X / detik" (flow rate dalam satuan Rupiah/detik) | P1 |
| FE-EMP-EWA-03 | Tombol "Tarik Gaji" (CTA utama, besar, di tengah) | P0 |
| FE-EMP-EWA-04 | Klik "Tarik Gaji" → silent sign via Privy `noPromptOnSignature: true` → submit UserOperation ke backend bundler → loading state → success toast | P0 |
| FE-EMP-EWA-05 | Setelah berhasil: angka EWA reset ke 0, tampilkan breakdown: "Rp X masuk ke dompet Anda, Rp Y ke BPJS/Pajak, Rp Z ke pesangon" | P0 |
| FE-EMP-EWA-06 | Riwayat claim: tabel tanggal, jumlah gross, jumlah bersih yang diterima, tx hash (link Basescan) | P1 |
| FE-EMP-EWA-07 | Jika stream paused: tampilkan banner "Stream gaji sedang dijeda oleh HR." (tidak ada tombol Tarik Gaji) | P0 |
| FE-EMP-EWA-08 | Tampilkan Work ID address (Ethereum address) dengan tombol salin — labelnya "ID Dompet Anda" bukan "wallet address" | P1 |

---

### 6.2 Saldo Pesangon (`/employee/severance`)

| ID | Requirement | Priority |
|---|---|---|
| FE-EMP-SEV-01 | Tampilkan saldo pesangon terakumulasi (Rp) dengan state badge: LOCKED / RETURNED / RELEASED | P0 |
| FE-EMP-SEV-02 | Jika LOCKED: teks informatif "Dana pesangon Anda terjamin on-chain. Akan cair jika terjadi PHK." | P0 |
| FE-EMP-SEV-03 | Jika RELEASED: tampilkan jumlah yang dicairkan + tanggal + tx hash (link Basescan) | P0 |
| FE-EMP-SEV-04 | Grafik akumulasi pesangon per bulan (bar chart) | P2 |
| FE-EMP-SEV-05 | Informasi tenure: "Masa kerja Anda: X bulan. Hak pesangon per UU Cipta Kerja Pasal 156: Y × gaji bulanan." | P1 |

---

### 6.3 Cliff Vesting — Employee View (`/employee/vesting`)

| ID | Requirement | Priority |
|---|---|---|
| FE-EMP-VEST-01 | Kartu per cliff vest: tipe (Bonus Retensi / Masa Percobaan / ESOP), jumlah (Rp), cliff date | P1 |
| FE-EMP-VEST-02 | Countdown timer visual sampai cliff date | P1 |
| FE-EMP-VEST-03 | Jika cliff date belum tercapai: tombol "Claim" disabled dengan tooltip "Tersedia pada [tanggal]" | P1 |
| FE-EMP-VEST-04 | Jika cliff date sudah tercapai: tombol "Claim Bonus" aktif → `claimCliffVest(vestId)` | P1 |
| FE-EMP-VEST-05 | Jika tidak ada vest aktif: tampilkan state kosong "Belum ada bonus terdaftar." | P1 |

---

### 6.4 Koperasi — Employee View (`/employee/koperasi`)

| ID | Requirement | Priority |
|---|---|---|
| FE-EMP-KOP-01 | Dua tab: "Pinjam Dana" dan "Simpan Dana" | P1 |
| **Tab Pinjam** | | |
| FE-EMP-KOP-02 | Tampilkan max pinjaman yang tersedia: "Maks Rp X (80% gaji bulan depan)" | P1 |
| FE-EMP-KOP-03 | Input nominal pinjaman dengan slider dan input field | P1 |
| FE-EMP-KOP-04 | Tampilkan ringkasan: "Pinjam Rp X, bunga 1.5%, total kembalikan Rp Y, cicilan otomatis saat tarik gaji" | P1 |
| FE-EMP-KOP-05 | Tombol "Pinjam Sekarang" → `borrowFromPool()` → dana masuk ke Work ID address | P1 |
| FE-EMP-KOP-06 | Jika ada pinjaman aktif: tampilkan saldo outstanding, due date, progress repayment (progress bar) | P1 |
| FE-EMP-KOP-07 | Tombol "Bayar Manual" → input amount → `repayLoanManual()` | P1 |
| **Tab Simpan** | | |
| FE-EMP-KOP-08 | Tampilkan yield rate pool: "1.5% / 30 hari" | P1 |
| FE-EMP-KOP-09 | Input jumlah deposit dengan estimasi yield per bulan | P1 |
| FE-EMP-KOP-10 | Tombol "Deposit" → `depositToPool()` | P1 |
| FE-EMP-KOP-11 | Tampilkan saldo deposit aktif + yield earned saat ini | P1 |
| FE-EMP-KOP-12 | Tombol "Tarik Simpanan" → validasi likuiditas pool → `withdrawDeposit()` | P1 |

---

### 6.5 Transfer ke Wallet Eksternal (`/employee/transfer`)

| ID | Requirement | Priority |
|---|---|---|
| FE-EMP-TRF-01 | Input alamat tujuan (EVM address) + jumlah IDRX | P1 |
| FE-EMP-TRF-02 | Validasi: alamat valid EVM format (0x..., 42 karakter), jumlah ≤ saldo Work ID | P1 |
| FE-EMP-TRF-03 | Preview transaksi sebelum kirim: dari, ke, jumlah, estimasi gas (~$0.01) | P1 |
| FE-EMP-TRF-04 | Tombol "Kirim" → `IERC20.transfer()` via wagmi → tampilkan tx hash + link Basescan | P1 |
| FE-EMP-TRF-05 | Riwayat transfer: tabel tanggal, alamat tujuan (disingkat), jumlah, status | P1 |
| FE-EMP-TRF-06 | Panduan singkat cara menambahkan IDRX ke MetaMask (collapsible section) | P2 |

---

## 7. Komponen Shared (Reusable)

| Komponen | Deskripsi | Digunakan Di |
|---|---|---|
| `<IDRXAmount />` | Format angka IDRX wei → `Rp X.XXX.XXX` | Semua halaman |
| `<TxStatusToast />` | Toast notification: pending → success/error dengan tx hash | Semua halaman yang ada transaksi |
| `<OnChainLink />` | Link ke Basescan dengan icon eksternal | Semua riwayat transaksi |
| `<StreamCounter />` | Angka real-time yang bergerak setiap detik (EWA accrued) | `/employee/ewa` |
| `<VaultStatusBadge />` | Badge Active/Paused/Frozen dengan warna | `/hr/vault`, `/hr/employees` |
| `<SeveranceBadge />` | Badge LOCKED/RETURNED/RELEASED | `/hr/employees/[id]`, `/employee/severance` |
| `<CliffCountdown />` | Countdown hari:jam:menit sampai cliff date | `/employee/vesting`, `/hr/vesting` |
| `<ConfirmModal />` | Modal konfirmasi untuk semua aksi destruktif (PHK, pause, resign) | HR Dashboard |
| `<EmptyState />` | State kosong dengan ilustrasi dan CTA | Semua list/tabel kosong |

---

## 8. Integrasi Web3

### Embedded Wallet — Dev Build (Current)

```typescript
// src/lib/wallet.ts
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

// First visit: generate EOA key → localStorage
// Return visits: load existing key
export function loadOrCreateWallet(): LocalWallet {
  let pk = localStorage.getItem("finley_wallet_pk");
  if (!pk) {
    pk = generatePrivateKey();
    localStorage.setItem("finley_wallet_pk", pk);
  }
  return buildWallet(pk as `0x${string}`);
}
```

### Embedded Wallet — Production Target

```typescript
// src/lib/wallet.ts (production)
// Key dienkripsi dengan AES-256-GCM sebelum disimpan di localStorage
// Kunci enkripsi diturunkan dari user PIN via WebCrypto PBKDF2

async function encryptAndStore(privateKey: string, pin: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw",
    new TextEncoder().encode(pin), "PBKDF2", false, ["deriveKey"]);
  const aesKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, aesKey, new TextEncoder().encode(privateKey));
  localStorage.setItem("finley_wallet_enc", JSON.stringify({
    encrypted: Array.from(new Uint8Array(encrypted)),
    iv: Array.from(iv), salt: Array.from(salt),
  }));
}
```

### Env Variables (`.env.local`)

```bash
# Contracts (Base Sepolia)
NEXT_PUBLIC_PAYROLL_CONTRACT_ADDRESS=0x05b1DF6d82356CC256D1265cD185B4222E4745b3
NEXT_PUBLIC_LIQUIDITY_CONTRACT_ADDRESS=0x872af14287370BAFC883237EF390E367d38a8A33
NEXT_PUBLIC_SBT_CONTRACT_ADDRESS=0xCB5118AF36907165496Dc028b441ad9152D2D264
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Production tambahan
NEXT_PUBLIC_ENTRY_POINT_ADDRESS=0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
NEXT_PUBLIC_SMART_ACCOUNT_FACTORY=<factory_address>
```

### Flow EWA Claim — Dev (Current)

```typescript
// useContractWrite.ts — direct EOA tx (karyawan bayar gas sendiri)
const hash = await walletClient.writeContract({
  address: PAYROLL_CONTRACT_ADDRESS,
  abi: PayrollContractABI,
  functionName: 'claimSalary',
  account: walletAddress,
});
```

### Flow EWA Claim — Production (Target)

```typescript
// Gasless via ERC-4337 UserOperation
const calldata = encodeFunctionData({
  abi: PayrollContractABI,
  functionName: 'claimSalary',
});

// Build UserOperation
const userOp = {
  sender: smartAccountAddress,
  nonce: await entryPoint.getNonce(smartAccountAddress, 0n),
  callData: calldata,
  paymasterAndData: paymasterAddress,
};

// Sign & relay via backend bundler
const res = await fetch(`${BACKEND_URL}/bundler/relay`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ userOp, entryPoint: ENTRY_POINT_ADDRESS }),
});
const { userOpHash } = await res.json();
// Poll /bundler/status/:userOpHash untuk konfirmasi
```

---

## 9. Role Guard

```typescript
// src/middleware.ts atau via layout.tsx
// Deteksi role saat pertama kali load

async function detectRole(address: string): Promise<'hr' | 'employee' | 'unknown'> {
  const company = await publicClient.readContract({
    address: PAYROLL_CONTRACT_ADDRESS,
    abi: PayrollContractABI,
    functionName: 'companies',
    args: [address],
  });
  if (company.status !== VaultStatus.Uninitialized) return 'hr';

  const stream = await publicClient.readContract({
    address: PAYROLL_CONTRACT_ADDRESS,
    abi: PayrollContractABI,
    functionName: 'employeeStreams',
    args: [address],
  });
  if (stream.flowRate > 0n) return 'employee';

  return 'unknown';
}
```

---

## 10. Error States yang Harus Ditangani

| Error On-Chain | Pesan yang Ditampilkan ke User |
|---|---|
| `InsufficientVaultBalance` | "Saldo perusahaan tidak mencukupi. Hubungi HR untuk top-up vault." |
| `StreamNotActive` | "Stream gaji Anda sedang dijeda. Hubungi HR." |
| `NotWhitelisted` | "Akun Anda belum terdaftar. Hubungi HR." |
| `NotVestedYet` | "Bonus belum bisa diclaim. Cliff date: [tanggal]." |
| `InsufficientPoolLiquidity` | "Pool koperasi sedang tidak cukup likuiditas. Coba lagi nanti." |
| `ProposalExpired` | "Proposal PHK sudah kedaluwarsa. Buat proposal baru." |
| Paymaster low balance | (Internal alert ke ops — tidak ditampilkan ke user) |
| Rate limit exceeded | "Anda sudah melakukan terlalu banyak penarikan. Coba lagi dalam 1 jam." |

---

## 11. Non-Functional Requirements (Frontend)

| NFR | Target |
|---|---|
| **Performance** | Halaman utama EWA load < 2 detik (LCP) |
| **Mobile** | Layout responsif — diuji di iPhone SE (375px) dan Samsung Galaxy A (360px) |
| **Browser** | Chrome 120+, Safari 16+, Firefox 120+ |
| **Aksesibilitas** | Semua tombol aksi memiliki aria-label yang deskriptif |
| **Error Boundary** | Setiap page dibungkus ErrorBoundary — kegagalan Web3 tidak crash seluruh app |
| **Loading State** | Skeleton loading untuk semua data yang di-fetch dari chain/backend |
| **Transaction UX** | Timeout 30 detik — jika tx tidak confirm, tampilkan "Transaksi memerlukan waktu lebih lama dari biasanya" |
| **Offline** | Jika tidak ada koneksi, tampilkan banner "Tidak ada koneksi internet." |

---

## 12. Deliverable per Sprint 6

| Task | Estimasi |
|---|---|
| Login + Auth + Role detection | 1 hari |
| HR: Onboarding Vault | 1 hari |
| HR: Vault Management + Karyawan List | 2 hari |
| HR: PHK Flow | 1 hari |
| HR: Compliance Report + CSV Export | 1 hari |
| HR: Cliff Vesting | 1 hari |
| Employee: EWA Tracker (real-time counter + claim) | 2 hari |
| Employee: Severance + Vesting + Transfer | 1 hari |
| Employee: Koperasi (pinjam + simpan) | 2 hari |
| Shared components + polish | 1 hari |
| E2E testing semua flow di Base Sepolia | 2 hari |
| **Total** | **~15 hari (4 minggu)** |
