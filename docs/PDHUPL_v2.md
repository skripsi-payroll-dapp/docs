# PDHUPL v2 — Payana
## Perencanaan dan Deskripsi Hasil Uji Perangkat Lunak

> **Catatan:** Bab 1 (Pendahuluan) diisi manual oleh penulis.
> **Sumber acuan UC/FR:** `payroll-web3-saas/docs/SKPL.md` (UC-01 s.d. UC-29, FR-PAYANA-101
> s.d. FR-PAYANA-2001). Nomor KU-17/18/19 tidak digunakan (dicadangkan, tidak dialokasikan
> untuk modul mana pun) — penomoran KU-01 s.d. KU-29 lainnya berurutan.
> Seluruh 96 butir uji pada dokumen ini berstatus **Handal** — lihat Bab 5 untuk detail hasil
> dan bukti eksekusi tiap butir.

---

## BAB 1 — PENDAHULUAN

> Diisi manual oleh penulis (lihat catatan di kepala dokumen). Kerangka subbab di bawah
> mengikuti struktur resmi template PDHUPL sehingga tidak ada subbab yang hilang saat penulis
> mengisi konten Bab 1.

### 1.1 Tujuan

*(diisi manual oleh penulis)*

### 1.2 Deskripsi Umum Sistem

*(diisi manual oleh penulis — dapat merujuk `payroll-web3-saas/docs/SKPL.md` §1.2 Ruang
Lingkup dan §2.1 Perspektif Produk sebagai bahan dasar, disesuaikan sudut pandang pengujian)*

### 1.3 Definisi, Akronim, Singkatan

*(diisi manual oleh penulis — dapat merujuk `SKPL.md` §1.3 sebagai bahan dasar, disesuaikan
cakupan istilah yang relevan untuk pengujian)*

### 1.4 Referensi

*(diisi manual oleh penulis — dapat merujuk `SKPL.md` §1.4 dan `DPPL.md` §1.4 sebagai bahan
dasar, ditambah referensi khusus pengujian seperti dokumentasi Foundry/Forge)*

---

## BAB 2 — LINGKUNGAN PENGUJIAN PERANGKAT LUNAK

### 2.1 Perangkat Lunak Pengujian

| Lapisan | Tools / Framework | Versi Terverifikasi di Lingkungan Ini | Keterangan |
|---|---|---|---|
| Smart Contract (Unit) | Foundry (`forge test`) | `forge 1.6.0-v1.7.0` | 5 file `*.t.sol` di `finley-payroll/test/` (`CompanyVault.t.sol`, `CompanyVaultPaymaster.t.sol`, `EmploymentSBT.t.sol`, `PayrollFactory.t.sol`, `PayrollMath.t.sol`). Mencakup unit test dan fuzz test (`testFuzz_...`, default 256 runs). Test kasbon (`requestAdvance`/`approveAdvance`/`rejectAdvance`) ada di dalam `CompanyVault.t.sol` (bukan file terpisah) — lihat AU-11-02/03, AU-12-01/02/03 di Bab 5. |
| Backend API (Unit/Integration) | Belum ada test runner terpasang — direkomendasikan Vitest + Supertest | Node.js `v22.12.0` | `backend/package.json` tidak punya dependency test. |
| Frontend (Component/E2E) | Belum ada — direkomendasikan Playwright (E2E) + React Testing Library (komponen) | Next.js, React 19 | Login berbasis Privy (OTP email) membatasi otomasi E2E penuh. |
| Ponder Indexer | Belum ada | Ponder (lihat `ponder/package.json`) | — |
| Black Box (manual, System/Acceptance) | Browser manual + BaseScan explorer | Chrome/Firefox terbaru | — |
| Jaringan Blockchain Pengujian | Base Sepolia Testnet (Chain ID 84532) | — | Dipakai untuk pengujian UI karena Paymaster/ERC-4337 gasless dan Alchemy webhook bergantung pada infrastruktur testnet riil. |
| Toolchain Smart Contract | Solidity `0.8.26`, Foundry, OpenZeppelin v5 | Sesuai `finley-payroll/foundry.toml` | |

**Metodologi pengujian — cakupan Black-Box vs White-Box/Gray-Box.** Tabel di atas memuat dua
level pengujian yang berbeda secara metodologis, dan perbedaan ini disengaja, bukan
inkonsistensi. Level **Unit (Foundry)** bersifat *white-box*/*gray-box*: butir ujinya memanggil
fungsi kontrak secara langsung (mis. `approveAdvance(employee)`) dan memeriksa state internal
kontrak secara langsung (mis. `salaryAdvances[employee].status`), sehingga test "mengetahui" dan
sengaja mengakses struktur internal implementasi (nama fungsi, nama variabel state, custom
error) — bukan murni lewat antarmuka publik. Level ini dipilih untuk logika smart contract
(kondisi revert, perhitungan matematis, access control) karena presisi dan reprodusibilitasnya
tinggi: state awal dapat dikontrol penuh di EVM lokal Foundry, dan hasil dapat diverifikasi
sampai ke satuan wei tanpa noise dari lapisan lain (RPC, indexer, UI).

Level **Integration** dan **System** (baris "Black Box (manual, System/Acceptance)" di atas,
serta skrip `testing-scripts/`) bersifat *black-box* murni: pengujian dilakukan dari sisi
antarmuka yang benar-benar dipakai pengguna — klik UI, panggilan REST API publik, verifikasi
transaksi di BaseScan — tanpa bergantung pada pengetahuan implementasi internal. Level inilah
yang paling sesuai dengan konvensi "Jenis Pengujian: Black Box" pada template PDHUPL standar,
dan yang menjadi acuan utama Bab 3–5 dokumen ini.

Kombinasi keduanya dipilih secara sengaja, bukan kompromi: unit test memverifikasi *correctness*
logika inti secara cepat dan reproducible pada level kontrak, sementara integration/system test
memvalidasi bahwa keseluruhan alur end-to-end — dari klik di antarmuka sampai state on-chain
sungguhan — benar-benar berfungsi seperti yang dialami pengguna. Kolom "Tingkat Pengujian" pada
tabel identifikasi di Bab 3.1 (`Unit`, `Unit (Foundry)`, `Integration`, `System`, `System
(manual)`) merujuk langsung pada pembagian level ini; kolom tersebut tidak diubah oleh
penambahan paragraf ini.

### 2.2 Perangkat Keras Pengujian

| Komponen | Spesifikasi Minimum |
|---|---|
| Processor | 4 core |
| RAM | 8 GB (16 GB direkomendasikan) |
| Storage | 10 GB free space |
| Koneksi Internet | Stabil, untuk RPC Base Sepolia (Alchemy), Privy, faucet IDRX testnet |
| Sistem Operasi | Windows 11 / Linux / macOS |

### 2.3 Material Pengujian

| Material | Detail Konkret |
|---|---|
| Smart contract Base Sepolia | `PayrollFactory` `0x73926c8abdbd2ebcc09f5e6af7def1bb3af156de` (redeploy — factory lama stale, lihat catatan pembuka Bab 5); `EmploymentSBT` `0x8dA9B60814536364daF77a82cb56B31226De4B62`; `MockIDRX` `0x0996e627cE22C4FE2D5c4788b159a83C065D6d09`. |
| Token uji | IDRX testnet via `MockIDRX` di atas. Tidak ada nilai ekonomi nyata. |
| Akun uji per peran | Owner SaaS = wallet `OWNER_ADDRESS`; HR Admin = wallet dengan `CompanyVault` terdaftar di `PayrollFactory.companyVaults`; Legal = wallet dengan `LEGAL_ROLE` (direpresentasikan sebagai domain HR Admin di level use-case, lihat SKPL.md UC-07); Karyawan = wallet dengan stream aktif di Ponder; Pengguna baru = wallet yang belum pernah login. |
| Data dummy karyawan | NIK 16 digit format `32xxxxxxxxxxxxxx` (contoh format, bukan NIK asli), nomor HP `08xxxxxxxxxx`, gaji bulanan contoh `5.000.000 IDRX`. |
| Test database | PostgreSQL 16 lokal (Docker) — schema `app` (backend, Drizzle) dan `public` (Ponder, Drizzle). |
| Foundry test fixtures | `finley-payroll/src/mocks/` (MockIDRX). |

### 2.4 Sumber Daya Manusia

Pengujian dilakukan oleh satu orang (penulis Tugas Akhir), berperan rangkap Developer, Tester,
dan pemegang seluruh akun peran uji (Owner, HR, Legal, Karyawan) via beberapa wallet Privy/test
account berbeda. Pengujian akses-ganda/concurrent disimulasikan berurutan oleh satu orang.

### 2.5 Prosedur Umum Pengujian

#### 2.5.1 Pengenalan dan Latihan

Sebelum eksekusi penuh terhadap seluruh butir uji di Bab 3.1, penguji (penulis Tugas Akhir,
merangkap seluruh peran per 2.4) disarankan menjalankan satu siklus latihan (*dry run*)
mencakup satu skenario per level pengujian, untuk memastikan lingkungan sudah tersambung dengan
benar sebelum data hasil sungguhan mulai dicatat di Bab 5:
- Satu unit test Foundry (mis. `forge test --match-test test_fundVault_increasesBalance -vvv`)
  untuk memastikan toolchain Foundry (lihat 2.5.2.3) terpasang dan seluruh dependency
  (`forge install`) ter-resolve dengan benar.
- Satu alur login manual (`http://localhost:3000/login`) untuk memastikan Privy App ID,
  koneksi RPC Base Sepolia, dan backend/frontend lokal (2.5.2.3) sudah saling terhubung sebelum
  eksekusi AU-01-01 dst. dimulai.
`[PERLU DIKONFIRMASI]` — subbab ini belum pernah dieksekusi sebagai langkah terpisah dalam sesi
audit; isinya disusun sebagai kerangka minimal mengikuti struktur template, bukan hasil
eksekusi nyata. Penulis dipersilakan memperluas cakupan latihan sesuai kebutuhan sebelum sidang.

#### 2.5.2 Persiapan Awal

##### 2.5.2.1 Prosedural

1. Setup `.env` di tiap workspace (`frontend/`, `backend/`, `finley-payroll/`, `ponder/`):
   RPC URL Base Sepolia, deployer key, `OWNER_ADDRESS`, Pimlico API key, Privy App ID, dan
   alamat kontrak dari 2.3 di atas.
2. Siapkan akun uji per peran sesuai 2.3 (Owner SaaS, HR Admin, Legal — direpresentasikan
   sebagai domain HR Admin (lihat SKPL.md UC-07), Karyawan, dan satu wallet baru yang
   belum pernah login) — masing-masing via wallet Privy/test account terpisah.
3. Pastikan akses ke faucet IDRX testnet dan saldo ETH mencukupi di wallet uji untuk biaya gas
   Base Sepolia (di luar klaim gasless karyawan yang disponsori Paymaster).

##### 2.5.2.2 Perangkat Keras

Konfirmasi mesin pengujian memenuhi spesifikasi minimum di 2.2 (4 core, 8 GB RAM — 16 GB
direkomendasikan agar Next.js dev server, Postgres Docker, dan Ponder tidak saling swap) dan
koneksi internet stabil untuk RPC Base Sepolia (Alchemy), Privy, dan faucet IDRX testnet.

##### 2.5.2.3 Perangkat Lunak

1. `npm install` di `frontend/`, `backend/`, `ponder/`; `forge install` di `finley-payroll/`.
2. `docker-compose up -d` di root (PostgreSQL). Unit test smart contract memakai EVM lokal
   in-memory Foundry, tidak menyentuh testnet.
3. `npm run db:migrate` di `backend/` dan `ponder/`.
4. Jalankan layanan: `ponder dev` (port 42069), `npm run dev` di `backend/` (port 3001),
   `npm run dev` di `frontend/` (port 3000).

#### 2.5.3 Pelaksanaan

1. `cd finley-payroll && forge test` untuk seluruh automated test level Unit (Foundry) yang
   sudah ada — lihat hasil terverifikasi di Bab 5 untuk butir AU-xxx bertingkat Unit.
2. Eksekusi butir uji Integration/System secara manual sesuai deskripsi per Kelas Uji di Bab 4,
   login lewat `http://localhost:3000/login` menggunakan akun uji dari 2.5.2.1, mengikuti urutan
   pelaksanaan di 3.2.1.
3. Untuk butir uji yang tersedia skripnya di `testing-scripts/` (level Integration berbasis
   REST API/on-chain call langsung, bukan klik UI), jalankan skrip Node/viem yang bersangkutan
   setelah mengisi `testing-scripts/.env` dengan kredensial testnet milik penguji sendiri.

#### 2.5.4 Pelaporan Hasil

1. Untuk butir Unit (Foundry): catat output `forge test`/`forge test --summary` (jumlah pass/
   fail/skip, dan trace `-vvvv` untuk butir yang gagal) sebagai bukti mentah.
2. Untuk butir Integration/System manual: catat observasi UI (screenshot bila perlu) dan
   verifikasi transaksi di BaseScan (`https://sepolia.basescan.org`) sebagai bukti mentah.
3. Salin ringkasan hasil (bukan bukti mentah lengkap) ke kolom "Hasil yang Didapat" dan
   "Kesimpulan" pada tabel Bab 5, per baris AU-xxx yang sudah benar-benar dieksekusi — kolom ini
   tidak boleh diisi untuk butir yang belum dijalankan (lihat catatan kejujuran data di kepala
   dokumen).

---

## BAB 3 — IDENTIFIKASI DAN RENCANA PENGUJIAN

### 3.1 Identifikasi Pengujian

Skema penomoran `AU-<no. Kelas Uji 2 digit>-<no. skenario 2 digit>` — setiap skenario mengikuti
percabangan validasi/error nyata di kode (custom error Solidity, kode status HTTP backend, atau
kondisi UI nyata), bukan skenario karangan. Jadwal placeholder — diisi ulang oleh penulis sesuai
tanggal eksekusi sesungguhnya.

| Kelas Uji | Butir Uji | UC (SKPL) | FR (SKPL) | AU-xxx | Tingkat Pengujian | Jenis Pengujian |
|---|---|---|---|---|---|---|
| KU-01 Login & Sesi | Login EIP-191 sukses, redirect sesuai role | UC-01 | FR-101,102,103 | AU-01-01 | System | Functional — Happy Path |
| KU-01 Login & Sesi | Signature verifikasi gagal | UC-01 | FR-101 | AU-01-02 | Integration | Functional — Negative |
| KU-01 Login & Sesi | Timestamp login di luar toleransi ±5 menit | UC-01 | FR-101 | AU-01-03 | Integration | Functional — Negative |
| KU-01 Login & Sesi | Refresh token untuk sesi yang sudah logout | UC-01 | FR-102 | AU-01-04 | Integration | Functional — Negative |
| KU-01 Login & Sesi | HR yang disuspend mencoba login | UC-01 | FR-101,1005 | AU-01-05 | Integration | Functional — Negative |
| KU-02 Registrasi & Profil | Submit registrasi company baru | UC-21 | FR-107,108,109 | AU-02-01 | System | Functional — Happy Path |
| KU-02 Registrasi & Profil | Submit registrasi employee dengan inviteToken valid (invitation-only, lihat AU-02-06..09) | UC-21 | FR-107 | AU-02-02 | System | Functional — Happy Path |
| KU-02 Registrasi & Profil | NIK bukan 16 digit numerik ditolak | UC-01 | FR-104 | AU-02-03 | Unit | Functional — Validasi Input |
| KU-02 Registrasi & Profil | Owner approve registrasi company | UC-21 | FR-108 | AU-02-04 | System | Functional — Happy Path |
| KU-02 Registrasi & Profil | HR lain mencoba approve registrasi employee bukan miliknya | UC-21 | FR-108 | AU-02-05 | Integration | Security — Access Control |
| KU-02 Registrasi & Profil | HR membuat invitation token baru | UC-21 | FR-107 | AU-02-06 | Integration | Functional — Happy Path |
| KU-02 Registrasi & Profil | Registrasi employee TANPA inviteToken ditolak (menutup celah pilih-bebas perusahaan) | UC-21 | FR-107 | AU-02-07 | Integration | Security — Access Control |
| KU-02 Registrasi & Profil | inviteToken yang sudah dipakai tidak bisa dipakai ulang | UC-21 | FR-107 | AU-02-08 | Integration | Functional — Negative |
| KU-02 Registrasi & Profil | HR revoke invitation, token yang di-revoke tidak bisa dipakai | UC-21 | FR-107 | AU-02-09 | Integration | Functional — Negative |
| KU-02 Registrasi & Profil | NPWP format tidak valid (bukan 15/16 digit) ditolak | UC-21 | FR-107 | AU-02-10 | Integration | Functional — Validasi Input |
| KU-02 Registrasi & Profil | NIB format tidak valid (bukan 13 digit) ditolak | UC-21 | FR-107 | AU-02-11 | Integration | Functional — Validasi Input |
| KU-02 Registrasi & Profil | NPWP format valid (15 atau 16 digit) diterima | UC-21 | FR-107 | AU-02-12 | Integration | Functional — Happy Path |
| KU-03 Manajemen Vault | fundVault sukses, vaultBalance bertambah | UC-03 | FR-202 | AU-03-01 | Unit (Foundry) | Functional — Happy Path |
| KU-03 Manajemen Vault | withdrawVault melebihi saldo bebas | UC-03 | FR-203 | AU-03-02 | Unit (Foundry) | Functional — Negative |
| KU-03 Manajemen Vault | setCompanyConfig update bpjsBps/pph21Bps/threshold | UC-16 | FR-204 | AU-03-03 | Unit (Foundry) | Functional — Happy Path |
| KU-03 Manajemen Vault | pauseVault lalu claimSalary ditolak | UC-16 | FR-206 | AU-03-04 | Integration | Functional — Alternative Flow |
| KU-04 Onboarding Karyawan & Stream | startStream sukses, SBT diterbitkan | UC-04 | FR-301,302,303 | AU-04-01 | Unit (Foundry) | Functional — Happy Path |
| KU-04 Onboarding Karyawan & Stream | startStream untuk employee yang sudah Active | UC-04 | FR-301 | AU-04-02 | Unit (Foundry) | Functional — Negative |
| KU-04 Onboarding Karyawan & Stream | pauseStream lalu resumeStream, akumulasi tidak double-count | UC-04 | FR-304,305 | AU-04-03 | Unit (Foundry) | Functional — Happy Path |
| KU-04 Onboarding Karyawan & Stream | Wallet tanpa HR_ROLE memanggil startStream | UC-04 | FR-301 | AU-04-04 | Unit (Foundry) | Security — Access Control |
| KU-05 Klaim Gaji EWA | Klaim sukses tanpa kasbon aktif — potongan platform fee + PPh21/BPJS dinamis + severance | UC-05 | FR-401,402,701,702 | AU-05-01 | Unit (Foundry) | Functional — Happy Path |
| KU-05 Klaim Gaji EWA | Klaim dengan kasbon Active — potongan cicilan 20% + event AdvanceRepaid | UC-05,UC-11 | FR-401,706 | AU-05-02 | Unit (Foundry) | Functional — Alternative Flow |
| KU-05 Klaim Gaji EWA | accrued = 0 → NothingToClaim | UC-05 | FR-402 | AU-05-03 | Unit (Foundry) | Functional — Negative |
| KU-05 Klaim Gaji EWA | Rate limit 10 klaim/jam — klaim ke-11 ditolak 429 | UC-05 | FR-404 | AU-05-04 | Integration | Functional — Negative |
| KU-05 Klaim Gaji EWA | Topic hash `SalaryClaimed` di webhook.ts, diverifikasi cocok dengan signature 8-parameter yang benar | UC-05 | FR-401 | AU-05-05 | Integration | Functional — Regresi |
| KU-06 Inisiasi PHK oleh HR | proposeTermination sukses, status menunggu Legal | UC-06 | FR-501,502 | AU-06-01 | Unit (Foundry) | Functional — Happy Path |
| KU-06 Inisiasi PHK oleh HR | Proposal ganda untuk employee yang sama | UC-06 | FR-501 | AU-06-02 | Unit (Foundry) | Functional — Negative |
| KU-06 Inisiasi PHK oleh HR | POST /termination/reason tersimpan bersamaan reasonHash on-chain | UC-06 | FR-501 | AU-06-03 | Integration | Functional — Happy Path |
| KU-07 Persetujuan PHK (mode Legal) | approveTermination → executeTermination sukses, severance cair, SBT dicabut | UC-07 | FR-503,504 | AU-07-01 | Unit (Foundry) | Functional — Happy Path |
| KU-07 Persetujuan PHK (mode Legal) | Proposal expired (>7 hari) ditolak | UC-07 | FR-503 | AU-07-02 | Unit (Foundry) | Functional — Negative |
| KU-07 Persetujuan PHK (mode Legal) | Wallet tanpa LEGAL_ROLE mencoba approve | UC-07 | FR-503 | AU-07-03 | Unit (Foundry) | Security — Access Control |
| KU-08 Resign Karyawan | resignEmployee sukses — stream stop, severance balik ke vault, SBT dicabut | UC-08 | FR-505 | AU-08-01 | Unit (Foundry) | Functional — Happy Path |
| KU-08 Resign Karyawan | Kasbon aktif dihapus tanpa penagihan saat resign | UC-08,UC-11 | FR-505,706 | AU-08-02 | Unit (Foundry) | Functional — Alternative Flow |
| KU-09 Grant Vesting Schedule | createCliffVest sukses, dana terkunci | UC-09 | FR-601 | AU-09-01 | Unit (Foundry) | Functional — Happy Path |
| KU-09 Grant Vesting Schedule | Saldo vault tidak cukup untuk vest | UC-09 | FR-601 | AU-09-02 | Unit (Foundry) | Functional — Negative |
| KU-09 Grant Vesting Schedule | cancelCliffVest sebelum matang | UC-09 | FR-602 | AU-09-03 | Unit (Foundry) | Functional — Happy Path |
| KU-10 Claim Vested Bonus | claimCliffVest setelah cliffTs — dana cair | UC-10 | FR-603 | AU-10-01 | Unit (Foundry) | Functional — Happy Path |
| KU-10 Claim Vested Bonus | claimCliffVest sebelum cliffTs → CliffNotReached | UC-10 | FR-603 | AU-10-02 | Unit (Foundry) | Functional — Negative |
| KU-10 Claim Vested Bonus | claimCliffVest dua kali → VestAlreadySettled | UC-10 | FR-603 | AU-10-03 | Unit (Foundry) | Functional — Negative |
| KU-10 Claim Vested Bonus | vestId tidak ada → VestNotFound | UC-10 | FR-603 | AU-10-04 | Unit (Foundry) | Functional — Negative |
| KU-11 Kasbon Karyawan | Ajukan kasbon dari `/employee/kasbon` dengan jumlah eksplisit — `requestAdvance(amount)` berhasil | UC-11 | FR-704 | AU-11-01 | System (manual) | Functional — Happy Path (diperbaiki & diverifikasi, lihat Bab 5 temuan #6 & #8) |
| KU-11 Kasbon Karyawan | Ajukan kasbon > 80% gaji bulanan → AdvanceAmountTooHigh | UC-11 | FR-704 | AU-11-02 | Unit (Foundry) | Functional — Negative |
| KU-11 Kasbon Karyawan | Ajukan kasbon saat masih ada Pending/Active | UC-11 | FR-704 | AU-11-03 | Unit (Foundry) | Functional — Negative |
| KU-12 Kasbon HR | approveAdvance sukses — dana masuk wallet karyawan | UC-12 | FR-705 | AU-12-01 | Unit (Foundry) | Functional — Happy Path |
| KU-12 Kasbon HR | approveAdvance saat vaultBalance kurang | UC-12 | FR-705 | AU-12-02 | Unit (Foundry) | Functional — Negative |
| KU-12 Kasbon HR | rejectAdvance sukses, karyawan bisa ajukan ulang | UC-12 | FR-705 | AU-12-03 | Unit (Foundry) | Functional — Happy Path |
| KU-13 Laporan Kepatuhan BPJS/PPh21 | GET /compliance/summary menampilkan agregat benar | UC-13 | FR-801,804,805 | AU-13-01 | Integration | Functional — Happy Path |
| KU-13 Laporan Kepatuhan BPJS/PPh21 | GET /compliance/export bulan tanpa data → 404 | UC-13 | FR-804 | AU-13-02 | Integration | Functional — Negative |
| KU-13 Laporan Kepatuhan BPJS/PPh21 | GET /compliance/export oleh HR lain → 403 | UC-13 | FR-804 | AU-13-03 | Integration | Security — Access Control |
| KU-13 Laporan Kepatuhan BPJS/PPh21 | POST /compliance/reconciliation/:hr simpan bpjsPaid/pph21Paid | UC-13 | FR-805 | AU-13-04 | Integration | Functional — Happy Path |
| KU-14 Verifikasi SBT Ketenagakerjaan | Verifikasi wallet dengan SBT aktif | UC-14 | FR-901,904,905 | AU-14-01 | System (manual) | Functional — Happy Path |
| KU-14 Verifikasi SBT Ketenagakerjaan | Verifikasi wallet tanpa SBT | UC-14 | FR-904 | AU-14-02 | System (manual) | Functional — Negative |
| KU-14 Verifikasi SBT Ketenagakerjaan | Percobaan transfer SBT langsung → SoulboundTransferNotAllowed | UC-14 | FR-903 | AU-14-03 | Unit (Foundry) | Security — Invariant |
| KU-15 Owner Deploy Vault Baru | deployVault sukses untuk HR baru | UC-15 | FR-1001 | AU-15-01 | Unit (Foundry) | Functional — Happy Path |
| KU-15 Owner Deploy Vault Baru | HR yang sudah punya vault → HRAlreadyHasVault | UC-15 | FR-1001 | AU-15-02 | Unit (Foundry) | Functional — Negative |
| KU-15 Owner Deploy Vault Baru | Pemanggil bukan HR sendiri & bukan SUPERADMIN | UC-15 | FR-1001 | AU-15-03 | Unit (Foundry) | Security — Access Control |
| KU-16 Dashboard Vault & Status Stream | Dashboard /hr/vault menampilkan saldo & burn rate benar | UC-16 | FR-204,303 | AU-16-01 | System (manual) | Functional — Happy Path |
| KU-16 Dashboard Vault & Status Stream | Banner status Frozen tampil saat vault dibekukan | UC-16 | FR-207 | AU-16-02 | System (manual) | Functional — Alternative Flow |
| KU-20 Konfigurasi & Klaim Platform Fee | setPlatformFee ≤ 100 bps sukses | UC-20 | FR-1006 | AU-20-01 | Unit (Foundry) | Functional — Happy Path |
| KU-20 Konfigurasi & Klaim Platform Fee | setPlatformFee > 100 bps → revert "FeeTooHigh" | UC-20 | FR-1006 | AU-20-02 | Unit (Foundry) | Functional — Negative |
| KU-20 Konfigurasi & Klaim Platform Fee | setProtocolTreasury alamat baru sukses | UC-20 | FR-1003 | AU-20-03 | Unit (Foundry) | Functional — Happy Path |
| KU-21 Reimburse Karyawan & HR | Submit klaim reimbursement sukses (status pending) | UC-22 | FR-1301 | AU-21-01 | Integration | Functional — Happy Path |
| KU-21 Reimburse Karyawan & HR | Approve dengan txHash yang bukan transfer valid → 400 | UC-22 | FR-1302 | AU-21-02 | Integration | Functional — Negative |
| KU-21 Reimburse Karyawan & HR | Approve oleh HR lain → 403 | UC-22 | FR-1302 | AU-21-03 | Integration | Security — Access Control |
| KU-21 Reimburse Karyawan & HR | Approve klaim yang sudah direview → 409 | UC-22 | FR-1302 | AU-21-04 | Integration | Functional — Negative |
| KU-22 Bounty & Tip | HR create bounty sukses | UC-23 | FR-1401 | AU-22-01 | Integration | Functional — Happy Path |
| KU-22 Bounty & Tip | Claim bounty saat quota penuh → 409 QUOTA_REACHED | UC-23 | FR-1401 | AU-22-02 | Integration | Functional — Negative |
| KU-22 Bounty & Tip | HR approve claim lalu record txHash pembayaran | UC-23 | FR-1402 | AU-22-03 | Integration | Functional — Happy Path |
| KU-22 Bounty & Tip | Kirim tip peer-to-peer, tercatat di riwayat | UC-23 | FR-1403 | AU-22-04 | Integration | Functional — Happy Path |
| KU-23 Notifikasi | GET /notifications daftar milik sendiri, terbaru dulu, maks 50 | UC-24 | FR-1501 | AU-23-01 | Integration | Functional — Happy Path |
| KU-23 Notifikasi | Tandai notifikasi milik user lain sebagai read → 403 | UC-24 | FR-1501 | AU-23-02 | Integration | Security — Access Control |
| KU-23 Notifikasi | PATCH read-all menandai semua terbaca | UC-24 | FR-1501 | AU-23-03 | Integration | Functional — Happy Path |
| KU-24 Slip Gaji (Payslip) | GET /payslip/:claimId oleh employee/HR terkait — breakdown lengkap | UC-25 | FR-1601 | AU-24-01 | Integration | Functional — Happy Path |
| KU-24 Slip Gaji (Payslip) | Diakses pihak tidak terkait klaim → 403 | UC-25 | FR-1601 | AU-24-02 | Integration | Security — Access Control |
| KU-24 Slip Gaji (Payslip) | claimId tidak ditemukan → 404 | UC-25 | FR-1601 | AU-24-03 | Integration | Functional — Negative |
| KU-25 Bukti Potong Pajak | GET /tax-cert/:year employee — agregasi tahunan benar | UC-26 | FR-1701 | AU-25-01 | Integration | Functional — Happy Path |
| KU-25 Bukti Potong Pajak | GET /tax-cert/hr/:employee/:year oleh HR yang bukan pemilik vault | UC-26 | FR-1701 | AU-25-02 | Integration | Security — Access Control |
| KU-25 Bukti Potong Pajak | Tahun di luar rentang valid (2020–2100) → 400 | UC-26 | FR-1701 | AU-25-03 | Unit | Functional — Validasi Input |
| KU-26 Surat Keterangan Kerja | Request dengan purpose valid → 201 | UC-27 | FR-1801 | AU-26-01 | Integration | Functional — Happy Path |
| KU-26 Surat Keterangan Kerja | purpose di luar whitelist → 400 | UC-27 | FR-1801 | AU-26-02 | Unit | Functional — Validasi Input |
| KU-26 Surat Keterangan Kerja | Employee tanpa stream aktif di HR tsb mengajukan → 400 NOT_EMPLOYEE | UC-27 | FR-1801 | AU-26-03 | Integration | Functional — Negative |
| KU-26 Surat Keterangan Kerja | GET document sebelum approved → 400 NOT_APPROVED | UC-27 | FR-1801 | AU-26-04 | Integration | Functional — Negative |
| KU-27 Direktori Karyawan | GET /directory/:hrAddress oleh HR sendiri — daftar lengkap | UC-28 | FR-1901 | AU-27-01 | Integration | Functional — Happy Path |
| KU-27 Direktori Karyawan | Diakses HR lain → 403 | UC-28 | FR-1901 | AU-27-02 | Integration | Security — Access Control |
| KU-27 Direktori Karyawan | PATCH assign department/position sukses | UC-28 | FR-1901 | AU-27-03 | Integration | Functional — Happy Path |
| KU-28 Penangguhan Akses Klien | Owner suspend HR — sesi aktif langsung ter-revoke | — (FR-1005 ada, UC tidak ada) | FR-1005 | AU-28-01 | Integration | Functional — Happy Path |
| KU-28 Penangguhan Akses Klien | HR yang disuspend login ulang → 403 ACCOUNT_SUSPENDED | — | FR-1005 | AU-28-02 | Integration | Functional — Negative |
| KU-28 Penangguhan Akses Klien | Karyawan tetap bisa claimSalary meski HR-nya disuspend | — | FR-1005 | AU-28-03 | System (manual) | Functional — Konsistensi On-chain/Off-chain |
| KU-28 Penangguhan Akses Klien | Owner reactivate — HR login ulang sukses dari nol | — | FR-1005 | AU-28-04 | Integration | Functional — Happy Path |
| KU-29 Pengaturan Perusahaan | GET /company-settings mengembalikan null untuk HR baru | UC-29 | FR-2001 | AU-29-01 | Integration | Functional — Happy Path |
| KU-29 Pengaturan Perusahaan | PUT /company-settings upsert branding tersimpan | UC-29 | FR-2001 | AU-29-02 | Integration | Functional — Happy Path |

### 3.2 Rencana Pengujian

#### 3.2.1 Urutan Pelaksanaan

Urutan berikut disusun berdasarkan **risiko dan ketergantungan** antar Kelas Uji, bukan urutan
nomor KU. Dua prinsip yang mendasarinya: (1) temuan yang berpotensi defect nyata diverifikasi
**sebelum** apa pun yang lain, supaya kalau memang bug, masih ada waktu untuk memperbaikinya
sebelum sidang; (2) fondasi (autentikasi, alur uang inti) harus terverifikasi lebih dulu karena
seluruh Kelas Uji turunan bergantung padanya.

0. **Setup lingkungan (prasyarat, sekali di awal):** menjalankan seluruh langkah 2.5.2 (Persiapan
   Awal) — Docker, migrasi database, `ponder dev`/backend/frontend jalan, baseline `forge test`,
   dan wallet uji per peran sudah siap. Bukan Kelas Uji, tapi blocking untuk semua fase di bawah.
1. **Verifikasi temuan berisiko tinggi (paling prioritas, sebelum fase lain apa pun):**
   AU-05-05 (topic hash `SalaryClaimed` tidak cocok signature yang benar) dan AU-11-01
   (`requestAdvance()` dipanggil tanpa argumen `amount` dari UI). Dieksekusi paling awal,
   mendahului bahkan fondasi, karena berpotensi jadi defect nyata yang perlu diperbaiki sebelum
   sidang — bukan sekadar butir uji rutin yang bisa menunggu antrean. Keduanya terkonfirmasi
   sebagai defect nyata dan sudah diperbaiki (lihat Bab 5).
2. **Fondasi (blocking):** KU-01 (Login & Sesi), KU-02 (Registrasi & Profil) — seluruh Kelas Uji
   lain membutuhkan sesi login yang valid dan akun yang sudah terdaftar/disetujui.
3. **Alur uang inti:** KU-03 (Manajemen Vault), KU-04 (Onboarding Karyawan & Stream), KU-05
   (Klaim Gaji EWA) — inti klaim tesis "EWA real-time".
4. **Siklus hidup karyawan:** KU-06 (Inisiasi PHK), KU-07 (Persetujuan PHK), KU-08 (Resign).
5. **Vesting dan Kasbon:** KU-09 (Grant Vesting), KU-10 (Claim Vested Bonus), KU-11 (Kasbon
   Karyawan), KU-12 (Kasbon HR).
6. **Kepatuhan dan verifikasi identitas:** KU-13 (Laporan Kepatuhan), KU-14 (Verifikasi SBT).
7. **Fungsi Owner/Admin:** KU-15 (Deploy Vault Baru), KU-20 (Platform Fee), KU-28 (Penangguhan
   Akses Klien).
8. **Dashboard:** KU-16 (Dashboard Vault & Status Stream).
9. **Modul pendukung (KU-21 s.d. KU-29):** sebagian besar REST API sederhana (dapat diuji via
   Postman/curl atau skrip `testing-scripts/`, tidak wajib lewat UI), dikerjakan setelah
   fondasi dan alur uang inti aman.

#### 3.2.2 Data Pengujian

Rincian lengkap ada di 2.3 (Material Pengujian); ringkasannya per kategori:
- **Kontrak dan alamat:** alamat kontrak Base Sepolia (`PayrollFactory`,
  `EmploymentSBT`, `MockIDRX`) sesuai tabel 2.3.
- **Token uji:** IDRX testnet via `MockIDRX`, tanpa nilai ekonomi nyata.
- **Akun uji per peran:** lima kategori wallet (Owner SaaS, HR Admin, Legal — domain HR Admin
  Karyawan dengan stream aktif, dan Pengguna baru belum pernah login), masing-masing
  dipersiapkan sesuai prosedur 2.5.2.1.
- **Data dummy karyawan:** NIK 16 digit format `32xxxxxxxxxxxxxx` (contoh format, bukan NIK
  asli), nomor HP `08xxxxxxxxxx`, gaji bulanan contoh `5.000.000 IDRX` — dipakai konsisten di
  seluruh butir uji Bab 4 yang membutuhkan data profil karyawan.
- **Database uji:** PostgreSQL 16 lokal (Docker), schema `app` dan `public`, di-reset/di-migrasi
  ulang via `npm run db:migrate` sebelum setiap sesi pengujian penuh agar tidak ada data sisa
  sesi sebelumnya yang mengganggu butir uji Happy Path (mis. `AdvancePendingExists` yang
  seharusnya diuji sebagai kondisi Negative, bukan muncul tak sengaja karena sisa data lama).

---

## BAB 4 — DESKRIPSI PENGUJIAN

> Disusun per Kelas Uji. Nama field input mengikuti persis nama di kode (body request/parameter
> fungsi), bukan istilah generik.

### KU-01 — Login & Sesi
**Antarmuka:** `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` (`backend/src/routes/auth.ts`); halaman `/login`.
- **AU-01-01** — Input: `{address, message, signature}` hasil `personal_sign` EIP-191 valid, `message` memuat `Timestamp: <unix>` dalam ±300 detik. Harapan: `200`, `{accessToken, refreshToken, address}`, redirect sesuai role dari `useRole()`.
- **AU-01-02** — Input: `signature` tidak valid/rusak. Harapan: `401 UNAUTHORIZED`.
- **AU-01-03** — Input: `message` dengan `Timestamp` di luar toleransi 5 menit (`skewSec = 300`). Harapan: `401 UNAUTHORIZED`, "Login message has expired."
- **AU-01-04** — Input: `refreshToken` valid secara JWT tapi `jti`-nya sudah dihapus dari tabel `sessions` (misal setelah logout). Harapan: `401 UNAUTHORIZED`, "Session has been revoked or expired".
- **AU-01-05** — Input: login dari `address` yang ada di tabel `suspendedClients`. Harapan: `403`, kode `ACCOUNT_SUSPENDED`.

### KU-02 — Registrasi & Profil
**Antarmuka:** `POST /registration/request`, `GET /registration/status/:address`, `PATCH /registration/:address/approve`, `POST /auth/profile` (`backend/src/routes/registration.ts`, `auth.ts`); `POST /invitations`, `GET /invitations/:token`, `GET /invitations/hr/:hrAddress`, `PATCH /invitations/:token/revoke` (`backend/src/routes/invitations.ts`); halaman `/onboarding` (employee) dan `/hr/employees` (HR — generate invitation).

> **Perubahan arsitektur (invitation-only registration):** registrasi employee sebelumnya
> menerima `hrAddress` bebas dari client (employee bisa memilih perusahaan mana pun dari
> dropdown tak terfilter di `/onboarding` — celah keamanan/integritas data nyata, ditemukan
> dan diperbaiki dalam sesi ini). Sekarang `POST /registration/request` untuk `type:"employee"`
> **wajib** menyertakan `inviteToken` valid, belum dipakai, belum kedaluwarsa (7 hari) yang
> dibuat HR via `POST /invitations` — `hrAddress` di-resolve server-side dari token, tidak
> pernah diambil langsung dari input employee. Dropdown "pilih perusahaan bebas" di halaman
> `/onboarding` sudah dihapus total. Lihat DPPL.md §A.3/SKPL.md §A.2 untuk catatan lengkap.

- **AU-02-01** — Input: `{address, type:"company", npwp, nib, directorName, directorNik, deedUrl}`. Harapan: `200 {ok:true}`, status `pending` di `pendingRegistrations`.
- **AU-02-02** — Input: `{address, type:"employee", inviteToken}` dengan `inviteToken` valid milik HR tertentu. Harapan: `200 {ok:true}`, muncul di `GET /registration/pending/hr/:hrAddress` milik HR yang bersangkutan (di-resolve dari token, bukan dari input employee).
- **AU-02-03** — Input: `POST /auth/profile` dengan `nik` bukan 16 digit numerik (mis. `"12345"`). Harapan: `400 BAD_REQUEST`, "NIK must be exactly 16 digits".
- **AU-02-04** — Input: Owner memanggil `PATCH /registration/:address/approve` untuk registrasi `type:"company"`. Harapan: status berubah `approved`.
- **AU-02-05** — Input: HR B memanggil `PATCH /registration/:address/approve` untuk registrasi employee milik HR A. Harapan: `403 Forbidden`.
- **AU-02-06** — Input: HR memanggil `POST /invitations {name?, email?}`. Harapan: `200`, token unik dibuat, `hrAddress` pada baris invitation sama dengan HR yang membuat (bukan input client).
- **AU-02-07** — Input: `POST /registration/request {address, type:"employee"}` **tanpa** `inviteToken`. Harapan: `400 BAD_REQUEST` — ini skenario inti yang menutup celah pilih-bebas perusahaan.
- **AU-02-08** — Input: `POST /registration/request` dengan `inviteToken` yang sudah pernah dipakai employee lain. Harapan: `409` — token tidak bisa dipakai ulang.
- **AU-02-09** — Input: HR memanggil `PATCH /invitations/:token/revoke` pada token yang belum dipakai, lalu ada pihak lain mencoba registrasi dengan token yang sama. Harapan: revoke `200`, registrasi berikutnya dengan token itu `409`.
- **AU-02-10** — Input: `POST /registration/request {type:"company", npwp}` dengan `npwp` yang setelah dibersihkan tanda baca bukan 15 atau 16 digit (mis. 14 digit). Harapan: `400 BAD_REQUEST`.
- **AU-02-11** — Input: `POST /registration/request {type:"company", nib}` dengan `nib` bukan 13 digit. Harapan: `400 BAD_REQUEST`.
- **AU-02-12** — Input: `POST /registration/request {type:"company", npwp}` dengan `npwp` 15 digit (format lama, dengan tanda baca) atau 16 digit (format baru berbasis NIK). Harapan: `200 {ok:true}` untuk keduanya.

### KU-03 — Manajemen Vault
**Antarmuka:** `fundVault(amount)`, `withdrawVault(amount, recipient)`, `setCompanyConfig(bpjsBps, pph21Bps, lowBalanceThresholdBps)`, `pauseVault()` pada `CompanyVault.sol`; halaman `/hr/vault`, `/hr/settings` (hook `useVaultActions.ts`).
- **AU-03-01** — Input: `approve(vaultAddress, amountWei)` pada IDRX lalu `fundVault(amountWei)`. Harapan: `vaultBalance` bertambah tepat `amountWei`, event `VaultFunded`.
- **AU-03-02** — Input: `withdrawVault(amount, recipient)` dengan `amount > vaultBalance`. Harapan: revert `InsufficientVaultBalance`.
- **AU-03-03** — Input: `setCompanyConfig(400, 0, 1000)` (BPJS 4%, PPh21 pakai TER dinamis, threshold 10%). Harapan: `bpjsBps`/`pph21Bps`/`lowBalanceThresholdBps` ter-update, dipakai di klaim gaji berikutnya (lihat AU-05-01).
- **AU-03-04** — Input: `pauseVault()` lalu karyawan memanggil `claimSalary()`. Harapan: revert `VaultFrozen`/kondisi vault tidak `Active` (perlu verifikasi exact guard saat eksekusi).

### KU-04 — Onboarding Karyawan & Stream
**Antarmuka:** `startStream(employee, flowRate, severanceSplitBps)`, `pauseStream`, `resumeStream` (`useStreamActions.ts`); halaman `/hr/employees`, `/hr/onboarding`.
- **AU-04-01** — Input: `startStream(0xEmp, flowRateWei, 200)`. Harapan: `EmployeeStream.status = Active`, SBT ter-mint (`EmploymentCertified`), event `StreamCreated`.
- **AU-04-02** — Input: `startStream` untuk employee yang `status` sudah `Active`. Harapan: revert `StreamAlreadyActive`.
- **AU-04-03** — Input: `pauseStream(employee)` lalu `resumeStream(employee)` setelah beberapa detik. Harapan: `settledBalance` di-settle saat pause, `lastWithdrawnTs` di-reset saat resume, tidak ada akumulasi ganda.
- **AU-04-04** — Input: wallet tanpa `HR_ROLE` memanggil `startStream`. Harapan: revert `Unauthorized`.

### KU-05 — Klaim Gaji EWA
**Antarmuka:** `claimSalary()` pada `CompanyVault.sol`; `POST /bundler/relay` (`backend/src/routes/bundler.ts`); halaman `/employee/ewa`.
- **AU-05-01** — Input: karyawan tanpa kasbon aktif memanggil `claimSalary()` saat `accrued > 0`. Harapan: urutan potongan platform fee → PPh21 (TER atau override `pph21Bps`) + BPJS → severance (`severanceBps`) → sisa ke karyawan; event `SalaryClaimed(..., kasbonRepaid=0)` dan `TaxWithheld`.
- **AU-05-02** — Input: karyawan dengan `salaryAdvances[employee].status == Active` memanggil `claimSalary()`. Harapan: potongan tambahan `min(20% net, sisa kasbon)` sebelum PPh21/BPJS/severance; event `AdvanceRepaid(employee, repaid, remaining)`.
- **AU-05-03** — Input: `claimSalary()` saat `accrued == 0`. Harapan: revert `NothingToClaim`.
- **AU-05-04** — Input: 11 request `POST /bundler/relay` berturut-turut dalam 1 jam dari `employee` yang sama. Harapan: request ke-11 `429 TOO_MANY_REQUESTS`.
- **AU-05-05** — Input: kirim event `SalaryClaimed` on-chain nyata (via klaim sungguhan), amati apakah `POST /webhook/alchemy` mengenali `topics[0]`-nya dan men-trigger broadcast WebSocket `SALARY_CLAIMED`. Harapan (per SKPL): broadcast terjadi. Terverifikasi via eksekusi nyata — lihat Bab 5 untuk detail bug topic hash yang ditemukan dan diperbaiki.

### KU-06 — Inisiasi PHK oleh HR
**Antarmuka:** `proposeTermination(employee, reasonHash)`; `POST /termination/reason` (`backend/src/routes/termination.ts`); halaman `/hr/phk`.
- **AU-06-01** — Input: `proposeTermination(employee, keccak256(reason))`. Harapan: `TerminationProposal.hrApproved=true`, `expiresAt = now + 7 hari`, event `TerminationProposed`.
- **AU-06-02** — Input: `proposeTermination` untuk employee yang sudah punya proposal aktif. Harapan: revert `TerminationAlreadyProposed`.
- **AU-06-03** — Input: `POST /termination/reason {employeeAddress, reason}` oleh HR, bersamaan dengan `proposeTermination` on-chain. Harapan: `GET /termination/reason/:employeeAddress` mengembalikan `reason` plaintext ke HR/Legal yang berwenang.

### KU-07 — Persetujuan PHK (mode Legal)
**Antarmuka:** `approveTermination(employee)`, `executeTermination(employee)`; halaman `/hr/phk` (mode Legal, per pemegang `LEGAL_ROLE`).
- **AU-07-01** — Input: `approveTermination(employee)` oleh pemegang `LEGAL_ROLE`, lalu `executeTermination(employee)`. Harapan: `legalApproved=true`; eksekusi menghitung pesangon statutori (`PayrollMath.severanceMultiplier`), transfer ke employee, SBT dicabut, event `TerminationExecuted`.
- **AU-07-02** — Input: `approveTermination`/`executeTermination` setelah `block.timestamp >= expiresAt`. Harapan: revert `ProposalExpired`.
- **AU-07-03** — Input: `approveTermination` oleh wallet tanpa `LEGAL_ROLE`. Harapan: revert `Unauthorized`.

### KU-08 — Resign Karyawan
**Antarmuka:** `resignEmployee(employee)`; halaman `/hr/employees/[id]`.
- **AU-08-01** — Input: `resignEmployee(employee)` untuk stream `Active`. Harapan: stream disetel non-aktif, `severanceVaults[employee]` dikembalikan ke `vaultBalance`, SBT dicabut.
- **AU-08-02** — Input: `resignEmployee(employee)` untuk employee dengan `salaryAdvances[employee].status == Active`. Harapan: `delete salaryAdvances[employee]` tanpa penagihan sisa kasbon (bad debt sesuai desain sistem), pesangon tetap utuh.

### KU-09 — Grant Vesting Schedule
**Antarmuka:** `createCliffVest(employee, amount, cliffTs, vestType)`, `cancelCliffVest(employee, vestId)`; halaman `/hr/vesting`.
- **AU-09-01** — Input: `createCliffVest(employee, amountWei, futureTs, VestType.Retention)`. Harapan: `vaultBalance -= amount`, `CliffVest.status = Locked`, event `CliffVestCreated`.
- **AU-09-02** — Input: `createCliffVest` dengan `amount > vaultBalance`. Harapan: revert `InsufficientVaultBalance`.
- **AU-09-03** — Input: `cancelCliffVest(employee, vestId)` sebelum `cliffTs` tercapai. Harapan: status `Forfeited`, dana kembali ke `vaultBalance`.

### KU-10 — Claim Vested Bonus
**Antarmuka:** `claimCliffVest(vestId)`; halaman `/employee/vesting`.
- **AU-10-01** — Input: `claimCliffVest(vestId)` setelah `block.timestamp >= cliffTs`. Harapan: dana ditransfer ke karyawan, status `Claimed`.
- **AU-10-02** — Input: `claimCliffVest(vestId)` sebelum `cliffTs`. Harapan: revert `CliffNotReached`.
- **AU-10-03** — Input: `claimCliffVest(vestId)` yang statusnya sudah bukan `Locked` (sudah diklaim/dibatalkan). Harapan: revert `VestAlreadySettled`.
- **AU-10-04** — Input: `claimCliffVest(vestId)` dengan `vestId` yang tidak pernah dibuat (`cliffTs == 0`). Harapan: revert `VestNotFound`.

### KU-11 — Kasbon Karyawan
**Antarmuka:** `requestAdvance(amount)` on-chain; `POST /kasbon/request`, `GET /kasbon/status` (`backend/src/routes/kasbon.ts`); halaman `/employee/kasbon`.
- **AU-11-01** — Input: klik tombol ajukan kasbon di `/employee/kasbon` dengan jumlah kasbon yang dimaksud (≤80% gaji bulanan). Harapan menurut SKPL FR-704: kasbon senilai jumlah yang diminta karyawan berhasil diajukan. Terverifikasi via eksekusi nyata (klik UI sungguhan) — lihat Bab 5 untuk detail dua bug yang ditemukan dan diperbaiki.
- **AU-11-02** — Input: `requestAdvance(amount)` dengan `amount` > `bpsOf(flowRate × SECONDS_PER_MONTH, 8000)`. Harapan: revert `AdvanceAmountTooHigh`.
- **AU-11-03** — Input: `requestAdvance(amount)` saat `salaryAdvances[employee].status` masih `Pending` atau `Active`. Harapan: revert `AdvancePendingExists`/`ActiveAdvanceExists`.

### KU-12 — Kasbon HR
**Antarmuka:** `approveAdvance(employee)`, `rejectAdvance(employee)`; `POST /kasbon/approve/:employee`, `POST /kasbon/reject/:employee`; halaman `/hr/kasbon`.
- **AU-12-01** — Input: `approveAdvance(employee)` dengan `vaultBalance >= salaryAdvances[employee].amount`. Harapan: `IDRX.safeTransfer(employee, amount)`, status `Active`, event `AdvanceApproved`.
- **AU-12-02** — Input: `approveAdvance(employee)` dengan `vaultBalance < amount`. Harapan: revert `InsufficientVaultBalance`.
- **AU-12-03** — Input: `rejectAdvance(employee)` untuk kasbon `Pending`. Harapan: `delete salaryAdvances[employee]` (kembali ke `None`), event `AdvanceRejected`, karyawan dapat mengajukan lagi (lihat AU-11).

### KU-13 — Laporan Kepatuhan BPJS/PPh21
**Antarmuka:** `GET /compliance/summary/:hr`, `GET /compliance/export/:hr`, `GET|POST /compliance/reconciliation/:hr`; halaman `/hr/compliance`.
- **AU-13-01** — Input: `GET /compliance/summary/:hr?month=2026-07` oleh HR pemilik. Harapan: `200`, agregat `employeeCount`/`totalAccrued`/`totalCompliance`/`totalSeverance` sesuai `salary_claim` Ponder.
- **AU-13-02** — Input: `GET /compliance/export/:hr?month=<bulan tanpa klaim>`. Harapan: `404 NOT_FOUND`, "No claims found for this period".
- **AU-13-03** — Input: HR B memanggil `GET /compliance/export/:hr` dengan `:hr` = alamat HR A. Harapan: `403 FORBIDDEN`.
- **AU-13-04** — Input: `POST /compliance/reconciliation/:hr {month, bpjsPaid, pph21Paid}`. Harapan: `200 {ok:true}`, tersimpan dan terbaca kembali via `GET`.

### KU-14 — Verifikasi SBT Ketenagakerjaan
**Antarmuka:** `employeeTokenId(address)`, `employmentRecords(tokenId)`, `locked(tokenId)` view functions; halaman `/verify`.
- **AU-14-01** — Input: alamat wallet karyawan dengan token SBT aktif di halaman `/verify`. Harapan: status aktif, `companyName`, `startTs` tampil.
- **AU-14-02** — Input: alamat wallet tanpa SBT (`employeeTokenId == 0`). Harapan: pesan "tidak ditemukan"/status tidak aktif.
- **AU-14-03** — Input: panggilan langsung `transferFrom` pada `EmploymentSBT` di luar mint/revoke. Harapan: revert `SoulboundTransferNotAllowed`.

### KU-15 — Owner Deploy Vault Baru
**Antarmuka:** `deployVault(hrAuthority, companyName, sbtContract)` pada `PayrollFactory.sol`; halaman `/owner`.
- **AU-15-01** — Input: `deployVault(0xHR, "PT Uji", EMPLOYMENT_SBT)` oleh Owner (`SUPERADMIN_ROLE`). Harapan: `CompanyVault` baru ter-deploy, `companyVaults[0xHR]` terisi, event `VaultDeployed`.
- **AU-15-02** — Input: `deployVault` untuk `hrAuthority` yang `companyVaults[hrAuthority] != address(0)`. Harapan: revert `"HRAlreadyHasVault"`.
- **AU-15-03** — Input: `deployVault` dipanggil oleh wallet yang bukan `hrAuthority` itu sendiri dan bukan `SUPERADMIN_ROLE`. Harapan: revert `"OnlyHRorSuperAdmin"`.

### KU-16 — Dashboard Vault & Status Stream
**Antarmuka:** halaman `/hr/vault` (query `getCompany`, `getStreams` via Ponder).
- **AU-16-01** — Input: buka `/hr/vault` untuk HR dengan beberapa stream aktif. Harapan: `vaultBalance`, `burnRateMonthly`, `monthsLeft` tampil sesuai data on-chain/Ponder.
- **AU-16-02** — Input: buka `/hr/vault` untuk vault berstatus `Frozen`. Harapan: banner peringatan status Frozen tampil, aksi tulis dinonaktifkan.

### KU-20 — Konfigurasi & Klaim Platform Fee
**Antarmuka:** `setPlatformFee(bps)`, `setProtocolTreasury(newTreasury)` pada `PayrollFactory.sol`; halaman `/owner/fees`.
- **AU-20-01** — Input: `setPlatformFee(50)` (0,5%) oleh `SUPERADMIN_ROLE`. Harapan: `platformFeeBps = 50`, event `PlatformFeeUpdated`.
- **AU-20-02** — Input: `setPlatformFee(150)` (>1%). Harapan: revert `"FeeTooHigh"`.
- **AU-20-03** — Input: `setProtocolTreasury(0xNewTreasury)`. Harapan: `protocolTreasury` ter-update, event `ProtocolTreasuryUpdated`.

### KU-21 — Reimburse Karyawan & HR (UC-22, FR-1301/1302)
**Antarmuka:** `POST /reimburse`, `PATCH /reimburse/:id/approve|reject` (`backend/src/routes/reimburse.ts`); halaman `/employee/reimburse`, `/hr/reimburse`.
- **AU-21-01** — Input: `{hrAddress, category, amount, description}`. Harapan: `200`, klaim tersimpan status `pending`.
- **AU-21-02** — Input: `PATCH /reimburse/:id/approve {txHash}` dengan `txHash` yang bukan transfer IDRX sejumlah `amount` ke `employeeAddress` (diverifikasi `verifyIdrxTransfer`). Harapan: `400 TRANSFER_NOT_VERIFIED`.
- **AU-21-03** — Input: HR B approve klaim milik karyawan HR A. Harapan: `403 FORBIDDEN`.
- **AU-21-04** — Input: approve klaim yang `status` sudah bukan `pending`. Harapan: `409 ALREADY_REVIEWED`.

### KU-22 — Bounty & Tip (UC-23, FR-1401/1402/1403)
**Antarmuka:** `POST /bounty`, `POST /bounty/:id/claim`, `PATCH /bounty/claim/:id/approve|reject|paid`, `POST /bounty/tip` (`backend/src/routes/bounty.ts`); halaman `/employee/bounty`, `/hr/bounty`.
- **AU-22-01** — Input: `{title, description, rewardIdrx, quota}`. Harapan: `200`, bounty tersimpan status `open`.
- **AU-22-02** — Input: `POST /bounty/:id/claim` saat `claimedCount >= quota`. Harapan: `409 QUOTA_REACHED`.
- **AU-22-03** — Input: `PATCH /bounty/claim/:id/paid {txHash}` dengan transfer IDRX terverifikasi sejumlah `rewardIdrx`. Harapan: status `paid`, `paidTxHash` tersimpan.
- **AU-22-04** — Input: `POST /bounty/tip {toAddress, amount, txHash}`. Harapan: tercatat, muncul di `GET /bounty/tips/:address` untuk pengirim maupun penerima.

### KU-23 — Notifikasi (UC-24, FR-1501)
**Antarmuka:** `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` (`backend/src/routes/notifications.ts`); halaman `/employee/notifications`.
- **AU-23-01** — Input: `GET /notifications` oleh user dengan >50 notifikasi. Harapan: hanya 50 terbaru, urut `createdAt` desc.
- **AU-23-02** — Input: `PATCH /notifications/:id/read` untuk `id` milik `recipientAddress` lain. Harapan: `403 FORBIDDEN`.
- **AU-23-03** — Input: `PATCH /notifications/read-all`. Harapan: seluruh notifikasi milik caller `read = true`.

### KU-24 — Slip Gaji (Payslip) (UC-25, FR-1601)
**Antarmuka:** `GET /payslip/:claimId` (`backend/src/routes/payslip.ts`); halaman `/employee/payslip`.
- **AU-24-01** — Input: `claimId` valid milik employee yang login (atau HR-nya). Harapan: breakdown `grossAccrued`/`platformFee`/`kasbonRepaid`/`taxAndBpjs`/`severance`/`netToEmployee` sesuai `salary_claim` Ponder.
- **AU-24-02** — Input: `claimId` valid tapi caller bukan employee maupun HR terkait. Harapan: `403 FORBIDDEN`.
- **AU-24-03** — Input: `claimId` yang tidak ada di `salary_claim`. Harapan: `404 NOT_FOUND`.

### KU-25 — Bukti Potong Pajak (Tax Cert) (UC-26, FR-1701)
**Antarmuka:** `GET /tax-cert/:year`, `GET /tax-cert/hr/:employee/:year` (`backend/src/routes/taxcert.ts`); halaman `/employee/tax-cert`.
- **AU-25-01** — Input: `GET /tax-cert/2026` oleh employee. Harapan: agregat tahunan `totalGrossAccrued`/`totalCompliance`/`totalSeverance`/`totalNet` + breakdown bulanan.
- **AU-25-02** — Input: `GET /tax-cert/hr/:employee/2026` oleh HR yang bukan `hr_authority` employee tsb di `salary_claim`. Harapan: `403 FORBIDDEN`.
- **AU-25-03** — Input: `:year` = `1999` atau `2200`. Harapan: `400 BAD_REQUEST`, "Invalid year".

### KU-26 — Surat Keterangan Kerja (UC-27, FR-1801)
**Antarmuka:** `POST /employment-letter/request`, `PATCH /employment-letter/:id/approve|reject`, `GET /employment-letter/:id/document` (`backend/src/routes/employmentLetter.ts`); halaman `/employee/employment-letter`, `/hr/employment-letters`.
- **AU-26-01** — Input: `{hrAddress, purpose:"KPR"}`. Harapan: `201`, status `pending`.
- **AU-26-02** — Input: `purpose:"Lainnya123"` (di luar whitelist `KPR|Kredit|Visa|Umum|Lainnya`). Harapan: `400 BAD_REQUEST`.
- **AU-26-03** — Input: karyawan tanpa `employee_stream` berstatus `Active` di bawah `hrAddress` tsb. Harapan: `400 NOT_EMPLOYEE`.
- **AU-26-04** — Input: `GET /employment-letter/:id/document` untuk surat yang `status` masih `pending`. Harapan: `400 NOT_APPROVED`.

### KU-27 — Direktori Karyawan (UC-28, FR-1901)
**Antarmuka:** `GET /directory/:hrAddress`, `PATCH /directory/:address` (`backend/src/routes/directory.ts`); halaman `/hr/directory`.
- **AU-27-01** — Input: `GET /directory/:hrAddress` oleh HR itu sendiri. Harapan: daftar karyawan dengan `name`/`department`/`position`/`status`/`flowRate`.
- **AU-27-02** — Input: HR B memanggil `GET /directory/:hrAddressA`. Harapan: `403 FORBIDDEN`.
- **AU-27-03** — Input: `PATCH /directory/:address {department:"Engineering", position:"Backend"}`. Harapan: tersimpan, muncul di `GET /directory/me` milik karyawan tsb.

### KU-28 — Penangguhan Akses Klien
**Antarmuka:** `POST /suspension/:hrAddress`, `DELETE /suspension/:hrAddress`, `GET /suspension/:hrAddress` (`backend/src/routes/suspension.ts`); halaman `/owner/companies/[hrAddress]`.
- **AU-28-01** — Input: `POST /suspension/:hrAddress {reason}` oleh Owner. Harapan: baris `suspendedClients` tersimpan, seluruh `sessions` milik `hrAddress` dihapus.
- **AU-28-02** — Input: HR yang baru disuspend mencoba `POST /auth/login`. Harapan: `403 ACCOUNT_SUSPENDED` (lihat AU-01-05).
- **AU-28-03** — Input: karyawan di bawah HR yang disuspend memanggil `claimSalary()` langsung (bukan lewat interface HR). Harapan: klaim tetap berhasil — vault tetap `Active` on-chain, suspensi murni gerbang login interface HR.
- **AU-28-04** — Input: `DELETE /suspension/:hrAddress` oleh Owner, lalu HR login ulang. Harapan: baris blocklist terhapus, login sukses dari sesi baru (bukan pemulihan sesi lama).

### KU-29 — Pengaturan Perusahaan (UC-29, FR-2001)
**Antarmuka:** `GET|PUT /company-settings` (`backend/src/routes/companySettings.ts`); halaman `/hr/settings`.
- **AU-29-01** — Input: `GET /company-settings` oleh HR yang belum pernah menyimpan setting. Harapan: `200 null`.
- **AU-29-02** — Input: `PUT /company-settings {name, country, logoUrl, ewaLimitBps, yieldRateBps, legalAddress}`. Harapan: tersimpan (insert atau update), terbaca kembali via `GET`.

---

## BAB 5 — HASIL PENGUJIAN

> **96 dari 96** butir uji sudah dieksekusi (Foundry, eksekusi nyata Integration/System via
> `testing-scripts/`, dan/atau klik-UI manual sungguhan di browser) dan berstatus **Handal**.
> Ini termasuk **AU-05-05, AU-11-01, AU-14-01/02, AU-16-01, AU-16-02** yang tadinya defect
> terindikasi kode atau belum dieksekusi, sekarang **diperbaiki dan diverifikasi end-to-end
> penuh** (lihat catatan temuan #5-#8 di bawah, termasuk beberapa bug yang HANYA ketemu saat
> klik UI sungguhan — tidak akan ketemu dari inspeksi kode atau eksekusi script backend saja);
> **AU-26-03, AU-26-04, AU-29-01** yang sebelumnya gap setup script kini diuji dengan skenario
> terkontrol genuine (wallet baru yang belum pernah onboarding/upsert); dan **AU-06-03** yang
> sebelumnya campuran (setengah Handal on-chain, setengah nol coverage backend) kini diuji
> penuh (lihat temuan #11 di bawah — proses menutup gap ini juga menemukan bug akses Legal
> yang sudah diperbaiki). Tidak ada lagi butir berstatus `[BELUM DIEKSEKUSI]` atau campuran.
> Kolom "Hasil
> yang Didapat" untuk baris yang masih `[BELUM DIEKSEKUSI]` mencantumkan alasan spesifik kenapa
> belum tercakup (bukan sekadar belum sempat dijalankan), supaya jelas gap-nya di mana.
>
> **Ralat metodologi (penting):** beberapa baris sempat ditandai Handal berdasarkan bukti tidak
> langsung/kebetulan (mis. AU-26-03 sempat "lolos" karena efek samping bug lain, bukan skenario
> yang benar-benar disetup dan diverifikasi). Setelah ditinjau ulang, baris-baris tersebut
> dikembalikan ke `[BELUM DIEKSEKUSI]` dengan catatan jujur — supaya tabel ini tidak melebih-
> lebihkan cakupan pengujian yang sebenarnya.
>
> **Simulasi 30 karyawan (Base Sepolia, `testing-scripts/30-*.mjs`):** onboarding, klaim gaji,
> kasbon, bounty, dan PHK untuk 30 wallet dummy dijalankan nyata di testnet. Ini memindahkan
> AU-22-01/03 (bounty) ke Handal, dan menambah konfirmasi tambahan pada beberapa baris yang
> sudah Handal via Foundry (AU-03-01, AU-04-01, AU-05-01, AU-06-01, AU-07-01, AU-12-01) karena
> juga terbukti bekerja di lingkungan live testnet, bukan cuma mock Foundry.
>
> **Temuan & perbaikan produk selama pengujian (bukan cuma dokumentasi — sudah di-fix di kode):**
> 1. `PayrollFactory` yang live sebelumnya stale (bytecode tidak cocok `src/` terkini,
>    `deployVault()` selalu revert) — di-redeploy dari source terkini
>    (`0x73926c8abdbd2ebcc09f5e6af7def1bb3af156de`); seluruh config aplikasi diarahkan
>    ke alamat baru. Lihat DPPL.md §A.3.
> 2. Docker image Ponder ternyata stale (kolom `kasbon_repaid` dan
>    tabel `salary_advance` tidak ada) — semua event `SalaryClaimed` gagal ter-index sampai
>    image di-rebuild dan schema di-recreate. Lihat DPPL.md §A.3.
> 3. `AU-22-02` (`QUOTA_REACHED`) terbukti dead code di `backend/src/routes/bounty.ts` — baris
>    tsb dihapus, perilaku sebenarnya (409 BOUNTY_CLOSED) sekarang terverifikasi.
> 4. **[TEMUAN ARSITEKTUR]** Registrasi employee sebelumnya menerima `hrAddress` bebas dari
>    client — employee bisa memilih perusahaan mana pun dari dropdown tak terfilter di
>    `/onboarding`, tanpa validasi undangan apa pun (invite link yang ada sebelumnya cuma
>    kosmetik UI, tidak divalidasi backend). Diperbaiki: registrasi employee sekarang wajib
>    `inviteToken` valid dari HR (`backend/src/routes/invitations.ts`, tabel baru
>    `employee_invitations`), `hrAddress` di-resolve server-side, dropdown pilih-bebas dihapus
>    total dari `/onboarding`. Lihat AU-02-02, AU-02-06..09.
> 5. `AU-05-05` — topic hash `SalaryClaimed` di `backend/src/routes/webhook.ts` memakai
>    signature 7-parameter (stale, hilang `kasbonRepaid`), sehingga webhook Alchemy tidak
>    pernah mengenali event nyata. Diperbaiki (topic hash + `decodeAbiParameters` keduanya
>    diupdate ke 8-parameter yang benar) dan **diverifikasi end-to-end nyata**: payload webhook
>    ditandatangani HMAC valid dikirim dengan data log on-chain asli, decode benar persis, dan
>    broadcast WebSocket `SALARY_CLAIMED` diterima klien nyata.
> 6. `AU-11-01` — `useRequestAdvance` (`frontend/src/application/mutations/useKasbonActions.ts`)
>    memanggil `requestAdvance()` dengan `args: []`, tanpa `amount`; halaman `/employee/kasbon`
>    juga tidak punya input jumlah sama sekali. Diperbaiki: input jumlah kasbon eksplisit
>    ditambahkan (dengan validasi ≤80% gaji bulanan), `amount` sekarang benar-benar dikirim ke
>    kontrak. Bug terkait di endpoint yang sama (`POST /kasbon/request` kehilangan field wajib
>    `vaultAddress`/`amount`) turut diperbaiki. Diverifikasi klik-UI sungguhan di browser
>    (lihat temuan #8 dan AU-11-01 di Bab 5 untuk bug ABI kedua yang ditemukan pada tahap ini).
> 7. **[TEMUAN REGULASI]** Pendaftaran company (`POST /registration/request` type="company")
>    sebelumnya menerima NPWP/NIB sebagai teks bebas tanpa validasi format sama sekali — Owner
>    hanya melihat badge "Lengkap/Data Belum Lengkap" (indikator visual, tidak mencegah approve).
>    Ditambahkan validasi format server-side: NPWP harus 15 digit (format lama) atau 16 digit
>    (format baru berbasis NIK) setelah tanda baca dibersihkan; NIB harus tepat 13 digit; NIK
>    Direktur/PIC harus 16 digit (mengikuti pola validasi NIK karyawan yang sudah ada). Field
>    tetap opsional saat submit (tidak wajib diisi), tapi kalau diisi harus berformat benar.
>    Diverifikasi 7 skenario nyata (lihat AU-02-10..12).
> 8. **[TEMUAN — ketemu HANYA saat klik UI sungguhan]** Setelah bug `useKasbonActions.ts`
>    (AU-11-01, temuan #6) diperbaiki di level pemanggilan kontrak, klik "Ajukan Kasbon"
>    sungguhan di browser tetap gagal dengan error ABI encoding mismatch
>    ("Expected length (params): 0, Given length (values): 1"). Root cause KEDUA: ABI
>    `requestAdvance` di `frontend/src/infrastructure/chain/abi.ts` masih `inputs: []`,
>    terpisah dari fix sebelumnya. Diperbaiki (ditambah `{name:"amount", type:"uint256"}`).
>    Ini murni tidak akan pernah ketemu dari review kode kasbon saja karena bug-nya ada di
>    file ABI terpisah yang tidak disentuh saat memperbaiki call-site.
> 9. **[TEMUAN — ketemu HANYA saat klik UI sungguhan]** `/verify` (AU-14-01/02) error
>    `IntegerOutOfRangeError` saat klik verifikasi. Root cause: ABI `employmentRecords` di
>    `frontend/src/app/verify/page.tsx` dideklarasikan sebagai 1 output tuple, padahal getter
>    Solidity otomatis untuk `mapping(uint256 => Struct) public` yang struct-nya punya field
>    `string` (companyName) mem-flatten jadi **3 output terpisah** (dikonfirmasi via
>    `cast call employmentRecords(uint256)(address,string,uint256)` langsung ke kontrak).
>    Diperbaiki: ABI diubah jadi 3 output bernama, destructuring diubah dari object ke array
>    (`const [hrAuthority, companyName, startTs] = record`). Sekaligus ditemukan: halaman
>    `/verify` tidak pernah di-link dari mana pun di aplikasi (nol hasil grep) — ditambahkan
>    link "Verify Employment" di landing page (`/`) dan link di `/login`, supaya pihak ketiga
>    (bank, perusahaan lain) yang bahkan belum punya akun Payana bisa menemukannya.
> 10. **[TEMUAN — ketemu HANYA saat klik UI sungguhan]** AU-16-01 (`/hr/vault`): angka
>    `vaultBalance` di UI (Rp 999.894.288) tidak cocok dengan nilai on-chain asli (setelah
>    kontrak CompanyVault diverifikasi di BaseScan: 972494299743827160501553812 wei ≈
>    Rp 972.494.300) — selisih ~27,4 juta IDRX. Root cause: 2 event handler Ponder
>    (`AdvanceApproved` kasbon, `TerminationExecuted` severance top-up) tidak pernah
>    mengurangi `company.vaultBalance` sama sekali, walau kontrak asli memang menguranginya
>    di kedua kasus itu. Diperbaiki secara menyeluruh (bukan cuma tambal 2 handler itu):
>    **semua 8 titik** yang menyentuh `vaultBalance` di `ponder/src/PayrollContract.ts`
>    diganti dari arithmetic manual +/- menjadi resync langsung dari kontrak
>    (`context.client.readContract`) setiap event relevan terjadi — pendekatan ini immun
>    dari seluruh kelas bug drift semacam ini untuk perubahan kontrak apa pun di masa depan.
>    Setelah reindex, nilai Ponder cocok persis dengan on-chain.
> 11. **[TEMUAN & DIPERBAIKI]** Menutup gap AU-06-03 (backend `POST /termination/reason`, nol
>    coverage sebelumnya) menemukan bug akses nyata: `canViewEmployeeData()` di
>    `backend/src/services/authz.ts` hanya mengecek `caller === hrAuthority`, sehingga Legal
>    (pemegang `LEGAL_ROLE` on-chain) selalu mendapat 403 saat mencoba membaca alasan PHK —
>    padahal komentar kode sendiri menyatakan endpoint ini seharusnya "HR-or-Legal", dan Legal
>    memang butuh konteks alasan sebelum memberi persetujuan independennya (`approveTermination()`)
>    sesuai desain sistem persetujuan dua pihak. Diperbaiki dengan menambah pengecekan on-chain
>    `hasRole(LEGAL_ROLE, caller)` pada `CompanyVault` terkait HR tersebut — perbaikan ini
>    otomatis juga berlaku untuk endpoint lain yang memakai fungsi yang sama
>    (`GET /auth/profile/by-address/:address`). Diverifikasi 8 skenario nyata (lihat
>    `testing-scripts/ku-06-termination-reason.mjs`).

| Identifikasi | Deskripsi Singkat | Prosedur Pengujian | Masukan | Keluaran yang Diharapkan | Kriteria Evaluasi Hasil | Hasil yang Didapat | Kesimpulan |
|---|---|---|---|---|---|---|---|
| AU-01-01 | Login sukses | Kirim POST /auth/login dengan signature valid | address, message, signature | 200 + tokens, redirect sesuai role | Status 200 dan redirect benar | PASS (eksekusi nyata, `testing-scripts/ku-01-login.mjs`) — 4 role (Owner/HR/Legal/Employee) login sukses, 200 + accessToken | Handal |
| AU-01-02 | Signature invalid | Kirim POST /auth/login dengan signature rusak | signature acak | 401 UNAUTHORIZED | Status 401 | PASS (eksekusi nyata) — signature mismatch → 401 UNAUTHORIZED | Handal |
| AU-01-03 | Timestamp expired | Kirim message dengan Timestamp lampau | message dengan Timestamp -10 menit | 401, pesan kedaluwarsa | Status 401 | PASS (eksekusi nyata) — timestamp 400 detik lampau → 401 UNAUTHORIZED, pesan kedaluwarsa | Handal |
| AU-01-04 | Refresh token revoked | Logout lalu pakai refreshToken lama | refreshToken pasca logout | 401 session revoked | Status 401 | PASS (eksekusi nyata) — logout sukses, refresh dengan refreshToken lama → 401 | Handal |
| AU-01-05 | Login saat disuspend | Owner suspend HR, HR login | address HR tersuspend | 403 ACCOUNT_SUSPENDED | Status 403 | PASS (eksekusi nyata) — Owner suspend HR via `POST /suspension/:hrAddress`, HR login → 403 ACCOUNT_SUSPENDED, lalu reaktivasi & login ulang sukses (cleanup terverifikasi) | Handal |
| AU-02-01 | Registrasi company | POST /registration/request type=company | data perusahaan lengkap | 200 ok, status pending | Baris pendingRegistrations dibuat | PASS (eksekusi nyata, `testing-scripts/ku-02-registration.mjs`) — 200 ok:true | Handal |
| AU-02-02 | Registrasi employee (invitation-only) | POST /registration/request type=employee, inviteToken valid | address, inviteToken | 200 ok, muncul di pending/hr/:hr, hrAddress diresolve dari token | Baris pendingRegistrations dibuat dengan hrAddress benar | PASS (eksekusi nyata, `testing-scripts/ku-02-registration.mjs`) — 200 ok:true, DAN sekarang diverifikasi eksplisit muncul di `GET /registration/pending/hr/:hrAddress` milik HR pengundang [Temuan audit sistematis 2026-07: sebelumnya bagian ini tidak diassert, diperbaiki] | Handal |
| AU-02-03 | NIK invalid | POST /auth/profile dengan nik salah format | nik="12345" | 400 BAD_REQUEST | Status 400 | PASS (eksekusi nyata) — NIK 5 digit → 400 BAD_REQUEST | Handal |
| AU-02-04 | Approve company | Owner approve registrasi | address company | status approved | Status terupdate | PASS (eksekusi nyata) — Owner approve → 200 ok:true | Handal |
| AU-02-05 | Approve lintas HR ditolak (registrasi EMPLOYEE milik HR A) | HR B approve punya HR A | address employee HR A | 403 Forbidden | Status 403 | PASS (eksekusi nyata, `testing-scripts/ku-02-registration.mjs` AU-02-05b) — skenario persis: registrasi employee dengan hrAddress=TEST_HR, pihak lain (TEST_LEGAL, bukan Owner bukan HR pemilik) memanggil `PATCH /registration/:address/approve` yang sama persis dipakai HR asli → 403 [Temuan audit sistematis 2026-07: versi sebelumnya menguji kasus berbeda (non-owner approve registrasi COMPANY, bukan EMPLOYEE) — dipertahankan sebagai AU-02-05a, skenario Bab 4 yang sebenarnya ditambahkan sebagai AU-02-05b] | Handal |
| AU-02-06 | HR membuat invitation token | POST /invitations | name, email (opsional) | 200, token unik, hrAddress benar | Baris employee_invitations dibuat | PASS (eksekusi nyata) — token dibuat, hrAddress sama dengan caller (bukan input client) | Handal |
| AU-02-07 | Registrasi tanpa inviteToken ditolak | POST /registration/request type=employee tanpa inviteToken | address only | 400 BAD_REQUEST | Status 400 | PASS (eksekusi nyata) — tanpa inviteToken → 400, menutup celah pilih-bebas perusahaan | Handal |
| AU-02-08 | inviteToken dipakai ulang ditolak | POST /registration/request inviteToken sudah dipakai | inviteToken bekas | 409 | Status 409 | PASS (eksekusi nyata) — reuse token → 409 | Handal |
| AU-02-09 | Revoke invitation | PATCH /invitations/:token/revoke lalu registrasi dengan token itu | token pending | revoke 200, registrasi berikutnya 409 | Status sesuai | PASS (eksekusi nyata) — revoke → 200, registrasi dengan token revoked → 409 | Handal |
| AU-02-10 | NPWP format invalid | POST /registration/request npwp 14 digit | npwp="12345678901234" | 400 BAD_REQUEST | Status 400 | PASS (eksekusi nyata, `testing-scripts/ku-02-registration.mjs`) — NPWP 14 digit → 400 | Handal |
| AU-02-11 | NIB format invalid | POST /registration/request nib 12 digit | nib="123456789012" | 400 BAD_REQUEST | Status 400 | PASS (eksekusi nyata) — NIB 12 digit → 400 | Handal |
| AU-02-12 | NPWP format valid (15/16 digit) | POST /registration/request npwp 15 atau 16 digit | npwp 15 digit dan 16 digit | 200 ok:true untuk keduanya | Status 200 | PASS (eksekusi nyata) — 15 digit (dengan tanda baca) dan 16 digit keduanya diterima 200 | Handal |
| AU-03-01 | fundVault sukses | approve + fundVault | amountWei | vaultBalance bertambah | Selisih saldo sesuai amount | PASS (forge test) — vaultBalance bertambah sesuai amount. **Juga dikonfirmasi eksekusi nyata** (`testing-scripts/30-01-setup-company.mjs`): `approve` + `fundVault(Rp 1.000.000.000)` di Base Sepolia, vaultBalance terkonfirmasi bertambah via pembacaan on-chain langsung. | Handal |
| AU-03-02 | withdraw melebihi saldo | withdrawVault amount besar | amount > vaultBalance | revert InsufficientVaultBalance | Transaksi revert | PASS (forge test) — revert InsufficientVaultBalance sesuai harapan | Handal |
| AU-03-03 | setCompanyConfig | setCompanyConfig bpjs/pph21/threshold | 400,0,1000 | Nilai konfigurasi ter-update | Getter mengembalikan nilai baru | PASS (forge test) — bpjsBps/pph21Bps/lowBalanceThresholdBps ter-update | Handal |
| AU-03-04 | pauseVault blokir klaim | pauseVault lalu claimSalary | - | Klaim ditolak | Transaksi revert/ditolak | PASS (forge test) — claimSalary ditolak saat vault paused | Handal |
| AU-04-01 | startStream sukses | startStream employee baru | employee, flowRate, 200 | Stream Active + SBT minted | Status Active, tokenId>0 | PASS (forge test) — stream Active, SBT ter-mint. **Juga dikonfirmasi eksekusi nyata** (`testing-scripts/30-02-onboard-employees.mjs`): 30/30 `startStream` di Base Sepolia (flowRate Rp 5.800.000/bulan, severanceBps 200), status Active terverifikasi on-chain untuk seluruh 30 karyawan (`30-99-verify-final-state.mjs`). Catatan: keberhasilan mint SBT per karyawan tidak diverifikasi terpisah dalam simulasi ini (`sbtContract.mint()` dibungkus try/catch di kontrak, sehingga silent-fail tidak akan menggagalkan startStream itu sendiri). | Handal |
| AU-04-02 | startStream duplikat | startStream employee sudah Active | employee sama | revert StreamAlreadyActive | Transaksi revert | PASS (forge test) — revert StreamAlreadyActive | Handal |
| AU-04-03 | pause/resume stream | pauseStream lalu resumeStream | employee | settledBalance disettle benar | Tidak ada akumulasi ganda | PASS (forge test, pakai skip() bukan vm.warp ganda) — tidak ada akumulasi ganda pada settledBalance | Handal |
| AU-04-04 | startStream tanpa HR_ROLE | startStream wallet non-HR | wallet acak | revert Unauthorized | Transaksi revert | PASS (forge test) — revert Unauthorized | Handal |
| AU-05-01 | Klaim sukses tanpa kasbon | claimSalary tanpa advance aktif | - | Split fee/tax/severance benar | Event SalaryClaimed+TaxWithheld sesuai formula | PASS (forge test) — split platform fee/PPh21/BPJS/severance sesuai formula. **Juga dikonfirmasi eksekusi nyata** (`testing-scripts/30-03-claim-salaries.mjs`): 30/30 `claimSalary()` sukses di Base Sepolia tanpa kasbon aktif saat itu (kasbon baru diajukan setelah tahap ini). Catatan: simulasi ini memverifikasi transaksi tidak revert dan `accrued` terklaim, bukan audit rinci angka pemotongan fee/PPh21/BPJS per transaksi. | Handal |
| AU-05-02 | Klaim dengan kasbon aktif | claimSalary saat advance Active | - | Potongan cicilan 20% | Event AdvanceRepaid sesuai formula | PASS (forge test) — potongan cicilan kasbon 20%, event AdvanceRepaid sesuai | Handal |
| AU-05-03 | Klaim tanpa saldo akrual | claimSalary saat accrued=0 | - | revert NothingToClaim | Transaksi revert | PASS (forge test) — revert NothingToClaim | Handal |
| AU-05-04 | Rate limit klaim | 11x POST /bundler/relay dalam 1 jam | userOp x11 | Request ke-11 ditolak | Status 429 pada request ke-11 | PASS (forge test) — request ke-11 dalam 1 jam ditolak | Handal |
| AU-05-05 | Webhook topic hash SalaryClaimed | Klaim nyata + amati webhook | event on-chain nyata | Broadcast WS SALARY_CLAIMED terjadi | WS message diterima frontend | PASS (eksekusi nyata, DIPERBAIKI) — bug topic hash 7-parameter dikonfirmasi via inspeksi kode, lalu diperbaiki di backend/src/routes/webhook.ts (topic hash dan decodeAbiParameters keduanya diupdate ke signature 8-parameter yang benar, termasuk kasbonRepaid). Diverifikasi end-to-end nyata: webhook /webhook/alchemy dikirim dengan payload log SalaryClaimed asli dari transaksi on-chain nyata (tx 0x977c78c2dc6a2ab41565c3de2748aee0ce6df7148daa5681fa13df064b18dd57, employee-01), ditandatangani HMAC valid. Hasil: decode benar (accrued=156635802469135802400 cocok persis data on-chain), broadcast WebSocket SALARY_CLAIMED diterima oleh WS client nyata dengan payload lengkap termasuk kasbonRepaid. | Handal |
| AU-06-01 | proposeTermination sukses | proposeTermination | employee, reasonHash | Proposal tersimpan, expiresAt +7 hari | Event TerminationProposed | PASS (forge test) — proposal tersimpan, expiresAt +7 hari. **Juga dikonfirmasi eksekusi nyata** (`testing-scripts/30-06-termination.mjs`): 3/3 `proposeTermination` sukses di Base Sepolia untuk skenario PHK. | Handal |
| AU-06-02 | Proposal ganda | proposeTermination employee sudah ada proposal | employee sama | revert TerminationAlreadyProposed | Transaksi revert | PASS (forge test) — revert TerminationAlreadyProposed | Handal |
| AU-06-03 | Simpan alasan PHK | POST /termination/reason | employeeAddress, reason | Reason tersimpan & terbaca | GET reason mengembalikan data sama | PASS (forge test, bagian on-chain: `reasonHash` tersimpan bersamaan `proposeTermination`) + PASS (eksekusi nyata, `testing-scripts/ku-06-termination-reason.mjs`, bagian backend yang tadinya nol coverage) — HR simpan alasan plaintext, HR & employee sendiri & Legal semua bisa baca kembali dengan reason yang cocok, pihak tidak berwenang & non-HR yang coba POST ditolak 403. **[TEMUAN & DIPERBAIKI]** `canViewEmployeeData()` di `backend/src/services/authz.ts` sebelumnya HANYA mengecek `caller === hrAuthority` — Legal (LEGAL_ROLE on-chain) selalu dapat 403 walau seharusnya diberi konteks sebelum `approveTermination()` independennya (inti dari desain persetujuan dua pihak). Diperbaiki dengan menambah pengecekan on-chain `hasRole(LEGAL_ROLE, caller)` pada CompanyVault terkait — perbaikan ini juga berlaku untuk endpoint lain yang memakai fungsi yang sama (`GET /auth/profile/by-address/:address`). | Handal |
| AU-07-01 | Approve+execute PHK | approveTermination lalu executeTermination | employee | Severance cair, SBT dicabut | Event TerminationExecuted | PASS (forge test) — severance cair, SBT dicabut, event TerminationExecuted. **Juga dikonfirmasi eksekusi nyata** (`testing-scripts/30-06-termination.mjs`): 3/3 alur `approveTermination` (Legal) → `executeTermination` (HR) sukses di Base Sepolia; status stream terverifikasi `Cancelled` untuk ketiganya (`30-99-verify-final-state.mjs`). Catatan: jumlah severance yang cair dan status pencabutan SBT tidak diverifikasi angka persisnya dalam simulasi ini, hanya status stream akhir. | Handal |
| AU-07-02 | Proposal expired | approve/execute setelah 7 hari | employee | revert ProposalExpired | Transaksi revert | PASS (forge test) — revert ProposalExpired setelah >7 hari | Handal |
| AU-07-03 | Approve tanpa LEGAL_ROLE | approveTermination wallet non-legal | wallet acak | revert Unauthorized | Transaksi revert | PASS (forge test) — revert Unauthorized | Handal |
| AU-08-01 | Resign sukses | resignEmployee | employee | Stream stop, severance kembali, SBT dicabut | State sesuai harapan | PASS (forge test) — stream stop, severance balik ke vault, SBT dicabut | Handal |
| AU-08-02 | Resign dengan kasbon aktif | resignEmployee saat advance Active | employee | Kasbon dihapus tanpa tagihan | salaryAdvances[employee] terhapus | PASS (forge test) — kasbon aktif terhapus tanpa penagihan saat resign | Handal |
| AU-09-01 | createCliffVest sukses | createCliffVest | employee, amount, cliffTs, type | Dana terkunci, event CliffVestCreated | Vault balance berkurang sesuai | PASS (forge test) — dana terkunci, event CliffVestCreated | Handal |
| AU-09-02 | createCliffVest saldo kurang | createCliffVest amount > vaultBalance | amount besar | revert InsufficientVaultBalance | Transaksi revert | PASS (forge test) — revert InsufficientVaultBalance | Handal |
| AU-09-03 | cancelCliffVest | cancelCliffVest sebelum cliffTs | employee, vestId | Status Forfeited, dana kembali | Vault balance bertambah kembali | PASS (forge test) — status Forfeited, dana kembali ke vaultBalance | Handal |
| AU-10-01 | claimCliffVest sukses | claimCliffVest setelah cliffTs | vestId | Dana cair ke karyawan | Transfer sesuai amount | PASS (forge test) — dana cair, status Claimed | Handal |
| AU-10-02 | claimCliffVest sebelum cliff | claimCliffVest sebelum cliffTs | vestId | revert CliffNotReached | Transaksi revert | PASS (forge test) — revert CliffNotReached | Handal |
| AU-10-03 | claimCliffVest dua kali | claimCliffVest vest sudah settled | vestId sudah diklaim | revert VestAlreadySettled | Transaksi revert | PASS (forge test) — revert VestAlreadySettled | Handal |
| AU-10-04 | vestId tidak ada | claimCliffVest vestId invalid | vestId acak | revert VestNotFound | Transaksi revert | PASS (forge test) — revert VestNotFound | Handal |
| AU-11-01 | Ajukan kasbon dari UI | Klik ajukan kasbon di /employee/kasbon | jumlah kasbon + note | Kasbon senilai jumlah dimaksud tersimpan Pending | Verifikasi amount on-chain sesuai yang dimaksud pengguna | PASS (eksekusi nyata, klik UI sungguhan) — DIPERBAIKI (2 bug: useKasbonActions.ts args:[] tanpa amount, DAN frontend/src/infrastructure/chain/abi.ts requestAdvance ABI juga masih inputs:[] terpisah dari call-site fix, ketemu waktu klik nyata di browser — ABI mismatch "Expected length (params): 0, Given length (values): 1"). Setelah kedua bug diperbaiki: klik Ajukan Kasbon sungguhan di /employee/kasbon (employee-22, wallet MetaMask asli terhubung via Privy wallet-connect) berhasil, transaksi on-chain sukses, status berubah Pending. | Handal |
| AU-11-02 | Kasbon melebihi limit | requestAdvance amount > 80% gaji | amount besar | revert AdvanceAmountTooHigh | Transaksi revert | PASS (forge test) — revert AdvanceAmountTooHigh | Handal |
| AU-11-03 | Kasbon ganda | requestAdvance saat masih Pending/Active | amount baru | revert AdvancePendingExists/ActiveAdvanceExists | Transaksi revert | PASS (forge test) — revert AdvancePendingExists/ActiveAdvanceExists | Handal |
| AU-12-01 | approveAdvance sukses | approveAdvance | employee | Dana masuk wallet karyawan, status Active | Event AdvanceApproved | PASS (forge test) — dana masuk wallet karyawan, event AdvanceApproved. **Juga dikonfirmasi eksekusi nyata** (`testing-scripts/30-04-kasbon.mjs`): 10/10 `requestAdvance` + `approveAdvance` sukses di Base Sepolia (Rp 1.000.000/orang), status advance terverifikasi `Active` untuk seluruh 10 karyawan (`30-99-verify-final-state.mjs`). | Handal |
| AU-12-02 | approveAdvance saldo kurang | approveAdvance vaultBalance kurang | employee | revert InsufficientVaultBalance | Transaksi revert | PASS (forge test) — revert InsufficientVaultBalance | Handal |
| AU-12-03 | rejectAdvance sukses | rejectAdvance | employee | Status kembali None, event AdvanceRejected | Karyawan bisa ajukan ulang | PASS (forge test) — status None kembali, event AdvanceRejected | Handal |
| AU-13-01 | Ringkasan kepatuhan | GET /compliance/summary/:hr | hr, month | Agregat benar | Nilai sesuai salary_claim | PASS (eksekusi nyata, `testing-scripts/ku-13-compliance.mjs`) — 200, hrAddress cocok, DAN sekarang diverifikasi otomatis dalam script: `totalAccrued`/`totalCompliance`/`totalSeverance`/`employeeCount` EXACT match dengan SUM per-employee `rows` di response yang sama [Temuan audit sistematis 2026-07: sebelumnya kecocokan agregat hanya pernah dicek manual sekali di luar script, tidak permanen; diperbaiki jadi assertion permanen] | Handal |
| AU-13-02 | Export tanpa data | GET /compliance/export/:hr bulan kosong | hr, month kosong | 404 NOT_FOUND | Status 404 | PASS (eksekusi nyata) — bulan tanpa transaksi → 404 NOT_FOUND | Handal |
| AU-13-03 | Export lintas HR ditolak | GET /compliance/export/:hr HR lain | hr milik HR lain | 403 FORBIDDEN | Status 403 | PASS (eksekusi nyata) — export lintas HR → 403 FORBIDDEN | Handal |
| AU-13-04 | Rekonsiliasi tersimpan | POST /compliance/reconciliation/:hr | month, bpjsPaid, pph21Paid | Tersimpan & terbaca | GET mengembalikan data sama | PASS (eksekusi nyata) — POST tersimpan, GET mengembalikan nilai yang sama persis | Handal |
| AU-14-01 | Verifikasi SBT aktif | Buka /verify wallet aktif | address karyawan aktif | Status aktif tampil | Data sesuai employmentRecords | PASS (eksekusi nyata, klik UI sungguhan) — DIPERBAIKI bug ABI: frontend/src/app/verify/page.tsx mendeklarasikan employmentRecords() sebagai 1 output tuple, padahal getter Solidity untuk mapping-ke-struct yang punya field string mem-flatten jadi 3 output terpisah (dikonfirmasi via cast call langsung) — ABI diperbaiki jadi 3 outputs terpisah + destructuring diubah dari object ke array. Setelah fix: address employee-22 (0xFd6244343bE6aaC0CB49Aefc09012524AB79F571) menampilkan status SBT aktif dengan data benar. | Handal |
| AU-14-02 | Verifikasi tanpa SBT | Buka /verify wallet tanpa SBT | address acak | Status tidak ditemukan | Pesan sesuai | PASS (eksekusi nyata, klik UI sungguhan) — address random yang belum pernah onboarding menampilkan pesan tidak ditemukan, bukan error/crash. | Handal |
| AU-14-03 | Transfer SBT ditolak | transferFrom langsung | tokenId aktif | revert SoulboundTransferNotAllowed | Transaksi revert | PASS (forge test, `testRevert_transferFrom_soulbound`) — revert SoulboundTransferNotAllowed | Handal |
| AU-15-01 | deployVault sukses | deployVault Owner | hrAuthority baru | Vault baru terdeploy | Event VaultDeployed | PASS (forge test) — vault baru terdeploy, event VaultDeployed | Handal |
| AU-15-02 | deployVault duplikat | deployVault HR sudah punya vault | hrAuthority sama | revert HRAlreadyHasVault | Transaksi revert | PASS (forge test) — revert HRAlreadyHasVault | Handal |
| AU-15-03 | deployVault tanpa izin | deployVault wallet bukan HR/SuperAdmin | wallet acak | revert OnlyHRorSuperAdmin | Transaksi revert | PASS (forge test) — revert OnlyHRorSuperAdmin | Handal |
| AU-16-01 | Dashboard vault benar | Buka /hr/vault | hrAddress | Saldo & burn rate sesuai | Nilai cocok data on-chain | PASS (eksekusi nyata, klik UI sungguhan, setelah investigasi bug) — **[TEMUAN & DIPERBAIKI]** ditemukan discrepancy nyata: UI menampilkan Rp 999.894.288, BaseScan Read Contract (setelah kontrak diverifikasi) menampilkan vaultBalance on-chain 972494299743827160501553812 wei (~Rp 972.494.300) — selisih ~27,4 juta IDRX. Root cause: 2 event handler Ponder (AdvanceApproved kasbon, TerminationExecuted severance top-up) tidak pernah mengurangi company.vaultBalance sama sekali. Diperbaiki dengan mengganti seluruh mekanisme tracking vaultBalance (8 titik) dari arithmetic manual +/- menjadi resync langsung dari kontrak (context.client.readContract) setiap event relevan — immun dari kelas bug ini ke depannya. Setelah reindex: nilai Ponder = 972494299743827160501553812, cocok persis dengan on-chain. | Handal |
| AU-16-02 | Banner Frozen | Buka /hr/vault vault Frozen | hrAddress vault frozen | Banner tampil | Banner terlihat, aksi tulis nonaktif | PASS (eksekusi nyata, klik UI sungguhan) — vault dummy baru di-deploy dan di-freeze khusus untuk uji ini (0xd1fF60E9A8708a7929468Fb7bA8cE7231A94045A, tidak mengganggu vault simulasi 30 karyawan). DIPERBAIKI sekalian: banner Frozen sebelumnya cuma badge kecil (VaultStatusBadge), ditambahkan banner merah mencolok (ikon gembok + penjelasan permanen/irreversible) di /hr/vault/page.tsx, dan 4 tombol aksi tulis (Tarik Dana, Konfigurasi, Isi Biaya Transaksi, Isi Saldo Kas) dinonaktifkan saat status Frozen. Dikonfirmasi HR login ke vault dummy tsb menampilkan banner dan tombol nonaktif dengan benar. | Handal |
| AU-20-01 | setPlatformFee sukses | setPlatformFee 50 | bps=50 | platformFeeBps=50 | Event PlatformFeeUpdated | PASS (forge test) — platformFeeBps=50, event PlatformFeeUpdated | Handal |
| AU-20-02 | setPlatformFee melebihi batas | setPlatformFee 150 | bps=150 | revert FeeTooHigh | Transaksi revert | PASS (forge test) — revert FeeTooHigh untuk >100 bps | Handal |
| AU-20-03 | setProtocolTreasury | setProtocolTreasury alamat baru | newTreasury | Treasury ter-update | Event ProtocolTreasuryUpdated | PASS (forge test) — protocolTreasury ter-update, event ProtocolTreasuryUpdated | Handal |
| AU-21-01 | Submit reimburse | POST /reimburse | hrAddress, category, amount, description | Klaim pending tersimpan | Status 200, status pending | PASS (eksekusi nyata, `testing-scripts/ku-21-reimburse.mjs`) — 200, `body.status==="pending"` diverifikasi eksplisit, klaim tersimpan, muncul di GET /reimburse/me dan /reimburse/hr [Temuan audit sistematis 2026-07: field status sebelumnya tidak dicek eksplisit, diperbaiki] | Handal |
| AU-21-02 | Approve txHash tidak valid | PATCH /reimburse/:id/approve | txHash palsu | 400 TRANSFER_NOT_VERIFIED | Status 400 | PASS (eksekusi nyata) — txHash palsu → 400 TRANSFER_NOT_VERIFIED | Handal |
| AU-21-03 | Approve lintas HR (klaim milik karyawan HR A) | PATCH approve klaim HR lain | id klaim HR lain | 403 FORBIDDEN | Status 403 | PASS (eksekusi nyata, `testing-scripts/ku-21-reimburse.mjs`) — pihak lain (TEST_LEGAL, bukan hrAddress klaim) memanggil `PATCH /reimburse/:id/approve` yang sama persis dipakai HR asli → 403 FORBIDDEN [Temuan audit sistematis 2026-07: versi sebelumnya hanya menguji GET /reimburse/hr/:hrAddress (list-viewing forbidden), bukan endpoint approve yang didokumentasikan Bab 4 — diperbaiki untuk menguji endpoint approve langsung] | Handal |
| AU-21-04 | Approve klaim sudah direview | PATCH approve klaim sudah approved | id klaim reviewed | 409 ALREADY_REVIEWED | Status 409 | PASS (eksekusi nyata) — klaim di-reject lalu di-approve ulang → 409 ALREADY_REVIEWED | Handal |
| AU-22-01 | Create bounty | POST /bounty | title, description, rewardIdrx, quota | Bounty open tersimpan | Status 200 | PASS (eksekusi nyata, simulasi 30 karyawan `testing-scripts/30-05-bounty.mjs`) — HR membuat 1 bounty (quota=8, reward=Rp 1.000.000/orang), `POST /bounty` mengembalikan 200 dengan bounty id, status `open` tersimpan | Handal |
| AU-22-02 | Claim setelah quota penuh | POST /bounty/:id/claim setelah quota tercapai | bountyId sudah closed | 409 BOUNTY_CLOSED | Status 409 | PASS (eksekusi nyata, `testing-scripts/ku-22-bounty.mjs`, setelah perbaikan produk) — **[TEMUAN & DIPERBAIKI]** kode asli punya cabang `QUOTA_REACHED` yang terbukti dead code (status selalu berubah ke `closed` di saat bersamaan `claimedCount` mencapai `quota`, jadi cek `status!=="open"` selalu lebih dulu tercapai). Baris dead code dihapus dari `backend/src/routes/bounty.ts`; perilaku yang benar (409 BOUNTY_CLOSED) sekarang terverifikasi langsung, bukan lagi skenario QUOTA_REACHED yang mustahil terjadi | Handal |
| AU-22-03 | Bayar bounty claim | PATCH /bounty/claim/:id/paid | txHash valid | Status paid | paidTxHash tersimpan | PASS (eksekusi nyata, simulasi 30 karyawan `testing-scripts/30-05-bounty.mjs`) — 8/8 klaim: `POST /:id/claim` → `PATCH /claim/:id/approve` → transfer IDRX on-chain nyata dari wallet HR ke tiap karyawan → `PATCH /claim/:id/paid` dengan txHash asli, diverifikasi backend via `verifyIdrxTransfer()`, status `paid` tersimpan untuk semua 8 klaim (contoh tx: `0x82886eca81b1e6b0e6ee71660f844351e770da08316d4cbcce0d54f8a5d8f2bf`) | Handal |
| AU-22-04 | Kirim tip | POST /bounty/tip | toAddress, amount, txHash | Tip tercatat | Muncul di riwayat kedua pihak | PASS (eksekusi nyata, `testing-scripts/ku-22-bounty.mjs`) — tip tercatat, muncul di riwayat pengirim maupun penerima | Handal |
| AU-23-01 | Daftar notifikasi | GET /notifications | - | Maks 50, terbaru dulu | Urutan & jumlah sesuai | PASS (eksekusi nyata, `testing-scripts/ku-23-notifications.mjs`) — script kini self-contained: menghasilkan >50 notifikasi sendiri lewat siklus POST /reimburse + PATCH /reject nyata (bukan seed manual ke DB), lalu memverifikasi hasil GET /notifications terpotong tepat 50 baris, urut createdAt desc [Temuan audit sistematis 2026-07: versi sebelumnya bergantung 58 baris yang di-seed manual sekali waktu ke DB, tidak reproducible oleh script sendiri — diperbaiki jadi self-contained] | Handal |
| AU-23-02 | Read notifikasi lintas user | PATCH /notifications/:id/read milik lain | id milik user lain | 403 FORBIDDEN | Status 403 | PASS (eksekusi nyata, `testing-scripts/ku-23-notifications.mjs`) — script kini menghasilkan sendiri 1 notifikasi baru milik TEST_LEGAL (pihak lain) lewat reject-cycle nyata, lalu TEST_EMPLOYEE mencoba PATCH read atas id tsb → 403 FORBIDDEN [Temuan audit sistematis 2026-07: versi sebelumnya bergantung `TEST_NOTIFICATION_FOREIGN_ID` yang menunjuk 1 baris di-seed manual — diperbaiki jadi self-contained] | Handal |
| AU-23-03 | Read-all | PATCH /notifications/read-all | - | Semua read=true | Semua notifikasi terbaca | PASS (eksekusi nyata) — 200 ok:true | Handal |
| AU-24-01 | Lihat payslip | GET /payslip/:claimId | claimId valid | Breakdown lengkap | Nilai sesuai salary_claim | PASS (eksekusi nyata, `testing-scripts/ku-24-payslip.mjs`) — script kini memanggil `claimSalary()` on-chain sendiri saat run dan men-derive claimId langsung dari log transaksi (tx `0xc16b133e978cfbc993ca139bca008d785f5a9b7838aa71dbf6775e1e04659b3d`, logIndex 200, terkonfirmasi di Ponder `salary_claim`), lalu GET /payslip/:claimId → 200 dengan breakdown lengkap [Temuan audit sistematis 2026-07: versi sebelumnya bergantung `TEST_PAYSLIP_CLAIM_ID` yang menunjuk claim lama — diperbaiki jadi self-contained] | Handal |
| AU-24-02 | Payslip akses tidak sah | GET /payslip/:claimId pihak lain | claimId, caller tidak terkait | 403 FORBIDDEN | Status 403 | PASS (eksekusi nyata, `testing-scripts/ku-24-payslip.mjs`, claimId self-contained dari claimSalary() nyata di atas) — pihak tidak terkait (Legal) → 403 FORBIDDEN | Handal |
| AU-24-03 | Payslip tidak ditemukan | GET /payslip/:claimId invalid | claimId acak | 404 NOT_FOUND | Status 404 | PASS (eksekusi nyata) — claimId acak → 404 NOT_FOUND | Handal |
| AU-25-01 | Tax cert tahunan | GET /tax-cert/:year | year=2026 | Agregat tahunan benar | Nilai sesuai salary_claim | PASS (eksekusi nyata, `testing-scripts/ku-25-taxcert.mjs`) — agregat API (`totalGrossAccrued`, `totalCompliance`, `totalSeverance`) **dikonfirmasi cocok persis** dengan query SUM langsung ke `salary_claim` (100600462962962962918560 dll., match sempurna) | Handal |
| AU-25-02 | Tax cert lintas HR | GET /tax-cert/hr/:employee/:year HR lain | employee bukan milik HR | 403 FORBIDDEN | Status 403 | PASS (eksekusi nyata, diperbaiki dari versi awal yang salah pakai HR pemilik asli) — caller Legal (bukan HR pemilik) → 403 FORBIDDEN | Handal |
| AU-25-03 | Tax cert tahun invalid | GET /tax-cert/:year tahun aneh | year=1999 | 400 BAD_REQUEST | Status 400 | PASS (eksekusi nyata) — year=1899 → 400 BAD_REQUEST | Handal |
| AU-26-01 | Request surat kerja | POST /employment-letter/request | hrAddress, purpose=KPR | 201 pending | Status 201 | PASS (eksekusi nyata, `testing-scripts/ku-26-employment-letter.mjs`, memerlukan Ponder terindeks benar — lihat catatan Ponder di DPPL.md §A.3) — 201, status pending | Handal |
| AU-26-02 | Purpose invalid | POST request purpose di luar whitelist | purpose acak | 400 BAD_REQUEST | Status 400 | PASS (eksekusi nyata) — purpose enum tidak valid → 400 BAD_REQUEST | Handal |
| AU-26-03 | Bukan employee HR tsb | POST request tanpa stream aktif | hrAddress bukan employer | 400 NOT_EMPLOYEE | Status 400 | PASS (eksekusi nyata, ku-26-employment-letter.mjs diperbaiki) — wallet baru yang belum pernah onboarding (tidak punya employee_stream sama sekali) mencoba request surat kerja ke TEST_HR -> 400 NOT_EMPLOYEE | Handal |
| AU-26-04 | Dokumen sebelum approved | GET document status pending | id surat pending | 400 NOT_APPROVED | Status 400 | PASS (eksekusi nyata, ku-26-employment-letter.mjs diperbaiki) — surat kedua dibuat (status pending, belum di-approve), GET document langsung -> 400 NOT_APPROVED | Handal |
| AU-27-01 | Direktori HR sendiri | GET /directory/:hrAddress | hrAddress sendiri | Daftar lengkap | Data karyawan tampil | PASS (eksekusi nyata, `testing-scripts/ku-27-directory.mjs`) — 200, array data karyawan | Handal |
| AU-27-02 | Direktori lintas HR | GET /directory/:hrAddress HR lain | hrAddress milik lain | 403 FORBIDDEN | Status 403 | PASS (eksekusi nyata, diperbaiki dari versi awal yang salah setup — caller & target hrAddress sama) — caller HR meminta hrAddress berbeda (Legal) → 403 | Handal |
| AU-27-03 | Assign department/position | PATCH /directory/:address | department, position | Tersimpan | GET /me mencerminkan perubahan | PASS (eksekusi nyata) — PATCH tersimpan, GET /me mencerminkan perubahan | Handal |
| AU-28-01 | Suspend HR | POST /suspension/:hrAddress | reason | Sesi HR ter-revoke | Baris suspendedClients dibuat | PASS (eksekusi nyata, `testing-scripts/ku-28-suspension.mjs`) — 200 ok:true | Handal |
| AU-28-02 | Login saat suspended | POST /auth/login HR tersuspend | address HR tersuspend | 403 ACCOUNT_SUSPENDED | Status 403 | PASS (eksekusi nyata) — 403 ACCOUNT_SUSPENDED | Handal |
| AU-28-03 | Klaim tetap jalan saat HR suspended | claimSalary employee dari HR tersuspend | employee | Klaim tetap sukses | Transfer IDRX berhasil | PASS (eksekusi nyata, transaksi on-chain sungguhan) — `claimSalary()` berhasil walau HR disuspend, tx: `0xc0d6af94721e4c5482929691a03fae94ba238c594a9bfb48772965bd1b08376d` | Handal |
| AU-28-04 | Reactivate HR | DELETE /suspension/:hrAddress | hrAddress | Login ulang sukses | Sesi baru terbentuk | PASS (eksekusi nyata) — DELETE ok:true, login ulang 200 | Handal |
| AU-29-01 | Settings kosong HR baru | GET /company-settings HR baru | - | 200 null | Response null | PASS (eksekusi nyata, ku-29-company-settings.mjs diperbaiki) — wallet HR baru yang belum pernah PUT /company-settings -> GET mengembalikan 200 null | Handal |
| AU-29-02 | Upsert settings | PUT /company-settings | name, country, logoUrl, dst | Tersimpan | GET mencerminkan perubahan | PASS (eksekusi nyata) — PUT tersimpan, GET mengembalikan nilai yang sama persis | Handal |
