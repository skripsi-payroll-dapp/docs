# PDHUPL — Payana
## Perencanaan dan Deskripsi Hasil Uji Perangkat Lunak

> **Catatan:** Bab 1 (Pendahuluan) diisi manual oleh penulis. Dokumen ini mulai dari Bab 2.
> **Tanggal penyusunan draft:** 19 Juni 2026
> **Sumber acuan UC:** `payroll-web3-saas/docs/SKPL.md` (UC-01 s.d. UC-20, dipetakan ke FR-PAYANA-xxx), narasi alur diperkaya dari `payroll-web3-saas/docs/use-case-descriptions.md` untuk use case yang overlap (UC-01 s.d. UC-08/UC-09).
> **Catatan kejujuran data:** Setiap baris di Bab 5 mencantumkan dengan jelas apakah hasil berasal dari eksekusi nyata (`forge test` di repo ini, dijalankan 19 Juni 2026) atau merupakan prosedur yang **belum dieksekusi** dan menunggu pengujian manual oleh penulis (karena membutuhkan wallet, OTP email Privy, atau testnet Base Sepolia yang tidak dapat diakses oleh asisten otomatis). Tidak ada baris yang diisi dengan data dummy/asumsi.

---

## BAB 2 — LINGKUNGAN PENGUJIAN

### 2.1 Perangkat Lunak Pengujian

| Lapisan | Tools / Framework | Versi Terverifikasi di Lingkungan Ini | Keterangan |
|---|---|---|---|
| Smart Contract (Unit) | Foundry (`forge test`) | `forge 1.6.0-v1.7.0` (terpasang di `~/.foundry/bin`) | Satu-satunya automated test suite yang sudah ada di repo. 6 file `*.t.sol` di `finley-payroll/test/`. Mencakup unit test dan **fuzz test** (`testFuzz_...`, default 256 runs/case) — fuzz test inilah yang dipakai sebagai dasar Stress Testing kelas KU-21. |
| Backend API (Unit/Integration) | **Belum ada** — direkomendasikan **Vitest** + **Supertest** | Node.js `v22.12.0` terpasang | `backend/package.json` tidak punya dependency/test script apa pun saat ini. Direkomendasikan untuk fungsi murni (validasi NIK/format registrasi, kalkulasi BPS) tanpa perlu koneksi DB nyata. |
| Frontend (Component/E2E) | **Belum ada** — direkomendasikan **Playwright** untuk E2E, **React Testing Library** untuk komponen | Next.js `16.2.6`, React 19 | Tidak ada test runner terpasang di `frontend/package.json`. Login berbasis Privy (OTP email) membatasi otomasi E2E penuh — lihat 2.4. |
| Ponder Indexer | **Belum ada** | Ponder (lihat `ponder/package.json`) | Tidak ada test script. |
| Black Box (manual, System/Acceptance) | Browser manual + BaseScan explorer | Chrome/Firefox versi terbaru | Mengikuti metodologi yang sudah dirintis di `payroll-web3-saas/black-box-testing.md` (33 TC, status masih `⏳ Pending` per dokumen tersebut). |
| Jaringan Blockchain Pengujian | **Base Sepolia Testnet** (Chain ID 84532) | — | Dipakai untuk seluruh pengujian fungsional UI karena beberapa fitur (Paymaster/ERC-4337 gasless, Alchemy webhook) bergantung pada infrastruktur testnet riil, tidak feasible disimulasikan penuh di local Anvil node untuk pengujian end-to-end. Untuk unit test smart contract murni, Foundry menggunakan EVM lokal in-memory (tidak menyentuh testnet). |
| Toolchain Smart Contract | Solidity `0.8.26`, Foundry, OpenZeppelin | Sesuai `finley-payroll/foundry.toml` | |

### 2.2 Perangkat Keras Pengujian

Spesifikasi minimum realistis untuk menjalankan dev server (frontend + backend + ponder) bersamaan dengan node EVM lokal Foundry:

| Komponen | Spesifikasi Minimum |
|---|---|
| Processor | 4 core (mendukung kompilasi Solidity + 3 proses Node.js paralel: frontend, backend, ponder) |
| RAM | 8 GB (16 GB direkomendasikan agar Next.js dev server + Postgres Docker + Ponder tidak saling swap) |
| Storage | 10 GB free space (node_modules tiga workspace + Foundry cache + Postgres data volume) |
| Koneksi Internet | Stabil, untuk akses RPC Base Sepolia (Alchemy), Privy auth service, dan faucet IDRX testnet |
| Sistem Operasi | Windows 11 / Linux / macOS — diuji pada Windows 11 (lingkungan penyusunan dokumen ini) |

### 2.3 Material Pengujian

| Material | Detail Konkret |
|---|---|
| Smart contract Base Sepolia | `PayrollFactory` `0x1B5A705Cb11BAF5798DC78fE27b8686C8c986BdF`; `EmployeeLiquidityContract` `0xd9cd18C33Ef3922810bD1b43B4F09693399d14a9`; `EmploymentSBT` `0xF0D52Bc9f3455F0D200bCE6Cf9e8C4f0759a5128`; `MockIDRX` `0x0996e627cE22C4FE2D5c4788b159a83C065D6d09`; `ConfidentialCompanyVault` (demo) `0x4560968670Dd852dACd73c7B8748695eC427e203` — redeploy terakhir block 42397510 (4 Juni 2026) |
| Token uji | IDRX testnet (via `MockIDRX` di atas, atau faucet Base Sepolia resmi `0x18Bc5bcC660cf2B9cE3cd51a404aFe1a0cBD3C22` per `finley-payroll/.env.example`). Tidak ada nilai ekonomi nyata. |
| Akun uji per peran | Owner SaaS = wallet yang nilainya cocok dengan `OWNER_ADDRESS`/`NEXT_PUBLIC_OWNER_ADDRESS` di `.env`; HR Admin = wallet apa pun yang sudah memiliki `CompanyVault` terdaftar di `PayrollFactory.companyVaults`; Legal Officer = wallet dengan `LEGAL_ROLE` di salah satu `CompanyVault`; Karyawan = wallet dengan stream aktif/paused di Ponder (`getStream`); Pengguna baru = wallet apa pun yang belum pernah dipakai login |
| Data dummy karyawan (untuk form onboarding) | NIK 16 digit format `32xxxxxxxxxxxxxx` (contoh format saja, bukan NIK asli), nomor HP format `08xxxxxxxxxx`, gaji bulanan contoh `5.000.000 IDRX` (sesuai contoh resmi yang sudah dipakai di `black-box-testing.md` TC-HR-04) |
| Test database | PostgreSQL 16 lokal (Docker, lihat `docker-compose.yml` root repo) — schema `app` (backend, Drizzle) dan `public` (Ponder, Drizzle) |
| Foundry test fixtures | Mock contract di `finley-payroll/src/mocks/` (MockIDRX, mock Inco co-processor untuk FHE) — dipakai oleh seluruh 6 file `*.t.sol` |

### 2.4 Sumber Daya Manusia

Pengujian dilakukan oleh **satu orang** (penulis Tugas Akhir), berperan rangkap sebagai:
- **Developer** — menulis dan memelihara kode yang diuji
- **Tester** — merancang butir uji, menjalankan prosedur manual, mencatat hasil
- **Pemegang seluruh akun peran uji** (Owner, HR, Legal, Karyawan) — karena sistem berbasis role on-chain, penulis menyiapkan beberapa wallet (Privy embedded wallet berbeda email, atau MetaMask test account) untuk mensimulasikan keempat peran secara bergantian.

Implikasi: pengujian **akses-ganda/concurrent oleh pengguna berbeda** (misalnya HR propose PHK lalu Legal approve dari device terpisah secara bersamaan) disimulasikan secara berurutan oleh satu orang, bukan diuji sebagai concurrency multi-user sungguhan. Untuk Usability Testing (KU-22), karena keterbatasan satu orang, metode yang dipakai adalah **task-based walkthrough dengan 2–3 responden eksternal** (rekan/dosen pembimbing yang belum pernah memakai sistem) ditambah evaluasi heuristik mandiri oleh penulis — bukan riset usability skala besar.

### 2.5 Prosedur Umum Pengujian

Urutan nyata yang dijalankan di lingkungan ini, sesuai struktur monorepo:

1. **Instalasi dependency** — jalankan `npm install` di tiap workspace: `frontend/`, `backend/`, `ponder/`; dan `forge install` (via `finley-payroll/package-lock.json`/`foundry.lock`) di `finley-payroll/`.
2. **Setup environment variable** — salin `.env.example` → `.env` di `finley-payroll/` (RPC URL, deployer key, `IDRX_TOKEN_ADDRESS`); siapkan `.env` serupa di `backend/` (connection string Postgres, `OWNER_ADDRESS`, Pimlico API key) dan `frontend/` (`NEXT_PUBLIC_OWNER_ADDRESS`, alamat kontrak, Privy App ID).
3. **Jalankan dependency infrastruktur** — `docker-compose up -d` di root (PostgreSQL); untuk pengujian unit smart contract, **tidak perlu** testnet — Foundry memakai EVM lokal in-memory secara otomatis saat `forge test` dipanggil.
4. **Migrasi & seed database** — `npm run db:migrate` di `backend/` dan `ponder/` (Drizzle).
5. **Jalankan layanan untuk pengujian manual/black-box** — `ponder dev` (port 42069), `npm run dev` di `backend/` (port 3001 via `tsx watch`), `npm run dev` di `frontend/` (port 3000 via `next dev`).
6. **Jalankan automated test yang sudah ada** — `cd finley-payroll && forge test` (lihat hasil nyata di Bab 5).
7. **Eksekusi butir uji manual** sesuai prosedur di Bab 4/5, menggunakan akun uji pada 2.3, login lewat `http://localhost:3000/login`.
8. **Baca laporan** — output `forge test` langsung di terminal (atau `forge test --summary` untuk tabel ringkas yang dipakai di Bab 5); untuk butir uji manual, hasil dicatat langsung ke tabel Bab 5 berdasarkan observasi UI + verifikasi transaksi di BaseScan (`https://sepolia.basescan.org`).

---

## BAB 3 — IDENTIFIKASI DAN RENCANA PENGUJIAN

### 3.1 Tabel Identifikasi dan Rencana Pengujian

Jadwal mengasumsikan satu penguji bekerja penuh, dimulai 22 Juni 2026 (Senin pekan setelah draft ini disusun).

| Kelas Uji | Butir Uji | Identifikasi SKPL (UC-xxx) | Identifikasi PDHUPL (AU-xxx) | Tingkat Pengujian | Jenis Pengujian | Jadwal |
|---|---|---|---|---|---|---|
| KU-01 Login & Deteksi Role | Login sukses, redirect sesuai role (owner/hr/legal/employee) | UC-01 | AU-001 | System | Functional — Happy Path | 22–23 Jun 2026 |
| KU-01 Login & Deteksi Role | Sesi JWT kedaluwarsa/invalid ditolak | UC-01 | AU-002 | Integration | Functional — Negative | 22–23 Jun 2026 |
| KU-01 Login & Deteksi Role | Wallet belum terdaftar → redirect ke `/onboarding` | UC-01 | AU-003 | System | Functional — Alternative Flow | 22–23 Jun 2026 |
| KU-02 Onboarding Perusahaan & Deploy Vault | Registrasi → approve Owner → deploy vault (alur normal) | UC-02 | AU-004 | System | Functional — Happy Path | 22–24 Jun 2026 |
| KU-02 Onboarding Perusahaan & Deploy Vault | NPWP sudah terdaftar perusahaan lain ditolak | UC-02 | AU-005 | Integration | Functional — Negative | 22–24 Jun 2026 |
| KU-02 Onboarding Perusahaan & Deploy Vault | Validasi total split BPS harus tepat 10.000 | UC-02 | AU-006 | Unit | Functional — Validasi Input | 22–24 Jun 2026 |
| KU-03 Deposit IDRX ke Vault | Deposit normal, saldo vault bertambah | UC-03 | AU-007 | Integration | Functional — Happy Path | 24 Jun 2026 |
| KU-03 Deposit IDRX ke Vault | Saldo IDRX HR tidak cukup → approval gagal | UC-03 | AU-008 | Integration | Functional — Negative | 24 Jun 2026 |
| KU-03 Deposit IDRX ke Vault | Vault dalam status `VaultFrozen` → deposit ditolak | UC-03 | AU-009 | Unit (Foundry) | Functional — Negative | 24 Jun 2026 |
| KU-04 Onboarding Karyawan & Start Stream | `startStream` normal, entri stream + SBT terbit | UC-04 | AU-010 | Unit (Foundry) | Functional — Happy Path | 25 Jun 2026 |
| KU-04 Onboarding Karyawan & Start Stream | Stream sudah aktif → revert `StreamAlreadyActive` | UC-04 | AU-011 | Unit (Foundry) | Functional — Negative | 25 Jun 2026 |
| KU-04 Onboarding Karyawan & Start Stream | Wallet tanpa `HR_ROLE` mencoba start stream | UC-04 | AU-012 | Unit (Foundry) | Security — Access Control | 25 Jun 2026 |
| KU-05 Klaim EWA | Klaim sukses, split 93/5/2 benar | UC-05 | AU-013 | Unit (Foundry) | Functional — Happy Path | 26 Jun 2026 |
| KU-05 Klaim EWA | Rate limit 10 klaim/jam — klaim ke-11 ditolak | UC-05 | AU-014 | Integration | Functional — Negative | 26 Jun 2026 |
| KU-05 Klaim EWA | Stream tidak aktif → `NothingToClaim`/`StreamNotActive` | UC-05 | AU-015 | Unit (Foundry) | Functional — Negative | 26 Jun 2026 |
| KU-06 Inisiasi PHK oleh HR | Propose PHK normal → status menunggu Legal | UC-06 | AU-016 | Unit (Foundry) | Functional — Happy Path | 29 Jun 2026 |
| KU-06 Inisiasi PHK oleh HR | Proposal ganda untuk karyawan yang sama ditolak | UC-06 | AU-017 | Unit (Foundry) | Functional — Negative | 29 Jun 2026 |
| KU-07 Persetujuan PHK oleh Legal | Approve Legal → execute → severance cair, SBT dicabut | UC-07 | AU-018 | Unit (Foundry) | Functional — Happy Path | 30 Jun 2026 |
| KU-07 Persetujuan PHK oleh Legal | Proposal expired (>7 hari) ditolak eksekusi | UC-07 | AU-019 | Integration | Functional — Negative | 30 Jun 2026 |
| KU-07 Persetujuan PHK oleh Legal | Wallet tanpa `LEGAL_ROLE` mencoba approve | UC-07 | AU-020 | Unit (Foundry) | Security — Access Control | 30 Jun 2026 |
| KU-08 Resign Karyawan | Proses resign normal — stream dihentikan, severance balik ke vault, SBT dicabut | UC-08 | AU-021 | Unit (Foundry) | Functional — Happy Path | 1 Jul 2026 |
| KU-08 Resign Karyawan | Verifikasi kesesuaian aktor: SKPL vs implementasi aktual | UC-08 | AU-022 | System | Functional — Konsistensi Implementasi | 1 Jul 2026 |
| KU-09 Grant Vesting Schedule | Buat cliff vest normal, dana terkunci di vault | UC-09 | AU-023 | System (manual) | Functional — Happy Path | 2 Jul 2026 |
| KU-09 Grant Vesting Schedule | Saldo vault tidak cukup → `InsufficientVaultBalance` | UC-09 | AU-024 | System (manual) | Functional — Negative | 2 Jul 2026 |
| KU-10 Claim Vested Bonus | Klaim setelah cliff date — dana cair ke karyawan | UC-10 | AU-025 | System (manual) | Functional — Happy Path | 3 Jul 2026 |
| KU-10 Claim Vested Bonus | Klaim sebelum cliff date — tombol disabled / revert `CliffNotReached` | UC-10 | AU-026 | System (manual) | Functional — Negative | 3 Jul 2026 |
| KU-11 Join Koperasi & Deposit | Join pool + deposit normal | UC-11 | AU-027 | Unit (Foundry) | Functional — Happy Path | 6 Jul 2026 |
| KU-11 Join Koperasi & Deposit | Withdraw simpanan normal | UC-11 | AU-028 | Unit (Foundry) | Functional — Happy Path | 6 Jul 2026 |
| KU-12 Pinjaman Koperasi | Borrow ≤ 80% gaji bulanan — pinjaman cair | UC-12 | AU-029 | Unit (Foundry) | Functional — Happy Path | 7 Jul 2026 |
| KU-12 Pinjaman Koperasi | Auto-repay saat klaim EWA berikutnya | UC-12 | AU-030 | Unit (Foundry) | Functional — Happy Path | 7 Jul 2026 |
| KU-12 Pinjaman Koperasi | Pinjaman > 80% gaji ditolak (`LoanLimitExceeded`) | UC-12 | AU-031 | System (manual) | Functional — Negative | 7 Jul 2026 |
| KU-13 Laporan Kepatuhan BPJS/PPh21 | Generate laporan periode dengan data transaksi — sukses | UC-13 | AU-032 | System (manual) | Functional — Happy Path | 8 Jul 2026 |
| KU-13 Laporan Kepatuhan BPJS/PPh21 | Periode tanpa transaksi → laporan kosong dengan pesan jelas | UC-13 | AU-033 | System (manual) | Functional — Negative | 8 Jul 2026 |
| KU-14 Verifikasi SBT Ketenagakerjaan | Cek wallet dengan SBT aktif — status & data tampil benar | UC-14 | AU-034 | System (manual) | Functional — Happy Path | 9 Jul 2026 |
| KU-14 Verifikasi SBT Ketenagakerjaan | Cek wallet tanpa SBT / SBT sudah dicabut | UC-14 | AU-035 | System (manual) | Functional — Negative | 9 Jul 2026 |
| KU-15 Owner Deploy Vault Baru | Deploy vault baru oleh Owner — sukses | UC-15 | AU-036 | Unit (Foundry) | Functional — Happy Path | 10 Jul 2026 |
| KU-15 Owner Deploy Vault Baru | HR yang dituju sudah punya vault → ditolak | UC-15 | AU-037 | Unit (Foundry) | Functional — Negative | 10 Jul 2026 |
| KU-16 Dashboard Vault & Status Stream | Dashboard menampilkan saldo & status stream real-time | UC-16 | AU-038 | System (manual) | Functional — Happy Path | 13 Jul 2026 |
| KU-16 Dashboard Vault & Status Stream | Banner peringatan saat `VaultFrozen` | UC-16 | AU-039 | System (manual) | Functional — Alternative Flow | 13 Jul 2026 |
| KU-17 Set Gaji Terenkripsi (FHE) | Set gaji FHE normal — ciphertext tersimpan | UC-17 | AU-040 | Unit (Foundry, FHE) | Functional — Happy Path | 14 Jul 2026 |
| KU-17 Set Gaji Terenkripsi (FHE) | Wallet tanpa `HR_ROLE` mencoba set gaji FHE | UC-17 | AU-041 | Unit (Foundry) | Security — Access Control | 14 Jul 2026 |
| KU-18 Lihat Gaji via Viewing Key | Karyawan dekripsi gaji sendiri | UC-18 | AU-042 | System (manual) | Functional — Happy Path | 15 Jul 2026 |
| KU-19 Agregasi Payroll Homomorphic | Agregasi total gaji seluruh karyawan (HR) | UC-19 | AU-043 | Unit (Foundry, FHE) | Functional — Happy Path | 16 Jul 2026 |
| KU-20 Konfigurasi & Klaim Platform Fee | Owner set platform fee ≤ batas maksimum | UC-20 | AU-044 | System (manual/on-chain) | Functional — Happy Path | 17 Jul 2026 |
| KU-20 Konfigurasi & Klaim Platform Fee | Fee > batas maksimum → revert `FeeTooHigh` | UC-20 | AU-045 | System (manual/on-chain) | Functional — Negative | 17 Jul 2026 |
| KU-21 Stress Testing | Fuzz test `grantViewingKey` (256 kombinasi expiry acak) | UC-17/UC-19 (NFR-PAYANA-03) | AU-046 | Unit (Foundry Fuzz) | Non-Fungsional — Stress/Fuzz | 20 Jul 2026 |
| KU-21 Stress Testing | Fuzz test `isAuditorActive` (256 kombinasi waktu acak) | UC-17/UC-19 (NFR-PAYANA-03) | AU-047 | Unit (Foundry Fuzz) | Non-Fungsional — Stress/Fuzz | 20 Jul 2026 |
| KU-21 Stress Testing | Simulasi banyak klaim EWA beruntun mendekati rate limit (≤5 detik P95) | UC-05 (NFR-PAYANA-02) | AU-048 | System (manual, terjadwal) | Non-Fungsional — Stress/Beban | 21 Jul 2026 |
| KU-21 Stress Testing | Load test endpoint `/auth/me` & `/bundler/relay` di bawah beban concurrent | UC-01/UC-05 (NFR-PAYANA-01) | AU-049 | Integration (load test tool) | Non-Fungsional — Stress/Beban | 21–22 Jul 2026 |
| KU-22 Usability Testing | SUS (System Usability Scale) untuk alur onboarding karyawan baru | UC-02 | AU-050 | Acceptance | Non-Fungsional — Usability | 23 Jul 2026 |
| KU-22 Usability Testing | Task success rate: HR menjalankan deploy vault → tambah karyawan | UC-02/UC-04 | AU-051 | Acceptance | Non-Fungsional — Usability | 23 Jul 2026 |
| KU-22 Usability Testing | Task success rate: Karyawan menemukan & menjalankan klaim EWA tanpa bantuan | UC-05 | AU-052 | Acceptance | Non-Fungsional — Usability | 24 Jul 2026 |
| KU-22 Usability Testing | Pemahaman pesan error oleh responden non-teknis (tanpa istilah blockchain) | UC-01/UC-02/UC-05 | AU-053 | Acceptance | Non-Fungsional — Usability | 24 Jul 2026 |

---

## BAB 4 — DESKRIPSI PENGUJIAN

> Disusun per kelas uji. Penjelasan tiap butir uji ditulis ringkas: apa yang diuji dan input yang dipakai.

### KU-01 — Login & Deteksi Role
**Aktor:** Semua pengguna (HR Admin, Karyawan, Legal Officer, Owner SaaS, pengguna baru). **Penjelasan:** Menguji gerbang masuk sistem berbasis tanda tangan dompet digital (Privy) dan logika deteksi peran on-chain di `useRole.ts`, yang menentukan halaman dashboard tujuan.

- **AU-001** — Login dengan masing-masing dari 4 jenis akun (owner/hr/legal/employee), input: kredensial Privy (email OTP) per akun, verifikasi redirect ke `/owner`, `/hr/vault`, `/hr/phk`, `/employee/ewa` secara berurutan.
- **AU-002** — Memaksa token JWT kedaluwarsa (tunggu >15 menit access token tanpa refresh, atau modifikasi token di local storage), input: token rusak/expired, harapan sistem menolak dengan 401 dan kembali ke `/login`.
- **AU-003** — Login dengan wallet yang belum pernah terdaftar di sistem, input: wallet baru, harapan redirect ke `/onboarding`.

### KU-02 — Onboarding Perusahaan & Deploy Vault
**Aktor:** Owner SaaS, HR Admin. **Penjelasan:** Menguji alur pendaftaran HR baru sampai vault perusahaannya live on-chain, termasuk validasi parameter split.

- **AU-004** — Input: data perusahaan (nama, NPWP dummy 15 digit, email PIC), split default 9300/500/200 bps. Jalankan submit → approve Owner → deploy. Harapan: vault address tersimpan, status akhir HR bisa akses `/hr/vault`.
- **AU-005** — Input: NPWP yang sudah dipakai perusahaan lain. Harapan: error `409 Conflict`.
- **AU-006** — Input: kombinasi split BPS yang totalnya ≠ 10.000 (misal 9000/500/200). Harapan: frontend menolak submit sebelum kirim transaksi.

### KU-03 — Deposit IDRX ke Vault Perusahaan
**Aktor:** HR Admin. **Penjelasan:** Menguji alur dua-langkah `approve` + `deposit` IDRX ERC-20 ke `CompanyVault`.

- **AU-007** — Input: jumlah deposit `1.000.000 IDRX`, saldo HR cukup. Harapan: saldo vault bertambah persis sejumlah itu.
- **AU-008** — Input: jumlah deposit lebih besar dari saldo wallet HR. Harapan: approval/transfer gagal dengan pesan saldo tidak cukup.
- **AU-009** — Prasyarat: vault dalam status `VaultFrozen` (di-set lewat fungsi admin). Input: percobaan deposit. Harapan: revert.

### KU-04 — Onboarding Karyawan & Inisiasi Stream Gaji
**Aktor:** HR Admin. **Penjelasan:** Menguji `startStream()` — pendaftaran karyawan on-chain dan mint `EmploymentSBT`.

- **AU-010** — Input: alamat karyawan baru, gaji bulanan `5.000.000 IDRX`, split default. Harapan: `EmployeeStream` tercatat aktif, `EmploymentSBT` terbit ke wallet karyawan.
- **AU-011** — Input: alamat karyawan yang stream-nya sudah aktif. Harapan: revert `StreamAlreadyActive`.
- **AU-012** — Input: wallet tanpa `HR_ROLE` mencoba memanggil `startStream`. Harapan: revert `Unauthorized`.

### KU-05 — Klaim EWA (Karyawan)
**Aktor:** Karyawan. **Penjelasan:** Menguji penarikan gaji terakumulasi via `claimSalary()`, termasuk split 93/5/2 dan rate limiting.

- **AU-013** — Input: stream aktif dengan akrual >0, tidak ada pinjaman koperasi. Harapan: 93% ke karyawan, 5% ke Compliance Vault, 2% ke Severance Vault, saldo akrual reset ke 0.
- **AU-014** — Input: 11 percobaan klaim berturut-turut dalam 1 jam pada akun yang sama. Harapan: percobaan ke-11 ditolak dengan pesan rate limit.
- **AU-015** — Input: klaim pada stream yang sudah dihentikan (`Cancelled`). Harapan: revert/ditolak, tidak ada transfer.

### KU-06 — Inisiasi PHK oleh HR Admin
**Aktor:** HR Admin. **Penjelasan:** Menguji `proposeTermination()` — tahap pertama mekanisme multi-sig PHK.

- **AU-016** — Input: alamat karyawan aktif + alasan PHK. Harapan: proposal tersimpan, `hrApproved=true`, `legalApproved=false`, expiry = now+7 hari.
- **AU-017** — Input: alamat karyawan yang sudah punya proposal aktif. Harapan: revert `TerminationAlreadyProposed`.

### KU-07 — Persetujuan PHK oleh Legal Officer
**Aktor:** Legal Officer, HR Admin (eksekusi). **Penjelasan:** Menguji `approveTermination()` dan `executeTermination()` — tahap kedua & final mekanisme multi-sig.

- **AU-018** — Input: proposal yang sudah di-propose HR, approve oleh wallet `LEGAL_ROLE`, lalu eksekusi oleh HR. Harapan: stream `Cancelled`, severance cair ke karyawan, SBT dicabut.
- **AU-019** — Input: proposal berumur >7 hari, coba eksekusi. Harapan: revert `ProposalExpired`, stream tetap aktif.
- **AU-020** — Input: wallet tanpa `LEGAL_ROLE` mencoba approve. Harapan: revert `Unauthorized`.

### KU-08 — Resign Karyawan
**Aktor:** Implementasi aktual = **HR Admin** (lihat catatan AU-022); SKPL UC-08 menulis aktor sebagai **Karyawan** (self-service). **Penjelasan:** Menguji `resignEmployee()` — penghentian stream, pengembalian severance vault ke saldo vault, pencabutan SBT.

- **AU-021** — Input: HR memanggil resign untuk karyawan dengan stream aktif. Harapan: stream dihentikan, `severanceVault.balance` dikembalikan ke `vaultBalance`, SBT dicabut.
- **AU-022** — Bukan pengujian fungsional kontrak, melainkan verifikasi dokumentasi: membandingkan narasi UC-08 di SKPL.md (karyawan mengajukan resign sendiri, notice period 30 hari, ada endpoint `POST /employee/resign`) dengan kode aktual `frontend/src/app/hr/employees/[id]/page.tsx` (`handleResign`, dipanggil HR, tanpa notice period). Harapan dokumentasi: SKPL diperbarui agar konsisten dengan implementasi, **atau** fitur self-resign karyawan dibangun menyusul.

### KU-09 — HR Grant Vesting Schedule ke Karyawan
**Aktor:** HR Admin. **Penjelasan:** Menguji `createCliffVest()`. **Catatan coverage:** tidak ada test Foundry untuk fungsi ini — `finley-payroll/test/CompanyVault.t.sol` tidak memiliki kasus uji vesting sama sekali per 19 Juni 2026.

- **AU-023** — Input: karyawan target, jumlah `10.000.000 IDRX`, cliff date 1 bulan ke depan, tipe Retensi. Harapan: vest tersimpan status `Locked`, saldo vault berkurang.
- **AU-024** — Input: jumlah vest lebih besar dari saldo vault tersedia. Harapan: revert `InsufficientVaultBalance`.

### KU-10 — Karyawan Claim Vested Bonus
**Aktor:** Karyawan. **Penjelasan:** Menguji `claimCliffVest()`. Sama seperti KU-09, **tidak ada automated test** untuk fungsi ini.

- **AU-025** — Input: vest dengan cliff date sudah lewat. Harapan: status `Claimed`, dana cair ke karyawan.
- **AU-026** — Input: vest dengan cliff date di masa depan. Harapan: tombol klaim disabled di UI; jika dipaksa via contract call langsung, revert `CliffNotReached`.

### KU-11 — Karyawan Bergabung ke Koperasi dan Menyimpan Dana
**Aktor:** Karyawan. **Penjelasan:** Menguji `joinPool()`/`deposit()`/`withdraw()` pada `EmployeeLiquidityContract`.

- **AU-027** — Input: jumlah deposit ≥ minimum 100 IDRX. Harapan: `lenderDeposits[employee].principal` bertambah, `totalDeposited` bertambah.
- **AU-028** — Input: penarikan sebagian simpanan. Harapan: principal berkurang sesuai jumlah ditarik, dana balik ke wallet karyawan.

### KU-12 — Karyawan Mengajukan Pinjaman Koperasi
**Aktor:** Karyawan. **Penjelasan:** Menguji `borrowFromPool()` dan auto-repay saat `claimSalary()`.

- **AU-029** — Input: pinjaman `3.000.000 IDRX` dari gaji bulanan `5.000.000 IDRX` (60%, dalam batas 80%). Harapan: dana cair, `LoanRecord` aktif.
- **AU-030** — Input: klaim EWA berikutnya saat pinjaman aktif. Harapan: `autoRepay()` terpanggil, sisa pinjaman berkurang sesuai `REPAY_FRACTION_BPS`.
- **AU-031** — Input: pinjaman `4.500.000 IDRX` (90% gaji, melebihi 80%). Harapan: revert `LoanLimitExceeded`.

### KU-13 — HR Generate Laporan Kepatuhan (BPJS/PPh21)
**Aktor:** HR Admin. **Penjelasan:** Menguji endpoint backend `/compliance/summary` dan `/compliance/export` (rekonsiliasi data on-chain vs database).

- **AU-032** — Input: periode bulan dengan minimal 1 klaim EWA tercatat. Harapan: laporan menampilkan rincian iuran per karyawan, dapat diunduh CSV.
- **AU-033** — Input: periode bulan tanpa transaksi klaim sama sekali. Harapan: pesan "tidak ada data" tanpa error 500.

### KU-14 — Verifikasi Sertifikat Ketenagakerjaan (SBT)
**Aktor:** Pihak Ketiga / Karyawan, halaman publik `/verify`. **Penjelasan:** Menguji pembacaan status `EmploymentSBT` tanpa perlu login.

- **AU-034** — Input: alamat wallet karyawan dengan SBT aktif. Harapan: status "aktif" + nama perusahaan + tanggal mulai tampil benar.
- **AU-035** — Input: alamat wallet tanpa SBT, dan alamat dengan SBT yang sudah dicabut (pasca PHK/resign). Harapan: pesan "tidak ditemukan" untuk kasus pertama, "SBT tidak aktif" + alasan untuk kasus kedua.

### KU-15 — Owner SaaS Deploy Company Vault Baru
**Aktor:** Owner SaaS. **Penjelasan:** Menguji `PayrollFactory.deployVault()` dipanggil langsung oleh Owner (bukan via alur approval HR mandiri di KU-02).

- **AU-036** — Input: alamat HR Admin baru yang sudah terdaftar di sistem, nama perusahaan, alamat IDRX & liquidity pool. Harapan: `VaultDeployed` event, `companyVaults[hr]` terisi.
- **AU-037** — Input: alamat HR yang sudah memiliki vault aktif. Harapan: revert `HRAlreadyHasVault`.

### KU-16 — HR Lihat Dashboard Vault dan Status Stream
**Aktor:** HR Admin. **Penjelasan:** Use case murni baca (read-only) — menguji akurasi agregasi data on-chain + Ponder di `/hr/vault`.

- **AU-038** — Input: akses `/hr/vault` dengan ≥1 karyawan aktif. Harapan: saldo vault, total flow rate, daftar karyawan, semua konsisten dengan nilai on-chain (verifikasi manual via BaseScan).
- **AU-039** — Prasyarat: vault dalam status `VaultFrozen`. Harapan: banner peringatan merah tampil di dashboard.

### KU-17 — HR Set Gaji Karyawan dalam Format Terenkripsi (FHE)
**Aktor:** HR Admin. **Penjelasan:** Menguji `setEncryptedSalary()` di `ConfidentialCompanyVault`. **Catatan:** belum ada UI di frontend yang memanggil fungsi ini (`grep` untuk `setEncryptedSalary` di `frontend/src` nihil per 19 Juni 2026) — pengujian fungsional penuh hanya bisa dilakukan di level smart contract.

- **AU-040** — Input: nilai gaji ter-enkripsi (ciphertext `euint256`) dari mock Inco co-processor. Harapan: tersimpan di `encryptedSalaries[employee]`, event tanpa plaintext. **Status saat ini: di-skip** di test suite (butuh node Inco live, lihat KI di KNOWN_ISSUES.md).
- **AU-041** — Input: wallet tanpa `HR_ROLE` mencoba `setEncryptedSalary`. Harapan: revert `Unauthorized`. Ini **bisa** diuji tanpa Inco live karena hanya menguji guard akses, bukan logika FHE.

### KU-18 — Karyawan Lihat Gaji Sendiri via Viewing Key
**Aktor:** Karyawan. **Penjelasan:** Use case ini **belum memiliki implementasi UI sama sekali** — tidak ada halaman/komponen di `frontend/src` yang memanggil dekripsi viewing key. Butir uji ditulis berdasarkan spesifikasi SKPL untuk keperluan dokumentasi rencana, bukan validasi sistem yang sudah ada.

- **AU-042** — (Belum dapat diuji terhadap sistem nyata) Spesifikasi: karyawan signing EIP-712 → ambil ciphertext → dekripsi lokal dengan viewing key.

### KU-19 — HR Lihat Total Payroll via Homomorphic Aggregation
**Aktor:** HR Admin. **Penjelasan:** Menguji `aggregateTotalPayroll()`. Operasi penjumlahan homomorphic-nya sendiri (`FHE.add`) di-skip di test suite (butuh Inco live), tetapi **guard akses dan validasi dasar sudah teruji**.

- **AU-043** — Input: panggilan oleh HR tanpa karyawan terdaftar (harapan revert `revertsIfNoEmployees` — **sudah ada test, PASS**), dan oleh wallet tanpa `HR_ROLE` (harapan revert — **sudah ada test, PASS**). Agregasi nilai aktual (FHE sum sungguhan) — **skipped**, butuh Inco live node.

### KU-20 — Owner SaaS Konfigurasi dan Klaim Platform Fee
**Aktor:** Owner SaaS. **Penjelasan:** Menguji `setPlatformFee()` di `PayrollFactory`. **Catatan:** tidak ada UI "Monetisasi" di `/owner` (grep untuk `platformFeeBps`/`Monetisasi` di frontend nihil) — fungsi hanya bisa diuji lewat pemanggilan kontrak langsung (`cast send` / Foundry script), bukan lewat UI.

- **AU-044** — Input: `feeBps` baru ≤ batas maksimum (misal 10 bps). Harapan: `platformFeeBps` ter-update, event `PlatformFeeUpdated`.
- **AU-045** — Input: `feeBps` > batas maksimum (>100 bps). Harapan: revert `FeeTooHigh`.

### KU-21 — Stress Testing
**Aktor:** Sistem (lintas peran). **Penjelasan:** Menguji ketahanan sistem terhadap input acak bervolume tinggi (fuzz, di level smart contract — sudah berjalan nyata via Foundry) dan beban concurrent (di level API/UI — perlu instrumentasi tambahan, lihat status di Bab 5).

- **AU-046** — Foundry fuzz: `testFuzz_grantViewingKey_expiryMustBeFuture(uint256)` — 256 nilai expiry acak dicoba terhadap guard "expiry harus di masa depan".
- **AU-047** — Foundry fuzz: `testFuzz_isAuditorActive_timeBased(uint256)` — 256 nilai timestamp acak dicoba terhadap logika status aktif/expired auditor.
- **AU-048** — Simulasi manual: HR/karyawan melakukan klaim EWA berulang mendekati ambang rate limit (9 klaim dalam 1 jam, lalu ukur waktu konfirmasi klaim ke-9) untuk memeriksa NFR-PAYANA-02 (≤5 detik P95 end-to-end).
- **AU-049** — Load test sederhana (disarankan tool `autocannon` atau `k6`) terhadap endpoint `GET /auth/me` dan `POST /bundler/relay` di backend lokal, untuk memeriksa NFR-PAYANA-01 (≤500ms P99 di bawah beban). Ini API HTTP biasa — tidak menyentuh testnet — sehingga **realistis dijalankan otomatis** asalkan backend + DB lokal berjalan.

### KU-22 — Usability Testing
**Aktor:** Responden eksternal (2–3 orang yang belum pernah memakai sistem) + penulis. **Penjelasan:** Karena pengujian dilakukan satu orang (lihat 2.4), usability testing dirancang sebagai task-based walkthrough singkat dengan beberapa responden, bukan riset UX skala besar. Bahasa instrumen sengaja dibuat **tanpa jargon blockchain** (tidak memakai istilah seperti "ERC-4337", "UserOperation", "gasless", "ciphertext" kepada responden) — istilah tersebut hanya dipakai di balik layar untuk keperluan dokumentasi teknis.

- **AU-050** — Kuesioner SUS (10 pertanyaan standar, skala 1–5) diisi responden setelah menyelesaikan alur pendaftaran karyawan baru di `/onboarding`. Skor SUS dihitung dan dibandingkan terhadap ambang umum (≥68 = "above average").
- **AU-051** — Skenario tugas: "Sebagai admin HR baru, daftarkan perusahaan Anda dan tambahkan satu karyawan." Diukur: berhasil/tidak, jumlah langkah salah, waktu penyelesaian.
- **AU-052** — Skenario tugas: "Sebagai karyawan, tarik gaji yang sudah terkumpul." Diukur: apakah responden menemukan tombol tanpa diarahkan, waktu penyelesaian.
- **AU-053** — Tunjukkan ke responden non-teknis tiga pesan error sistem (contoh: "Stream gaji Anda belum aktif. Hubungi HR Admin", "Batas klaim telah tercapai...", "Saldo ETH tidak mencukupi untuk membayar gas"). Tanyakan apakah mereka memahami maksud dan tindakan yang harus diambil — dipakai untuk menilai apakah pesan error masih terlalu teknis untuk pengguna awam (misal istilah "gas" berpotensi tidak dipahami pengguna non-crypto).

---

## BAB 5 — EKSEKUSI DAN HASIL PENGUJIAN

> **Eksekusi nyata yang sudah dijalankan di lingkungan ini (19 Juni 2026):**
> `cd finley-payroll && forge test --summary` → **77 passed, 0 failed, 6 skipped**, total waktu CPU gabungan ≈ 117 ms.
> Baris di bawah yang berasal dari hasil ini mencantumkan nama fungsi test persis dan gas usage asli dari output tersebut. Baris yang membutuhkan wallet/Privy/testnet/browser dicatat sebagai **belum dieksekusi** — bukan diasumsikan lulus.

| Identifikasi | Deskripsi | Prosedur Pengujian | Masukan | Keluaran yang Diharapkan | Kriteria Evaluasi Hasil | Hasil yang Didapat | Kesimpulan |
|---|---|---|---|---|---|---|---|
| AU-001 | Login & redirect 4 peran | Login manual via Privy untuk tiap akun, amati URL tujuan | Akun owner/hr/legal/employee | Redirect ke `/owner`, `/hr/vault`, `/hr/phk`, `/employee/ewa` | Sesuai role | **Belum dieksekusi** — butuh OTP email Privy manual, tidak dapat diotomasi di lingkungan ini | Pending |
| AU-002 | JWT expired ditolak | Modifikasi/tunggu expiry token, akses halaman terlindungi | Token rusak | 401 + redirect login | Sesuai | **Belum dieksekusi** | Pending |
| AU-003 | Wallet baru → onboarding | Login wallet baru | Wallet belum terdaftar | Redirect `/onboarding` | Sesuai | **Belum dieksekusi** | Pending |
| AU-004 | Registrasi → approve → deploy | Manual end-to-end UI | Data perusahaan dummy | Vault ter-deploy | Sesuai | **Belum dieksekusi** | Pending |
| AU-005 | NPWP duplikat ditolak | Submit NPWP yang sudah dipakai | NPWP sama 2x | 409 Conflict | Sesuai | **Belum dieksekusi** (logic di backend, belum ada test otomatis) | Pending |
| AU-006 | Validasi total BPS = 10.000 | Input split tidak total 100% | 9000/500/200 bps | Ditolak frontend sebelum submit | Sesuai | **Belum dieksekusi** | Pending |
| AU-007 | Deposit normal | Approve + deposit via UI | 1.000.000 IDRX | Saldo vault +1.000.000 | Sesuai | **Belum dieksekusi** | Pending |
| AU-008 | Saldo IDRX tidak cukup | Deposit > saldo wallet | Jumlah > saldo | Approval gagal | Sesuai | **Belum dieksekusi** | Pending |
| AU-009 | Deposit saat `VaultFrozen` | — | — | Revert | Sesuai | **Belum dieksekusi** — tidak ada test Foundry untuk skenario freeze di `CompanyVault.t.sol` saat ini | Pending — **gap test coverage teridentifikasi** |
| AU-010 | `startStream` normal | `forge test --match-test test_startStream_createsEntries` | Karyawan baru, flowRate dari gaji 5jt | Stream + SBT aktif | PASS | **PASS** — `test_startStream_createsEntries() (gas: 259087)` | **Handal** |
| AU-011 | Stream sudah aktif ditolak | `forge test --match-test testRevert_startStream_alreadyActive` | Karyawan dengan stream aktif | Revert `StreamAlreadyActive` | PASS | **PASS** — `testRevert_startStream_alreadyActive() (gas: 259360)` | **Handal** |
| AU-012 | Non-HR mencoba startStream | — | — | Revert `Unauthorized` | — | **Belum dieksekusi** — tidak ada test khusus untuk guard ini di `CompanyVault.t.sol` (perlu ditambahkan) | Pending — **gap test coverage teridentifikasi** |
| AU-013 | Klaim EWA split 93/5/2 | `forge test --match-test test_claimSalary_splitCorrect` | Akrual > 0 | Split benar | PASS | **PASS** — `test_claimSalary_splitCorrect() (gas: 404344)` | **Handal** |
| AU-014 | Rate limit 10x/jam | Manual, 11x klaim berurutan | 11 klaim dalam 1 jam | Klaim ke-11 ditolak | Sesuai | **Belum dieksekusi** — logic rate limit ada di backend (`requireAuth`/limiter), bukan di smart contract, tidak tercakup `forge test` | Pending |
| AU-015 | Klaim saat stream nonaktif | — | — | Revert/ditolak | — | **Belum dieksekusi** secara eksplisit, namun tersirat lulus lewat `test_cancelStream_balanceRemainsClaimable` yang menguji state pasca cancel (gas: 263081) — perlu test tambahan yang spesifik mengecek klaim ditolak total | Pending |
| AU-016 | Propose PHK normal | Tersirat dari `test_phk_fullFlow_severanceReleasedToEmployee` | Karyawan aktif | Proposal aktif | PASS (sebagai bagian flow) | **PASS** (bagian dari) `test_phk_fullFlow_severanceReleasedToEmployee() (gas: 478909)` | **Handal** |
| AU-017 | Proposal ganda ditolak | — | — | Revert `TerminationAlreadyProposed` | — | **Belum dieksekusi** — tidak ada test spesifik untuk kasus ini | Pending — **gap test coverage** |
| AU-018 | Approve + Execute PHK | `forge test --match-test test_phk_fullFlow_severanceReleasedToEmployee` | Proposal HR+Legal lengkap | Severance cair, SBT dicabut | PASS | **PASS** — `test_phk_fullFlow_severanceReleasedToEmployee() (gas: 478909)`; SBT revoke terverifikasi terpisah di `test_executeTermination_revokesSBT() (gas: 540723)` | **Handal** |
| AU-019 | Proposal expired ditolak | — | — | Revert `ProposalExpired` | — | **Belum dieksekusi** — tidak ada test untuk time-travel >7 hari di suite ini | Pending — **gap test coverage** |
| AU-020 | Non-legal approve ditolak | — | — | Revert `Unauthorized` | — | **Belum dieksekusi** — tidak ada test khusus guard ini | Pending — **gap test coverage** |
| AU-021 | Resign normal | `forge test --match-test test_resignEmployee_severanceReturnedToVault` dan `test_resignEmployee_revokesSBT` | Karyawan aktif | Severance balik ke vault, SBT dicabut | PASS | **PASS** — `test_resignEmployee_severanceReturnedToVault() (gas: 398522)`; `test_resignEmployee_revokesSBT() (gas: 411463)` | **Handal** |
| AU-022 | Cek konsistensi dokumentasi UC-08 | Baca SKPL.md UC-08 vs `hr/employees/[id]/page.tsx` baris 157–167 | Teks SKPL vs kode | Konsisten | Tidak sesuai jika aktor berbeda | **Tidak sesuai** — SKPL menulis aktor "Karyawan (self-resign, notice period 30 hari)", kode aktual: HR memanggil `resignEmployee` langsung tanpa notice period, tidak ada endpoint `POST /employee/resign` di `backend/src/routes/` | **Tidak Handal (dokumentasi)** — SKPL perlu direvisi atau fitur self-resign dibangun |
| AU-023 | Buat cliff vest normal | Manual UI `/hr/vesting` | Karyawan, 10jt IDRX, cliff +1 bulan | Vest `Locked`, saldo vault berkurang | Sesuai | **Belum dieksekusi** — tidak ada test Foundry untuk `createCliffVest` di repo ini sama sekali | Pending — **gap test coverage signifikan** |
| AU-024 | Saldo vault tidak cukup untuk vest | — | — | Revert `InsufficientVaultBalance` | — | **Belum dieksekusi** — sama, tidak ada test vesting | Pending |
| AU-025 | Claim vest setelah cliff | Manual UI `/employee/vesting` | Vest matang | Dana cair, status `Claimed` | Sesuai | **Belum dieksekusi** | Pending |
| AU-026 | Claim vest sebelum cliff ditolak | Manual UI | Vest belum matang | Tombol disabled / revert `CliffNotReached` | Sesuai | **Belum dieksekusi** | Pending |
| AU-027 | Join + deposit koperasi | `forge test --match-test test_depositToPool_updatesState` | Deposit ≥100 IDRX | Principal & totalDeposited bertambah | PASS | **PASS** — `test_depositToPool_updatesState() (gas: 161167)` | **Handal** |
| AU-028 | Withdraw simpanan | `forge test --match-test test_withdrawDeposit_returnsPrincipal` | Penarikan sebagian | Principal berkurang, dana balik | PASS | **PASS** — `test_withdrawDeposit_returnsPrincipal() (gas: 152844)` | **Handal** |
| AU-029 | Borrow ≤80% gaji | `forge test --match-test test_borrowFromPool_createsLoan` | Pinjam 60% gaji | Dana cair, `LoanRecord` aktif | PASS | **PASS** — `test_borrowFromPool_createsLoan() (gas: 570570)` | **Handal** |
| AU-030 | Auto-repay saat claim EWA | `forge test --match-test test_repayLoan_distributesYieldAndFee` | Klaim EWA dengan pinjaman aktif | Cicilan terpotong otomatis | PASS | **PASS** — `test_repayLoan_distributesYieldAndFee() (gas: 654026)` | **Handal** |
| AU-031 | Pinjaman >80% gaji ditolak | — | — | Revert `LoanLimitExceeded` | — | **Belum dieksekusi** — tidak ada test spesifik untuk batas atas ini di `EmployeeLiquidityContract.t.sol` (hanya 4 test, semua happy path) | Pending — **gap test coverage** |
| AU-032 | Generate laporan kepatuhan normal | Manual UI `/hr/compliance` | Periode dengan transaksi | Laporan + CSV | Sesuai | **Belum dieksekusi** — tidak ada test backend (tidak ada test suite backend sama sekali) | Pending |
| AU-033 | Periode tanpa data | Manual UI | Periode kosong | Pesan "tidak ada data" | Sesuai | **Belum dieksekusi** | Pending |
| AU-034 | Verifikasi SBT aktif | Manual `/verify` | Wallet dengan SBT | Status aktif tampil | Sesuai | **Belum dieksekusi** (halaman ada di kode, belum diuji end-to-end) | Pending |
| AU-035 | Verifikasi SBT tidak ada/dicabut | Manual `/verify` | Wallet tanpa SBT / dicabut | Pesan sesuai | Sesuai | **Belum dieksekusi** | Pending |
| AU-036 | Owner deploy vault baru | Tersirat dari `test_vault_initialized` (constructor path yang sama dipakai factory) | Parameter vault baru | Vault aktif | PASS (constructor) | **PASS (sebagian)** — `test_vault_initialized() (gas: 24993)` menguji vault hasil deploy sudah terbentuk benar; alur `PayrollFactory.deployVault()` end-to-end dari sisi Owner UI **belum diuji manual** | Pending (parsial) |
| AU-037 | HR sudah punya vault ditolak | — | — | Revert `HRAlreadyHasVault` | — | **Belum dieksekusi** — tidak ada test file untuk `PayrollFactory.sol` sama sekali di `finley-payroll/test/` | Pending — **gap test coverage: seluruh PayrollFactory belum punya unit test** |
| AU-038 | Dashboard vault akurat | Manual `/hr/vault` + cross-check BaseScan | Vault dengan data aktif | Data konsisten | Sesuai | **Belum dieksekusi** | Pending |
| AU-039 | Banner `VaultFrozen` | Manual, set status frozen | Vault frozen | Banner tampil | Sesuai | **Belum dieksekusi** | Pending |
| AU-040 | Set gaji FHE (nilai sungguhan) | `forge test --match-test test_FHE_setEncryptedSalary_storesEncryptedSalary` | Ciphertext mock | Tersimpan | SKIP | **SKIP** — `[SKIP] test_FHE_setEncryptedSalary_storesEncryptedSalary() (gas: 0)`, butuh node Inco live (lihat KNOWN_ISSUES.md, "FHE tests di-skip") | **Tidak dapat disimpulkan (infrastruktur belum tersedia)** |
| AU-041 | Set gaji FHE oleh non-HR | `forge test --match-test test_setEncryptedSalary_revertsIfNotHR` | Wallet tanpa HR_ROLE | Revert | PASS | **PASS** — `test_setEncryptedSalary_revertsIfNotHR() (gas: 18701)` | **Handal** |
| AU-042 | Karyawan dekripsi gaji sendiri | — (tidak ada UI) | — | — | — | **Tidak dapat diuji** — fitur belum diimplementasikan di frontend per 19 Juni 2026 (tidak ditemukan referensi `encryptedSalar`/viewing key apa pun di `frontend/src`) | **Tidak Handal (belum tersedia)** |
| AU-043 | Agregasi payroll — guard akses & kondisi kosong | `forge test --match-test test_aggregateTotalPayroll_revertsIfNoEmployees` dan `..._revertsIfNotHR` | Tanpa karyawan / non-HR | Revert pada kedua kasus | PASS | **PASS** — `test_aggregateTotalPayroll_revertsIfNoEmployees() (gas: 17787)`; `test_aggregateTotalPayroll_revertsIfNotHR() (gas: 15329)`. Nilai agregasi FHE sungguhan: **SKIP** (`test_FHE_aggregateTotalPayroll_sumsTwoSalaries`, gas: 0) | **Handal (guard)** / **Tidak dapat disimpulkan (agregasi FHE nyata)** |
| AU-044 | Set platform fee valid | — (tidak ada UI, perlu `cast send` manual) | feeBps ≤ 100 | Update tersimpan | Sesuai | **Belum dieksekusi** — tidak ada test file untuk `PayrollFactory.sol`; tidak ada UI untuk memicu fungsi ini | Pending — **gap test coverage + fitur tanpa UI** |
| AU-045 | Platform fee melebihi batas | — | feeBps > 100 | Revert `FeeTooHigh` | — | **Belum dieksekusi** | Pending |
| AU-046 | Fuzz `grantViewingKey` | `forge test --match-test testFuzz_grantViewingKey_expiryMustBeFuture` | 256 nilai `uint256` acak | Semua kombinasi taat invariant "expiry harus masa depan" | PASS seluruh runs | **PASS** — `testFuzz_grantViewingKey_expiryMustBeFuture(uint256) (runs: 256, μ: 46480, ~: 46480)` | **Handal** |
| AU-047 | Fuzz `isAuditorActive` | `forge test --match-test testFuzz_isAuditorActive_timeBased` | 256 nilai `uint256` acak | Semua kombinasi konsisten dengan status aktif/expired | PASS seluruh runs | **PASS** — `testFuzz_isAuditorActive_timeBased(uint256) (runs: 256, μ: 45832, ~: 45832)` | **Handal** |
| AU-048 | Stress klaim EWA mendekati rate limit | Manual, 9 klaim berurutan, ukur waktu konfirmasi | 9 klaim dalam 1 jam | P95 ≤5 detik (NFR-PAYANA-02) | Sesuai/tidak | **Belum dieksekusi** — butuh testnet Base Sepolia + Pimlico bundler aktif, tidak dapat dijalankan dari lingkungan asisten otomatis ini | Pending |
| AU-049 | Load test `/auth/me` & `/bundler/relay` | `autocannon`/`k6` terhadap backend lokal | N concurrent request | P99 ≤500ms (NFR-PAYANA-01) | Sesuai/tidak | **Belum dieksekusi** — backend lokal (Postgres + env) belum di-bootstrap di sesi ini; secara teknis dapat dijalankan otomatis pada sesi pengujian berikutnya karena tidak memerlukan testnet, hanya server lokal | Pending |
| AU-050 | SUS onboarding | Kuesioner 10 pertanyaan ke 2–3 responden | Responden non-teknis | Skor ≥68 | Sesuai/tidak | **Belum dieksekusi** — butuh responden manusia | Pending |
| AU-051 | Task success: HR deploy vault + tambah karyawan | Observasi responden | Skenario tugas | Selesai tanpa bantuan | Sesuai/tidak | **Belum dieksekusi** | Pending |
| AU-052 | Task success: karyawan klaim EWA | Observasi responden | Skenario tugas | Selesai tanpa bantuan | Sesuai/tidak | **Belum dieksekusi** | Pending |
| AU-053 | Pemahaman pesan error oleh non-teknis | Tunjukkan 3 pesan error, tanya pemahaman | 3 pesan error sistem | Responden paham maksud & tindakan | Sesuai/tidak | **Belum dieksekusi** | Pending |

### 5.1 Ringkasan Hasil

| Status | Jumlah Butir Uji | Daftar AU |
|---|---|---|
| **Handal** (PASS, hasil nyata) | 13 | AU-010, AU-011, AU-013, AU-018, AU-021, AU-027, AU-028, AU-029, AU-030, AU-041, AU-043 (guard), AU-046, AU-047 |
| **Tidak Handal** | 2 | AU-022 (inkonsistensi dokumentasi), AU-042 (fitur belum ada) |
| **Tidak dapat disimpulkan** (infrastruktur FHE belum tersedia) | 2 | AU-040, AU-043 (bagian agregasi FHE nyata) |
| **Pending** (belum dieksekusi — manual/perlu infrastruktur tambahan) | 36 | sisanya |
| **Gap test coverage teridentifikasi** (tidak ada test otomatis sama sekali untuk fungsi terkait) | 8 area | AU-009 (vault freeze), AU-012 (HR access guard di startStream), AU-017/019/020 (kasus error PHK), AU-023–026 (seluruh cliff vesting), AU-031 (batas pinjaman atas), AU-037/044/045 (seluruh `PayrollFactory.sol`) |

### 5.2 Catatan Penting untuk Bab Kesimpulan/Saran TA

1. **Smart contract layer** (CompanyVault inti, koperasi, SBT) memiliki fondasi unit test yang solid: 77 test PASS, mencakup hampir seluruh happy path UC-04, UC-05, UC-06/07, UC-08, UC-11, UC-12.
2. **Tiga gap coverage paling signifikan** layak disebut eksplisit di laporan TA: (a) **`PayrollFactory.sol` tidak memiliki file test sama sekali** meski jadi entry point seluruh sistem (UC-02, UC-15, UC-20); (b) **cliff vesting (UC-09/UC-10) tidak punya test otomatis sama sekali**; (c) **FHE (UC-17/18/19) sebagian besar di-skip** karena bergantung pada Inco co-processor live yang tidak tersedia di lingkungan pengujian lokal.
3. **Backend dan frontend tidak punya automated test apa pun** — seluruh butir uji di lapisan ini (Auth, Owner, Compliance, Dashboard UI) bergantung pada pengujian manual oleh penulis, dicatat sebagai "Pending" sampai dijalankan langsung.
4. **UC-18 (viewing key) dan UC-20 (platform fee UI)** sebaiknya ditandai di laporan TA sebagai **"belum diimplementasikan"**, bukan "gagal diuji" — supaya jelas bahwa kekosongan ini adalah batas scope MVP, bukan bug.
5. **AU-049 dan AU-046/047** adalah satu-satunya butir uji non-fungsional (stress) yang realistis dijalankan otomatis tanpa testnet — disarankan diprioritaskan duluan saat sesi pengujian manual berikutnya.
