# Black Box Testing — Finley Payroll

> **Versi Dokumen:** v1.0  
> **Tanggal:** 19 April 2026  
> **Network:** Base Sepolia Testnet (Chain ID: 84532)  
> **Metodologi:** Black Box Testing — pengujian dilakukan dari sisi pengguna tanpa melihat implementasi internal smart contract atau kode frontend.

---

## Metodologi

**Black box testing** menguji sistem dari perspektif pengguna akhir: input diberikan, output diamati, dan dibandingkan dengan hasil yang diharapkan. Tidak ada akses ke source code saat pengujian.

Setiap test case dikategorikan ke salah satu dari dua jenis:

| Tipe | Deskripsi |
|---|---|
| **Happy Path** | Input valid, kondisi normal — sistem harus berhasil |
| **Bad Path** | Input tidak valid, kondisi edge case, atau aksi tidak diizinkan — sistem harus gagal dengan pesan yang tepat |

### Skala Status

| Status | Arti |
|---|---|
| ✅ Pass | Actual result sesuai expected result |
| ❌ Fail | Actual result tidak sesuai expected result |
| ⏳ Pending | Belum diuji |

---

## Daftar Test Cases

| ID | Modul | Skenario | Tipe | Status |
|---|---|---|---|---|
| TC-A01 | Core Payroll | Inisialisasi vault berhasil | Happy | ⏳ |
| TC-A02 | Core Payroll | Inisialisasi vault duplikat | Bad | ⏳ |
| TC-A03 | Core Payroll | Fund vault berhasil | Happy | ⏳ |
| TC-A04 | Core Payroll | Fund vault tanpa approval IDRX | Bad | ⏳ |
| TC-A05 | Core Payroll | Mulai stream gaji karyawan | Happy | ⏳ |
| TC-A06 | Core Payroll | Mulai stream oleh non-HR | Bad | ⏳ |
| TC-A07 | Core Payroll | Klaim gaji (EWA) berhasil | Happy | ⏳ |
| TC-A08 | Core Payroll | Klaim gaji saat stream dijeda | Bad | ⏳ |
| TC-A09 | Core Payroll | Klaim gaji saldo vault tidak cukup | Bad | ⏳ |
| TC-A10 | Core Payroll | Jeda & lanjutkan stream | Happy | ⏳ |
| TC-A11 | Core Payroll | Update flow rate karyawan | Happy | ⏳ |
| TC-A12 | Core Payroll | Tarik dana vault | Happy | ⏳ |
| TC-A13 | Core Payroll | Jeda & bekukan vault | Happy | ⏳ |
| TC-B01 | Auth & Onboarding | Registrasi HR via wizard (company onboarding) | Happy | ⏳ |
| TC-B02 | Auth & Onboarding | HR akses dashboard employee (salah role) | Bad | ⏳ |
| TC-B03 | Auth & Onboarding | Employee join via invite link valid | Happy | ⏳ |
| TC-B04 | Auth & Onboarding | Employee buka invite link perusahaan tidak ada | Bad | ⏳ |
| TC-B05 | Auth & Onboarding | Employee akses dashboard sebelum stream aktif | Bad | ⏳ |
| TC-C01 | Compliance & PHK | Ajukan PHK oleh HR | Happy | ⏳ |
| TC-C02 | Compliance & PHK | Eksekusi PHK sebelum Legal setujui | Bad | ⏳ |
| TC-C03 | Compliance & PHK | Eksekusi PHK setelah semua setujui | Happy | ⏳ |
| TC-C04 | Compliance & PHK | PHK oleh non-HR | Bad | ⏳ |
| TC-C05 | Compliance & PHK | Export laporan compliance (BPJS/PPh21) | Happy | ⏳ |
| TC-C06 | Compliance & PHK | Export laporan bulan tanpa transaksi | Bad | ⏳ |
| TC-D01 | Cliff Vesting | Buat cliff vest oleh HR | Happy | ⏳ |
| TC-D02 | Cliff Vesting | Klaim vest sebelum cliff date | Bad | ⏳ |
| TC-D03 | Cliff Vesting | Klaim vest setelah cliff date | Happy | ⏳ |
| TC-D04 | Cliff Vesting | Batal vest oleh HR | Happy | ⏳ |
| TC-D05 | Cliff Vesting | Klaim vest yang sudah dibatalkan | Bad | ⏳ |
| TC-E01 | Koperasi | Deposit ke pool koperasi | Happy | ⏳ |
| TC-E02 | Koperasi | Deposit tanpa approval IDRX | Bad | ⏳ |
| TC-E03 | Koperasi | Pinjam dari pool | Happy | ⏳ |
| TC-E04 | Koperasi | Pinjam melebihi batas maksimum | Bad | ⏳ |
| TC-E05 | Koperasi | Pinjam saat masih ada pinjaman aktif | Bad | ⏳ |
| TC-E06 | Koperasi | Bayar pinjaman manual | Happy | ⏳ |
| TC-E07 | Koperasi | Auto-repay saat klaim gaji | Happy | ⏳ |
| TC-E08 | Koperasi | Tarik simpanan koperasi | Happy | ⏳ |

---

## Modul A — Core Payroll

### TC-A01 — Inisialisasi Vault Berhasil

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Aktor** | HR / Company Admin |
| **Precondition** | Akun HR sudah login via Privy (email). Belum pernah inisialisasi vault. |

**Langkah Uji:**
1. Buka `https://finley.app/onboarding/company`
2. Isi nama perusahaan: `"PT Test Indonesia"`
3. Klik **Lanjut**
4. Atur BPJS = 300 bps (3%), PPh21 = 200 bps (2%), threshold alert = 2000 bps
5. Klik **Inisialisasi Vault On-Chain** → setujui transaksi di Privy
6. Tunggu konfirmasi Base Sepolia (~2 detik)

**Expected Result:**
- Transaksi berhasil (status `success`)
- Link ke BaseScan muncul
- Wizard otomatis pindah ke Step 3 (Fund Vault)
- Event `VaultInitialized` muncul di BaseScan

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-A02 — Inisialisasi Vault Duplikat

| Field | Detail |
|---|---|
| **Tipe** | Bad Path |
| **Aktor** | HR yang sudah punya vault aktif |
| **Precondition** | Vault sudah diinisialisasi (TC-A01 sudah berhasil) |

**Langkah Uji:**
1. Buka `/onboarding/company` dengan akun HR yang sama
2. Isi nama perusahaan: `"PT Duplikat"`
3. Klik **Inisialisasi Vault On-Chain** → setujui transaksi

**Expected Result:**
- Transaksi **gagal** (reverted oleh smart contract)
- Pesan error muncul di TxButton: `"Transaction failed"`
- Vault lama tidak berubah

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-A03 — Fund Vault Berhasil

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Aktor** | HR |
| **Precondition** | Vault sudah diinisialisasi. HR punya saldo IDRX di dompet (≥ jumlah yang akan di-deposit). |

**Langkah Uji:**
1. Buka `/hr/vault`
2. Isi jumlah deposit: `1000000` IDRX
3. Klik **1. Approve IDRX** → setujui di Privy
4. Tunggu konfirmasi approval
5. Klik **2. Deposit ke Vault** → setujui di Privy
6. Tunggu konfirmasi

**Expected Result:**
- Approval berhasil (step 1 ✅)
- Deposit berhasil (step 2 ✅)
- Saldo vault bertambah 1.000.000 IDRX
- Angka di kartu vault terupdate

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-A04 — Fund Vault Tanpa Approval IDRX

| Field | Detail |
|---|---|
| **Tipe** | Bad Path |
| **Aktor** | HR |
| **Precondition** | Vault sudah diinisialisasi. Tombol deposit langsung diklik tanpa approval terlebih dahulu. |

**Langkah Uji:**
1. Buka `/hr/vault`
2. Isi jumlah: `500000` IDRX
3. Langsung klik **2. Deposit ke Vault** (tanpa klik Approve dulu)

**Expected Result:**
- Tombol **2. Deposit ke Vault** disabled (tidak bisa diklik) — UI mencegah aksi ini
- Tidak ada transaksi yang dikirim

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-A05 — Mulai Stream Gaji Karyawan

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Aktor** | HR |
| **Precondition** | Vault aktif dan bersaldo cukup. Alamat karyawan diketahui (Work ID). |

**Langkah Uji:**
1. Buka `/hr/employees`
2. Klik **Tambah Karyawan**
3. Isi alamat karyawan: `0xABC...` (Work ID dari EmployeeWelcome)
4. Isi gaji bulanan: `5000000` IDRX
5. Split: 9300 / 500 / 200 bps (default)
6. Klik **Mulai Stream** → setujui di Privy

**Expected Result:**
- Transaksi berhasil
- Karyawan muncul di tabel dengan status `Active`
- Event `StreamCreated` muncul di BaseScan
- Employee bisa klaim gaji di `/employee`

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-A06 — Mulai Stream oleh Non-HR

| Field | Detail |
|---|---|
| **Tipe** | Bad Path |
| **Aktor** | Karyawan (tidak punya HR_ROLE) |
| **Precondition** | Akun employee sudah login |

**Langkah Uji:**
1. Login sebagai employee
2. Coba akses `/hr/employees` langsung via URL bar

**Expected Result:**
- Halaman **tidak dapat diakses** — AuthGuard redirect ke `/employee`
- Tidak ada cara untuk memanggil `startStream()` dari UI employee

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-A07 — Klaim Gaji (EWA) Berhasil

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Aktor** | Karyawan |
| **Precondition** | Stream aktif. Sudah ada waktu berjalan (minim 60 detik sejak stream dibuat/klaim terakhir). |

**Langkah Uji:**
1. Login sebagai employee, buka `/employee`
2. Amati live counter EWA bertambah setiap detik
3. Klik **Klaim Gaji — Gasless ⚡**
4. Setujui transaksi di Privy (silent sign)
5. Tunggu konfirmasi

**Expected Result:**
- Counter EWA reset ke 0 setelah klaim berhasil
- Dompet employee menerima 93% dari total accrued dalam IDRX
- ComplianceVault HR bertambah 5%
- SeveranceVault employee bertambah 2%
- Event `SalaryClaimed` muncul di BaseScan dengan nilai `netToEmployee`, `toCompliance`, `toSeverance`

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-A08 — Klaim Gaji Saat Stream Dijeda

| Field | Detail |
|---|---|
| **Tipe** | Bad Path |
| **Aktor** | Karyawan |
| **Precondition** | Stream ada tapi status `Paused` (HR sudah menjeda) |

**Langkah Uji:**
1. HR jeda stream di `/hr/employees` → Kelola → Jeda
2. Login sebagai employee, buka `/employee`
3. Klik **Klaim Gaji**

**Expected Result:**
- Tombol **disabled** — UI mendeteksi status `Paused` dan menonaktifkan klaim
- Jika tombol berhasil diklik (bypass UI), transaksi contract revert

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-A09 — Klaim Gaji Saldo Vault Tidak Cukup

| Field | Detail |
|---|---|
| **Tipe** | Bad Path |
| **Aktor** | Karyawan |
| **Precondition** | Stream aktif, tapi saldo vault HR sudah habis / di bawah accrued amount |

**Langkah Uji:**
1. HR tarik seluruh dana vault hingga saldo = 0
2. Tunggu beberapa detik agar accrued > 0
3. Employee klik **Klaim Gaji**

**Expected Result:**
- Transaksi **gagal** (contract revert karena `vaultBalance < accrued`)
- Pesan error muncul di TxButton
- Alert saldo rendah (`LowVaultBalance` event) sudah di-emit sebelumnya

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-A10 — Jeda & Lanjutkan Stream

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Aktor** | HR |
| **Precondition** | Stream karyawan status `Active` |

**Langkah Uji:**
1. Buka `/hr/employees` → klik **Kelola** pada karyawan
2. Klik **Jeda** → setujui transaksi
3. Verifikasi status berubah jadi `Paused`
4. Klik **Lanjutkan** → setujui transaksi
5. Verifikasi status berubah kembali jadi `Active`

**Expected Result:**
- Status berubah `Active` → `Paused` → `Active`
- Settled balance terakumulasi selama jeda (waktu jeda tidak hilang)
- Setelah dilanjutkan, employee bisa klaim kembali

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-A11 — Update Flow Rate Karyawan

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Aktor** | HR |
| **Precondition** | Stream karyawan status `Active` |

**Langkah Uji:**
1. Buka `/hr/employees` → Kelola karyawan target
2. Isi gaji baru: `6000000` IDRX/bulan di field Update
3. Klik **Update** → setujui transaksi

**Expected Result:**
- Flow rate karyawan berubah sesuai gaji baru
- Live counter di dashboard employee menggunakan flow rate baru
- Event `FlowRateUpdated` muncul di BaseScan

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-A12 — Tarik Dana Vault

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Aktor** | HR |
| **Precondition** | Vault bersaldo > jumlah yang akan ditarik |

**Langkah Uji:**
1. Buka `/hr/vault`
2. Isi jumlah tarik: `100000` IDRX
3. Isi alamat tujuan: alamat dompet HR sendiri
4. Klik **Tarik Dana** → setujui transaksi

**Expected Result:**
- Saldo vault berkurang 100.000 IDRX
- Alamat tujuan menerima 100.000 IDRX
- Event `VaultWithdrawn` muncul di BaseScan

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-A13 — Jeda & Bekukan Vault

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Aktor** | HR |
| **Precondition** | Vault status `Active` |

**Langkah Uji:**
1. Buka `/hr/vault`
2. Klik **Jeda Vault** → setujui → verifikasi status `Paused`
3. Klik **Lanjutkan Vault** → setujui → verifikasi status `Active`
4. Klik **Bekukan Vault** → setujui → verifikasi status `Frozen`

**Expected Result:**
- Vault `Paused`: semua klaim stream baru tidak bisa diproses
- Vault `Active`: normal kembali
- Vault `Frozen`: tidak bisa dijeda atau dilanjutkan lagi tanpa admin

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

## Modul B — Auth & Onboarding

### TC-B01 — Registrasi HR via Company Wizard

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Aktor** | Pengguna baru (belum punya akun) |
| **Precondition** | Pengguna belum pernah login ke Finley |

**Langkah Uji:**
1. Buka `https://finley.app/onboarding/company`
2. Klik **Masuk dengan Email / Google** → login via Privy
3. Wizard muncul di Step 1
4. Isi nama perusahaan → Lanjut
5. Atur split config → Inisialisasi Vault (TC-A01)
6. Fund vault (TC-A03)
7. Salin link undangan karyawan

**Expected Result:**
- Dompet kripto (Work ID) dibuat otomatis oleh Privy — pengguna tidak perlu tahu seed phrase
- Setelah `initializeVault()` berhasil, akun mendapat `HR_ROLE` on-chain
- Wizard selesai di Step 4 dengan link undangan yang valid

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-B02 — HR Coba Akses Dashboard Employee

| Field | Detail |
|---|---|
| **Tipe** | Bad Path |
| **Aktor** | HR (punya HR_ROLE) |
| **Precondition** | HR sudah login dan punya vault aktif |

**Langkah Uji:**
1. Login sebagai HR
2. Ketik langsung di URL: `https://finley.app/employee`

**Expected Result:**
- AuthGuard mendeteksi role = `"hr"`
- Redirect otomatis ke `/hr`
- Halaman employee **tidak ditampilkan**

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-B03 — Employee Join via Invite Link Valid

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Aktor** | Karyawan baru |
| **Precondition** | HR sudah buat link undangan. Karyawan belum pernah login. |

**Langkah Uji:**
1. Buka link: `https://finley.app/onboarding/employee?company=0x05b1...`
2. Halaman menampilkan nama perusahaan HR
3. Klik **Masuk dengan Email / Google** → login via Privy
4. Halaman berubah ke **Menunggu aktivasi** dengan Work ID

**Expected Result:**
- Company terverifikasi on-chain (`VaultStatus != Uninitialized`)
- Dompet karyawan dibuat otomatis (Work ID)
- Work ID ditampilkan dengan tombol salin
- Halaman polling setiap 10 detik menunggu HR aktifkan stream

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-B04 — Employee Buka Invite Link Perusahaan Tidak Ada

| Field | Detail |
|---|---|
| **Tipe** | Bad Path |
| **Aktor** | Siapa saja |
| **Precondition** | URL menggunakan alamat company yang tidak valid / belum diinisialisasi |

**Langkah Uji:**
1. Buka: `https://finley.app/onboarding/employee?company=0x0000000000000000000000000000000000000001`

**Expected Result:**
- Halaman menampilkan **"Link Tidak Valid"**
- Pesan: `"Perusahaan tidak ditemukan. Hubungi HR Anda untuk mendapatkan link undangan yang benar."`
- Tidak ada tombol login

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-B05 — Employee Akses Dashboard Sebelum Stream Aktif

| Field | Detail |
|---|---|
| **Tipe** | Bad Path |
| **Aktor** | Karyawan yang sudah login tapi stream belum diaktifkan HR |
| **Precondition** | Employee sudah join via invite link, tapi HR belum panggil `startStream()` |

**Langkah Uji:**
1. Employee login via invite link (TC-B03)
2. Coba akses langsung: `https://finley.app/employee`

**Expected Result:**
- `employeeStreams[address].status` = `Inactive` (0)
- EmployeeWelcome tetap tampilkan **WaitingView** dan polling
- Dashboard `/employee` tidak redirect masuk — atau jika stream status `Inactive`, tampil empty state dengan pesan "Stream belum aktif"

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

## Modul C — Compliance & PHK

### TC-C01 — Ajukan PHK oleh HR

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Aktor** | HR |
| **Precondition** | Karyawan memiliki stream aktif |

**Langkah Uji:**
1. Buka `/hr/termination`
2. Isi alamat karyawan di kolom "Ajukan PHK"
3. Klik **Ajukan Terminasi** → setujui transaksi

**Expected Result:**
- Proposal PHK terdaftar on-chain
- Event `TerminationProposed` muncul di BaseScan
- Status proposal: `hrApproved = false`, `legalApproved = false`
- Proposal bisa ditemukan via fitur "Cari Proposal PHK"

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-C02 — Eksekusi PHK Sebelum Legal Setujui

| Field | Detail |
|---|---|
| **Tipe** | Bad Path |
| **Aktor** | HR |
| **Precondition** | Proposal PHK sudah dibuat, tapi Legal belum `approveTermination()` |

**Langkah Uji:**
1. Setelah TC-C01 berhasil (proposal ada)
2. Cari proposal di `/hr/termination`
3. Coba klik **Eksekusi PHK** (jika tombol muncul)

**Expected Result:**
- Tombol **Eksekusi PHK** tidak muncul di UI karena `legalApproved = false`
- Jika dipaksa via contract call langsung, transaksi **revert** dengan error `"Both HR and Legal must approve"`

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-C03 — Eksekusi PHK Setelah Semua Menyetujui

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Aktor** | HR (setelah Legal juga setujui) |
| **Precondition** | Proposal PHK sudah di-approve oleh HR dan Legal (`hrApproved = true`, `legalApproved = true`). Belum expired. |

**Langkah Uji:**
1. HR approve via `approveTermination()` (TC-C01)
2. Akun Legal approve via `approveTermination()` (off-screen — gunakan cast atau direct contract call)
3. Buka `/hr/termination` → cari proposal
4. Klik **Eksekusi PHK & Cairkan Pesangon** → setujui transaksi

**Expected Result:**
- Stream karyawan dibatalkan (`StreamStatus.Cancelled`)
- SeveranceVault karyawan dicairkan ke dompet karyawan (`SeveranceState.Released`)
- EmploymentSBT karyawan di-revoke
- Event `TerminationExecuted` dan `SeveranceReleased` muncul di BaseScan

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-C04 — PHK oleh Non-HR

| Field | Detail |
|---|---|
| **Tipe** | Bad Path |
| **Aktor** | Karyawan (tidak punya HR_ROLE) |
| **Precondition** | Karyawan sudah login |

**Langkah Uji:**
1. Login sebagai employee
2. Coba akses `/hr/termination` via URL langsung

**Expected Result:**
- AuthGuard redirect ke `/employee` — halaman tidak bisa diakses
- Tidak ada cara memanggil `proposeTermination()` dari UI employee

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-C05 — Export Laporan Compliance (BPJS/PPh21)

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Aktor** | HR |
| **Precondition** | Ada minimal 1 klaim gaji pada bulan yang dipilih |

**Langkah Uji:**
1. Buka `/hr/compliance`
2. Pilih bulan: `2026-04`
3. Klik **Lihat Ringkasan** → tabel karyawan muncul
4. Klik **Export CSV** → file ter-download

**Expected Result:**
- Tabel menampilkan per-karyawan: jumlah klaim, total accrued, total compliance, total severance
- File CSV ter-download dengan nama `compliance_2026-04.csv`
- Data CSV sesuai dengan tabel ringkasan

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-C06 — Export Laporan Bulan Tanpa Transaksi

| Field | Detail |
|---|---|
| **Tipe** | Bad Path |
| **Aktor** | HR |
| **Precondition** | Tidak ada klaim gaji pada bulan yang dipilih |

**Langkah Uji:**
1. Buka `/hr/compliance`
2. Pilih bulan jauh di masa depan: `2030-01`
3. Klik **Lihat Ringkasan**

**Expected Result:**
- Tabel tampil kosong dengan pesan `"Tidak ada klaim pada bulan ini."`
- Export CSV tetap bisa dilakukan (file kosong / hanya header)
- Tidak ada error crash

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

## Modul D — Cliff Vesting

### TC-D01 — Buat Cliff Vest oleh HR

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Aktor** | HR |
| **Precondition** | Vault aktif. Karyawan terdaftar. |

**Langkah Uji:**
1. Buka `/hr/vesting` → klik **Buat Vest Baru**
2. Isi alamat karyawan, jumlah: `10000000` IDRX, cliff date: 1 bulan ke depan
3. Pilih tipe: **Retensi**
4. Klik **Buat Cliff Vest** → setujui transaksi

**Expected Result:**
- Vest terdaftar on-chain dengan status `Locked`
- Vest muncul saat dicari via alamat karyawan
- Event `CliffVestCreated` muncul di BaseScan
- Karyawan melihat vest di `/employee/vesting` dengan countdown hari

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-D02 — Klaim Vest Sebelum Cliff Date

| Field | Detail |
|---|---|
| **Tipe** | Bad Path |
| **Aktor** | Karyawan |
| **Precondition** | Vest ada dengan cliff date di masa depan. Status `Locked`. |

**Langkah Uji:**
1. Login sebagai karyawan, buka `/employee/vesting`
2. Lihat vest dengan status `Locked` dan cliff belum tercapai
3. Coba klik tombol **Klaim Vest**

**Expected Result:**
- Tombol **Klaim Vest** tidak muncul di UI — hanya tampil countdown "Tersedia dalam X hari"
- Jika dipaksa via contract langsung, transaksi revert dengan `"Cliff not reached"`

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-D03 — Klaim Vest Setelah Cliff Date

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Aktor** | Karyawan |
| **Precondition** | Vest ada dengan cliff date yang sudah terlewati. Status `Locked`. |

**Langkah Uji:**
1. Login sebagai karyawan, buka `/employee/vesting`
2. Lihat vest dengan countdown "0 hari" / cliff date sudah lewat
3. Klik **Klaim Vest** → setujui transaksi

**Expected Result:**
- Vest status berubah jadi `Claimed`
- Karyawan menerima jumlah IDRX vest ke dompetnya
- Event `CliffVestClaimed` muncul di BaseScan

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-D04 — Batalkan Vest oleh HR

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Aktor** | HR |
| **Precondition** | Vest status `Locked` (belum diklaim) |

**Langkah Uji:**
1. Buka `/hr/vesting`
2. Cari vest karyawan target
3. Klik **Batalkan Vest** → setujui transaksi

**Expected Result:**
- Vest status berubah jadi `Forfeited`
- Dana vest kembali ke vault HR
- Event `CliffVestForfeited` muncul di BaseScan

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-D05 — Klaim Vest yang Sudah Dibatalkan

| Field | Detail |
|---|---|
| **Tipe** | Bad Path |
| **Aktor** | Karyawan |
| **Precondition** | Vest status `Forfeited` (sudah dibatalkan HR) |

**Langkah Uji:**
1. Login sebagai karyawan, buka `/employee/vesting`
2. Lihat vest dengan status `Forfeited`
3. Coba klik klaim

**Expected Result:**
- Tidak ada tombol klaim untuk vest `Forfeited`
- Jika dipaksa via contract langsung, transaksi revert

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

## Modul E — Koperasi Digital

### TC-E01 — Deposit ke Pool Koperasi

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Aktor** | Karyawan (sebagai penyimpan/lender) |
| **Precondition** | Stream aktif. Karyawan punya saldo IDRX. |

**Langkah Uji:**
1. Buka `/employee/koperasi`
2. Isi jumlah deposit: `500000` IDRX
3. Klik **Approve** → setujui transaksi
4. Klik **Simpan** → setujui transaksi

**Expected Result:**
- Approval berhasil
- Deposit berhasil — saldo simpanan muncul di kartu "Simpanan Saya"
- Total pool perusahaan bertambah
- Event `Deposited` muncul di BaseScan

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-E02 — Deposit Tanpa Approval IDRX

| Field | Detail |
|---|---|
| **Tipe** | Bad Path |
| **Aktor** | Karyawan |
| **Precondition** | Karyawan belum approve IDRX ke contract |

**Langkah Uji:**
1. Buka `/employee/koperasi`
2. Isi jumlah deposit: `100000`
3. Langsung klik **Simpan** (tanpa approve dulu)

**Expected Result:**
- Tombol **Simpan** disabled karena approve belum berhasil
- Tidak ada transaksi yang dikirim

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-E03 — Pinjam dari Pool Koperasi

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Aktor** | Karyawan |
| **Precondition** | Stream aktif. Pool memiliki likuiditas cukup. Tidak ada pinjaman aktif. |

**Langkah Uji:**
1. Buka `/employee/koperasi`
2. Isi jumlah pinjam: `500000` IDRX
3. Klik **1. Approve** → setujui
4. Klik **2. Pinjam** → setujui transaksi

**Expected Result:**
- Pinjaman aktif muncul di kartu "Pinjaman" dengan status `Active`
- Karyawan menerima IDRX pinjaman di dompetnya
- Pool likuiditas tersedia berkurang
- Event `LoanCreated` muncul di BaseScan

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-E04 — Pinjam Melebihi Batas Maksimum

| Field | Detail |
|---|---|
| **Tipe** | Bad Path |
| **Aktor** | Karyawan |
| **Precondition** | Stream aktif. Gaji bulanan = 5.000.000 IDRX. Batas maks = 50% gaji (MAX_LOAN_BPS = 5000). |

**Langkah Uji:**
1. Buka `/employee/koperasi`
2. Isi jumlah pinjam: `3000000` IDRX (60% gaji — melebihi batas 50%)
3. Klik **1. Approve** → setujui
4. Klik **2. Pinjam** → setujui transaksi

**Expected Result:**
- Transaksi **gagal** (contract revert: `"Exceeds max loan amount"`)
- Pesan error muncul di UI
- Pinjaman tidak terbuat

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-E05 — Pinjam Saat Masih Ada Pinjaman Aktif

| Field | Detail |
|---|---|
| **Tipe** | Bad Path |
| **Aktor** | Karyawan |
| **Precondition** | Sudah ada pinjaman aktif dari TC-E03 |

**Langkah Uji:**
1. Buka `/employee/koperasi`
2. Coba pinjam lagi: `100000` IDRX

**Expected Result:**
- Tombol pinjam **tidak muncul** di UI — digantikan form **Bayar Pinjaman**
- Jika dipaksa via contract langsung, transaksi revert dengan `"Active loan exists"`

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-E06 — Bayar Pinjaman Manual

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Aktor** | Karyawan |
| **Precondition** | Ada pinjaman aktif |

**Langkah Uji:**
1. Buka `/employee/koperasi`
2. Isi jumlah bayar: `200000` IDRX
3. Klik **Bayar Pinjaman** → setujui transaksi

**Expected Result:**
- Sisa pinjaman berkurang 200.000 IDRX
- Jika sisa = 0, status pinjaman berubah jadi `Repaid`
- Event `LoanRepaid` muncul di BaseScan

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-E07 — Auto-Repay Saat Klaim Gaji

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Aktor** | Karyawan |
| **Precondition** | Ada pinjaman aktif. Stream aktif. Ada accrued salary. |

**Langkah Uji:**
1. Pastikan ada pinjaman aktif (TC-E03)
2. Login sebagai employee, buka `/employee`
3. Klik **Klaim Gaji** → setujui transaksi

**Expected Result:**
- Saat `claimSalary()` dieksekusi, contract memanggil `autoRepay()` di EmployeeLiquidityContract terlebih dahulu
- Sebagian accrued dipotong untuk cicilan pinjaman (sesuai `REPAY_FRACTION_BPS`)
- Sisa accrued dibagi 93/5/2
- Saldo pinjaman berkurang secara otomatis

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

### TC-E08 — Tarik Simpanan Koperasi

| Field | Detail |
|---|---|
| **Tipe** | Happy Path |
| **Aktor** | Karyawan (penyimpan) |
| **Precondition** | Ada simpanan di pool (TC-E01). Pool punya cukup likuiditas. Tidak dalam masa lock. |

**Langkah Uji:**
1. Buka `/employee/koperasi`
2. Isi jumlah tarik: `250000` IDRX
3. Klik **Tarik Simpanan** → setujui transaksi

**Expected Result:**
- Simpanan berkurang 250.000 IDRX
- Dompet karyawan menerima 250.000 + yield yang sudah earned
- Pool total berkurang

**Actual Result:** _(isi saat pengujian)_  
**Status:** ⏳

---

## Ringkasan Hasil Pengujian

| Modul | Total TC | Pass | Fail | Pending |
|---|---|---|---|---|
| A — Core Payroll | 13 | — | — | 13 |
| B — Auth & Onboarding | 5 | — | — | 5 |
| C — Compliance & PHK | 6 | — | — | 6 |
| D — Cliff Vesting | 5 | — | — | 5 |
| E — Koperasi | 8 | — | — | 8 |
| **Total** | **37** | **—** | **—** | **37** |

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
| Token | IDRX (Base Sepolia testnet faucet) |
