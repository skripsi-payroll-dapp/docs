# PDHUPL v2 — Payana
## Perencanaan dan Deskripsi Hasil Uji Perangkat Lunak

> **Catatan:** Bab 1 (Pendahuluan) diisi manual oleh penulis, mengikuti konvensi dokumen v1.
> **Status dokumen:** Rebuild total Bab 3–5 dari audit kode nyata (bukan salinan pola contoh
> SIAP-Apotik, bukan salinan `PDHUPL_draft.md` lama). Lihat `PDHUPL_v2_GAP_SUMMARY.md` untuk
> daftar gap FR/implementasi dan perbandingan lengkap dengan draft v1 (55 butir uji lama).
> **Sumber acuan UC/FR:** `payroll-web3-saas/docs/SKPL.md` (UC-01 s.d. UC-20, FR-PAYANA-101
> s.d. FR-PAYANA-1105) — sudah direvisi Gen8 (Koperasi dihapus, diganti Mesin Pajak & Kasbon).
> Tujuh modul (Reimburse, Bounty, Notifikasi, Slip Gaji, Bukti Potong Pajak, Surat Keterangan
> Kerja, Direktori Karyawan) TIDAK punya UC/FR resmi di SKPL — kelas ujinya memakai identifikasi
> `[TIDAK ADA DI SKPL]`, bukan nomor UC/FR karangan.
> **Catatan kejujuran data:** Seluruh baris Bab 5 diberi status `[BELUM DIEKSEKUSI]`. Tidak ada
> satu pun hasil eksekusi yang diasumsikan atau dikarang dalam penyusunan dokumen ini.

---

## BAB 2 — LINGKUNGAN PENGUJIAN

### 2.1 Perangkat Lunak Pengujian

| Lapisan | Tools / Framework | Versi Terverifikasi di Lingkungan Ini | Keterangan |
|---|---|---|---|
| Smart Contract (Unit) | Foundry (`forge test`) | `forge 1.6.0-v1.7.0` | 6 file `*.t.sol` di `finley-payroll/test/`. Mencakup unit test dan fuzz test (`testFuzz_...`, default 256 runs). Belum ada file test khusus untuk fitur Kasbon (`requestAdvance`/`approveAdvance`/`rejectAdvance`) per audit sesi ini — `[PERLU DIKONFIRMASI]` apakah sudah ditambahkan setelah tanggal audit. |
| Backend API (Unit/Integration) | Belum ada test runner terpasang — direkomendasikan Vitest + Supertest | Node.js `v22.12.0` | `backend/package.json` tidak punya dependency test. |
| Frontend (Component/E2E) | Belum ada — direkomendasikan Playwright (E2E) + React Testing Library (komponen) | Next.js, React 19 | Login berbasis Privy (OTP email) membatasi otomasi E2E penuh. |
| Ponder Indexer | Belum ada | Ponder (lihat `ponder/package.json`) | — |
| Black Box (manual, System/Acceptance) | Browser manual + BaseScan explorer | Chrome/Firefox terbaru | — |
| Jaringan Blockchain Pengujian | Base Sepolia Testnet (Chain ID 84532) | — | Dipakai untuk pengujian UI karena Paymaster/ERC-4337 gasless dan Alchemy webhook bergantung pada infrastruktur testnet riil. |
| Toolchain Smart Contract | Solidity `0.8.26`, Foundry, OpenZeppelin v5 | Sesuai `finley-payroll/foundry.toml` | |

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
| Smart contract Base Sepolia (Gen8) | `PayrollFactory` `0xF62dF08b38c6Fbde33E24208BA044907475ca815`; `EmploymentSBT` `0x8dA9B60814536364daF77a82cb56B31226De4B62`; `MockIDRX` `0x0996e627cE22C4FE2D5c4788b159a83C065D6d09`; `ConfidentialCompanyVault` (demo) `0x4560968670Dd852dACd73c7B8748695eC427e203`. `EmployeeLiquidityContract` **tidak lagi dideploy** sejak Gen8. |
| Token uji | IDRX testnet via `MockIDRX` di atas. Tidak ada nilai ekonomi nyata. |
| Akun uji per peran | Owner SaaS = wallet `OWNER_ADDRESS`; HR Admin = wallet dengan `CompanyVault` terdaftar di `PayrollFactory.companyVaults`; Legal = wallet dengan `LEGAL_ROLE` (per Gen8, direpresentasikan sebagai domain HR Admin di level use-case, lihat SKPL.md UC-07); Karyawan = wallet dengan stream aktif di Ponder; Pengguna baru = wallet yang belum pernah login. |
| Data dummy karyawan | NIK 16 digit format `32xxxxxxxxxxxxxx` (contoh format, bukan NIK asli), nomor HP `08xxxxxxxxxx`, gaji bulanan contoh `5.000.000 IDRX`. |
| Test database | PostgreSQL 16 lokal (Docker) — schema `app` (backend, Drizzle) dan `public` (Ponder, Drizzle). |
| Foundry test fixtures | `finley-payroll/src/mocks/` (MockIDRX, mock Inco co-processor FHE). |

### 2.4 Sumber Daya Manusia

Pengujian dilakukan oleh satu orang (penulis Tugas Akhir), berperan rangkap Developer, Tester,
dan pemegang seluruh akun peran uji (Owner, HR, Legal, Karyawan) via beberapa wallet Privy/test
account berbeda. Pengujian akses-ganda/concurrent disimulasikan berurutan oleh satu orang.

### 2.5 Prosedur Umum Pengujian

1. `npm install` di `frontend/`, `backend/`, `ponder/`; `forge install` di `finley-payroll/`.
2. Setup `.env` di tiap workspace (RPC URL, deployer key, `OWNER_ADDRESS`, Pimlico API key,
   Privy App ID, alamat kontrak Gen8 dari 2.3 di atas).
3. `docker-compose up -d` di root (PostgreSQL). Unit test smart contract memakai EVM lokal
   in-memory Foundry, tidak menyentuh testnet.
4. `npm run db:migrate` di `backend/` dan `ponder/`.
5. `ponder dev` (port 42069), `npm run dev` di `backend/` (port 3001), `npm run dev` di
   `frontend/` (port 3000).
6. `cd finley-payroll && forge test` untuk automated test yang sudah ada.
7. Eksekusi butir uji manual sesuai Bab 4/5, login lewat `http://localhost:3000/login`.
8. Catat hasil: output `forge test`/`forge test --summary` untuk unit test; observasi UI +
   verifikasi transaksi BaseScan (`https://sepolia.basescan.org`) untuk butir uji manual.

---

## BAB 3 — IDENTIFIKASI DAN RENCANA PENGUJIAN

### 3.1 Tabel Identifikasi dan Rencana Pengujian

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
| KU-02 Registrasi & Profil | Submit registrasi company baru | UC-02 | FR-107,108,109 | AU-02-01 | System | Functional — Happy Path |
| KU-02 Registrasi & Profil | Submit registrasi employee dengan hrAddress | UC-02 | FR-107 | AU-02-02 | System | Functional — Happy Path |
| KU-02 Registrasi & Profil | NIK bukan 16 digit numerik ditolak | UC-01 | FR-104 | AU-02-03 | Unit | Functional — Validasi Input |
| KU-02 Registrasi & Profil | Owner approve registrasi company | UC-02 | FR-108 | AU-02-04 | System | Functional — Happy Path |
| KU-02 Registrasi & Profil | HR lain mencoba approve registrasi employee bukan miliknya | UC-02 | FR-108 | AU-02-05 | Integration | Security — Access Control |
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
| KU-05 Klaim Gaji EWA | [TEMUAN] Topic hash `SalaryClaimed` di webhook.ts tidak cocok signature 8-parameter Gen8 — WebSocket broadcast berpotensi tidak terpicu | UC-05 | FR-401 | AU-05-05 | Integration | Functional — Regresi (perlu verifikasi) |
| KU-06 Inisiasi PHK oleh HR | proposeTermination sukses, status menunggu Legal | UC-06 | FR-501,502 | AU-06-01 | Unit (Foundry) | Functional — Happy Path |
| KU-06 Inisiasi PHK oleh HR | Proposal ganda untuk employee yang sama | UC-06 | FR-501 | AU-06-02 | Unit (Foundry) | Functional — Negative |
| KU-06 Inisiasi PHK oleh HR | POST /termination/reason tersimpan bersamaan reasonHash on-chain | UC-06 | FR-501 | AU-06-03 | Integration | Functional — Happy Path |
| KU-07 Persetujuan PHK (mode Legal) | approveTermination → executeTermination sukses, severance cair, SBT dicabut | UC-07 | FR-503,504 | AU-07-01 | Unit (Foundry) | Functional — Happy Path |
| KU-07 Persetujuan PHK (mode Legal) | Proposal expired (>7 hari) ditolak | UC-07 | FR-503 | AU-07-02 | Unit (Foundry) | Functional — Negative |
| KU-07 Persetujuan PHK (mode Legal) | Wallet tanpa LEGAL_ROLE mencoba approve | UC-07 | FR-503 | AU-07-03 | Unit (Foundry) | Security — Access Control |
| KU-08 Resign Karyawan | resignEmployee sukses — stream stop, severance balik ke vault, SBT dicabut | UC-08 | FR-505 | AU-08-01 | Unit (Foundry) | Functional — Happy Path |
| KU-08 Resign Karyawan | Kasbon aktif dihapus tanpa penagihan saat resign (Gen8) | UC-08,UC-11 | FR-505,706 | AU-08-02 | Unit (Foundry) | Functional — Alternative Flow |
| KU-09 Grant Vesting Schedule | createCliffVest sukses, dana terkunci | UC-09 | FR-601 | AU-09-01 | Unit (Foundry) | Functional — Happy Path |
| KU-09 Grant Vesting Schedule | Saldo vault tidak cukup untuk vest | UC-09 | FR-601 | AU-09-02 | Unit (Foundry) | Functional — Negative |
| KU-09 Grant Vesting Schedule | cancelCliffVest sebelum matang | UC-09 | FR-602 | AU-09-03 | Unit (Foundry) | Functional — Happy Path |
| KU-10 Claim Vested Bonus | claimCliffVest setelah cliffTs — dana cair | UC-10 | FR-603 | AU-10-01 | Unit (Foundry) | Functional — Happy Path |
| KU-10 Claim Vested Bonus | claimCliffVest sebelum cliffTs → CliffNotReached | UC-10 | FR-603 | AU-10-02 | Unit (Foundry) | Functional — Negative |
| KU-10 Claim Vested Bonus | claimCliffVest dua kali → VestAlreadySettled | UC-10 | FR-603 | AU-10-03 | Unit (Foundry) | Functional — Negative |
| KU-10 Claim Vested Bonus | vestId tidak ada → VestNotFound | UC-10 | FR-603 | AU-10-04 | Unit (Foundry) | Functional — Negative |
| KU-11 Kasbon Karyawan | [TEMUAN] Ajukan kasbon dari `/employee/kasbon` — `requestAdvance()` dipanggil tanpa argumen `amount` | UC-11 | FR-704 | AU-11-01 | System (manual) | Functional — Defect (perlu verifikasi) |
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
| KU-17 Set Gaji Terenkripsi FHE | setEncryptedSalary sukses, ciphertext tersimpan | UC-17 | FR-1101 | AU-17-01 | Unit (Foundry, FHE) | Functional — Happy Path |
| KU-17 Set Gaji Terenkripsi FHE | Wallet tanpa HR_ROLE mencoba set gaji FHE | UC-17 | FR-1101 | AU-17-02 | Unit (Foundry) | Security — Access Control |
| KU-18 Lihat Gaji via Viewing Key | Karyawan dekripsi gaji sendiri via ACL | UC-18 | FR-1102 | AU-18-01 | System (manual) | Functional — Happy Path |
| KU-18 Lihat Gaji via Viewing Key | Belum pernah di-set HR → NoEncryptedSalarySet | UC-18 | FR-1102 | AU-18-02 | Unit (Foundry) | Functional — Negative |
| KU-19 Agregasi Payroll Homomorphic | aggregateTotalPayroll oleh HR sukses | UC-19 | FR-1103 | AU-19-01 | Unit (Foundry, FHE) | Functional — Happy Path |
| KU-19 Agregasi Payroll Homomorphic | grantViewingKey ke auditor, isAuditorActive true sebelum expiry | UC-19 | FR-1105 | AU-19-02 | Unit (Foundry) | Functional — Happy Path |
| KU-19 Agregasi Payroll Homomorphic | Akses auditor setelah expiresAt → AuditorAccessExpired | UC-19 | FR-1105 | AU-19-03 | Unit (Foundry) | Functional — Negative |
| KU-20 Konfigurasi & Klaim Platform Fee | setPlatformFee ≤ 100 bps sukses | UC-20 | FR-1006 | AU-20-01 | Unit (Foundry) | Functional — Happy Path |
| KU-20 Konfigurasi & Klaim Platform Fee | setPlatformFee > 100 bps → revert "FeeTooHigh" | UC-20 | FR-1006 | AU-20-02 | Unit (Foundry) | Functional — Negative |
| KU-20 Konfigurasi & Klaim Platform Fee | setProtocolTreasury alamat baru sukses | UC-20 | FR-1003 | AU-20-03 | Unit (Foundry) | Functional — Happy Path |
| KU-21 Reimburse Karyawan & HR [TIDAK ADA DI SKPL] | Submit klaim reimbursement sukses (status pending) | — | — | AU-21-01 | Integration | Functional — Happy Path |
| KU-21 Reimburse Karyawan & HR [TIDAK ADA DI SKPL] | Approve dengan txHash yang bukan transfer valid → 400 | — | — | AU-21-02 | Integration | Functional — Negative |
| KU-21 Reimburse Karyawan & HR [TIDAK ADA DI SKPL] | Approve oleh HR lain → 403 | — | — | AU-21-03 | Integration | Security — Access Control |
| KU-21 Reimburse Karyawan & HR [TIDAK ADA DI SKPL] | Approve klaim yang sudah direview → 409 | — | — | AU-21-04 | Integration | Functional — Negative |
| KU-22 Bounty & Tip [TIDAK ADA DI SKPL] | HR create bounty sukses | — | — | AU-22-01 | Integration | Functional — Happy Path |
| KU-22 Bounty & Tip [TIDAK ADA DI SKPL] | Claim bounty saat quota penuh → 409 QUOTA_REACHED | — | — | AU-22-02 | Integration | Functional — Negative |
| KU-22 Bounty & Tip [TIDAK ADA DI SKPL] | HR approve claim lalu record txHash pembayaran | — | — | AU-22-03 | Integration | Functional — Happy Path |
| KU-22 Bounty & Tip [TIDAK ADA DI SKPL] | Kirim tip peer-to-peer, tercatat di riwayat | — | — | AU-22-04 | Integration | Functional — Happy Path |
| KU-23 Notifikasi [TIDAK ADA DI SKPL] | GET /notifications daftar milik sendiri, terbaru dulu, maks 50 | — | — | AU-23-01 | Integration | Functional — Happy Path |
| KU-23 Notifikasi [TIDAK ADA DI SKPL] | Tandai notifikasi milik user lain sebagai read → 403 | — | — | AU-23-02 | Integration | Security — Access Control |
| KU-23 Notifikasi [TIDAK ADA DI SKPL] | PATCH read-all menandai semua terbaca | — | — | AU-23-03 | Integration | Functional — Happy Path |
| KU-24 Slip Gaji (Payslip) [TIDAK ADA DI SKPL] | GET /payslip/:claimId oleh employee/HR terkait — breakdown lengkap | — | — | AU-24-01 | Integration | Functional — Happy Path |
| KU-24 Slip Gaji (Payslip) [TIDAK ADA DI SKPL] | Diakses pihak tidak terkait klaim → 403 | — | — | AU-24-02 | Integration | Security — Access Control |
| KU-24 Slip Gaji (Payslip) [TIDAK ADA DI SKPL] | claimId tidak ditemukan → 404 | — | — | AU-24-03 | Integration | Functional — Negative |
| KU-25 Bukti Potong Pajak [TIDAK ADA DI SKPL] | GET /tax-cert/:year employee — agregasi tahunan benar | — | — | AU-25-01 | Integration | Functional — Happy Path |
| KU-25 Bukti Potong Pajak [TIDAK ADA DI SKPL] | GET /tax-cert/hr/:employee/:year oleh HR yang bukan pemilik vault | — | — | AU-25-02 | Integration | Security — Access Control |
| KU-25 Bukti Potong Pajak [TIDAK ADA DI SKPL] | Tahun di luar rentang valid (2020–2100) → 400 | — | — | AU-25-03 | Unit | Functional — Validasi Input |
| KU-26 Surat Keterangan Kerja [TIDAK ADA DI SKPL] | Request dengan purpose valid → 201 | — | — | AU-26-01 | Integration | Functional — Happy Path |
| KU-26 Surat Keterangan Kerja [TIDAK ADA DI SKPL] | purpose di luar whitelist → 400 | — | — | AU-26-02 | Unit | Functional — Validasi Input |
| KU-26 Surat Keterangan Kerja [TIDAK ADA DI SKPL] | Employee tanpa stream aktif di HR tsb mengajukan → 400 NOT_EMPLOYEE | — | — | AU-26-03 | Integration | Functional — Negative |
| KU-26 Surat Keterangan Kerja [TIDAK ADA DI SKPL] | GET document sebelum approved → 400 NOT_APPROVED | — | — | AU-26-04 | Integration | Functional — Negative |
| KU-27 Direktori Karyawan [TIDAK ADA DI SKPL] | GET /directory/:hrAddress oleh HR sendiri — daftar lengkap | — | — | AU-27-01 | Integration | Functional — Happy Path |
| KU-27 Direktori Karyawan [TIDAK ADA DI SKPL] | Diakses HR lain → 403 | — | — | AU-27-02 | Integration | Security — Access Control |
| KU-27 Direktori Karyawan [TIDAK ADA DI SKPL] | PATCH assign department/position sukses | — | — | AU-27-03 | Integration | Functional — Happy Path |
| KU-28 Penangguhan Akses Klien | Owner suspend HR — sesi aktif langsung ter-revoke | — (FR-1005 ada, UC tidak ada) | FR-1005 | AU-28-01 | Integration | Functional — Happy Path |
| KU-28 Penangguhan Akses Klien | HR yang disuspend login ulang → 403 ACCOUNT_SUSPENDED | — | FR-1005 | AU-28-02 | Integration | Functional — Negative |
| KU-28 Penangguhan Akses Klien | Karyawan tetap bisa claimSalary meski HR-nya disuspend | — | FR-1005 | AU-28-03 | System (manual) | Functional — Konsistensi On-chain/Off-chain |
| KU-28 Penangguhan Akses Klien | Owner reactivate — HR login ulang sukses dari nol | — | FR-1005 | AU-28-04 | Integration | Functional — Happy Path |
| KU-29 Pengaturan Perusahaan [TIDAK ADA DI SKPL] | GET /company-settings mengembalikan null untuk HR baru | — | — | AU-29-01 | Integration | Functional — Happy Path |
| KU-29 Pengaturan Perusahaan [TIDAK ADA DI SKPL] | PUT /company-settings upsert branding tersimpan | — | — | AU-29-02 | Integration | Functional — Happy Path |

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
**Antarmuka:** `POST /registration/request`, `GET /registration/status/:address`, `PATCH /registration/:address/approve`, `POST /auth/profile` (`backend/src/routes/registration.ts`, `auth.ts`); halaman `/onboarding`.
- **AU-02-01** — Input: `{address, type:"company", npwp, nib, directorName, directorNik, deedUrl}`. Harapan: `200 {ok:true}`, status `pending` di `pendingRegistrations`.
- **AU-02-02** — Input: `{address, type:"employee", hrAddress}`. Harapan: `200 {ok:true}`, muncul di `GET /registration/pending/hr/:hrAddress` milik HR terkait.
- **AU-02-03** — Input: `POST /auth/profile` dengan `nik` bukan 16 digit numerik (mis. `"12345"`). Harapan: `400 BAD_REQUEST`, "NIK must be exactly 16 digits".
- **AU-02-04** — Input: Owner memanggil `PATCH /registration/:address/approve` untuk registrasi `type:"company"`. Harapan: status berubah `approved`.
- **AU-02-05** — Input: HR B memanggil `PATCH /registration/:address/approve` untuk registrasi employee milik HR A. Harapan: `403 Forbidden`.

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
- **AU-05-05** — Input: kirim event `SalaryClaimed` on-chain nyata (via klaim sungguhan), amati apakah `POST /webhook/alchemy` mengenali `topics[0]`-nya dan men-trigger broadcast WebSocket `SALARY_CLAIMED`. Harapan (per SKPL): broadcast terjadi. **Risiko nyata dari audit kode:** topic hash yang dihitung `webhook.ts` (7 parameter) tidak cocok signature aktual (8 parameter, ada `kasbonRepaid`) — kemungkinan besar broadcast TIDAK terjadi. Wajib dieksekusi nyata untuk konfirmasi, jangan diasumsikan gagal tanpa bukti.

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
- **AU-08-02** — Input: `resignEmployee(employee)` untuk employee dengan `salaryAdvances[employee].status == Active`. Harapan: `delete salaryAdvances[employee]` tanpa penagihan sisa kasbon (bad debt sesuai desain Gen8), pesangon tetap utuh.

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
- **AU-11-01** — Input: klik tombol ajukan kasbon di `/employee/kasbon` (form hanya punya field `note`, tidak ada input jumlah kasbon eksplisit). **[PERLU DIKONFIRMASI melalui eksekusi nyata]** — kode `useRequestAdvance` (`frontend/src/application/mutations/useKasbonActions.ts:15-19`) memanggil kontrak dengan `functionName: "requestAdvance", args: []`, padahal signature kontrak mensyaratkan `amount: uint256`. Harapan menurut SKPL FR-704: kasbon senilai jumlah yang diminta karyawan (≤80% gaji bulanan) berhasil diajukan. Hasil aktual perlu diverifikasi: kemungkinan transaksi gagal di tahap encoding viem sebelum sempat ditandatangani, atau — bila viem tetap mengirim dengan nilai default — kasbon senilai 0 IDRX yang tercatat.
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

### KU-17 — Set Gaji Terenkripsi (FHE)
**Antarmuka:** `setEncryptedSalary(employee, ciphertext)` pada `ConfidentialCompanyVault.sol` (hook `useSetEncryptedSalary.ts`); halaman `hr/employees/[id]`.
- **AU-17-01** — Input: HR mengisi form gaji dan submit, ciphertext dibuat via Inco client-side lalu dikirim `setEncryptedSalary`. Harapan: `hasEncryptedSalary[employee] = true`, event `EncryptedSalarySet`.
- **AU-17-02** — Input: wallet tanpa `HR_ROLE` memanggil `setEncryptedSalary`. Harapan: revert (modifier `onlyHR`).

### KU-18 — Lihat Gaji via Viewing Key
**Antarmuka:** `getEncryptedSalary(employee)`; halaman `/employee/settings`.
- **AU-18-01** — Input: karyawan dengan `hasEncryptedSalary=true` membuka halaman dekripsi gaji. Harapan: nilai gaji plaintext berhasil didekripsi client-side via ACL viewing key.
- **AU-18-02** — Input: karyawan yang gajinya belum pernah di-set HR memanggil `getEncryptedSalary`. Harapan: revert `NoEncryptedSalarySet`.

### KU-19 — Agregasi Payroll Homomorphic
**Antarmuka:** `aggregateTotalPayroll()`, `grantViewingKey(auditor, expiresAt, startIdx, batchSize)`, `isAuditorActive(auditor)`; halaman `/hr/employees/[id]` atau `/hr/vault` (auditor grant UI, hook `useAuditorActions.ts`).
- **AU-19-01** — Input: HR memanggil `aggregateTotalPayroll()`. Harapan: total payroll terenkripsi (homomorfik) berhasil dihitung tanpa mendekripsi nilai individual.
- **AU-19-02** — Input: `grantViewingKey(auditor, futureTs, 0, 200)`. Harapan: `isAuditorActive(auditor) == true` sebelum `expiresAt`.
- **AU-19-03** — Input: `isAuditorActive(auditor)` dipanggil setelah `block.timestamp >= expiresAt`. Harapan: mengembalikan `false` (revert `AuditorAccessExpired` bila dipakai di jalur yang mensyaratkan aktif).

### KU-20 — Konfigurasi & Klaim Platform Fee
**Antarmuka:** `setPlatformFee(bps)`, `setProtocolTreasury(newTreasury)` pada `PayrollFactory.sol`; halaman `/owner/fees`.
- **AU-20-01** — Input: `setPlatformFee(50)` (0,5%) oleh `SUPERADMIN_ROLE`. Harapan: `platformFeeBps = 50`, event `PlatformFeeUpdated`.
- **AU-20-02** — Input: `setPlatformFee(150)` (>1%). Harapan: revert `"FeeTooHigh"`.
- **AU-20-03** — Input: `setProtocolTreasury(0xNewTreasury)`. Harapan: `protocolTreasury` ter-update, event `ProtocolTreasuryUpdated`.

### KU-21 — Reimburse Karyawan & HR `[TIDAK ADA DI SKPL]`
**Antarmuka:** `POST /reimburse`, `PATCH /reimburse/:id/approve|reject` (`backend/src/routes/reimburse.ts`); halaman `/employee/reimburse`, `/hr/reimburse`.
- **AU-21-01** — Input: `{hrAddress, category, amount, description}`. Harapan: `200`, klaim tersimpan status `pending`.
- **AU-21-02** — Input: `PATCH /reimburse/:id/approve {txHash}` dengan `txHash` yang bukan transfer IDRX sejumlah `amount` ke `employeeAddress` (diverifikasi `verifyIdrxTransfer`). Harapan: `400 TRANSFER_NOT_VERIFIED`.
- **AU-21-03** — Input: HR B approve klaim milik karyawan HR A. Harapan: `403 FORBIDDEN`.
- **AU-21-04** — Input: approve klaim yang `status` sudah bukan `pending`. Harapan: `409 ALREADY_REVIEWED`.

### KU-22 — Bounty & Tip `[TIDAK ADA DI SKPL]`
**Antarmuka:** `POST /bounty`, `POST /bounty/:id/claim`, `PATCH /bounty/claim/:id/approve|reject|paid`, `POST /bounty/tip` (`backend/src/routes/bounty.ts`); halaman `/employee/bounty`, `/hr/bounty`.
- **AU-22-01** — Input: `{title, description, rewardIdrx, quota}`. Harapan: `200`, bounty tersimpan status `open`.
- **AU-22-02** — Input: `POST /bounty/:id/claim` saat `claimedCount >= quota`. Harapan: `409 QUOTA_REACHED`.
- **AU-22-03** — Input: `PATCH /bounty/claim/:id/paid {txHash}` dengan transfer IDRX terverifikasi sejumlah `rewardIdrx`. Harapan: status `paid`, `paidTxHash` tersimpan.
- **AU-22-04** — Input: `POST /bounty/tip {toAddress, amount, txHash}`. Harapan: tercatat, muncul di `GET /bounty/tips/:address` untuk pengirim maupun penerima.

### KU-23 — Notifikasi `[TIDAK ADA DI SKPL]`
**Antarmuka:** `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` (`backend/src/routes/notifications.ts`); halaman `/employee/notifications`.
- **AU-23-01** — Input: `GET /notifications` oleh user dengan >50 notifikasi. Harapan: hanya 50 terbaru, urut `createdAt` desc.
- **AU-23-02** — Input: `PATCH /notifications/:id/read` untuk `id` milik `recipientAddress` lain. Harapan: `403 FORBIDDEN`.
- **AU-23-03** — Input: `PATCH /notifications/read-all`. Harapan: seluruh notifikasi milik caller `read = true`.

### KU-24 — Slip Gaji (Payslip) `[TIDAK ADA DI SKPL]`
**Antarmuka:** `GET /payslip/:claimId` (`backend/src/routes/payslip.ts`); halaman `/employee/payslip`.
- **AU-24-01** — Input: `claimId` valid milik employee yang login (atau HR-nya). Harapan: breakdown `grossAccrued`/`platformFee`/`kasbonRepaid`/`taxAndBpjs`/`severance`/`netToEmployee` sesuai `salary_claim` Ponder.
- **AU-24-02** — Input: `claimId` valid tapi caller bukan employee maupun HR terkait. Harapan: `403 FORBIDDEN`.
- **AU-24-03** — Input: `claimId` yang tidak ada di `salary_claim`. Harapan: `404 NOT_FOUND`.

### KU-25 — Bukti Potong Pajak (Tax Cert) `[TIDAK ADA DI SKPL]`
**Antarmuka:** `GET /tax-cert/:year`, `GET /tax-cert/hr/:employee/:year` (`backend/src/routes/taxcert.ts`); halaman `/employee/tax-cert`.
- **AU-25-01** — Input: `GET /tax-cert/2026` oleh employee. Harapan: agregat tahunan `totalGrossAccrued`/`totalCompliance`/`totalSeverance`/`totalNet` + breakdown bulanan.
- **AU-25-02** — Input: `GET /tax-cert/hr/:employee/2026` oleh HR yang bukan `hr_authority` employee tsb di `salary_claim`. Harapan: `403 FORBIDDEN`.
- **AU-25-03** — Input: `:year` = `1999` atau `2200`. Harapan: `400 BAD_REQUEST`, "Invalid year".

### KU-26 — Surat Keterangan Kerja `[TIDAK ADA DI SKPL]`
**Antarmuka:** `POST /employment-letter/request`, `PATCH /employment-letter/:id/approve|reject`, `GET /employment-letter/:id/document` (`backend/src/routes/employmentLetter.ts`); halaman `/employee/employment-letter`, `/hr/employment-letters`.
- **AU-26-01** — Input: `{hrAddress, purpose:"KPR"}`. Harapan: `201`, status `pending`.
- **AU-26-02** — Input: `purpose:"Lainnya123"` (di luar whitelist `KPR|Kredit|Visa|Umum|Lainnya`). Harapan: `400 BAD_REQUEST`.
- **AU-26-03** — Input: karyawan tanpa `employee_stream` berstatus `Active` di bawah `hrAddress` tsb. Harapan: `400 NOT_EMPLOYEE`.
- **AU-26-04** — Input: `GET /employment-letter/:id/document` untuk surat yang `status` masih `pending`. Harapan: `400 NOT_APPROVED`.

### KU-27 — Direktori Karyawan `[TIDAK ADA DI SKPL]`
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

### KU-29 — Pengaturan Perusahaan `[TIDAK ADA DI SKPL]`
**Antarmuka:** `GET|PUT /company-settings` (`backend/src/routes/companySettings.ts`); halaman `/hr/settings`.
- **AU-29-01** — Input: `GET /company-settings` oleh HR yang belum pernah menyimpan setting. Harapan: `200 null`.
- **AU-29-02** — Input: `PUT /company-settings {name, country, logoUrl, ewaLimitBps, yieldRateBps, legalAddress}`. Harapan: tersimpan (insert atau update), terbaca kembali via `GET`.

---

## BAB 5 — HASIL PENGUJIAN

> Seluruh baris berstatus `[BELUM DIEKSEKUSI]`. Kolom "Prosedur Pengujian", "Masukan", dan
> "Keluaran yang Diharapkan" merangkum Bab 4; kolom "Hasil yang Didapat" dan "Kesimpulan" WAJIB
> diisi manual oleh penulis setelah eksekusi nyata (`forge test` untuk butir Unit (Foundry),
> observasi UI + BaseScan untuk butir System/Integration manual).

| Identifikasi | Deskripsi Singkat | Prosedur Pengujian | Masukan | Keluaran yang Diharapkan | Kriteria Evaluasi Hasil | Hasil yang Didapat | Kesimpulan |
|---|---|---|---|---|---|---|---|
| AU-01-01 | Login sukses | Kirim POST /auth/login dengan signature valid | address, message, signature | 200 + tokens, redirect sesuai role | Status 200 dan redirect benar | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-01-02 | Signature invalid | Kirim POST /auth/login dengan signature rusak | signature acak | 401 UNAUTHORIZED | Status 401 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-01-03 | Timestamp expired | Kirim message dengan Timestamp lampau | message dengan Timestamp -10 menit | 401, pesan kedaluwarsa | Status 401 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-01-04 | Refresh token revoked | Logout lalu pakai refreshToken lama | refreshToken pasca logout | 401 session revoked | Status 401 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-01-05 | Login saat disuspend | Owner suspend HR, HR login | address HR tersuspend | 403 ACCOUNT_SUSPENDED | Status 403 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-02-01 | Registrasi company | POST /registration/request type=company | data perusahaan lengkap | 200 ok, status pending | Baris pendingRegistrations dibuat | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-02-02 | Registrasi employee | POST /registration/request type=employee | address, hrAddress | 200 ok, muncul di pending/hr/:hr | Baris pendingRegistrations dibuat | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-02-03 | NIK invalid | POST /auth/profile dengan nik salah format | nik="12345" | 400 BAD_REQUEST | Status 400 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-02-04 | Approve company | Owner approve registrasi | address company | status approved | Status terupdate | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-02-05 | Approve lintas HR ditolak | HR B approve punya HR A | address employee HR A | 403 Forbidden | Status 403 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-03-01 | fundVault sukses | approve + fundVault | amountWei | vaultBalance bertambah | Selisih saldo sesuai amount | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-03-02 | withdraw melebihi saldo | withdrawVault amount besar | amount > vaultBalance | revert InsufficientVaultBalance | Transaksi revert | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-03-03 | setCompanyConfig | setCompanyConfig bpjs/pph21/threshold | 400,0,1000 | Nilai konfigurasi ter-update | Getter mengembalikan nilai baru | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-03-04 | pauseVault blokir klaim | pauseVault lalu claimSalary | - | Klaim ditolak | Transaksi revert/ditolak | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-04-01 | startStream sukses | startStream employee baru | employee, flowRate, 200 | Stream Active + SBT minted | Status Active, tokenId>0 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-04-02 | startStream duplikat | startStream employee sudah Active | employee sama | revert StreamAlreadyActive | Transaksi revert | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-04-03 | pause/resume stream | pauseStream lalu resumeStream | employee | settledBalance disettle benar | Tidak ada akumulasi ganda | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-04-04 | startStream tanpa HR_ROLE | startStream wallet non-HR | wallet acak | revert Unauthorized | Transaksi revert | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-05-01 | Klaim sukses tanpa kasbon | claimSalary tanpa advance aktif | - | Split fee/tax/severance benar | Event SalaryClaimed+TaxWithheld sesuai formula | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-05-02 | Klaim dengan kasbon aktif | claimSalary saat advance Active | - | Potongan cicilan 20% | Event AdvanceRepaid sesuai formula | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-05-03 | Klaim tanpa saldo akrual | claimSalary saat accrued=0 | - | revert NothingToClaim | Transaksi revert | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-05-04 | Rate limit klaim | 11x POST /bundler/relay dalam 1 jam | userOp x11 | Request ke-11 ditolak | Status 429 pada request ke-11 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-05-05 | Webhook topic hash SalaryClaimed | Klaim nyata + amati webhook | event on-chain nyata | Broadcast WS SALARY_CLAIMED terjadi | WS message diterima frontend | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-06-01 | proposeTermination sukses | proposeTermination | employee, reasonHash | Proposal tersimpan, expiresAt +7 hari | Event TerminationProposed | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-06-02 | Proposal ganda | proposeTermination employee sudah ada proposal | employee sama | revert TerminationAlreadyProposed | Transaksi revert | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-06-03 | Simpan alasan PHK | POST /termination/reason | employeeAddress, reason | Reason tersimpan & terbaca | GET reason mengembalikan data sama | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-07-01 | Approve+execute PHK | approveTermination lalu executeTermination | employee | Severance cair, SBT dicabut | Event TerminationExecuted | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-07-02 | Proposal expired | approve/execute setelah 7 hari | employee | revert ProposalExpired | Transaksi revert | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-07-03 | Approve tanpa LEGAL_ROLE | approveTermination wallet non-legal | wallet acak | revert Unauthorized | Transaksi revert | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-08-01 | Resign sukses | resignEmployee | employee | Stream stop, severance kembali, SBT dicabut | State sesuai harapan | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-08-02 | Resign dengan kasbon aktif | resignEmployee saat advance Active | employee | Kasbon dihapus tanpa tagihan | salaryAdvances[employee] terhapus | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-09-01 | createCliffVest sukses | createCliffVest | employee, amount, cliffTs, type | Dana terkunci, event CliffVestCreated | Vault balance berkurang sesuai | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-09-02 | createCliffVest saldo kurang | createCliffVest amount > vaultBalance | amount besar | revert InsufficientVaultBalance | Transaksi revert | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-09-03 | cancelCliffVest | cancelCliffVest sebelum cliffTs | employee, vestId | Status Forfeited, dana kembali | Vault balance bertambah kembali | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-10-01 | claimCliffVest sukses | claimCliffVest setelah cliffTs | vestId | Dana cair ke karyawan | Transfer sesuai amount | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-10-02 | claimCliffVest sebelum cliff | claimCliffVest sebelum cliffTs | vestId | revert CliffNotReached | Transaksi revert | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-10-03 | claimCliffVest dua kali | claimCliffVest vest sudah settled | vestId sudah diklaim | revert VestAlreadySettled | Transaksi revert | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-10-04 | vestId tidak ada | claimCliffVest vestId invalid | vestId acak | revert VestNotFound | Transaksi revert | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-11-01 | Ajukan kasbon dari UI | Klik ajukan kasbon di /employee/kasbon | note (tanpa amount eksplisit) | Kasbon senilai jumlah dimaksud tersimpan Pending | Verifikasi amount on-chain sesuai yang dimaksud pengguna | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-11-02 | Kasbon melebihi limit | requestAdvance amount > 80% gaji | amount besar | revert AdvanceAmountTooHigh | Transaksi revert | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-11-03 | Kasbon ganda | requestAdvance saat masih Pending/Active | amount baru | revert AdvancePendingExists/ActiveAdvanceExists | Transaksi revert | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-12-01 | approveAdvance sukses | approveAdvance | employee | Dana masuk wallet karyawan, status Active | Event AdvanceApproved | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-12-02 | approveAdvance saldo kurang | approveAdvance vaultBalance kurang | employee | revert InsufficientVaultBalance | Transaksi revert | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-12-03 | rejectAdvance sukses | rejectAdvance | employee | Status kembali None, event AdvanceRejected | Karyawan bisa ajukan ulang | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-13-01 | Ringkasan kepatuhan | GET /compliance/summary/:hr | hr, month | Agregat benar | Nilai sesuai salary_claim | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-13-02 | Export tanpa data | GET /compliance/export/:hr bulan kosong | hr, month kosong | 404 NOT_FOUND | Status 404 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-13-03 | Export lintas HR ditolak | GET /compliance/export/:hr HR lain | hr milik HR lain | 403 FORBIDDEN | Status 403 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-13-04 | Rekonsiliasi tersimpan | POST /compliance/reconciliation/:hr | month, bpjsPaid, pph21Paid | Tersimpan & terbaca | GET mengembalikan data sama | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-14-01 | Verifikasi SBT aktif | Buka /verify wallet aktif | address karyawan aktif | Status aktif tampil | Data sesuai employmentRecords | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-14-02 | Verifikasi tanpa SBT | Buka /verify wallet tanpa SBT | address acak | Status tidak ditemukan | Pesan sesuai | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-14-03 | Transfer SBT ditolak | transferFrom langsung | tokenId aktif | revert SoulboundTransferNotAllowed | Transaksi revert | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-15-01 | deployVault sukses | deployVault Owner | hrAuthority baru | Vault baru terdeploy | Event VaultDeployed | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-15-02 | deployVault duplikat | deployVault HR sudah punya vault | hrAuthority sama | revert HRAlreadyHasVault | Transaksi revert | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-15-03 | deployVault tanpa izin | deployVault wallet bukan HR/SuperAdmin | wallet acak | revert OnlyHRorSuperAdmin | Transaksi revert | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-16-01 | Dashboard vault benar | Buka /hr/vault | hrAddress | Saldo & burn rate sesuai | Nilai cocok data on-chain | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-16-02 | Banner Frozen | Buka /hr/vault vault Frozen | hrAddress vault frozen | Banner tampil | Banner terlihat, aksi tulis nonaktif | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-17-01 | setEncryptedSalary sukses | setEncryptedSalary | employee, ciphertext | hasEncryptedSalary true | Event EncryptedSalarySet | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-17-02 | setEncryptedSalary tanpa izin | setEncryptedSalary wallet non-HR | wallet acak | revert (onlyHR) | Transaksi revert | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-18-01 | Dekripsi gaji sendiri | Buka /employee/settings | employee dengan gaji ter-set | Gaji plaintext tampil | Nilai sesuai ciphertext | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-18-02 | Gaji belum di-set | getEncryptedSalary belum pernah diset | employee baru | revert NoEncryptedSalarySet | Transaksi revert | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-19-01 | Agregasi payroll | aggregateTotalPayroll | - | Total terhitung homomorfik | Nilai agregat valid | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-19-02 | Grant viewing key | grantViewingKey auditor | auditor, expiresAt | isAuditorActive true | Return true sebelum expiry | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-19-03 | Viewing key expired | isAuditorActive setelah expiry | auditor, waktu lewat | Return false/revert | AuditorAccessExpired | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-20-01 | setPlatformFee sukses | setPlatformFee 50 | bps=50 | platformFeeBps=50 | Event PlatformFeeUpdated | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-20-02 | setPlatformFee melebihi batas | setPlatformFee 150 | bps=150 | revert FeeTooHigh | Transaksi revert | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-20-03 | setProtocolTreasury | setProtocolTreasury alamat baru | newTreasury | Treasury ter-update | Event ProtocolTreasuryUpdated | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-21-01 | Submit reimburse | POST /reimburse | hrAddress, category, amount, description | Klaim pending tersimpan | Status 200, status pending | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-21-02 | Approve txHash tidak valid | PATCH /reimburse/:id/approve | txHash palsu | 400 TRANSFER_NOT_VERIFIED | Status 400 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-21-03 | Approve lintas HR | PATCH approve klaim HR lain | id klaim HR lain | 403 FORBIDDEN | Status 403 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-21-04 | Approve klaim sudah direview | PATCH approve klaim sudah approved | id klaim reviewed | 409 ALREADY_REVIEWED | Status 409 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-22-01 | Create bounty | POST /bounty | title, description, rewardIdrx, quota | Bounty open tersimpan | Status 200 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-22-02 | Claim quota penuh | POST /bounty/:id/claim quota habis | bountyId penuh | 409 QUOTA_REACHED | Status 409 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-22-03 | Bayar bounty claim | PATCH /bounty/claim/:id/paid | txHash valid | Status paid | paidTxHash tersimpan | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-22-04 | Kirim tip | POST /bounty/tip | toAddress, amount, txHash | Tip tercatat | Muncul di riwayat kedua pihak | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-23-01 | Daftar notifikasi | GET /notifications | - | Maks 50, terbaru dulu | Urutan & jumlah sesuai | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-23-02 | Read notifikasi lintas user | PATCH /notifications/:id/read milik lain | id milik user lain | 403 FORBIDDEN | Status 403 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-23-03 | Read-all | PATCH /notifications/read-all | - | Semua read=true | Semua notifikasi terbaca | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-24-01 | Lihat payslip | GET /payslip/:claimId | claimId valid | Breakdown lengkap | Nilai sesuai salary_claim | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-24-02 | Payslip akses tidak sah | GET /payslip/:claimId pihak lain | claimId, caller tidak terkait | 403 FORBIDDEN | Status 403 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-24-03 | Payslip tidak ditemukan | GET /payslip/:claimId invalid | claimId acak | 404 NOT_FOUND | Status 404 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-25-01 | Tax cert tahunan | GET /tax-cert/:year | year=2026 | Agregat tahunan benar | Nilai sesuai salary_claim | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-25-02 | Tax cert lintas HR | GET /tax-cert/hr/:employee/:year HR lain | employee bukan milik HR | 403 FORBIDDEN | Status 403 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-25-03 | Tax cert tahun invalid | GET /tax-cert/:year tahun aneh | year=1999 | 400 BAD_REQUEST | Status 400 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-26-01 | Request surat kerja | POST /employment-letter/request | hrAddress, purpose=KPR | 201 pending | Status 201 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-26-02 | Purpose invalid | POST request purpose di luar whitelist | purpose acak | 400 BAD_REQUEST | Status 400 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-26-03 | Bukan employee HR tsb | POST request tanpa stream aktif | hrAddress bukan employer | 400 NOT_EMPLOYEE | Status 400 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-26-04 | Dokumen sebelum approved | GET document status pending | id surat pending | 400 NOT_APPROVED | Status 400 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-27-01 | Direktori HR sendiri | GET /directory/:hrAddress | hrAddress sendiri | Daftar lengkap | Data karyawan tampil | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-27-02 | Direktori lintas HR | GET /directory/:hrAddress HR lain | hrAddress milik lain | 403 FORBIDDEN | Status 403 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-27-03 | Assign department/position | PATCH /directory/:address | department, position | Tersimpan | GET /me mencerminkan perubahan | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-28-01 | Suspend HR | POST /suspension/:hrAddress | reason | Sesi HR ter-revoke | Baris suspendedClients dibuat | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-28-02 | Login saat suspended | POST /auth/login HR tersuspend | address HR tersuspend | 403 ACCOUNT_SUSPENDED | Status 403 | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-28-03 | Klaim tetap jalan saat HR suspended | claimSalary employee dari HR tersuspend | employee | Klaim tetap sukses | Transfer IDRX berhasil | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-28-04 | Reactivate HR | DELETE /suspension/:hrAddress | hrAddress | Login ulang sukses | Sesi baru terbentuk | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-29-01 | Settings kosong HR baru | GET /company-settings HR baru | - | 200 null | Response null | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
| AU-29-02 | Upsert settings | PUT /company-settings | name, country, logoUrl, dst | Tersimpan | GET mencerminkan perubahan | [BELUM DIEKSEKUSI] | [BELUM DIEKSEKUSI] |
