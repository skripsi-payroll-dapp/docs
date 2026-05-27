# Black Box Testing — Payana Payroll Web3

> **Versi Dokumen:** v3.0
> **Tanggal:** 27 Mei 2026
> **Network:** Base Sepolia Testnet (Chain ID: 84532)
> **Metodologi:** Black Box Testing — pengujian dilakukan dari sisi pengguna tanpa melihat implementasi internal smart contract atau kode frontend.
> **Catatan Revisi:**
> - v2.0 — Menambahkan Modul Auth & Onboarding (TC-AUTH-01 s.d. TC-AUTH-06) dan Modul Owner SaaS (TC-OWN-01 s.d. TC-OWN-06).
> - v3.0 — Penataan ulang seluruh test case ke format ID terstandar (TC-HR, TC-PHK, TC-EWA, TC-KOP, TC-VEST). Penambahan test case PHK Multi-Sig dan EWA sesuai fitur terbaru.

---

## Metodologi

**Black box testing** menguji sistem dari perspektif pengguna akhir: input diberikan, output diamati, dan dibandingkan dengan hasil yang diharapkan. Tidak ada akses ke source code saat pengujian.

Setiap test case dikategorikan ke salah satu dari dua jenis:

| Tipe | Deskripsi |
|---|---|
| **Happy Path** | Input valid, kondisi normal — sistem harus berhasil |
| **Bad Path** | Input tidak valid, kondisi edge case, atau aksi tidak diizinkan — sistem harus gagal dengan pesan yang tepat |

### Skala Prioritas

| Prioritas | Arti |
|---|---|
| **P0** | Kritikal — kegagalan memblokir fungsi utama sistem |
| **P1** | Tinggi — kegagalan berdampak signifikan terhadap pengguna |
| **P2** | Sedang — kegagalan berdampak minor atau bisa di-workaround |

### Skala Status

| Status | Arti |
|---|---|
| ✅ Pass | Actual result sesuai expected result |
| ❌ Fail | Actual result tidak sesuai expected result |
| ⏳ Pending | Belum diuji |

---

## Daftar Test Cases

| TC-ID | Modul | Nama Test | Tipe | Prioritas | Status |
|---|---|---|---|---|---|
| TC-AUTH-01 | Auth & Onboarding | Login dengan Privy (Email OTP) berhasil | Happy | P0 | ⏳ |
| TC-AUTH-02 | Auth & Onboarding | Deteksi role dan redirect sesuai peran | Happy | P0 | ⏳ |
| TC-AUTH-03 | Auth & Onboarding | Validasi form onboarding: input tidak valid | Bad | P0 | ⏳ |
| TC-AUTH-04 | Auth & Onboarding | Submit pendaftaran → status "pending" | Happy | P0 | ⏳ |
| TC-AUTH-05 | Auth & Onboarding | Login ulang setelah approved → tidak redirect ke /onboarding | Happy | P0 | ⏳ |
| TC-AUTH-06 | Auth & Onboarding | Login ulang setelah rejected → tampilkan state rejected | Bad | P1 | ⏳ |
| TC-OWN-01 | Owner SaaS | Akses /owner berhasil untuk OWNER_ADDRESS | Happy | P0 | ⏳ |
| TC-OWN-02 | Owner SaaS | Akses /owner diblokir untuk non-owner | Bad | P0 | ⏳ |
| TC-OWN-03 | Owner SaaS | Lihat daftar pending registrations | Happy | P0 | ⏳ |
| TC-OWN-04 | Owner SaaS | Approve registrasi → status berubah ke "approved" | Happy | P0 | ⏳ |
| TC-OWN-05 | Owner SaaS | Tolak registrasi → status berubah ke "rejected" | Happy | P0 | ⏳ |
| TC-OWN-06 | Owner SaaS | Tab filter Pending/Approved/Rejected berfungsi | Happy | P1 | ⏳ |
| TC-HR-01 | HR — Vault | Deploy vault baru (HR baru) | Happy | P0 | ⏳ |
| TC-HR-02 | HR — Vault | Top up vault dengan IDRX | Happy | P0 | ⏳ |
| TC-HR-03 | HR — Vault | Saldo vault terupdate setelah top up | Happy | P0 | ⏳ |
| TC-HR-04 | HR — Karyawan | Tambah karyawan → startStream on-chain | Happy | P0 | ⏳ |
| TC-HR-05 | HR — Karyawan | Pause stream karyawan | Happy | P1 | ⏳ |
| TC-HR-06 | HR — Karyawan | Resume stream karyawan | Happy | P1 | ⏳ |
| TC-HR-07 | HR — Karyawan | Lihat detail karyawan | Happy | P2 | ⏳ |
| TC-HR-08 | HR — Karyawan | Propose PHK oleh HR | Happy | P0 | ⏳ |
| TC-HR-09 | HR — Karyawan | Akses halaman HR diblokir untuk non-HR | Bad | P0 | ⏳ |
| TC-PHK-01 | PHK Multi-Sig | Propose PHK → status "Menunggu Legal" | Happy | P0 | ⏳ |
| TC-PHK-02 | PHK Multi-Sig | Approve oleh Legal → status "Siap Dieksekusi" | Happy | P0 | ⏳ |
| TC-PHK-03 | PHK Multi-Sig | Execute PHK → stream dibatalkan, severance dirilis | Happy | P0 | ⏳ |
| TC-PHK-04 | PHK Multi-Sig | Proposal PHK expire setelah 7 hari | Bad | P1 | ⏳ |
| TC-EWA-01 | EWA — Karyawan | Saldo EWA terakru real-time (naik setiap detik) | Happy | P0 | ⏳ |
| TC-EWA-02 | EWA — Karyawan | Klaim EWA berhasil → saldo reset ke 0 | Happy | P0 | ⏳ |
| TC-EWA-03 | EWA — Karyawan | Rate limit: maksimal 10 klaim per jam | Bad | P1 | ⏳ |
| TC-KOP-01 | Koperasi | Pinjam IDRX dari pool (max 80% gaji) | Happy | P1 | ⏳ |
| TC-KOP-02 | Koperasi | Auto-repay saat klaim EWA berikutnya | Happy | P1 | ⏳ |
| TC-VEST-01 | Cliff Vesting | Buat cliff vest oleh HR | Happy | P1 | ⏳ |
| TC-VEST-02 | Cliff Vesting | Tombol klaim disabled sebelum cliff date | Bad | P1 | ⏳ |
| TC-VEST-03 | Cliff Vesting | Klaim vest berhasil setelah cliff date | Happy | P1 | ⏳ |

---

## Modul AUTH — Autentikasi & Onboarding

Modul ini mencakup alur login berbasis Privy (email OTP), mekanisme deteksi peran pengguna, validasi form pendaftaran, serta siklus status registrasi (pending → approved/rejected). Modul ini merupakan gerbang utama yang harus dilewati semua pengguna sebelum dapat mengakses fitur inti platform.

---

### TC-AUTH-01 — Login dengan Privy (Email OTP) Berhasil

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P0 |
| **Aktor** | Pengguna baru / pengguna terdaftar |
| **Pre-kondisi** | Pengguna memiliki alamat email aktif. Jaringan internet tersedia. |

**Langkah Pengujian:**
1. Buka `https://payana.app` (atau `http://localhost:3000`)
2. Klik tombol **Masuk / Login**
3. Pilih metode login: **Email**
4. Masukkan alamat email yang valid, misal `penguji@example.com`
5. Buka kotak masuk email, salin kode OTP 6 digit
6. Masukkan kode OTP di halaman Privy
7. Tunggu proses autentikasi selesai

**Input:** Email `penguji@example.com`, kode OTP 6 digit valid

**Expected Output:**
- Privy memverifikasi OTP dalam waktu < 5 detik
- Wallet tertanam (embedded wallet) dibuat atau dimuat secara otomatis oleh Privy
- Pengguna dinyatakan terautentikasi — sesi aktif
- Sistem membaca data profil dari database backend untuk menentukan peran

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-AUTH-02 — Deteksi Role dan Redirect Sesuai Peran

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P0 |
| **Aktor** | Pengguna dengan berbagai peran (HR, Karyawan, Legal, Null) |
| **Pre-kondisi** | Pengguna sudah terdaftar dan berstatus "approved" di database |

**Langkah Pengujian:**
1. Skenario A — Login sebagai **HR Manager** (role = `hr`): login via Privy, amati redirect
2. Skenario B — Login sebagai **Karyawan** (role = `employee`): login via Privy, amati redirect
3. Skenario C — Login sebagai **Legal Officer** (role = `legal`): login via Privy, amati redirect
4. Skenario D — Login dengan akun **belum terdaftar** (role = `null`): login via Privy, amati redirect

**Input:** Akun dengan masing-masing peran (hr / employee / legal / null)

**Expected Output:**
- Skenario A: Redirect ke `/hr/vault`
- Skenario B: Redirect ke `/employee/ewa`
- Skenario C: Redirect ke `/hr/phk`
- Skenario D: Redirect ke `/onboarding`

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-AUTH-03 — Validasi Form Onboarding: Input Tidak Valid

| Field | Detail |
|---|---|
| **Tipe** | Bad Path |
| **Prioritas** | P0 |
| **Aktor** | Pengguna baru yang belum terdaftar |
| **Pre-kondisi** | Pengguna sudah login via Privy dan diarahkan ke `/onboarding` |

**Langkah Pengujian:**
1. Buka `/onboarding`
2. **Skenario A** — Nama kosong: biarkan field nama kosong, isi NIK dan HP valid, klik **Daftar**
3. **Skenario B** — NIK kurang dari 16 digit: isi NIK = `123456789` (9 digit), klik **Daftar**
4. **Skenario C** — NIK lebih dari 16 digit: isi NIK = `12345678901234567` (17 digit), klik **Daftar**
5. **Skenario D** — Nomor HP kosong: isi nama dan NIK valid, HP kosong, klik **Daftar**

**Input:**
- Skenario A: Nama = `""`, NIK = `3201010101010001`, HP = `08123456789`
- Skenario B: Nama = `"Budi"`, NIK = `123456789`, HP = `08123456789`
- Skenario C: Nama = `"Budi"`, NIK = `12345678901234567`, HP = `08123456789`
- Skenario D: Nama = `"Budi"`, NIK = `3201010101010001`, HP = `""`

**Expected Output:**
- Skenario A: Pesan validasi "Nama wajib diisi" muncul; form tidak disubmit
- Skenario B: Pesan validasi "NIK harus 16 digit" muncul; form tidak disubmit
- Skenario C: Pesan validasi "NIK harus 16 digit" muncul; form tidak disubmit
- Skenario D: Pesan validasi "Nomor HP wajib diisi" muncul; form tidak disubmit
- Tidak ada request ke API yang dikirim dalam kondisi form tidak valid

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-AUTH-04 — Submit Pendaftaran → Status "Pending"

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P0 |
| **Aktor** | Pengguna baru yang belum terdaftar |
| **Pre-kondisi** | Pengguna sudah login via Privy dan berada di halaman `/onboarding` |

**Langkah Pengujian:**
1. Buka `/onboarding`
2. Isi nama lengkap, NIK 16 digit, dan nomor HP
3. Pilih peran yang diinginkan (jika tersedia)
4. Klik tombol **Daftar** / **Submit**
5. Tunggu respons dari server

**Input:** Nama = `"Budi Santoso"`, NIK = `3201010101010001`, HP = `08123456789`

**Expected Output:**
- Request API berhasil dikirim ke backend
- Data tersimpan di database dengan status `pending`
- Halaman menampilkan pesan konfirmasi: _"Pendaftaran berhasil. Menunggu persetujuan admin."_
- Pengguna tidak dapat mengakses fitur utama selama status `pending`
- Data muncul di dashboard Owner SaaS dengan status "Pending"

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-AUTH-05 — Login Ulang Setelah Approved: Tidak Redirect ke /onboarding

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P0 |
| **Aktor** | Pengguna yang sudah diapprove oleh Owner |
| **Pre-kondisi** | Pengguna sudah submit pendaftaran (TC-AUTH-04) dan Owner sudah approve (TC-OWN-04). Status = `approved`. |

**Langkah Pengujian:**
1. Logout dari sesi saat ini
2. Login kembali menggunakan akun yang sama via Privy
3. Amati halaman tujuan setelah login

**Input:** Akun dengan status `approved` di database

**Expected Output:**
- Sistem membaca status = `approved` dari database
- Pengguna **tidak** diarahkan ke `/onboarding`
- Pengguna langsung diarahkan ke dashboard sesuai perannya: HR → `/hr/vault`, Karyawan → `/employee/ewa`, Legal → `/hr/phk`

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-AUTH-06 — Login Ulang Setelah Rejected: Tampilkan State Rejected

| Field | Detail |
|---|---|
| **Tipe** | Bad Path |
| **Prioritas** | P1 |
| **Aktor** | Pengguna yang pendaftarannya ditolak oleh Owner |
| **Pre-kondisi** | Pengguna sudah submit pendaftaran (TC-AUTH-04) dan Owner sudah menolak (TC-OWN-05). Status = `rejected`. |

**Langkah Pengujian:**
1. Logout dari sesi saat ini
2. Login kembali menggunakan akun yang sama via Privy
3. Amati tampilan halaman setelah login

**Input:** Akun dengan status `rejected` di database

**Expected Output:**
- Sistem membaca status = `rejected` dari database
- Halaman menampilkan state "Pendaftaran Ditolak" dengan keterangan yang sesuai
- Pengguna **tidak** dapat mengakses fitur utama manapun
- Pengguna **tidak** diarahkan kembali ke form `/onboarding` (sudah pernah mendaftar)
- Tersedia opsi untuk menghubungi admin

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

## Modul OWN — Owner SaaS

Modul ini mencakup fungsi administrator platform (Owner SaaS) dalam mengelola pendaftaran perusahaan/pengguna baru. Akses ke modul ini dibatasi secara ketat hanya untuk alamat wallet `OWNER_ADDRESS` yang telah dikonfigurasi di environment variabel backend.

---

### TC-OWN-01 — Akses /owner Berhasil untuk OWNER_ADDRESS

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P0 |
| **Aktor** | Owner SaaS (wallet address = `OWNER_ADDRESS`) |
| **Pre-kondisi** | Pengguna login menggunakan wallet yang alamatnya cocok dengan `OWNER_ADDRESS` di konfigurasi backend |

**Langkah Pengujian:**
1. Login via Privy menggunakan akun Owner (alamat wallet = `OWNER_ADDRESS`)
2. Navigasi ke `https://payana.app/owner`
3. Amati apakah halaman dashboard Owner ditampilkan

**Input:** Login dengan wallet `OWNER_ADDRESS`, akses URL `/owner`

**Expected Output:**
- Halaman `/owner` berhasil dimuat
- Dashboard Owner menampilkan daftar registrasi pengguna
- Tidak ada redirect atau pesan error akses
- Navbar/sidebar menampilkan menu khusus Owner

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-OWN-02 — Akses /owner Diblokir untuk Non-Owner

| Field | Detail |
|---|---|
| **Tipe** | Bad Path |
| **Prioritas** | P0 |
| **Aktor** | Pengguna biasa (HR, Karyawan, atau Legal) |
| **Pre-kondisi** | Pengguna login dengan akun yang alamatnya **bukan** `OWNER_ADDRESS` |

**Langkah Pengujian:**
1. Login via Privy dengan akun HR atau karyawan biasa
2. Coba akses langsung: `https://payana.app/owner` via address bar browser
3. Amati respons sistem

**Input:** Login dengan akun non-owner, akses URL `/owner`

**Expected Output:**
- Sistem memverifikasi bahwa alamat wallet pengguna !== `OWNER_ADDRESS`
- Pengguna **tidak dapat** mengakses halaman `/owner`
- Sistem melakukan redirect ke halaman dashboard sesuai peran, atau menampilkan halaman "403 Akses Ditolak"
- Tidak ada data registrasi yang terekspos

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-OWN-03 — Lihat Daftar Pending Registrations

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P0 |
| **Aktor** | Owner SaaS |
| **Pre-kondisi** | Sudah ada minimal 1 pendaftaran dengan status `pending` di database (TC-AUTH-04 sudah dijalankan) |

**Langkah Pengujian:**
1. Login sebagai Owner, buka `/owner`
2. Amati daftar registrasi yang tampil
3. Pastikan tab "Pending" aktif secara default
4. Periksa detail data yang ditampilkan per registrasi

**Input:** Akses halaman `/owner` sebagai OWNER_ADDRESS

**Expected Output:**
- Daftar registrasi dengan status `pending` ditampilkan
- Setiap entri menampilkan: nama, NIK, nomor HP, alamat email, peran yang diminta, dan waktu pendaftaran
- Tombol **Approve** dan **Tolak** tersedia untuk setiap entri

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-OWN-04 — Approve Registrasi → Status Berubah ke "Approved"

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P0 |
| **Aktor** | Owner SaaS |
| **Pre-kondisi** | Ada registrasi dengan status `pending` (TC-AUTH-04 sudah dijalankan). Owner sudah login. |

**Langkah Pengujian:**
1. Login sebagai Owner, buka `/owner`
2. Cari registrasi milik pengguna target (misal `Budi Santoso`) dengan status `pending`
3. Klik tombol **Approve** pada entri tersebut
4. Konfirmasi aksi jika ada dialog konfirmasi
5. Amati perubahan status pada antarmuka

**Input:** Klik tombol Approve pada registrasi `Budi Santoso`

**Expected Output:**
- Status registrasi berubah dari `pending` menjadi `approved` di database
- Entri berpindah dari tab "Pending" ke tab "Approved" di UI
- Pengguna yang bersangkutan kini dapat login dan mengakses dashboard sesuai perannya
- Tidak ada entri duplikat yang terbuat

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-OWN-05 — Tolak Registrasi → Status Berubah ke "Rejected"

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P0 |
| **Aktor** | Owner SaaS |
| **Pre-kondisi** | Ada registrasi dengan status `pending` di database. Owner sudah login. |

**Langkah Pengujian:**
1. Login sebagai Owner, buka `/owner`
2. Cari registrasi target dengan status `pending`
3. Klik tombol **Tolak** pada entri tersebut
4. Isi alasan penolakan jika form tersedia (opsional)
5. Konfirmasi aksi
6. Amati perubahan status pada antarmuka

**Input:** Klik tombol Tolak pada registrasi target

**Expected Output:**
- Status registrasi berubah dari `pending` menjadi `rejected` di database
- Entri berpindah dari tab "Pending" ke tab "Rejected" di UI
- Pengguna yang bersangkutan akan melihat state "rejected" saat login ulang (sesuai TC-AUTH-06)

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-OWN-06 — Tab Filter Pending/Approved/Rejected Berfungsi

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P1 |
| **Aktor** | Owner SaaS |
| **Pre-kondisi** | Ada data registrasi dengan ketiga status: `pending`, `approved`, dan `rejected` di database |

**Langkah Pengujian:**
1. Login sebagai Owner, buka `/owner`
2. Klik tab **Pending** — amati daftar yang tampil
3. Klik tab **Approved** — amati daftar yang tampil
4. Klik tab **Rejected** — amati daftar yang tampil
5. Verifikasi data di masing-masing tab sesuai statusnya

**Input:** Klik tab Pending, Approved, Rejected secara bergantian

**Expected Output:**
- Tab **Pending**: hanya menampilkan registrasi dengan status `pending`
- Tab **Approved**: hanya menampilkan registrasi dengan status `approved`
- Tab **Rejected**: hanya menampilkan registrasi dengan status `rejected`
- Jumlah badge/counter di setiap tab sesuai jumlah data

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

## Modul HR — Vault & Manajemen Karyawan

Modul ini mencakup pengelolaan vault payroll oleh HR Manager, termasuk deployment vault baru, top up saldo, serta manajemen stream gaji karyawan. Semua operasi vault berinteraksi langsung dengan smart contract di Base Sepolia.

---

### TC-HR-01 — Deploy Vault Baru (HR Baru)

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P0 |
| **Aktor** | HR Manager |
| **Pre-kondisi** | Pengguna sudah login sebagai HR dan berstatus `approved`. Belum pernah menginisialisasi vault. |

**Langkah Pengujian:**
1. Buka `/hr/vault`
2. Klik tombol **Inisialisasi Vault Baru**
3. Isi nama perusahaan: `"PT Test Indonesia"`
4. Atur parameter split (BPJS = 300 bps, PPh21 = 200 bps)
5. Klik **Inisialisasi Vault On-Chain** → setujui transaksi di Privy
6. Tunggu konfirmasi dari Base Sepolia (~2 detik)

**Input:** Nama perusahaan `"PT Test Indonesia"`, BPJS = 300 bps, PPh21 = 200 bps

**Expected Output:**
- Transaksi berhasil (status `success`)
- Vault terdaftar on-chain dengan alamat kontrak baru
- Event `VaultInitialized` muncul di BaseScan
- Halaman `/hr/vault` menampilkan kartu vault dengan saldo 0 IDRX
- HR mendapatkan `HR_ROLE` on-chain

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-HR-02 — Top Up Vault dengan IDRX

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P0 |
| **Aktor** | HR Manager |
| **Pre-kondisi** | Vault sudah diinisialisasi (TC-HR-01). HR memiliki saldo IDRX di dompet ≥ jumlah yang akan di-deposit. |

**Langkah Pengujian:**
1. Buka `/hr/vault`
2. Isi jumlah deposit: `1000000` IDRX
3. Klik **1. Approve IDRX** → setujui di Privy
4. Tunggu konfirmasi approval
5. Klik **2. Deposit ke Vault** → setujui di Privy
6. Tunggu konfirmasi transaksi

**Input:** Jumlah deposit = `1000000` IDRX

**Expected Output:**
- Approval IDRX berhasil (step 1 selesai)
- Deposit berhasil (step 2 selesai)
- Transaksi tercatat di BaseScan
- Event `VaultFunded` atau `Deposit` muncul di BaseScan

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-HR-03 — Saldo Vault Terupdate Setelah Top Up

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P0 |
| **Aktor** | HR Manager |
| **Pre-kondisi** | Top up vault berhasil dilakukan (TC-HR-02) |

**Langkah Pengujian:**
1. Setelah TC-HR-02 selesai, amati kartu saldo vault di `/hr/vault`
2. Bandingkan saldo sebelum dan sesudah top up
3. Verifikasi angka saldo sesuai dengan jumlah yang dideposit

**Input:** Saldo awal vault (dicatat sebelum TC-HR-02), jumlah deposit = `1000000` IDRX

**Expected Output:**
- Saldo vault bertambah sebesar jumlah yang dideposit: saldo baru = saldo lama + 1.000.000 IDRX
- Angka di kartu vault terupdate secara real-time tanpa perlu reload halaman
- Tidak ada selisih antara nilai on-chain dan nilai yang ditampilkan di UI

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-HR-04 — Tambah Karyawan → startStream On-Chain

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P0 |
| **Aktor** | HR Manager |
| **Pre-kondisi** | Vault aktif dan bersaldo cukup. Alamat wallet karyawan (Work ID) sudah diketahui. |

**Langkah Pengujian:**
1. Buka `/hr/employees`
2. Klik tombol **Tambah Karyawan**
3. Isi alamat karyawan (Work ID): `0xABC...`
4. Isi gaji bulanan: `5000000` IDRX
5. Atur split: 9300 / 500 / 200 bps (default)
6. Klik **Mulai Stream** → setujui transaksi di Privy
7. Tunggu konfirmasi

**Input:** Work ID karyawan = `0xABC...`, gaji = `5000000` IDRX/bulan

**Expected Output:**
- Transaksi berhasil
- Karyawan muncul di tabel dengan status `Active`
- Event `StreamCreated` muncul di BaseScan
- Karyawan dapat klaim gaji di `/employee/ewa`

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-HR-05 — Pause Stream Karyawan

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P1 |
| **Aktor** | HR Manager |
| **Pre-kondisi** | Stream karyawan berstatus `Active` (TC-HR-04 sudah dijalankan) |

**Langkah Pengujian:**
1. Buka `/hr/employees`
2. Klik **Kelola** pada karyawan target
3. Klik tombol **Jeda** (Pause)
4. Setujui transaksi di Privy
5. Tunggu konfirmasi dan amati perubahan status

**Input:** Klik Pause pada stream karyawan aktif

**Expected Output:**
- Transaksi berhasil
- Status stream karyawan berubah dari `Active` menjadi `Paused`
- Event `StreamPaused` muncul di BaseScan
- Karyawan tidak dapat klaim gaji baru selama stream dijeda

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-HR-06 — Resume Stream Karyawan

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P1 |
| **Aktor** | HR Manager |
| **Pre-kondisi** | Stream karyawan berstatus `Paused` (TC-HR-05 sudah dijalankan) |

**Langkah Pengujian:**
1. Buka `/hr/employees`
2. Klik **Kelola** pada karyawan target yang berstatus `Paused`
3. Klik tombol **Lanjutkan** (Resume)
4. Setujui transaksi di Privy
5. Tunggu konfirmasi dan amati perubahan status

**Input:** Klik Resume pada stream karyawan yang dijeda

**Expected Output:**
- Transaksi berhasil
- Status stream karyawan berubah dari `Paused` menjadi `Active`
- Event `StreamResumed` muncul di BaseScan
- Karyawan dapat kembali klaim gaji
- Settled balance yang terakumulasi selama jeda tidak hilang

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-HR-07 — Lihat Detail Karyawan

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P2 |
| **Aktor** | HR Manager |
| **Pre-kondisi** | Ada karyawan yang sudah terdaftar dengan stream aktif |

**Langkah Pengujian:**
1. Buka `/hr/employees`
2. Klik pada nama karyawan atau tombol **Detail**
3. Amati informasi yang ditampilkan di halaman detail

**Input:** Klik detail pada karyawan yang sudah terdaftar

**Expected Output:**
- Halaman detail menampilkan: nama karyawan, alamat wallet (Work ID), status stream, gaji bulanan, total yang sudah diklaim, tanggal mulai stream
- Data sesuai dengan yang tersimpan on-chain
- Tidak ada error atau halaman kosong

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-HR-08 — Propose PHK oleh HR

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P0 |
| **Aktor** | HR Manager |
| **Pre-kondisi** | Karyawan memiliki stream aktif. HR sudah login. |

**Langkah Pengujian:**
1. Buka `/hr/phk`
2. Isi alamat karyawan yang akan di-PHK
3. Klik tombol **Ajukan Terminasi**
4. Setujui transaksi di Privy
5. Tunggu konfirmasi dan amati status proposal

**Input:** Alamat wallet karyawan target

**Expected Output:**
- Proposal PHK terdaftar on-chain
- Event `TerminationProposed` muncul di BaseScan
- Status proposal: menunggu persetujuan Legal Officer
- Proposal dapat ditemukan di daftar proposal PHK

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-HR-09 — Akses Halaman HR Diblokir untuk Non-HR

| Field | Detail |
|---|---|
| **Tipe** | Bad Path |
| **Prioritas** | P0 |
| **Aktor** | Karyawan (tidak memiliki HR_ROLE) |
| **Pre-kondisi** | Pengguna login sebagai karyawan biasa |

**Langkah Pengujian:**
1. Login sebagai karyawan
2. Coba akses langsung via URL: `https://payana.app/hr/employees`
3. Amati respons sistem

**Input:** Akses URL `/hr/employees` sebagai non-HR

**Expected Output:**
- AuthGuard mendeteksi role = `employee`
- Redirect otomatis ke `/employee/ewa`
- Halaman HR tidak ditampilkan
- Tidak ada data HR yang terekspos

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

## Modul PHK — Multi-Sig Pemutusan Hubungan Kerja

Modul ini mencakup alur pemutusan hubungan kerja (PHK) yang menggunakan mekanisme multi-signature: memerlukan persetujuan dari HR Manager dan Legal Officer sebelum dapat dieksekusi. Hal ini memastikan kepatuhan prosedur PHK sesuai regulasi ketenagakerjaan.

---

### TC-PHK-01 — Propose PHK → Status "Menunggu Legal"

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P0 |
| **Aktor** | HR Manager |
| **Pre-kondisi** | Karyawan memiliki stream aktif. HR sudah login dan berstatus approved. |

**Langkah Pengujian:**
1. Buka `/hr/phk`
2. Isi alamat karyawan yang akan di-PHK: `0xEMP...`
3. Klik tombol **Ajukan Proposal PHK**
4. Setujui transaksi di Privy
5. Tunggu konfirmasi blockchain
6. Amati status proposal yang baru dibuat

**Input:** Alamat karyawan `0xEMP...`

**Expected Output:**
- Proposal PHK terdaftar on-chain dengan `hrApproved = true`, `legalApproved = false`
- Status proposal ditampilkan sebagai **"Menunggu Persetujuan Legal"**
- Event `TerminationProposed` muncul di BaseScan
- Proposal muncul di antrian Legal Officer untuk ditinjau

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-PHK-02 — Approve oleh Legal → Status "Siap Dieksekusi"

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P0 |
| **Aktor** | Legal Officer |
| **Pre-kondisi** | Proposal PHK sudah dibuat oleh HR (TC-PHK-01). Status `hrApproved = true`, `legalApproved = false`. |

**Langkah Pengujian:**
1. Login sebagai Legal Officer, buka `/hr/phk`
2. Temukan proposal PHK yang menunggu persetujuan
3. Tinjau detail proposal (nama karyawan, alasan PHK)
4. Klik tombol **Setujui Proposal**
5. Setujui transaksi di Privy
6. Amati perubahan status proposal

**Input:** Klik Setujui pada proposal PHK yang berstatus "Menunggu Legal"

**Expected Output:**
- Status on-chain berubah: `hrApproved = true`, `legalApproved = true`
- Status proposal di UI berubah menjadi **"Siap Dieksekusi"**
- Event `TerminationApproved` muncul di BaseScan
- Tombol **Eksekusi PHK** menjadi aktif (dapat diklik oleh HR)

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-PHK-03 — Execute PHK → Stream Dibatalkan, Severance Dirilis

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P0 |
| **Aktor** | HR Manager |
| **Pre-kondisi** | Proposal PHK sudah disetujui oleh HR dan Legal (`hrApproved = true`, `legalApproved = true`). Belum expired (< 7 hari sejak proposal). |

**Langkah Pengujian:**
1. Login sebagai HR, buka `/hr/phk`
2. Temukan proposal dengan status "Siap Dieksekusi"
3. Klik tombol **Eksekusi PHK & Cairkan Pesangon**
4. Setujui transaksi di Privy
5. Tunggu konfirmasi blockchain
6. Verifikasi status karyawan dan saldo severance

**Input:** Klik Eksekusi pada proposal yang sudah diapprove dua pihak

**Expected Output:**
- Stream karyawan dibatalkan (status = `Cancelled`)
- SeveranceVault karyawan dicairkan ke dompet karyawan
- EmploymentSBT karyawan di-revoke
- Event `TerminationExecuted` dan `SeveranceReleased` muncul di BaseScan
- Karyawan tidak lagi muncul sebagai karyawan aktif di tabel HR

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-PHK-04 — Proposal PHK Expire Setelah 7 Hari

| Field | Detail |
|---|---|
| **Tipe** | Bad Path |
| **Prioritas** | P1 |
| **Aktor** | HR Manager |
| **Pre-kondisi** | Proposal PHK sudah dibuat namun tidak dieksekusi dalam 7 hari. |

**Langkah Pengujian:**
1. Buat proposal PHK (TC-PHK-01)
2. Tunggu lebih dari 7 hari (atau gunakan mekanisme time manipulation di testnet)
3. Login sebagai HR, buka `/hr/phk`
4. Temukan proposal yang sudah melewati batas waktu
5. Amati status proposal dan coba eksekusi

**Input:** Proposal PHK yang sudah melewati batas waktu 7 hari

**Expected Output:**
- Status proposal berubah menjadi **"Expired"** secara otomatis
- Tombol **Eksekusi PHK** tidak aktif atau tidak tampil
- Jika dipaksa via contract langsung, transaksi revert dengan error `"Proposal expired"`
- Stream karyawan tetap aktif (tidak dibatalkan)

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

## Modul EWA — Earned Wage Access (Karyawan)

Modul ini mencakup kemampuan karyawan untuk mengakses gaji yang sudah terakumulasi (Earned Wage Access) secara real-time. Saldo EWA bertambah setiap detik sesuai flow rate gaji, dan karyawan dapat melakukan klaim kapan saja dengan batas rate limit.

---

### TC-EWA-01 — Saldo EWA Terakru Real-Time (Naik Setiap Detik)

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P0 |
| **Aktor** | Karyawan |
| **Pre-kondisi** | Stream karyawan berstatus `Active`. Karyawan sudah login. |

**Langkah Pengujian:**
1. Login sebagai karyawan, buka `/employee/ewa`
2. Amati angka saldo EWA yang tampil
3. Tunggu 5–10 detik
4. Amati kembali angka saldo EWA
5. Bandingkan nilai sebelum dan sesudah menunggu

**Input:** Tunggu 10 detik tanpa melakukan aksi apapun

**Expected Output:**
- Angka saldo EWA bertambah secara berkelanjutan setiap detik
- Pertambahan saldo sesuai dengan flow rate gaji per detik: `flowRate = gajiBulanan / (30 * 24 * 3600)` IDRX/detik
- Live counter berjalan tanpa perlu reload halaman
- Nilai yang ditampilkan konsisten dengan nilai on-chain

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-EWA-02 — Klaim EWA Berhasil → Saldo Reset ke 0

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P0 |
| **Aktor** | Karyawan |
| **Pre-kondisi** | Stream aktif. Sudah ada saldo EWA yang terakumulasi (minimal > 0). Vault HR bersaldo cukup. |

**Langkah Pengujian:**
1. Login sebagai karyawan, buka `/employee/ewa`
2. Catat saldo EWA saat ini (misal: 10.000 IDRX)
3. Klik tombol **Klaim Gaji — Gasless**
4. Setujui transaksi di Privy (silent sign)
5. Tunggu konfirmasi
6. Amati saldo EWA setelah klaim

**Input:** Klik tombol Klaim Gaji dengan saldo EWA > 0

**Expected Output:**
- Saldo EWA direset ke 0 setelah klaim berhasil
- Dompet karyawan menerima 93% dari total accrued dalam IDRX
- ComplianceVault HR bertambah 5%
- SeveranceVault karyawan bertambah 2%
- Event `SalaryClaimed` muncul di BaseScan
- Counter EWA mulai berjalan kembali dari 0

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-EWA-03 — Rate Limit: Maksimal 10 Klaim per Jam

| Field | Detail |
|---|---|
| **Tipe** | Bad Path |
| **Prioritas** | P1 |
| **Aktor** | Karyawan |
| **Pre-kondisi** | Karyawan sudah melakukan 10 klaim dalam satu jam terakhir. Stream masih aktif. |

**Langkah Pengujian:**
1. Login sebagai karyawan, buka `/employee/ewa`
2. Lakukan klaim EWA sebanyak 10 kali berturut-turut dalam satu jam (setiap ada saldo > 0)
3. Pada percobaan klaim ke-11, amati respons sistem

**Input:** Percobaan klaim ke-11 dalam satu jam yang sama

**Expected Output:**
- Tombol klaim **dinonaktifkan** dengan pesan seperti: _"Batas klaim tercapai. Coba lagi dalam X menit."_
- Jika dipaksa via contract langsung, transaksi revert dengan error rate limit
- Klaim ke-11 tidak diproses; saldo EWA tetap terakumulasi
- Setelah jendela 1 jam berlalu, klaim dapat dilakukan kembali

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

## Modul KOP — Koperasi Digital

Modul ini menyediakan layanan pinjaman berbasis gaji karyawan menggunakan pool likuiditas bersama. Batas pinjaman dihitung berdasarkan persentase gaji bulanan karyawan, dan pembayaran kembali dilakukan secara otomatis saat karyawan melakukan klaim EWA.

---

### TC-KOP-01 — Pinjam IDRX dari Pool (Maksimal 80% Gaji)

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P1 |
| **Aktor** | Karyawan |
| **Pre-kondisi** | Stream aktif. Pool koperasi memiliki likuiditas cukup. Tidak ada pinjaman aktif. Gaji bulanan = 5.000.000 IDRX (maks pinjam = 4.000.000 IDRX). |

**Langkah Pengujian:**
1. Buka `/employee/koperasi`
2. Isi jumlah pinjam: `3000000` IDRX (60% gaji — dalam batas maksimal 80%)
3. Klik **1. Approve** → setujui transaksi
4. Klik **2. Pinjam** → setujui transaksi
5. Amati status pinjaman setelah transaksi berhasil

**Input:** Jumlah pinjam = `3000000` IDRX (60% dari gaji bulanan 5.000.000 IDRX)

**Expected Output:**
- Pinjaman aktif muncul di kartu "Pinjaman Saya" dengan status `Active`
- Karyawan menerima 3.000.000 IDRX di dompetnya
- Pool likuiditas tersedia berkurang
- Event `LoanCreated` muncul di BaseScan
- Formulir pinjaman diganti dengan tampilan "Lunasi Pinjaman"

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-KOP-02 — Auto-Repay Saat Klaim EWA Berikutnya

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P1 |
| **Aktor** | Karyawan |
| **Pre-kondisi** | Ada pinjaman aktif dari koperasi (TC-KOP-01). Stream aktif dan ada saldo EWA yang terakumulasi. |

**Langkah Pengujian:**
1. Pastikan ada pinjaman aktif (TC-KOP-01)
2. Catat sisa pinjaman sebelum klaim
3. Login sebagai karyawan, buka `/employee/ewa`
4. Klik **Klaim Gaji — Gasless** → setujui transaksi
5. Amati sisa pinjaman setelah klaim

**Input:** Klik Klaim Gaji saat ada pinjaman koperasi aktif

**Expected Output:**
- Saat `claimSalary()` dieksekusi, contract memanggil `autoRepay()` secara otomatis
- Sebagian accrued EWA dipotong untuk cicilan pinjaman sesuai `REPAY_FRACTION_BPS`
- Saldo pinjaman berkurang secara otomatis
- Sisa accrued (setelah auto-repay) dibagi sesuai skema 93/5/2
- Event `LoanRepaid` dan `SalaryClaimed` muncul di BaseScan

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

## Modul VEST — Cliff Vesting

Modul ini menyediakan mekanisme pemberian token/gaji dengan periode penguncian (cliff). HR dapat membuat paket vesting untuk karyawan, dan karyawan hanya dapat mengklaim setelah tanggal cliff tercapai.

---

### TC-VEST-01 — Buat Cliff Vest oleh HR

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P1 |
| **Aktor** | HR Manager |
| **Pre-kondisi** | Vault aktif dan bersaldo cukup. Karyawan terdaftar di sistem. |

**Langkah Pengujian:**
1. Buka `/hr/vesting`
2. Klik tombol **Buat Vest Baru**
3. Isi alamat karyawan, jumlah: `10000000` IDRX
4. Tentukan cliff date: 1 bulan ke depan
5. Pilih tipe vesting: **Retensi**
6. Klik **Buat Cliff Vest** → setujui transaksi di Privy
7. Tunggu konfirmasi

**Input:** Karyawan = `0xEMP...`, jumlah = `10000000` IDRX, cliff date = 1 bulan ke depan, tipe = Retensi

**Expected Output:**
- Vest terdaftar on-chain dengan status `Locked`
- Event `CliffVestCreated` muncul di BaseScan
- Karyawan dapat melihat vest di `/employee/vesting` dengan countdown hari
- Saldo vault HR berkurang sebesar jumlah vest yang dialokasikan

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-VEST-02 — Tombol Klaim Disabled Sebelum Cliff Date

| Field | Detail |
|---|---|
| **Tipe** | Bad Path |
| **Prioritas** | P1 |
| **Aktor** | Karyawan |
| **Pre-kondisi** | Vest sudah dibuat (TC-VEST-01). Cliff date belum tercapai (masih di masa depan). |

**Langkah Pengujian:**
1. Login sebagai karyawan, buka `/employee/vesting`
2. Temukan vest dengan status `Locked` dan cliff belum tercapai
3. Amati tombol klaim yang tersedia
4. Jika tombol ada, coba klik

**Input:** Coba klaim vest dengan cliff date di masa depan

**Expected Output:**
- Tombol **Klaim Vest** tidak aktif (disabled) atau tidak tampil
- UI menampilkan countdown: _"Tersedia dalam X hari"_
- Jika dipaksa via contract langsung, transaksi revert dengan error `"Cliff not reached"`
- Tidak ada transfer IDRX yang terjadi

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

### TC-VEST-03 — Klaim Vest Berhasil Setelah Cliff Date

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Prioritas** | P1 |
| **Aktor** | Karyawan |
| **Pre-kondisi** | Vest sudah dibuat (TC-VEST-01). Cliff date sudah terlewati. Status vest masih `Locked` (belum diklaim). |

**Langkah Pengujian:**
1. Login sebagai karyawan, buka `/employee/vesting`
2. Temukan vest dengan countdown "0 hari" atau cliff date sudah lewat
3. Klik tombol **Klaim Vest**
4. Setujui transaksi di Privy
5. Tunggu konfirmasi dan amati perubahan status

**Input:** Klik Klaim Vest setelah cliff date tercapai

**Expected Output:**
- Transaksi berhasil
- Status vest berubah dari `Locked` menjadi `Claimed`
- Karyawan menerima jumlah IDRX vest di dompetnya
- Event `CliffVestClaimed` muncul di BaseScan
- Tombol klaim tidak lagi tampil (vest sudah diklaim)

**Actual Result:** _(isi saat pengujian)_
**Status:** ⏳

---

## Ringkasan Hasil Pengujian

| Modul | Total TC | P0 | P1 | P2 | Pass | Fail | Pending |
|---|---|---|---|---|---|---|---|
| AUTH — Auth & Onboarding | 6 | 5 | 1 | 0 | — | — | 6 |
| OWN — Owner SaaS | 6 | 5 | 1 | 0 | — | — | 6 |
| HR — Vault & Karyawan | 9 | 5 | 3 | 1 | — | — | 9 |
| PHK — Multi-Sig PHK | 4 | 3 | 1 | 0 | — | — | 4 |
| EWA — Earned Wage Access | 3 | 2 | 1 | 0 | — | — | 3 |
| KOP — Koperasi Digital | 2 | 0 | 2 | 0 | — | — | 2 |
| VEST — Cliff Vesting | 3 | 0 | 3 | 0 | — | — | 3 |
| **Total** | **33** | **20** | **12** | **1** | **—** | **—** | **33** |

---

## Catatan Pengujian

> Isi bagian ini setelah pengujian dilakukan.

| Tanggal | TC-ID | Penguji | Temuan |
|---|---|---|---|
| | | | |

---

## Environment Pengujian

| Item | Detail |
|---|---|
| Network | Base Sepolia Testnet (Chain ID: 84532) |
| PayrollContract | `0x05b1DF6d82356CC256D1265cD185B4222E4745b3` |
| EmployeeLiquidityContract | `0x872af14287370BAFC883237EF390E367d38a8A33` |
| EmploymentSBT | `0xCB5118AF36907165496Dc028b441ad9152D2D264` |
| Frontend | `http://localhost:3000` |
| Backend | `http://localhost:3001` |
| Ponder Indexer | `http://localhost:42069` |
| Browser | Chrome / Firefox (versi terbaru) |
| Device | Desktop (1920x1080) dan Mobile (375x812) |
| Token | IDRX (Base Sepolia testnet faucet) |
