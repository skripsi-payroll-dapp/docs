# Test Plan — Payana Payroll Web3

> **Versi Dokumen:** v2.0 — disesuaikan dengan sistem aktual per 2026-06-25 (Gen7)
> **Tanggal:** 25 Juni 2026
> **Proyek:** Payana — Platform Payroll Berbasis Blockchain (Skripsi)
> **Network Pengujian:** Base Sepolia Testnet (Chain ID: 84532)
> **Disusun oleh:** Tim Pengembang Payana

> **Catatan revisi v2.0:** Versi sebelumnya (v1.0, 27 Mei 2026) merujuk ke struktur modul lama
> dan kontrak Gen1, serta ke file `black-box-testing.md`, `functional-requirements/`, `prd.md`,
> dan `technical-architecture.md` yang ternyata tidak pernah dibuat. Versi ini disusun ulang
> langsung dari sistem yang benar-benar berjalan (frontend, backend, smart contract Gen7) dan
> dari SKPL.md Revisi D — bukan dari rencana modul yang sudah basi. `black-box-testing.md` kini
> benar-benar ada (lihat §9) dengan rincian seluruh test case.

---

## 1. Tujuan Pengujian

Dokumen Test Plan ini disusun sebagai panduan pelaksanaan pengujian perangkat lunak terhadap platform **Payana**, sebuah sistem payroll berbasis blockchain yang dikembangkan sebagai proyek skripsi. Pengujian bertujuan untuk:

1. **Memverifikasi fungsionalitas** — memastikan setiap fitur platform bekerja sesuai dengan FR-PAYANA yang ditetapkan di SKPL.md.
2. **Mengidentifikasi kegagalan** — menemukan bug, error, atau perilaku tidak terduga sebelum produk diserahkan atau dipresentasikan.
3. **Memvalidasi integrasi** — memastikan komponen frontend, backend (API), smart contract on-chain, dan Ponder indexer bekerja secara sinergis.
4. **Menjamin keamanan akses** — memverifikasi bahwa kontrol akses berbasis peran (RBAC) bekerja dengan benar sehingga setiap pengguna hanya dapat mengakses fitur yang sesuai dengan perannya.
5. **Mendukung kelayakan skripsi** — menyediakan dokumentasi pengujian yang terstruktur dan formal sebagai bagian dari laporan pertanggungjawaban akademik.

Pengujian difokuskan pada aspek **fungsionalitas dari sisi pengguna** (end-to-end) tanpa mengasumsikan pengetahuan tentang implementasi internal sistem — lihat §3.1 untuk definisi pendekatan Black Box Testing yang dipakai.

---

## 2. Ruang Lingkup Pengujian

### 2.1 Modul yang Diuji (In Scope)

Daftar modul di bawah ini disusun langsung dari Kelompok FR-PAYANA A–K di SKPL.md (Kelompok L sudah dihapus, lihat Revisi C) ditambah tiga modul yang sudah berjalan di sistem namun belum ber-nomor FR resmi (Attendance, Reimburse, Bounty — gap dokumentasi spec, bukan gap implementasi).

| No | Modul | Kelompok FR | Deskripsi Cakupan |
|---|---|---|---|
| 1 | Auth & Onboarding | A (101–109) | Login EIP-191, refresh/logout token, profil, resolusi role, pengajuan & approval registrasi HR |
| 2 | Owner SaaS — Vault & Platform | B, J (201–208, 1001–1008) | Deploy/top-up/withdraw vault, konfigurasi split, freeze, dashboard seluruh tenant, protocol fee, **penangguhan & reaktivasi akses klien (baru)** |
| 3 | Manajemen Stream Karyawan | C (301–306) | Start/pause/resume/update/cancel stream gaji |
| 4 | EWA — Earned Wage Access | D (401–405) | Akrual real-time, klaim gasless via ERC-4337, rate limit, status transaksi |
| 5 | PHK & Resign | E (501–506) | Proposal PHK multi-sig HR→Legal, eksekusi, expiry, resign mandiri, pesangon otomatis |
| 6 | Cliff Vesting | F (601–605) | Pembuatan, klaim setelah cliff, pembatalan/penyitaan oleh HR |
| 7 | Koperasi Karyawan | G (701–706) | Deposit/withdraw pool, pinjaman + auto-repay, **freeze/unfreeze pool darurat (baru)** |
| 8 | Kepatuhan & Pelaporan | H (801–805) | Akumulasi compliance, konfigurasi tarif BPJS/PPh21, withdraw, export CSV, **rekonsiliasi pembayaran aktual (baru)** |
| 9 | Sertifikasi Ketenagakerjaan (SBT) | I (901–905) | Mint otomatis, soulbound (non-transferable), revoke saat offboarding, verifikasi pihak ketiga |
| 10 | Kerahasiaan Gaji (FHE) | K (1101–1105) | Set gaji terenkripsi, dekripsi mandiri, agregasi homomorfik, **UI grant/revoke akses auditor (baru)** |
| 11 | Attendance | — (belum ber-FR) | Clock-in/clock-out karyawan, rekap HR |
| 12 | Reimburse | — (belum ber-FR) | Klaim reimburse karyawan, approve/reject + payout HR |
| 13 | Bounty | — (belum ber-FR) | Pembuatan bounty oleh HR, submit proof + payout karyawan |

### 2.2 Modul yang Tidak Diuji via Black Box (Out of Scope)

| No | Item | Alasan |
|---|---|---|
| 1 | **Unit Testing Smart Contract** | Dilakukan terpisah menggunakan Foundry (`forge test`) — 90/96 test pass, 6 skip FHE; bukan black box testing |
| 2 | **Load/Stress Testing** | **Sudah dilakukan secara terpisah** menggunakan k6 + InfluxDB + Grafana (lihat `stress-test/README.md` dan SKPL.md NFR-PAYANA-01 Revisi D) — bukan bagian dari black box testing karena mengukur performa di bawah beban, bukan kebenaran fungsional |
| 3 | **`POST /bundler/relay` di bawah beban** | Sengaja tidak dimasukkan ke stress test maupun ke pengujian volume tinggi manapun — endpoint ini mengirim transaksi nyata via Pimlico Paymaster ke Base Sepolia; pengujian fungsionalnya tetap dilakukan satu-per-satu sebagai bagian dari TC EWA |
| 4 | **Penetration Testing** | Memerlukan tooling dan keahlian khusus; bukan fokus skripsi |
| 5 | **Integrasi BPJS/PPh21 Eksternal ke DJP/Pemerintah** | Tidak tersedia API resmi pemerintah untuk diintegrasikan — sesuai keputusan desain FR-PAYANA-805 (rekonsiliasi tetap manual, lihat SKPL Kelompok H) |
| 6 | **Multi-browser Automation** | Pengujian manual pada Chrome dan Firefox sudah memadai untuk skripsi |
| 7 | **Notifikasi Email/Push** | Fitur notifikasi belum diimplementasikan pada versi MVP |

---

## 3. Pendekatan Pengujian

### 3.1 Metodologi

Pengujian menggunakan pendekatan **Black Box Testing**, di mana pengujian dilakukan dari perspektif pengguna akhir tanpa akses atau pengetahuan tentang implementasi internal (source code, logika smart contract, atau skema database). Setiap test case hanya mempertimbangkan:

- **Input:** data yang dimasukkan ke sistem
- **Aksi:** langkah yang dilakukan oleh pengguna di antarmuka
- **Output:** respons yang ditampilkan oleh sistem

### 3.2 Jenis Pengujian

| Jenis Pengujian | Deskripsi | Penerapan |
|---|---|---|
| **Functional Testing** | Memverifikasi bahwa fitur menghasilkan output sesuai FR-PAYANA terkait | Seluruh test case di `black-box-testing.md` |
| **Happy Path Testing** | Skenario ideal dengan input valid dan kondisi normal | Mayoritas test case |
| **Negative / Bad Path Testing** | Skenario dengan input tidak valid, kondisi error, atau akses tidak sah | Minimal 1 per modul |
| **End-to-End Testing** | Pengujian alur lengkap melibatkan frontend, backend, dan blockchain | Alur PHK, Penangguhan Klien, EWA→Koperasi auto-repay |
| **Access Control Testing** | Verifikasi bahwa pembatasan akses berbasis peran (dan status suspensi) berjalan dengan benar | TC-AUTH-09, TC-AUTH-10, TC-OWN-04 |

### 3.3 Skala Prioritas Test Case

| Prioritas | Definisi | Konsekuensi Kegagalan |
|---|---|---|
| **P0 — Kritikal** | Fungsionalitas inti yang wajib berjalan | Sistem tidak dapat digunakan; rilis diblokir |
| **P1 — Tinggi** | Fungsionalitas penting yang mempengaruhi pengalaman pengguna | Pengalaman terdegradasi; perlu diperbaiki sebelum rilis |
| **P2 — Sedang** | Fungsionalitas tambahan atau informatif | Berdampak minor; dapat ditangani setelah rilis |

### 3.4 Klasifikasi Skenario

- **Happy Path:** Input valid, kondisi sistem normal — sistem diharapkan berhasil menyelesaikan operasi
- **Bad Path:** Input tidak valid, kondisi edge case, atau upaya akses tidak sah — sistem diharapkan menolak dengan pesan error yang informatif

---

## 4. Lingkungan Pengujian

### 4.1 Infrastruktur

| Komponen | Konfigurasi |
|---|---|
| **Blockchain Network** | Base Sepolia Testnet (Chain ID: 84532) |
| **RPC Provider** | Alchemy / Base Sepolia Public RPC |
| **Frontend** | Next.js 15 — `http://localhost:3000` (atau staging URL) |
| **Backend API** | Node.js/Express — `http://localhost:3001` |
| **Ponder Indexer** | REST API (Hono) — `http://localhost:42069` (bukan GraphQL — lihat `ponder/src/api/index.ts`) |
| **Database** | PostgreSQL (Docker lokal `payroll_postgres`; Azure PostgreSQL untuk staging/prod) |

### 4.2 Smart Contract yang Digunakan (Gen7 — per 2026-06-25)

| Kontrak | Alamat (Base Sepolia) |
|---|---|
| PayrollFactory | `0xF62dF08b38c6Fbde33E24208BA044907475ca815` |
| EmployeeLiquidityContract | `0xf78DF2c5BDc5c6c53800DeafD6399025155DE02e` |
| EmploymentSBT | `0x8dA9B60814536364daF77a82cb56B31226De4B62` |
| ConfidentialCompanyVault (Demo, single-tenant) | `0x4560968670Dd852dACd73c7B8748695eC427e203` |
| IDRX Token (Testnet/Mock) | `0x0996e627cE22C4FE2D5c4788b159a83C065D6d09` |

> **Catatan:** Alamat-alamat di atas berubah setiap kali `CompanyVault.sol` diubah (PayrollFactory
> meng-embed bytecode penciptaan `CompanyVault` secara penuh — lihat `RedeployGen7.s.sol`).
> Konfirmasi alamat aktual di `finley-payroll/.env` sebelum memulai sesi pengujian — JANGAN
> menyalin alamat dari dokumen ini tanpa verifikasi, karena dapat sudah usang lagi di generasi
> berikutnya. Vault Gen1–Gen6 yang orphan dapat dipulihkan via `/legacy-recovery`.

### 4.3 Akun Pengujian

| Peran | Keterangan |
|---|---|
| **Owner SaaS** | Alamat wallet = nilai `OWNER_ADDRESS` di `.env` backend |
| **HR Manager** | Akun Privy yang sudah terdaftar dan diapprove sebagai `hr` (demo: "pt test 1" / "PT Payana Demo", HR `0xF37a0eA147B119019f93D62E4BA174CDfB6F7A5d`, vault Gen7 `0xB08e4Da71Dd928099842292F02cb9F4eCc9d83Cf`) |
| **Karyawan** | Akun Privy yang sudah terdaftar, diapprove, dan memiliki stream aktif |
| **Legal Officer** | Akun Privy yang sudah terdaftar dan diapprove sebagai `legal` |
| **Auditor (FHE)** | Akun yang diberi viewing key terdelegasi via `/hr/auditor` — hanya relevan untuk perusahaan demo confidential vault |
| **Pengguna Baru** | Akun Privy yang belum pernah mendaftar (belum ada di database) |

### 4.4 Browser dan Perangkat

| Dimensi | Detail |
|---|---|
| **Browser Utama** | Google Chrome (versi terbaru) |
| **Browser Sekunder** | Mozilla Firefox (versi terbaru) |
| **Resolusi Desktop** | 1920x1080 px dan 1440x900 px |
| **Resolusi Mobile** | 375x812 px (simulasi iPhone SE / iPhone 12) |
| **Sistem Operasi** | Windows 11 / macOS |

### 4.5 Token Pengujian

Seluruh pengujian menggunakan token **IDRX** di jaringan Base Sepolia Testnet. Token ini diperoleh dari faucet testnet/mint admin dan tidak memiliki nilai ekonomi nyata. Tidak ada pengujian yang menggunakan aset mainnet.

---

## 5. Kriteria Keberhasilan Pengujian

### 5.1 Kriteria Lulus (Pass Criteria)

| No | Kriteria | Threshold |
|---|---|---|
| 1 | **Semua test case P0 lulus** | 100% test case P0 harus berstatus ✅ Pass |
| 2 | **Mayoritas test case P1 lulus** | Minimal 90% test case P1 harus berstatus ✅ Pass |
| 3 | **Tidak ada critical bug yang belum diselesaikan** | 0 bug P0 yang masih terbuka |
| 4 | **Alur end-to-end utama berjalan** | Onboarding → Approval → Login → Klaim EWA, dan Suspend → Reaktivasi Klien, harus berjalan tanpa error |
| 5 | **Kontrol akses berfungsi** | Seluruh test case access control (§3.2) harus lulus |

### 5.2 Kriteria Gagal (Fail Criteria)

- Lebih dari 1 test case P0 berstatus ❌ Fail
- Ditemukan bug yang menyebabkan hilangnya data pengguna atau aset keuangan
- Kontrol akses (termasuk status suspensi klien) dapat di-bypass oleh pengguna tanpa otoritas
- Sistem crash atau tidak dapat diakses selama lebih dari 5 menit berturut-turut saat pengujian
- Smart contract mengalami revert pada skenario Happy Path yang seharusnya berhasil

### 5.3 Definisi Bug

| Tingkat | Definisi |
|---|---|
| **Critical (P0)** | Bug yang menyebabkan fitur utama tidak dapat digunakan atau data hilang/rusak |
| **Major (P1)** | Bug yang mengganggu alur kerja utama namun ada workaround |
| **Minor (P2)** | Bug kosmetik, typo, atau perilaku tidak konsisten yang tidak mengganggu fungsi |

---

## 6. Jadwal Pengujian

| No | Modul | Estimasi Durasi | Dependensi |
|---|---|---|---|
| 1 | Auth & Onboarding | 1 hari | — |
| 2 | Owner SaaS — Vault & Platform (termasuk Suspend/Reaktivasi) | 1,5 hari | Auth |
| 3 | Manajemen Stream Karyawan | 0,5 hari | Owner SaaS (vault aktif) |
| 4 | EWA | 0,5 hari | Stream aktif |
| 5 | PHK & Resign | 1 hari | Stream aktif |
| 6 | Cliff Vesting | 0,5 hari | Vault bersaldo |
| 7 | Koperasi (termasuk Freeze/Unfreeze) | 1 hari | EWA (stream aktif) |
| 8 | Kepatuhan & Pelaporan (termasuk Rekonsiliasi) | 1 hari | EWA (ada data klaim) |
| 9 | SBT | 0,5 hari | Stream aktif |
| 10 | Kerahasiaan Gaji / FHE (termasuk UI Auditor) | 0,5 hari | Vault confidential demo |
| 11 | Attendance, Reimburse, Bounty | 1 hari | Stream aktif |
| — | **Dokumentasi & Rekap** | 1 hari | Semua modul selesai |
| — | **Total** | **~10 hari kerja** | — |

---

## 7. Tabel Rekap Test Case per Modul

Rincian penuh tiap test case (Input/Aksi/Output) ada di `black-box-testing.md`. Tabel di bawah hanya rekap jumlah dan prioritas.

| Modul | Total TC | P0 | P1 | P2 |
|---|---|---|---|---|
| AUTH | 10 | 7 | 3 | 0 |
| OWN (Vault & Platform) | 14 | 6 | 7 | 1 |
| STREAM | 5 | 1 | 3 | 1 |
| EWA | 5 | 3 | 2 | 0 |
| PHK | 5 | 3 | 2 | 0 |
| VEST | 4 | 0 | 3 | 1 |
| KOP | 6 | 0 | 5 | 1 |
| COMP | 4 | 0 | 3 | 1 |
| SBT | 4 | 0 | 3 | 1 |
| FHE | 4 | 0 | 0 | 4 |
| ATT | 2 | 0 | 0 | 2 |
| RMB | 3 | 0 | 2 | 1 |
| BTY | 2 | 0 | 0 | 2 |
| **Total** | **68** | **20** | **33** | **15** |

---

## 8. Manajemen Risiko Pengujian

| Risiko | Kemungkinan | Dampak | Mitigasi |
|---|---|---|---|
| Jaringan testnet tidak stabil | Sedang | Tinggi | Gunakan RPC provider cadangan; jadwalkan pengujian saat jaringan sepi |
| Faucet/mint IDRX testnet habis | Rendah | Tinggi | Siapkan saldo IDRX di beberapa akun sebelum pengujian dimulai |
| Smart contract di-redeploy saat pengujian (sudah terjadi 7x: Gen1–Gen7) | Sedang | Kritis | Konfirmasi alamat kontrak di `.env` sebelum tiap sesi pengujian; JANGAN hardcode dari dokumen ini |
| Waktu konfirmasi transaksi lama | Sedang | Sedang | Toleransi timeout 60 detik; catat jika melebihi threshold |
| Privy OTP delay | Rendah | Sedang | Siapkan akun cadangan; uji di luar jam sibuk provider |
| Akun HR demo ("pt test 1") tertangguhkan tidak sengaja saat menguji TC-OWN-04 | Sedang | Sedang | Selalu jalankan TC-OWN-05 (reaktivasi) segera setelah TC-OWN-04 dalam sesi yang sama, jangan biarkan tergantung antar sesi |

---

## 9. Referensi Dokumen

| Dokumen | Lokasi |
|---|---|
| Spesifikasi Kebutuhan Perangkat Lunak (SKPL) | `SKPL.md` |
| Deskripsi Perancangan Perangkat Lunak (DPPL) | `DPPL.md` |
| Black Box Testing (Test Cases Detail) | `black-box-testing.md` |
| Catatan Update SKPL/DPPL | `CATATAN_UPDATE_SKPL_DPPL.md` |
| Stress/Load Testing (k6 + Grafana) | `../../stress-test/README.md` |
| Database Definition Language (DDL) | `DDL.sql` |
| Use Case Descriptions | `use-case-descriptions.md` |
