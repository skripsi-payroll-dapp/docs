# Kamus Data (Data Dictionary)

**Proyek:** Payana — Platform Payroll Web3 SaaS (Skripsi)
**Database:** PostgreSQL
**Tanggal:** 2026-05-27

---

## Pendahuluan

Sistem Payana menggunakan dua skema database yang terpisah:

| Skema | Dikelola Oleh | Sumber Data |
|---|---|---|
| `app` | Backend aplikasi (Node.js/Hono) | Pengguna & logika bisnis off-chain |
| `public` | Indexer Ponder | Event smart contract di jaringan Base Sepolia |

**Konvensi tipe data pada skema `public` (on-chain):**
- `BIGINT` yang menyimpan **nilai token IDRX**: satuan wei dengan 6 desimal. **1 IDRX = 1.000.000 unit wei.**
- `BIGINT` yang menyimpan **waktu**: Unix timestamp dalam detik (detik sejak 1 Januari 1970 UTC).
- `TEXT` yang menyimpan **alamat blockchain**: format hexadecimal lowercase, diawali `0x`, panjang 42 karakter.

---

## Bagian 1 — Skema Backend Aplikasi (`app.*`)

Skema `app` menyimpan data operasional off-chain yang dikelola langsung oleh backend. Data PII (Personally Identifiable Information) dienkripsi sebelum disimpan ke database.

---

### 1.1 Tabel `app.employees`

Menyimpan data identitas karyawan (PII). Kolom `name`, `nik`, dan `phone` dienkripsi menggunakan AES-256-GCM sebelum tersimpan di database; backend mendekripsi nilainya pada saat pengambilan data.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| `address` | `TEXT` | `PRIMARY KEY`, `NOT NULL` | Alamat wallet karyawan (Smart Account ERC-4337) dalam format lowercase hex `0x...`. Berfungsi sebagai identitas unik karyawan di seluruh sistem. |
| `name` | `TEXT` | `NOT NULL` | Nama lengkap karyawan. Nilai disimpan dalam bentuk ciphertext AES-256-GCM; hanya backend yang dapat mendekripsinya. |
| `nik` | `TEXT` | `NOT NULL` | Nomor Induk Kependudukan (NIK) 16 digit sesuai KTP. Nilai disimpan dalam bentuk ciphertext AES-256-GCM. |
| `phone` | `TEXT` | `NOT NULL` | Nomor telepon karyawan. Nilai disimpan dalam bentuk ciphertext AES-256-GCM. |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT NOW()` | Waktu (server time) pada saat baris data karyawan pertama kali dibuat. |
| `updated_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT NOW()` | Waktu (server time) pada saat baris data karyawan terakhir kali diperbarui. |

---

### 1.2 Tabel `app.sessions`

Menyimpan daftar sesi JWT yang sedang aktif untuk keperluan pencabutan token (JWT revocation). Backend memeriksa tabel ini sebelum memvalidasi setiap request; jika JTI tidak ditemukan, token dianggap sudah dicabut atau tidak sah.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| `jti` | `TEXT` | `PRIMARY KEY`, `NOT NULL` | JWT ID — klaim `jti` dari token JWT yang bersifat unik per token. Digunakan sebagai kunci pencabutan. |
| `address` | `TEXT` | `NOT NULL` | Alamat wallet pengguna (HR atau karyawan) pemilik sesi ini. |
| `expires_at` | `TIMESTAMP` | `NOT NULL` | Batas waktu keabsahan token. Setelah waktu ini, token harus ditolak meskipun JTI masih ada di tabel. |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT NOW()` | Waktu pada saat sesi ini pertama kali dibuat (waktu login). |

---

### 1.3 Tabel `app.audit_logs`

Menyimpan jejak audit untuk aksi-aksi kritikal pada sistem. Digunakan untuk kepatuhan regulasi (compliance) dan investigasi forensik jika terjadi insiden keamanan.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `BIGINT` | `PRIMARY KEY`, `GENERATED ALWAYS AS IDENTITY` | Kunci surrogate yang di-generate otomatis oleh database secara berurutan. |
| `action` | `TEXT` | `NOT NULL` | Kode jenis aksi yang diaudit. Nilai yang valid: `"BUNDLER_RELAY"` (relai transaksi UserOp ke bundler), `"COMPLIANCE_EXPORT"` (ekspor data kepatuhan oleh HR), `"LOAN_LIQUIDATED"` (pinjaman dilikuidasi paksa). |
| `actor` | `TEXT` | `NOT NULL` | Alamat wallet pelaku aksi, baik HR Authority maupun karyawan. |
| `tx_hash` | `TEXT` | Nullable | Hash transaksi blockchain (format `0x` + 64 karakter hex). Bernilai `NULL` untuk aksi yang bersifat off-chain. |
| `meta` | `TEXT` | Nullable | String JSON yang memuat konteks tambahan spesifik per jenis aksi. Contoh: `{"amount": "5000000", "reason": "salary_claim"}`. Bernilai `NULL` jika tidak ada konteks tambahan. |
| `created_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT NOW()` | Waktu server pada saat aksi ini dicatat ke log. |

**Indeks:** `idx_audit_logs_actor` pada kolom `actor`; `idx_audit_logs_action` pada kolom `action`.

---

### 1.4 Tabel `app.rate_limits`

Membatasi frekuensi klaim gaji oleh karyawan dalam satu jendela waktu tertentu (time window). Mekanisme ini mencegah penyalahgunaan sistem dan spam ke bundler ERC-4337.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| `employee_address` | `TEXT` | `PRIMARY KEY`, `NOT NULL` | Alamat wallet karyawan yang menjadi subjek pembatasan. Satu baris per karyawan. |
| `claim_count` | `INTEGER` | `NOT NULL`, `DEFAULT 0` | Jumlah klaim gaji yang telah dilakukan dalam jendela waktu yang sedang aktif. |
| `window_start` | `TIMESTAMP` | `NOT NULL`, `DEFAULT NOW()` | Waktu mulai jendela waktu pembatasan saat ini. Di-reset ke waktu sekarang setiap kali jendela baru dimulai. |

---

### 1.5 Tabel `app.webhook_events`

Berfungsi sebagai buffer penerimaan event webhook dari layanan Alchemy (notifikasi aktivitas on-chain). Kolom `processed` menjamin idempotency sehingga event yang sama tidak akan diproses lebih dari satu kali oleh backend.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY`, `NOT NULL` | ID unik event yang diberikan oleh Alchemy. Digunakan sebagai idempotency key untuk mencegah duplikasi pemrosesan. |
| `type` | `TEXT` | `NOT NULL` | Tipe event webhook dari Alchemy. Contoh: `"ADDRESS_ACTIVITY"` (aktivitas pada alamat tertentu), `"MINED_TRANSACTION"` (transaksi dikonfirmasi). |
| `processed` | `BOOLEAN` | `NOT NULL`, `DEFAULT FALSE` | Flag status pemrosesan. Bernilai `FALSE` saat event baru diterima; diubah menjadi `TRUE` setelah backend selesai memprosesnya. |
| `received_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT NOW()` | Waktu pada saat backend menerima event ini dari Alchemy. |

**Indeks:** `idx_webhook_events_unprocessed` (indeks parsial) pada `received_at` untuk baris dengan `processed = FALSE`.

---

### 1.6 Tabel `app.pending_registrations`

Menyimpan antrian permintaan pendaftaran karyawan baru yang menunggu persetujuan HR. Alur kerja: karyawan mengisi form onboarding → baris dibuat dengan status `"pending"` → HR menyetujui atau menolak → kolom `status` dan `updated_at` diperbarui.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| `address` | `TEXT` | `PRIMARY KEY`, `NOT NULL` | Alamat wallet calon karyawan dalam format lowercase hex `0x...`. |
| `email` | `TEXT` | Nullable | Alamat email calon karyawan yang diisi pada form onboarding. Bersifat opsional. |
| `name` | `TEXT` | Nullable | Nama tampilan (display name) yang diisi pada form onboarding. Bersifat opsional dan belum dienkripsi. |
| `hr_address` | `TEXT` | Nullable | Alamat wallet HR Authority yang ditugaskan untuk memproses dan memverifikasi pendaftaran ini. |
| `status` | `TEXT` | `NOT NULL`, `DEFAULT 'pending'` | Status alur kerja pendaftaran. Nilai yang valid: `"pending"` (menunggu tindakan HR), `"approved"` (disetujui, karyawan aktif), `"rejected"` (ditolak oleh HR). |
| `requested_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL`, `DEFAULT NOW()` | Timestamp (inklusif timezone) pada saat calon karyawan mengajukan permintaan pendaftaran. |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL`, `DEFAULT NOW()` | Timestamp (inklusif timezone) pada saat status pendaftaran terakhir kali diperbarui. |

**Indeks:** `idx_pending_registrations_hr_status` pada kolom `(hr_address, status)`.

---

## Bagian 2 — Skema Ponder / On-Chain (`public.*`)

Skema `public` diisi sepenuhnya oleh indexer Ponder yang membaca event dari smart contract Payana di jaringan Base Sepolia. Backend aplikasi hanya membaca dari skema ini; tidak ada penulisan langsung dari backend.

---

### 2.1 Tabel `public.company`

Di-index dari event `VaultDeployed`. Setiap baris merepresentasikan satu perusahaan yang telah men-deploy vault payroll mereka di blockchain. Primary key adalah alamat HR Authority selaku deployer vault.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY`, `NOT NULL` | Alamat wallet HR Authority yang men-deploy vault. Merupakan identitas unik perusahaan di seluruh sistem on-chain. |
| `name` | `TEXT` | `NOT NULL` | Nama perusahaan yang dikodekan ke dalam smart contract saat vault di-deploy. |
| `status` | `TEXT` | `NOT NULL` | Status operasional vault. Nilai yang valid: `"Active"` (berjalan normal), `"Paused"` (aliran gaji dijeda), `"Frozen"` (vault dibekukan oleh admin). |
| `vault_balance` | `BIGINT` | `NOT NULL` | Saldo kas vault perusahaan dalam satuan **wei IDRX**. Contoh: `1.000.000` = 1 IDRX. |
| `created_at` | `BIGINT` | `NOT NULL` | **Unix timestamp** (detik) pada saat vault pertama kali di-deploy ke blockchain. |

---

### 2.2 Tabel `public.employee_stream`

Di-index dari event `StreamCreated` dan `StreamUpdated`. Menyimpan konfigurasi aliran gaji real-time setiap karyawan. Menggunakan pola upsert: satu karyawan = satu baris yang diperbarui setiap ada perubahan konfigurasi stream.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY`, `NOT NULL` | Alamat wallet karyawan (Smart Account ERC-4337). |
| `hr_authority` | `TEXT` | `NOT NULL` | Alamat wallet HR Authority yang menciptakan dan memiliki stream gaji ini. |
| `flow_rate` | `BIGINT` | `NOT NULL` | Laju aliran gaji **per detik** dalam satuan wei IDRX. Contoh: `385` wei/detik kira-kira setara dengan 1 juta IDRX per bulan (30 hari). |
| `start_ts` | `BIGINT` | `NOT NULL` | **Unix timestamp** (detik) pada saat stream mulai berjalan. |
| `status` | `TEXT` | `NOT NULL` | Status stream. Nilai yang valid: `"Active"` (mengalir), `"Paused"` (dijeda sementara), `"Cancelled"` (dibatalkan permanen). |
| `employee_bps` | `INTEGER` | `NOT NULL` | Porsi gaji bersih yang diterima karyawan dalam **basis poin** (10.000 = 100%). Default: `9300` = 93%. |
| `compliance_bps` | `INTEGER` | `NOT NULL` | Porsi potongan pajak/BPJS/kepatuhan dalam **basis poin**. Default: `500` = 5%. |
| `severance_bps` | `INTEGER` | `NOT NULL` | Porsi iuran dana pesangon on-chain dalam **basis poin**. Default: `200` = 2%. |

**Indeks:** `idx_employee_stream_hr_authority` pada kolom `hr_authority`.

---

### 2.3 Tabel `public.salary_claim`

Di-index dari event `SalaryClaimed`. Setiap baris merepresentasikan satu transaksi klaim gaji oleh karyawan. Menggunakan ID composite `{txHash}-{logIndex}` untuk memastikan keunikan bahkan jika ada beberapa klaim dalam satu transaksi.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY`, `NOT NULL` | ID composite berformat `"{txHash}-{logIndex}"` untuk keunikan per event log blockchain. |
| `employee` | `TEXT` | `NOT NULL` | Alamat wallet karyawan yang melakukan klaim gaji. |
| `hr_authority` | `TEXT` | `NOT NULL` | Alamat wallet HR Authority pemilik vault yang sumber pembayarannya. |
| `accrued` | `BIGINT` | `NOT NULL` | Total gaji bruto yang telah terakru sejak klaim terakhir, dalam satuan **wei IDRX**. |
| `net_to_employee` | `BIGINT` | `NOT NULL` | Jumlah bersih (setelah semua potongan) yang ditransfer ke wallet karyawan, dalam satuan **wei IDRX**. |
| `to_compliance` | `BIGINT` | `NOT NULL` | Jumlah yang dialihkan ke compliance vault untuk pajak/BPJS, dalam satuan **wei IDRX**. |
| `to_severance` | `BIGINT` | `NOT NULL` | Jumlah yang dialihkan ke severance vault sebagai tabungan pesangon, dalam satuan **wei IDRX**. |
| `block_number` | `BIGINT` | `NOT NULL` | Nomor blok blockchain di mana transaksi klaim ini dikonfirmasi. |
| `timestamp` | `BIGINT` | `NOT NULL` | **Unix timestamp** (detik) blok tempat transaksi klaim ini dikonfirmasi. |

**Indeks:** `idx_salary_claim_employee` pada kolom `employee`; `idx_salary_claim_hr_authority` pada kolom `hr_authority`.

---

### 2.4 Tabel `public.severance_vault`

Di-index dari event perubahan dana pesangon. Menyimpan akumulasi dana pesangon masing-masing karyawan yang terkumpul secara bertahap dari setiap klaim gaji. Menggunakan pola upsert: satu karyawan = satu baris.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY`, `NOT NULL` | Alamat wallet karyawan pemilik dana pesangon ini. |
| `hr_authority` | `TEXT` | `NOT NULL` | Alamat wallet HR Authority yang mengelola vault pesangon ini. |
| `amount` | `BIGINT` | `NOT NULL` | Total saldo dana pesangon yang telah terkumpul, dalam satuan **wei IDRX**. |
| `state` | `TEXT` | `NOT NULL` | Status dana pesangon. Nilai yang valid: `"Locked"` (terkunci, karyawan masih aktif), `"Returned"` (dikembalikan ke vault HR setelah karyawan keluar tanpa hak pesangon), `"Released"` (dicairkan ke karyawan yang berhak). |
| `last_updated` | `BIGINT` | `NOT NULL` | **Unix timestamp** (detik) pada saat baris ini terakhir diperbarui oleh indexer. |

---

### 2.5 Tabel `public.termination_proposal`

Di-index dari event proposal Pemutusan Hubungan Kerja (PHK). Mengimplementasikan alur persetujuan multi-pihak: HR Authority **dan** Legal Owner harus sama-sama memberikan persetujuan sebelum eksekusi PHK dapat dilakukan.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY`, `NOT NULL` | Alamat wallet karyawan yang menjadi subjek proposal PHK. |
| `hr_authority` | `TEXT` | `NOT NULL` | Alamat wallet HR Authority yang mengajukan proposal PHK ini. |
| `hr_approved` | `BOOLEAN` | `NOT NULL` | Flag persetujuan dari pihak HR. `TRUE` = HR sudah menyetujui PHK. |
| `legal_approved` | `BOOLEAN` | `NOT NULL` | Flag persetujuan dari Legal Owner (pemilik legal perusahaan). `TRUE` = Legal Owner sudah menyetujui PHK. |
| `expires_at` | `BIGINT` | `NOT NULL` | **Unix timestamp** (detik) kedaluwarsa proposal. Setelah waktu ini, proposal tidak dapat dieksekusi meski sudah disetujui keduanya. |
| `proposed_at` | `BIGINT` | `NOT NULL` | **Unix timestamp** (detik) pada saat proposal PHK dibuat dan diemit di blockchain. |
| `executed_at` | `BIGINT` | Nullable | **Unix timestamp** (detik) pada saat PHK dieksekusi dan stream karyawan dibatalkan. Bernilai `NULL` selama proposal belum dieksekusi. |

---

### 2.6 Tabel `public.cliff_vest`

Di-index dari event vesting. Menyimpan detail setiap paket cliff vesting yang diberikan HR kepada karyawan. Satu karyawan dapat memiliki banyak paket vesting dengan tipe yang berbeda-beda.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY`, `NOT NULL` | ID composite berformat `"{employee}-{vestId}"` sebagai primary key unik. |
| `employee` | `TEXT` | `NOT NULL` | Alamat wallet karyawan penerima paket vesting. |
| `hr_authority` | `TEXT` | `NOT NULL` | Alamat wallet HR Authority yang membuat dan membiayai paket vesting ini. |
| `vest_id` | `BIGINT` | `NOT NULL` | Nomor urut paket vesting untuk karyawan ini, dimulai dari `0` (0, 1, 2, ...). |
| `amount` | `BIGINT` | `NOT NULL` | Jumlah token yang di-lock untuk vesting ini, dalam satuan **wei IDRX**. Contoh: `12.000.000` = 12 IDRX. |
| `cliff_ts` | `BIGINT` | `NOT NULL` | **Unix timestamp** (detik) cliff: token baru dapat diklaim oleh karyawan setelah melewati waktu ini. |
| `vest_type` | `TEXT` | `NOT NULL` | Kategori vesting. Nilai yang valid: `"Retention"` (bonus retensi karyawan), `"Probation"` (bonus selesai masa percobaan), `"ESOP"` (Employee Stock Option Plan — saham karyawan). |
| `status` | `TEXT` | `NOT NULL` | Status paket vesting. Nilai yang valid: `"Locked"` (terkunci, belum melewati cliff), `"Claimed"` (sudah diklaim oleh karyawan), `"Forfeited"` (hangus karena karyawan keluar sebelum cliff). |
| `created_at` | `BIGINT` | `NOT NULL` | **Unix timestamp** (detik) pada saat paket vesting ini dibuat di blockchain. |

**Indeks:** `idx_cliff_vest_employee` pada kolom `employee`.

---

### 2.7 Tabel `public.compliance_vault`

Di-index dari event akumulasi dana kepatuhan. Menyimpan total akumulasi dana pajak dan BPJS yang terkumpul dari setiap klaim gaji seluruh karyawan dalam satu perusahaan. Satu vault per HR Authority (satu vault per perusahaan).

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY`, `NOT NULL` | Alamat wallet HR Authority sebagai pemilik compliance vault. Satu vault per perusahaan. |
| `accumulated` | `BIGINT` | `NOT NULL` | Total dana kepatuhan (pajak/BPJS) yang telah terkumpul dari semua klaim gaji karyawan, dalam satuan **wei IDRX**. |
| `last_updated` | `BIGINT` | `NOT NULL` | **Unix timestamp** (detik) pada saat saldo vault terakhir diperbarui oleh indexer. |

---

### 2.8 Tabel `public.liquidity_pool`

Di-index dari event pembuatan atau konfigurasi pool pinjaman koperasi. Menyimpan parameter operasional dan statistik agregat pool pinjaman per perusahaan.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY`, `NOT NULL` | Alamat wallet perusahaan pemilik pool koperasi. |
| `interest_rate_bps` | `INTEGER` | `NOT NULL` | Suku bunga pinjaman dalam **basis poin** (10.000 = 100%). Contoh: `150` = 1,5% per periode. |
| `total_deposited` | `BIGINT` | `NOT NULL` | Total dana yang telah disetor oleh seluruh pemberi pinjaman (lender) ke pool ini, dalam satuan **wei IDRX**. |
| `total_loans_outstanding` | `BIGINT` | `NOT NULL` | Total nilai pokok pinjaman yang sedang aktif/beredar dari pool ini, dalam satuan **wei IDRX**. |
| `created_at` | `BIGINT` | `NOT NULL` | **Unix timestamp** (detik) pada saat pool koperasi pertama kali dibuat di blockchain. |

---

### 2.9 Tabel `public.lender_deposit`

Di-index dari event setoran ke pool koperasi. Menyimpan posisi modal dan akumulasi imbal hasil (yield) setiap pemberi pinjaman. Menggunakan pola upsert: satu lender per perusahaan = satu baris yang diperbarui setiap ada perubahan.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY`, `NOT NULL` | Alamat wallet pemberi pinjaman (lender). |
| `company_address` | `TEXT` | `NOT NULL` | Alamat wallet perusahaan pemilik pool tempat lender menyetor dana. |
| `principal` | `BIGINT` | `NOT NULL` | Jumlah pokok modal yang telah disetor oleh lender ke pool, dalam satuan **wei IDRX**. |
| `yield_earned` | `BIGINT` | `NOT NULL` | Akumulasi imbal hasil (bunga) yang telah diperoleh lender dari pool, dalam satuan **wei IDRX**. |
| `last_updated` | `BIGINT` | `NOT NULL` | **Unix timestamp** (detik) pada saat baris ini terakhir diperbarui oleh indexer. |

**Indeks:** `idx_lender_deposit_company_address` pada kolom `company_address`.

---

### 2.10 Tabel `public.loan_record`

Di-index dari event pinjaman. Setiap baris merepresentasikan satu record pinjaman aktif dari seorang karyawan kepada pool koperasi perusahaan. Primary key adalah alamat wallet peminjam, sehingga satu karyawan hanya bisa memiliki satu pinjaman aktif pada satu waktu.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY`, `NOT NULL` | Alamat wallet peminjam (karyawan/borrower). |
| `company_address` | `TEXT` | `NOT NULL` | Alamat wallet perusahaan pemilik pool yang menjadi sumber dana pinjaman. |
| `principal` | `BIGINT` | `NOT NULL` | Jumlah pokok pinjaman yang dicairkan, dalam satuan **wei IDRX**. |
| `interest` | `BIGINT` | `NOT NULL` | Total bunga yang dibebankan atas pinjaman ini (dihitung saat pencairan), dalam satuan **wei IDRX**. |
| `repaid_amount` | `BIGINT` | `NOT NULL` | Total jumlah yang sudah dilunasi oleh peminjam hingga saat ini, dalam satuan **wei IDRX**. Bernilai `0` saat pinjaman baru dicairkan. |
| `due_ts` | `BIGINT` | `NOT NULL` | **Unix timestamp** (detik) jatuh tempo pinjaman. Jika `repaid_amount < (principal + interest)` setelah waktu ini, status secara otomatis berubah menjadi `"Defaulted"`. |
| `status` | `TEXT` | `NOT NULL` | Status pinjaman. Nilai yang valid: `"Active"` (pinjaman berjalan), `"Repaid"` (lunas), `"Defaulted"` (gagal bayar). |
| `created_at` | `BIGINT` | `NOT NULL` | **Unix timestamp** (detik) pada saat pinjaman dicairkan di blockchain. |

**Indeks:** `idx_loan_record_company_address` pada kolom `company_address`.

---

### 2.11 Tabel `public.employment_certificate`

Di-index dari event penerbitan Soulbound Token (SBT). SBT adalah token ERC-721 yang bersifat non-transferable (tidak dapat dipindahtangankan), berfungsi sebagai sertifikat ketenagakerjaan on-chain yang dapat diverifikasi oleh siapapun secara publik di blockchain.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY`, `NOT NULL` | Alamat wallet karyawan pemegang SBT. Satu karyawan hanya memiliki satu sertifikat aktif. |
| `token_id` | `BIGINT` | `NOT NULL` | ID token ERC-721 di smart contract, bersifat unik per token yang diterbitkan. |
| `hr_authority` | `TEXT` | `NOT NULL` | Alamat wallet HR Authority yang menerbitkan (mint) SBT ini. |
| `company_name` | `TEXT` | `NOT NULL` | Nama perusahaan yang tertera di dalam metadata sertifikat on-chain. |
| `issued_at` | `BIGINT` | `NOT NULL` | **Unix timestamp** (detik) pada saat SBT diterbitkan/di-mint oleh HR. |
| `revoked_at` | `BIGINT` | Nullable | **Unix timestamp** (detik) pada saat SBT dicabut (burn/revoke). Bernilai `NULL` selama sertifikat masih berlaku. |
| `active` | `BOOLEAN` | `NOT NULL` | Flag keaktifan sertifikat. `TRUE` = sertifikat berlaku (karyawan aktif), `FALSE` = sertifikat telah dicabut. |

**Indeks:** `idx_employment_certificate_hr_authority` pada kolom `hr_authority`.

---

### 2.12 Tabel `public.low_balance_alert`

Di-index dari event `LowBalance` yang diemit smart contract secara otomatis ketika saldo vault perusahaan turun di bawah ambang batas aman (biasanya kurang dari kebutuhan gaji 1 bulan). Setiap event menghasilkan baris baru (bukan upsert) untuk menjaga riwayat peringatan secara lengkap.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY`, `NOT NULL` | ID composite berformat `"{txHash}-{logIndex}"` untuk keunikan per event log. |
| `hr_authority` | `TEXT` | `NOT NULL` | Alamat wallet HR Authority pemilik vault yang memicu peringatan saldo rendah. |
| `balance` | `BIGINT` | `NOT NULL` | Saldo vault pada saat peringatan dipicu, dalam satuan **wei IDRX**. |
| `monthly_need` | `BIGINT` | `NOT NULL` | Estimasi total kebutuhan gaji bulanan berdasarkan semua stream aktif pada saat itu, dalam satuan **wei IDRX**. |
| `timestamp` | `BIGINT` | `NOT NULL` | **Unix timestamp** (detik) blok di mana event peringatan ini diemit. |

**Indeks:** `idx_low_balance_alert_hr_authority` pada kolom `hr_authority`.

---

*Dokumen ini dibuat untuk keperluan skripsi proyek Payana — Platform Payroll Web3 SaaS.*
