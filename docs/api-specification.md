# Spesifikasi API — Payana Platform Payroll Web3

---

## Informasi Umum

Dokumen ini merupakan spesifikasi lengkap seluruh endpoint REST API yang tersedia pada platform Payana. API dibagi menjadi dua kelompok layanan:

1. **Backend REST API** — Dikelola oleh layanan Node.js/Express, menangani autentikasi, manajemen registrasi, bundler ERC-4337, kepatuhan, dan webhook.
2. **Ponder REST API** — Dikelola oleh layanan Ponder (Hono), menyajikan data terindeks dari blockchain secara *real-time*.

### Base URL

| Layanan | Base URL |
|---|---|
| **Backend** | `https://backend-payroll-g4b0b3e2akbjbxf3.indonesiacentral-01.azurewebsites.net` |
| **Ponder** | `https://ponder-payroll-aucxhrb3hmhfd3fh.indonesiacentral-01.azurewebsites.net` |

### Konvensi Umum

- Seluruh request dan response menggunakan format **JSON** (`Content-Type: application/json`), kecuali dinyatakan lain.
- Timestamp menggunakan format **Unix epoch** (detik) atau **ISO 8601** sesuai konteks masing-masing endpoint.
- Autentikasi menggunakan skema **Bearer Token** (JWT) pada header `Authorization: Bearer <accessToken>`.
- Alamat Ethereum ditulis dalam format **checksum address** (EIP-55), contoh: `0xAbCd...`.

### Kode Status HTTP

| Kode | Keterangan |
|---|---|
| `200 OK` | Permintaan berhasil diproses |
| `201 Created` | Sumber daya baru berhasil dibuat |
| `400 Bad Request` | Parameter request tidak valid atau tidak lengkap |
| `401 Unauthorized` | Token tidak ada, tidak valid, atau sudah kedaluwarsa |
| `403 Forbidden` | Token valid namun tidak memiliki hak akses yang diperlukan |
| `404 Not Found` | Sumber daya yang diminta tidak ditemukan |
| `409 Conflict` | Terjadi konflik data, misalnya registrasi duplikat |
| `500 Internal Server Error` | Kesalahan pada sisi server |

---

## Bagian 1: Backend REST API

### 1.1 Autentikasi (`/auth`)

---

#### POST /auth/login

**Deskripsi:** Melakukan autentikasi pengguna berbasis tanda tangan kriptografi EIP-191. Frontend (Privy embedded wallet) menandatangani pesan terstruktur, kemudian backend memverifikasi tanda tangan menggunakan library `viem`. Jika valid, server menerbitkan `accessToken` (JWT, berlaku 15 menit) dan `refreshToken` (JWT, berlaku 7 hari).

**Autentikasi:** Public (tidak memerlukan token)

**Request Body:**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `address` | `string` | Ya | Alamat Ethereum pengguna (checksum address) |
| `message` | `string` | Ya | Pesan yang ditandatangani, format: `"Sign in to Payana\nTimestamp: {unix_seconds}"` |
| `signature` | `string` | Ya | Hasil EIP-191 `personal_sign` dari wallet Privy |
| `timestamp` | `number` | Ya | Unix timestamp (detik) saat tanda tangan dibuat |

**Contoh Request Body:**
```json
{
  "address": "0xAbCd1234...",
  "message": "Sign in to Payana\nTimestamp: 1748304000",
  "signature": "0x4a3b...",
  "timestamp": 1748304000
}
```

**Response (200 OK):**

| Field | Tipe | Keterangan |
|---|---|---|
| `accessToken` | `string` | JWT berlaku 15 menit |
| `refreshToken` | `string` | JWT berlaku 7 hari, disimpan di database |

**Contoh Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Error:**

| Kode | Pesan | Penyebab |
|---|---|---|
| `400` | `"Field address, message, signature, dan timestamp wajib diisi"` | Salah satu field tidak ada |
| `401` | `"Signature tidak valid"` | Hasil pemulihan alamat tidak cocok dengan `address` |
| `401` | `"Timestamp kedaluwarsa"` | Selisih `|now - timestamp| > 300 detik` (replay protection) |

---

#### POST /auth/refresh

**Deskripsi:** Memperbarui `accessToken` yang sudah kedaluwarsa menggunakan `refreshToken` yang masih valid. Backend memvalidasi `refreshToken` terhadap data yang tersimpan di database PostgreSQL.

**Autentikasi:** Public (menggunakan `refreshToken` sebagai kredensial)

**Request Body:**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `refreshToken` | `string` | Ya | Refresh token yang diterbitkan saat login |

**Contoh Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**

| Field | Tipe | Keterangan |
|---|---|---|
| `accessToken` | `string` | JWT baru berlaku 15 menit |

**Contoh Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Error:**

| Kode | Pesan | Penyebab |
|---|---|---|
| `400` | `"refreshToken wajib diisi"` | Field tidak ada dalam body |
| `401` | `"Refresh token tidak valid atau sudah kedaluwarsa"` | Token tidak ditemukan di DB atau sudah expired |

---

#### POST /auth/logout

**Deskripsi:** Mencabut (revoke) `refreshToken` dari database sehingga tidak dapat digunakan kembali untuk memperbarui sesi. `accessToken` yang masih aktif tetap berlaku hingga kedaluwarsa secara alami (15 menit).

**Autentikasi:** Bearer JWT (`requireAuth`)

**Request Body:** Tidak ada

**Response (200 OK):**
```json
{
  "message": "Logout berhasil"
}
```

**Response Error:**

| Kode | Pesan | Penyebab |
|---|---|---|
| `401` | `"Token tidak valid atau tidak ditemukan"` | Header Authorization tidak ada atau token expired |

---

#### POST /auth/profile

**Deskripsi:** Menyimpan atau memperbarui data profil pengguna (nama, NIK, nomor telepon). Data sensitif seperti NIK dan nomor telepon dienkripsi menggunakan algoritma AES-256-GCM sebelum disimpan ke database.

**Autentikasi:** Bearer JWT (`requireAuth`)

**Request Body:**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `name` | `string` | Ya | Nama lengkap pengguna |
| `nik` | `string` | Ya | Nomor Induk Kependudukan (16 digit) |
| `phone` | `string` | Ya | Nomor telepon pengguna |

**Contoh Request Body:**
```json
{
  "name": "Budi Santoso",
  "nik": "3174012345678901",
  "phone": "08123456789"
}
```

**Response (200 OK):**
```json
{
  "message": "Profil berhasil disimpan"
}
```

**Response Error:**

| Kode | Pesan | Penyebab |
|---|---|---|
| `400` | `"Field name, nik, dan phone wajib diisi"` | Salah satu field tidak ada |
| `401` | `"Token tidak valid"` | JWT tidak valid atau expired |

---

#### GET /auth/profile

**Deskripsi:** Mengambil data profil pengguna yang sedang login. Data terenkripsi (NIK, nomor telepon) didekripsi secara otomatis oleh server sebelum dikirimkan ke klien.

**Autentikasi:** Bearer JWT (`requireAuth`)

**Request Body:** Tidak ada

**Response (200 OK):**

| Field | Tipe | Keterangan |
|---|---|---|
| `address` | `string` | Alamat Ethereum pengguna |
| `name` | `string` | Nama lengkap |
| `nik` | `string` | NIK (didekripsi dari AES-256-GCM) |
| `phone` | `string` | Nomor telepon (didekripsi) |

**Contoh Response:**
```json
{
  "address": "0xAbCd1234...",
  "name": "Budi Santoso",
  "nik": "3174012345678901",
  "phone": "08123456789"
}
```

**Response Error:**

| Kode | Pesan | Penyebab |
|---|---|---|
| `401` | `"Token tidak valid"` | JWT tidak valid atau expired |
| `404` | `"Profil tidak ditemukan"` | Pengguna belum mengisi profil |

---

### 1.2 Registrasi HR (`/registration`)

---

#### POST /registration/request

**Deskripsi:** Mengirimkan permohonan registrasi sebagai HR (Human Resources) baru pada platform Payana. Permohonan akan masuk ke antrian menunggu persetujuan dari Owner SaaS. Status awal adalah `"pending"`.

**Autentikasi:** Public (tidak memerlukan token)

**Request Body:**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `address` | `string` | Ya | Alamat Ethereum calon HR |
| `email` | `string` | Ya | Alamat email untuk notifikasi |
| `name` | `string` | Ya | Nama lengkap atau nama perusahaan |

**Contoh Request Body:**
```json
{
  "address": "0xAbCd1234...",
  "email": "hr@perusahaan.com",
  "name": "PT Maju Bersama"
}
```

**Response (201 Created):**
```json
{
  "message": "Permohonan registrasi berhasil dikirim. Menunggu persetujuan admin.",
  "status": "pending"
}
```

**Response Error:**

| Kode | Pesan | Penyebab |
|---|---|---|
| `400` | `"Field address, email, dan name wajib diisi"` | Salah satu field tidak ada |
| `409` | `"Permohonan untuk alamat ini sudah ada"` | Alamat sudah pernah mendaftar |

---

#### GET /registration/status/:address

**Deskripsi:** Memeriksa status permohonan registrasi untuk alamat Ethereum tertentu. Dapat digunakan oleh calon HR untuk memantau perkembangan permohonan mereka.

**Autentikasi:** Public (tidak memerlukan token)

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `address` | `string` | Alamat Ethereum yang ingin diperiksa statusnya |

**Response (200 OK):**

| Field | Tipe | Keterangan |
|---|---|---|
| `status` | `string` | Salah satu dari: `"none"`, `"pending"`, `"approved"`, `"rejected"` |

**Contoh Response:**
```json
{
  "status": "pending"
}
```

**Keterangan Nilai Status:**

| Nilai | Keterangan |
|---|---|
| `"none"` | Tidak ada permohonan untuk alamat tersebut |
| `"pending"` | Permohonan sudah diterima, menunggu review Owner |
| `"approved"` | Permohonan disetujui; HR dapat men-deploy CompanyVault |
| `"rejected"` | Permohonan ditolak oleh Owner SaaS |

**Response Error:**

| Kode | Pesan | Penyebab |
|---|---|---|
| `400` | `"Alamat tidak valid"` | Format alamat Ethereum tidak valid |

---

#### GET /registration/pending

**Deskripsi:** Mengambil daftar seluruh permohonan registrasi yang berstatus `"pending"`. Endpoint ini hanya dapat diakses oleh Owner SaaS untuk melakukan review dan tindakan persetujuan.

**Autentikasi:** Bearer JWT (`requireOwner`) — `req.address` harus sama dengan `OWNER_ADDRESS` di environment variable

**Request Body:** Tidak ada

**Response (200 OK):**

Array objek `PendingRegistration`:

| Field | Tipe | Keterangan |
|---|---|---|
| `address` | `string` | Alamat Ethereum calon HR |
| `email` | `string` | Email yang didaftarkan |
| `name` | `string` | Nama calon HR atau perusahaan |
| `createdAt` | `string` | Waktu permohonan dibuat (ISO 8601) |

**Contoh Response:**
```json
[
  {
    "address": "0xAbCd1234...",
    "email": "hr@perusahaan.com",
    "name": "PT Maju Bersama",
    "createdAt": "2026-05-26T10:00:00.000Z"
  }
]
```

**Response Error:**

| Kode | Pesan | Penyebab |
|---|---|---|
| `401` | `"Token tidak valid"` | JWT tidak valid atau expired |
| `403` | `"Akses ditolak. Hanya Owner SaaS yang diizinkan"` | Address JWT bukan OWNER_ADDRESS |

---

#### PATCH /registration/:address/approve

**Deskripsi:** Menyetujui permohonan registrasi HR yang berstatus `"pending"`. Setelah disetujui, HR dapat melakukan login dan men-deploy CompanyVault melalui `PayrollFactory.deployVault()`.

**Autentikasi:** Bearer JWT (`requireOwner`)

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `address` | `string` | Alamat Ethereum HR yang disetujui |

**Request Body:** Tidak ada

**Response (200 OK):**
```json
{
  "message": "Registrasi berhasil disetujui",
  "address": "0xAbCd1234..."
}
```

**Response Error:**

| Kode | Pesan | Penyebab |
|---|---|---|
| `401` | `"Token tidak valid"` | JWT tidak valid atau expired |
| `403` | `"Akses ditolak"` | Address bukan OWNER_ADDRESS |
| `404` | `"Permohonan tidak ditemukan"` | Tidak ada permohonan untuk alamat tersebut |

---

#### DELETE /registration/:address

**Deskripsi:** Menolak dan menghapus permohonan registrasi HR. Digunakan oleh Owner SaaS untuk menolak permohonan yang tidak memenuhi syarat.

**Autentikasi:** Bearer JWT (`requireOwner`)

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `address` | `string` | Alamat Ethereum HR yang ditolak |

**Request Body:** Tidak ada

**Response (200 OK):**
```json
{
  "message": "Permohonan registrasi berhasil ditolak dan dihapus",
  "address": "0xAbCd1234..."
}
```

**Response Error:**

| Kode | Pesan | Penyebab |
|---|---|---|
| `401` | `"Token tidak valid"` | JWT tidak valid atau expired |
| `403` | `"Akses ditolak"` | Address bukan OWNER_ADDRESS |
| `404` | `"Permohonan tidak ditemukan"` | Tidak ada permohonan untuk alamat tersebut |

---

### 1.3 Bundler ERC-4337 (`/bundler`)

---

#### POST /bundler/relay

**Deskripsi:** Meneruskan (relay) UserOperation ERC-4337 ke jaringan Base Sepolia melalui Alchemy RPC. Backend melakukan verifikasi, pengecekan rate limit (maksimum 10 klaim per jam per alamat), dan melampirkan tanda tangan Paymaster sebelum mengirimkan operasi ke EntryPoint kontrak ERC-4337.

**Autentikasi:** Bearer JWT (`requireAuth`)

**Request Body:**

Objek `UserOperation` sesuai spesifikasi ERC-4337:

| Field | Tipe | Keterangan |
|---|---|---|
| `sender` | `string` | Alamat Smart Account pengirim |
| `nonce` | `string` | Nonce UserOperation (hex) |
| `initCode` | `string` | Kode inisialisasi akun (hex, `"0x"` jika akun sudah ada) |
| `callData` | `string` | Data fungsi yang dipanggil (hex) |
| `callGasLimit` | `string` | Batas gas eksekusi (hex) |
| `verificationGasLimit` | `string` | Batas gas verifikasi (hex) |
| `preVerificationGas` | `string` | Gas pra-verifikasi (hex) |
| `maxFeePerGas` | `string` | Biaya gas maksimum (hex) |
| `maxPriorityFeePerGas` | `string` | Priority fee maksimum (hex) |
| `paymasterAndData` | `string` | Data Paymaster (hex) |
| `signature` | `string` | Tanda tangan UserOperation (hex) |

**Contoh Request Body:**
```json
{
  "sender": "0xSmartAccount...",
  "nonce": "0x01",
  "initCode": "0x",
  "callData": "0xa9059cbb...",
  "callGasLimit": "0x493E0",
  "verificationGasLimit": "0x493E0",
  "preVerificationGas": "0xC350",
  "maxFeePerGas": "0x3B9ACA00",
  "maxPriorityFeePerGas": "0x3B9ACA00",
  "paymasterAndData": "0x",
  "signature": "0x4a3b..."
}
```

**Response (200 OK):**

| Field | Tipe | Keterangan |
|---|---|---|
| `userOpHash` | `string` | Hash UserOperation yang disubmit ke EntryPoint |
| `txHash` | `string` | Hash transaksi on-chain (setelah dikonfirmasi) |

**Contoh Response:**
```json
{
  "userOpHash": "0xabc123...",
  "txHash": "0xdef456..."
}
```

**Response Error:**

| Kode | Pesan | Penyebab |
|---|---|---|
| `400` | `"UserOperation tidak valid"` | Field UserOperation tidak lengkap atau salah format |
| `401` | `"Token tidak valid"` | JWT tidak valid atau expired |
| `429` | `"Rate limit terlampaui. Maksimum 10 klaim per jam"` | Pengguna melampaui batas klaim per jam |
| `500` | `"Gagal merelay UserOperation ke jaringan"` | Alchemy RPC error atau EntryPoint menolak operasi |

---

### 1.4 Kepatuhan (`/compliance`)

---

#### GET /compliance/summary/:hrAddress

**Deskripsi:** Menghasilkan laporan ringkasan kepatuhan (compliance) untuk perusahaan yang dikelola oleh HR tertentu, mencakup akumulasi BPJS dan PPh 21 pada periode bulan yang ditentukan. Data diambil dari kombinasi data on-chain (Ponder) dan catatan off-chain (PostgreSQL).

**Autentikasi:** Bearer JWT (`requireAuth`)

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `hrAddress` | `string` | Alamat Ethereum HR yang vaultnya akan dilaporkan |

**Query Parameter:**

| Parameter | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `month` | `string` | Ya | Periode laporan dalam format `YYYY-MM`, contoh: `2026-05` |

**Contoh Request:**
```
GET /compliance/summary/0xHRAddress...?month=2026-05
```

**Response (200 OK):**

| Field | Tipe | Keterangan |
|---|---|---|
| `hrAddress` | `string` | Alamat HR |
| `month` | `string` | Periode laporan |
| `totalGrossSalary` | `string` | Total gaji bruto seluruh karyawan periode tersebut (dalam unit IDRX, 6 desimal) |
| `totalBpjs` | `string` | Total akumulasi BPJS (dalam unit IDRX) |
| `totalPph21` | `string` | Total akumulasi PPh 21 (dalam unit IDRX) |
| `complianceBalance` | `string` | Saldo vault kepatuhan saat ini (on-chain) |
| `employeeCount` | `number` | Jumlah karyawan aktif pada periode tersebut |

**Contoh Response:**
```json
{
  "hrAddress": "0xHRAddress...",
  "month": "2026-05",
  "totalGrossSalary": "50000000000",
  "totalBpjs": "2500000000",
  "totalPph21": "1000000000",
  "complianceBalance": "3500000000",
  "employeeCount": 5
}
```

**Response Error:**

| Kode | Pesan | Penyebab |
|---|---|---|
| `400` | `"Parameter month wajib diisi dengan format YYYY-MM"` | Query parameter tidak ada atau format salah |
| `401` | `"Token tidak valid"` | JWT tidak valid atau expired |
| `404` | `"Vault untuk HR ini tidak ditemukan"` | Alamat HR tidak memiliki CompanyVault |

---

### 1.5 Webhook (`/webhook`)

---

#### POST /webhook

**Deskripsi:** Menerima notifikasi event on-chain dari Alchemy Webhook. Backend memverifikasi keaslian payload menggunakan HMAC-SHA256 dengan kunci `ALCHEMY_WEBHOOK_SIGNING_KEY`. Setelah terverifikasi, data event disimpan ke PostgreSQL sebagai audit log dan memperbarui cache off-chain.

**Autentikasi:** HMAC Signature Alchemy (bukan Bearer JWT) — verifikasi melalui header `X-Alchemy-Signature`

**Header Khusus:**

| Header | Keterangan |
|---|---|
| `X-Alchemy-Signature` | HMAC-SHA256 signature dari payload, diverifikasi oleh backend |

**Request Body:** Payload JSON dari Alchemy Webhook (format ditentukan oleh Alchemy, berisi data event transaksi on-chain)

**Response (200 OK):**
```json
{
  "received": true
}
```

**Response Error:**

| Kode | Pesan | Penyebab |
|---|---|---|
| `400` | `"Signature webhook tidak valid"` | HMAC tidak cocok, kemungkinan payload dimanipulasi |
| `500` | `"Gagal memproses event webhook"` | Kesalahan saat menyimpan ke database |

---

## Bagian 2: Ponder REST API

Layanan Ponder mengindeks event-event dari smart contract Payana di Base Sepolia secara *real-time* dan menyajikannya melalui REST API berbasis Hono. Seluruh endpoint bersifat **read-only** dan tidak memerlukan autentikasi.

---

### 2.1 Data Perusahaan

---

#### GET /companies

**Deskripsi:** Mengambil daftar seluruh perusahaan (company vault) yang telah terdaftar di `PayrollFactory`. Data mencakup informasi vault, alamat HR, dan statistik dasar.

**Autentikasi:** Public

**Query Parameter:** Tidak ada

**Response (200 OK):**

Array objek Company:

| Field | Tipe | Keterangan |
|---|---|---|
| `hrAddress` | `string` | Alamat HR pemilik vault |
| `vaultAddress` | `string` | Alamat CompanyVault yang di-deploy |
| `companyName` | `string` | Nama perusahaan (jika tersedia dari event) |
| `createdAt` | `number` | Block number saat vault di-deploy |

**Contoh Response:**
```json
[
  {
    "hrAddress": "0xHRAddress...",
    "vaultAddress": "0xVaultAddress...",
    "companyName": "PT Maju Bersama",
    "createdAt": 12345678
  }
]
```

---

#### GET /company/:hr

**Deskripsi:** Mengambil detail satu perusahaan berdasarkan alamat HR. Mengembalikan informasi vault beserta statistik karyawan aktif.

**Autentikasi:** Public

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `hr` | `string` | Alamat Ethereum HR |

**Response (200 OK):**

| Field | Tipe | Keterangan |
|---|---|---|
| `hrAddress` | `string` | Alamat HR |
| `vaultAddress` | `string` | Alamat CompanyVault |
| `activeStreamCount` | `number` | Jumlah stream karyawan aktif |
| `createdAt` | `number` | Block number deployment |

**Response Error:**

| Kode | Pesan | Penyebab |
|---|---|---|
| `404` | `"Perusahaan tidak ditemukan"` | Alamat HR tidak memiliki vault terdaftar |

---

### 2.2 Data Stream Karyawan

---

#### GET /stream/:employee

**Deskripsi:** Mengambil informasi stream gaji aktif untuk satu karyawan. Stream merepresentasikan aliran gaji real-time berdasarkan `flowRate` per detik yang ditetapkan HR.

**Autentikasi:** Public

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `employee` | `string` | Alamat Ethereum karyawan |

**Response (200 OK):**

| Field | Tipe | Keterangan |
|---|---|---|
| `employeeAddress` | `string` | Alamat karyawan |
| `hrAddress` | `string` | Alamat HR yang membuat stream |
| `vaultAddress` | `string` | Alamat CompanyVault |
| `flowRate` | `string` | Laju aliran gaji per detik (dalam unit IDRX, 6 desimal) |
| `startTimestamp` | `number` | Unix timestamp mulai stream |
| `lastWithdrawnTimestamp` | `number` | Unix timestamp klaim terakhir |
| `isActive` | `boolean` | Status stream aktif/tidak |
| `employeeBps` | `number` | Persentase ke karyawan dalam basis poin (default: 9300) |
| `complianceBps` | `number` | Persentase ke vault kepatuhan (default: 500) |
| `severanceBps` | `number` | Persentase ke vault pesangon (default: 200) |

**Contoh Response:**
```json
{
  "employeeAddress": "0xEmployee...",
  "hrAddress": "0xHR...",
  "vaultAddress": "0xVault...",
  "flowRate": "3858024",
  "startTimestamp": 1748304000,
  "lastWithdrawnTimestamp": 1748390400,
  "isActive": true,
  "employeeBps": 9300,
  "complianceBps": 500,
  "severanceBps": 200
}
```

**Catatan:** Kolom `employeeBps`, `complianceBps`, dan `severanceBps` menggunakan nilai default karena event `StreamCreated` tidak meng-emit konfigurasi split kustom. Nilai distribusi aktual dapat diperoleh dari riwayat event `SalaryClaimed`.

**Response Error:**

| Kode | Pesan | Penyebab |
|---|---|---|
| `404` | `"Stream tidak ditemukan"` | Karyawan tidak memiliki stream aktif |

---

#### GET /streams/:hr

**Deskripsi:** Mengambil daftar seluruh stream karyawan yang dikelola oleh satu HR, baik yang aktif maupun yang sudah dihentikan.

**Autentikasi:** Public

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `hr` | `string` | Alamat Ethereum HR |

**Response (200 OK):**

Array objek stream (format sama dengan `GET /stream/:employee`).

---

### 2.3 Riwayat Klaim

---

#### GET /claims/:employee

**Deskripsi:** Mengambil riwayat 50 klaim gaji (EWA) terakhir yang dilakukan oleh karyawan. Setiap entri merepresentasikan satu transaksi `claimSalary()` yang berhasil dieksekusi di blockchain.

**Autentikasi:** Public

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `employee` | `string` | Alamat Ethereum karyawan |

**Response (200 OK):**

Array (maksimum 50 entri) objek klaim:

| Field | Tipe | Keterangan |
|---|---|---|
| `txHash` | `string` | Hash transaksi on-chain |
| `blockNumber` | `number` | Nomor blok eksekusi |
| `timestamp` | `number` | Unix timestamp eksekusi |
| `netToEmployee` | `string` | Jumlah IDRX yang diterima karyawan |
| `toCompliance` | `string` | Jumlah IDRX ke vault kepatuhan |
| `toSeverance` | `string` | Jumlah IDRX ke vault pesangon |
| `totalClaimed` | `string` | Total IDRX yang diklaim |

**Contoh Response:**
```json
[
  {
    "txHash": "0xabc123...",
    "blockNumber": 12345678,
    "timestamp": 1748390400,
    "netToEmployee": "9300000",
    "toCompliance": "500000",
    "toSeverance": "200000",
    "totalClaimed": "10000000"
  }
]
```

---

### 2.4 Vault Pesangon

---

#### GET /severance/:employee

**Deskripsi:** Mengambil informasi saldo vault pesangon milik karyawan. Pesangon dikumpulkan secara otomatis sebesar 2% dari setiap klaim gaji dan hanya dapat dicairkan setelah proses PHK selesai dieksekusi.

**Autentikasi:** Public

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `employee` | `string` | Alamat Ethereum karyawan |

**Response (200 OK):**

| Field | Tipe | Keterangan |
|---|---|---|
| `employeeAddress` | `string` | Alamat karyawan |
| `balance` | `string` | Saldo vault pesangon (unit IDRX, 6 desimal) |
| `status` | `string` | Status: `"Locked"`, `"Returned"`, atau `"Released"` |

**Contoh Response:**
```json
{
  "employeeAddress": "0xEmployee...",
  "balance": "5000000000",
  "status": "Locked"
}
```

---

### 2.5 Vault Kepatuhan

---

#### GET /compliance/:hr

**Deskripsi:** Mengambil informasi saldo vault kepatuhan (compliance vault) milik perusahaan, berisi akumulasi BPJS dan PPh 21 dari seluruh klaim gaji karyawan.

**Autentikasi:** Public

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `hr` | `string` | Alamat Ethereum HR |

**Response (200 OK):**

| Field | Tipe | Keterangan |
|---|---|---|
| `hrAddress` | `string` | Alamat HR |
| `vaultAddress` | `string` | Alamat CompanyVault |
| `balance` | `string` | Saldo vault kepatuhan (unit IDRX, 6 desimal) |
| `bpjsBps` | `number` | Persentase BPJS dalam basis poin |
| `pph21Bps` | `number` | Persentase PPh 21 dalam basis poin |

---

### 2.6 Peringatan Saldo Rendah

---

#### GET /alerts/:hr

**Deskripsi:** Mengambil 10 peringatan saldo rendah (low balance alerts) terakhir untuk vault perusahaan. Peringatan dipicu secara otomatis oleh sistem ketika saldo vault mendekati ambang batas minimum.

**Autentikasi:** Public

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `hr` | `string` | Alamat Ethereum HR |

**Response (200 OK):**

Array (maksimum 10 entri) objek alert:

| Field | Tipe | Keterangan |
|---|---|---|
| `timestamp` | `number` | Unix timestamp saat peringatan dipicu |
| `vaultBalance` | `string` | Saldo vault saat peringatan (unit IDRX) |
| `threshold` | `string` | Ambang batas saldo minimum |
| `blockNumber` | `number` | Nomor blok saat peringatan |

---

### 2.7 Cliff Vesting

---

#### GET /vests/:employee

**Deskripsi:** Mengambil seluruh jadwal cliff vesting yang ditetapkan untuk karyawan. Cliff vesting adalah mekanisme pemberian token yang terkunci hingga tanggal tertentu (`cliffTs`), biasanya digunakan untuk program retensi karyawan.

**Autentikasi:** Public

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `employee` | `string` | Alamat Ethereum karyawan |

**Response (200 OK):**

Array objek vest:

| Field | Tipe | Keterangan |
|---|---|---|
| `vestId` | `string` | Identifier unik vest |
| `employeeAddress` | `string` | Alamat karyawan |
| `amount` | `string` | Jumlah IDRX yang di-vest |
| `cliffTimestamp` | `number` | Unix timestamp kapan vest dapat diklaim |
| `status` | `string` | Status: `"Active"`, `"Claimed"`, atau `"Cancelled"` |
| `createdAt` | `number` | Block number pembuatan |

---

### 2.8 Koperasi Karyawan (Liquidity Pool)

---

#### GET /pool/:company

**Deskripsi:** Mengambil informasi liquidity pool koperasi karyawan milik perusahaan. Pool ini digunakan sebagai sumber dana pinjaman bagi karyawan dan dikelola melalui `EmployeeLiquidityContract`.

**Autentikasi:** Public

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `company` | `string` | Alamat CompanyVault atau alamat HR |

**Response (200 OK):**

| Field | Tipe | Keterangan |
|---|---|---|
| `companyAddress` | `string` | Alamat perusahaan |
| `totalDeposited` | `string` | Total IDRX yang disetor ke pool (unit IDRX) |
| `totalBorrowed` | `string` | Total IDRX yang sedang dipinjam |
| `availableLiquidity` | `string` | Likuiditas tersedia untuk dipinjam |
| `totalProtocolFee` | `string` | Akumulasi biaya protokol (1% yield untuk Owner) |

---

#### GET /deposit/:lender

**Deskripsi:** Mengambil informasi simpanan (deposit) milik satu lender (HR atau penyetor dana) pada `EmployeeLiquidityContract`.

**Autentikasi:** Public

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `lender` | `string` | Alamat Ethereum penyetor dana |

**Response (200 OK):**

| Field | Tipe | Keterangan |
|---|---|---|
| `lenderAddress` | `string` | Alamat lender |
| `depositedAmount` | `string` | Jumlah IDRX yang disetor |
| `yieldEarned` | `string` | Yield yang diperoleh dari bunga pinjaman |
| `lastDepositTimestamp` | `number` | Unix timestamp setoran terakhir |

---

#### GET /loan/:borrower

**Deskripsi:** Mengambil informasi pinjaman aktif milik satu peminjam (karyawan). Hanya mengembalikan satu pinjaman aktif per borrower sesuai aturan kontrak.

**Autentikasi:** Public

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `borrower` | `string` | Alamat Ethereum peminjam (karyawan) |

**Response (200 OK):**

| Field | Tipe | Keterangan |
|---|---|---|
| `borrowerAddress` | `string` | Alamat peminjam |
| `principalAmount` | `string` | Pokok pinjaman (unit IDRX) |
| `interestAccrued` | `string` | Bunga yang telah terakumulasi |
| `totalOwed` | `string` | Total yang harus dibayar (`principal + interest`) |
| `borrowTimestamp` | `number` | Unix timestamp saat meminjam |
| `isOverdue` | `boolean` | Status apakah pinjaman sudah jatuh tempo |

---

### 2.9 Pemutusan Hubungan Kerja (PHK)

---

#### GET /termination/:employee

**Deskripsi:** Mengambil proposal PHK yang sedang aktif untuk karyawan tertentu. Proposal PHK memerlukan persetujuan dari HR (memegang `HR_ROLE`) dan Legal (memegang `LEGAL_ROLE`) sebelum dapat dieksekusi.

**Autentikasi:** Public

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `employee` | `string` | Alamat Ethereum karyawan |

**Response (200 OK):**

| Field | Tipe | Keterangan |
|---|---|---|
| `employeeAddress` | `string` | Alamat karyawan |
| `proposedBy` | `string` | Alamat yang mengajukan proposal (HR) |
| `proposedAt` | `number` | Unix timestamp pengajuan |
| `hrApproved` | `boolean` | Status persetujuan HR |
| `legalApproved` | `boolean` | Status persetujuan Legal |
| `status` | `string` | Status: `"Proposed"`, `"Approved"`, atau `"Executed"` |

**Response Error:**

| Kode | Pesan | Penyebab |
|---|---|---|
| `404` | `"Proposal PHK tidak ditemukan"` | Tidak ada proposal aktif untuk karyawan tersebut |

---

### 2.10 Sertifikat Kerja (SBT)

---

#### GET /certificate/:employee

**Deskripsi:** Mengambil informasi Soulbound Token (SBT) sertifikat kerja milik karyawan sesuai standar ERC-5192. SBT diterbitkan saat karyawan bergabung dan tidak dapat dipindahtangankan. Token URI berisi metadata pekerjaan yang tersimpan on-chain.

**Autentikasi:** Public

**Parameter URL:**

| Parameter | Tipe | Keterangan |
|---|---|---|
| `employee` | `string` | Alamat Ethereum karyawan |

**Response (200 OK):**

| Field | Tipe | Keterangan |
|---|---|---|
| `employeeAddress` | `string` | Alamat karyawan |
| `tokenId` | `string` | ID token SBT |
| `tokenURI` | `string` | URI metadata sertifikat (IPFS atau on-chain) |
| `mintedAt` | `number` | Block number saat token dicetak |
| `isActive` | `boolean` | Status token aktif (false jika sudah di-burn) |

**Contoh Response:**
```json
{
  "employeeAddress": "0xEmployee...",
  "tokenId": "42",
  "tokenURI": "ipfs://Qm...",
  "mintedAt": 12345678,
  "isActive": true
}
```

**Response Error:**

| Kode | Pesan | Penyebab |
|---|---|---|
| `404` | `"Sertifikat tidak ditemukan"` | Karyawan belum memiliki SBT atau token sudah di-burn |

---

### 2.11 Dokumentasi API Ponder

---

#### GET /openapi.json

**Deskripsi:** Mengembalikan skema OpenAPI 3.0 dalam format JSON yang mendeskripsikan seluruh endpoint Ponder REST API secara lengkap, termasuk parameter, tipe data, dan contoh respons.

**Autentikasi:** Public

**Response (200 OK):** Dokumen OpenAPI 3.0 JSON

**URL:**
```
https://ponder-payroll-aucxhrb3hmhfd3fh.indonesiacentral-01.azurewebsites.net/openapi.json
```

---

#### GET /api-docs

**Deskripsi:** Menyajikan antarmuka Swagger UI yang interaktif untuk eksplorasi dan pengujian seluruh endpoint Ponder REST API secara visual melalui browser web.

**Autentikasi:** Public

**Response:** Halaman HTML Swagger UI

**URL:**
```
https://ponder-payroll-aucxhrb3hmhfd3fh.indonesiacentral-01.azurewebsites.net/api-docs
```

---

## Lampiran: Ringkasan Endpoint

### Backend REST API

| Method | Path | Autentikasi | Deskripsi Singkat |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Login via tanda tangan EIP-191 |
| `POST` | `/auth/refresh` | Public (refreshToken) | Perbarui access token |
| `POST` | `/auth/logout` | Bearer JWT | Cabut refresh token |
| `POST` | `/auth/profile` | Bearer JWT | Simpan profil pengguna |
| `GET` | `/auth/profile` | Bearer JWT | Ambil profil pengguna |
| `POST` | `/registration/request` | Public | Ajukan permohonan registrasi HR |
| `GET` | `/registration/status/:address` | Public | Cek status permohonan |
| `GET` | `/registration/pending` | Owner JWT | Daftar permohonan pending |
| `PATCH` | `/registration/:address/approve` | Owner JWT | Setujui registrasi HR |
| `DELETE` | `/registration/:address` | Owner JWT | Tolak registrasi HR |
| `POST` | `/bundler/relay` | Bearer JWT | Relay UserOperation ERC-4337 |
| `GET` | `/compliance/summary/:hrAddress` | Bearer JWT | Laporan kepatuhan BPJS/PPh21 |
| `POST` | `/webhook` | HMAC Alchemy | Terima event on-chain dari Alchemy |

### Ponder REST API

| Method | Path | Deskripsi Singkat |
|---|---|---|
| `GET` | `/companies` | Daftar semua company vault |
| `GET` | `/company/:hr` | Detail satu perusahaan |
| `GET` | `/stream/:employee` | Stream aktif karyawan |
| `GET` | `/streams/:hr` | Semua stream per HR |
| `GET` | `/claims/:employee` | Riwayat klaim (last 50) |
| `GET` | `/severance/:employee` | Saldo vault pesangon |
| `GET` | `/compliance/:hr` | Saldo vault kepatuhan |
| `GET` | `/alerts/:hr` | Peringatan saldo rendah (last 10) |
| `GET` | `/vests/:employee` | Jadwal cliff vesting |
| `GET` | `/pool/:company` | Info liquidity pool koperasi |
| `GET` | `/deposit/:lender` | Info simpanan lender |
| `GET` | `/loan/:borrower` | Pinjaman aktif karyawan |
| `GET` | `/termination/:employee` | Proposal PHK aktif |
| `GET` | `/certificate/:employee` | Sertifikat kerja SBT |
| `GET` | `/openapi.json` | Skema OpenAPI 3.0 |
| `GET` | `/api-docs` | Swagger UI interaktif |
