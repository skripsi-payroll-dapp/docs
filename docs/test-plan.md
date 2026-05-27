# Test Plan — Payana Payroll Web3

> **Versi Dokumen:** v1.0
> **Tanggal:** 27 Mei 2026
> **Proyek:** Payana — Platform Payroll Berbasis Blockchain (Skripsi)
> **Network Pengujian:** Base Sepolia Testnet (Chain ID: 84532)
> **Disusun oleh:** Tim Pengembang Payana

---

## 1. Tujuan Pengujian

Dokumen Test Plan ini disusun sebagai panduan pelaksanaan pengujian perangkat lunak terhadap platform **Payana**, sebuah sistem payroll berbasis blockchain yang dikembangkan sebagai proyek skripsi. Pengujian bertujuan untuk:

1. **Memverifikasi fungsionalitas** — memastikan setiap fitur platform bekerja sesuai dengan spesifikasi yang telah ditetapkan dalam dokumen *Product Requirements Document* (PRD) dan *Functional Requirements*.
2. **Mengidentifikasi kegagalan** — menemukan bug, error, atau perilaku tidak terduga sebelum produk diserahkan atau dipresentasikan.
3. **Memvalidasi integrasi** — memastikan komponen frontend, backend (API), smart contract on-chain, dan ponder indexer bekerja secara sinergis.
4. **Menjamin keamanan akses** — memverifikasi bahwa kontrol akses berbasis peran (RBAC) bekerja dengan benar sehingga setiap pengguna hanya dapat mengakses fitur yang sesuai dengan perannya.
5. **Mendukung kelayakan skripsi** — menyediakan dokumentasi pengujian yang terstruktur dan formal sebagai bagian dari laporan pertanggungjawaban akademik.

Pengujian difokuskan pada aspek **fungsionalitas dari sisi pengguna** (end-to-end) tanpa mengasumsikan pengetahuan tentang implementasi internal sistem.

---

## 2. Ruang Lingkup Pengujian

### 2.1 Fitur yang Diuji (In Scope)

| No | Modul | Deskripsi Cakupan |
|---|---|---|
| 1 | **Auth & Onboarding** | Login via Privy (email OTP), deteksi role, form validasi, siklus status registrasi |
| 2 | **Owner SaaS** | Manajemen akses halaman /owner, persetujuan dan penolakan registrasi, filter status |
| 3 | **HR — Vault** | Inisialisasi vault baru, top up saldo IDRX, verifikasi saldo setelah deposit |
| 4 | **HR — Manajemen Karyawan** | Tambah karyawan (startStream), pause/resume stream, lihat detail, propose PHK |
| 5 | **PHK Multi-Sig** | Alur proposal PHK oleh HR, persetujuan oleh Legal, eksekusi PHK, mekanisme expire |
| 6 | **EWA — Karyawan** | Akrual saldo real-time, klaim EWA, rate limit klaim per jam |
| 7 | **Koperasi Digital** | Pinjam IDRX dari pool dengan batas 80% gaji, auto-repay saat klaim EWA |
| 8 | **Cliff Vesting** | Pembuatan vest oleh HR, proteksi klaim sebelum cliff date, klaim setelah cliff date |

### 2.2 Fitur yang Tidak Diuji (Out of Scope)

| No | Item | Alasan |
|---|---|---|
| 1 | **Unit Testing Smart Contract** | Dilakukan terpisah menggunakan Foundry/Hardhat (bukan black box testing) |
| 2 | **Performance / Load Testing** | Di luar cakupan skripsi; platform masih dalam tahap MVP |
| 3 | **Penetration Testing** | Memerlukan tooling dan keahlian khusus; bukan fokus skripsi |
| 4 | **Export Laporan Compliance (CSV)** | Fitur reporting masih dalam tahap pengembangan |
| 5 | **Integrasi BPJS/PPh21 Eksternal** | Memerlukan koneksi ke sistem pemerintah yang tidak tersedia di testnet |
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
| **Functional Testing** | Memverifikasi bahwa fitur menghasilkan output sesuai spesifikasi | Seluruh 33 test case |
| **Happy Path Testing** | Skenario ideal dengan input valid dan kondisi normal | 24 test case |
| **Negative / Bad Path Testing** | Skenario dengan input tidak valid, kondisi error, atau akses tidak sah | 9 test case |
| **End-to-End Testing** | Pengujian alur lengkap melibatkan frontend, backend, dan blockchain | TC-AUTH-04→05, TC-PHK-01→03 |
| **Access Control Testing** | Verifikasi bahwa pembatasan akses berbasis peran berjalan dengan benar | TC-OWN-02, TC-HR-09, TC-AUTH-06 |

### 3.3 Skala Prioritas Test Case

| Prioritas | Definisi | Konsekuensi Kegagalan |
|---|---|---|
| **P0 — Kritikal** | Fungsionalitas inti yang wajib berjalan | Sistem tidak dapat digunakan; rilis diblokir |
| **P1 — Tinggi** | Fungsionalitas penting yang mempengaruhi pengalaman pengguna | Pengalaman terdegradasi; perlu diperbaiki sebelum rilis |
| **P2 — Sedang** | Fungsionalitas tambahan atau informatif | Berdampak minor; dapat ditangani setelah rilis |

### 3.4 Klasifikasi Skenario

Setiap test case diklasifikasikan ke dalam dua skenario:

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
| **Ponder Indexer** | `http://localhost:42069/graphql` |
| **Database** | PostgreSQL (lokal atau Supabase dev instance) |

### 4.2 Smart Contract yang Digunakan

| Kontrak | Alamat (Base Sepolia) |
|---|---|
| PayrollContract | `0x05b1DF6d82356CC256D1265cD185B4222E4745b3` |
| EmployeeLiquidityContract | `0x872af14287370BAFC883237EF390E367d38a8A33` |
| EmploymentSBT | `0xCB5118AF36907165496Dc028b441ad9152D2D264` |
| IDRX Token (Testnet) | Faucet Base Sepolia |

### 4.3 Akun Pengujian

| Peran | Keterangan |
|---|---|
| **Owner SaaS** | Alamat wallet = nilai `OWNER_ADDRESS` di `.env` backend |
| **HR Manager** | Akun Privy yang sudah terdaftar dan diapprove sebagai `hr` |
| **Karyawan** | Akun Privy yang sudah terdaftar, diapprove, dan memiliki stream aktif |
| **Legal Officer** | Akun Privy yang sudah terdaftar dan diapprove sebagai `legal` |
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

Seluruh pengujian menggunakan token **IDRX** di jaringan Base Sepolia Testnet. Token ini diperoleh dari faucet testnet dan tidak memiliki nilai ekonomi nyata. Tidak ada pengujian yang menggunakan aset mainnet.

---

## 5. Kriteria Keberhasilan Pengujian

### 5.1 Kriteria Lulus (Pass Criteria)

Pengujian dinyatakan berhasil dan sistem layak untuk presentasi/rilis apabila memenuhi seluruh kriteria berikut:

| No | Kriteria | Threshold |
|---|---|---|
| 1 | **Semua test case P0 lulus** | 100% dari 20 test case P0 harus berstatus ✅ Pass |
| 2 | **Mayoritas test case P1 lulus** | Minimal 90% dari 12 test case P1 harus berstatus ✅ Pass |
| 3 | **Tidak ada critical bug yang belum diselesaikan** | 0 bug P0 yang masih terbuka |
| 4 | **Alur end-to-end utama berjalan** | Alur Onboarding → Approval → Login → Klaim EWA harus berjalan tanpa error |
| 5 | **Kontrol akses berfungsi** | Seluruh test case access control (TC-OWN-02, TC-HR-09) harus lulus |

### 5.2 Kriteria Gagal (Fail Criteria)

Pengujian dinyatakan gagal apabila terjadi salah satu dari kondisi berikut:

- Lebih dari 1 test case P0 berstatus ❌ Fail
- Ditemukan bug yang menyebabkan hilangnya data pengguna atau aset keuangan
- Kontrol akses dapat di-bypass oleh pengguna tanpa otoritas
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

Estimasi waktu pengujian berdasarkan kompleksitas dan jumlah test case per modul. Pengujian dilakukan secara berurutan mengikuti dependensi antar modul (Auth harus selesai sebelum modul lain dapat diuji).

| No | Modul | Jumlah TC | Estimasi Durasi | Dependensi |
|---|---|---|---|---|
| 1 | Auth & Onboarding | 6 | 1 hari | — |
| 2 | Owner SaaS | 6 | 1 hari | Auth (TC-AUTH-04) |
| 3 | HR — Vault | 3 | 0,5 hari | Auth + Owner (akun HR approved) |
| 4 | HR — Karyawan | 6 | 1 hari | HR Vault (vault aktif dan bersaldo) |
| 5 | PHK Multi-Sig | 4 | 1 hari | HR Karyawan (stream aktif) |
| 6 | EWA — Karyawan | 3 | 0,5 hari | HR Karyawan (stream aktif) |
| 7 | Koperasi Digital | 2 | 0,5 hari | EWA (stream aktif) |
| 8 | Cliff Vesting | 3 | 0,5 hari | HR Vault (vault bersaldo) |
| — | **Dokumentasi & Rekap** | — | 1 hari | Semua modul selesai |
| — | **Total** | **33** | **~7 hari kerja** | — |

> **Catatan:** Estimasi 7 hari kerja mengasumsikan satu penguji bekerja penuh. Durasi dapat berkurang jika pengujian dilakukan paralel oleh lebih dari satu orang.

---

## 7. Tabel Rekap Test Case per Modul

Tabel berikut merangkum seluruh test case yang tercakup dalam pengujian, dikelompokkan berdasarkan modul dengan rincian jumlah dan skala prioritas.

| Modul | Total TC | P0 (Kritikal) | P1 (Tinggi) | P2 (Sedang) |
|---|---|---|---|---|
| **AUTH — Auth & Onboarding** | 6 | 5 | 1 | 0 |
| **OWN — Owner SaaS** | 6 | 5 | 1 | 0 |
| **HR — Vault & Karyawan** | 9 | 5 | 3 | 1 |
| **PHK — Multi-Sig PHK** | 4 | 3 | 1 | 0 |
| **EWA — Earned Wage Access** | 3 | 2 | 1 | 0 |
| **KOP — Koperasi Digital** | 2 | 0 | 2 | 0 |
| **VEST — Cliff Vesting** | 3 | 0 | 3 | 0 |
| **Total** | **33** | **20** | **12** | **1** |

### 7.1 Rincian Test Case per Modul

#### Modul AUTH — Autentikasi & Onboarding (6 TC)

| TC-ID | Nama Test | Tipe | Prioritas |
|---|---|---|---|
| TC-AUTH-01 | Login dengan Privy (Email OTP) berhasil | Happy | P0 |
| TC-AUTH-02 | Deteksi role dan redirect sesuai peran | Happy | P0 |
| TC-AUTH-03 | Validasi form onboarding: input tidak valid | Bad | P0 |
| TC-AUTH-04 | Submit pendaftaran → status "pending" | Happy | P0 |
| TC-AUTH-05 | Login ulang setelah approved → tidak redirect ke /onboarding | Happy | P0 |
| TC-AUTH-06 | Login ulang setelah rejected → tampilkan state rejected | Bad | P1 |

#### Modul OWN — Owner SaaS (6 TC)

| TC-ID | Nama Test | Tipe | Prioritas |
|---|---|---|---|
| TC-OWN-01 | Akses /owner berhasil untuk OWNER_ADDRESS | Happy | P0 |
| TC-OWN-02 | Akses /owner diblokir untuk non-owner | Bad | P0 |
| TC-OWN-03 | Lihat daftar pending registrations | Happy | P0 |
| TC-OWN-04 | Approve registrasi → status berubah ke "approved" | Happy | P0 |
| TC-OWN-05 | Tolak registrasi → status berubah ke "rejected" | Happy | P0 |
| TC-OWN-06 | Tab filter Pending/Approved/Rejected berfungsi | Happy | P1 |

#### Modul HR — Vault & Manajemen Karyawan (9 TC)

| TC-ID | Nama Test | Tipe | Prioritas |
|---|---|---|---|
| TC-HR-01 | Deploy vault baru (HR baru) | Happy | P0 |
| TC-HR-02 | Top up vault dengan IDRX | Happy | P0 |
| TC-HR-03 | Saldo vault terupdate setelah top up | Happy | P0 |
| TC-HR-04 | Tambah karyawan → startStream on-chain | Happy | P0 |
| TC-HR-05 | Pause stream karyawan | Happy | P1 |
| TC-HR-06 | Resume stream karyawan | Happy | P1 |
| TC-HR-07 | Lihat detail karyawan | Happy | P2 |
| TC-HR-08 | Propose PHK oleh HR | Happy | P0 |
| TC-HR-09 | Akses halaman HR diblokir untuk non-HR | Bad | P0 |

#### Modul PHK — Multi-Sig Pemutusan Hubungan Kerja (4 TC)

| TC-ID | Nama Test | Tipe | Prioritas |
|---|---|---|---|
| TC-PHK-01 | Propose PHK → status "Menunggu Legal" | Happy | P0 |
| TC-PHK-02 | Approve oleh Legal → status "Siap Dieksekusi" | Happy | P0 |
| TC-PHK-03 | Execute PHK → stream dibatalkan, severance dirilis | Happy | P0 |
| TC-PHK-04 | Proposal PHK expire setelah 7 hari | Bad | P1 |

#### Modul EWA — Earned Wage Access (3 TC)

| TC-ID | Nama Test | Tipe | Prioritas |
|---|---|---|---|
| TC-EWA-01 | Saldo EWA terakru real-time (naik setiap detik) | Happy | P0 |
| TC-EWA-02 | Klaim EWA berhasil → saldo reset ke 0 | Happy | P0 |
| TC-EWA-03 | Rate limit: maksimal 10 klaim per jam | Bad | P1 |

#### Modul KOP — Koperasi Digital (2 TC)

| TC-ID | Nama Test | Tipe | Prioritas |
|---|---|---|---|
| TC-KOP-01 | Pinjam IDRX dari pool (maksimal 80% gaji) | Happy | P1 |
| TC-KOP-02 | Auto-repay saat klaim EWA berikutnya | Happy | P1 |

#### Modul VEST — Cliff Vesting (3 TC)

| TC-ID | Nama Test | Tipe | Prioritas |
|---|---|---|---|
| TC-VEST-01 | Buat cliff vest oleh HR | Happy | P1 |
| TC-VEST-02 | Tombol klaim disabled sebelum cliff date | Bad | P1 |
| TC-VEST-03 | Klaim vest berhasil setelah cliff date | Happy | P1 |

---

## 8. Manajemen Risiko Pengujian

| Risiko | Kemungkinan | Dampak | Mitigasi |
|---|---|---|---|
| Jaringan testnet tidak stabil | Sedang | Tinggi | Gunakan RPC provider cadangan; jadwalkan pengujian saat jaringan sepi |
| Faucet IDRX testnet habis | Rendah | Tinggi | Siapkan saldo IDRX di beberapa akun sebelum pengujian dimulai |
| Smart contract di-redeploy saat pengujian | Rendah | Kritis | Konfirmasi alamat kontrak sebelum pengujian; perbarui di `black-box-testing.md` |
| Waktu konfirmasi transaksi lama | Sedang | Sedang | Toleransi timeout 60 detik; catat jika melebihi threshold |
| Privy OTP delay | Rendah | Sedang | Siapkan akun cadangan; uji di luar jam sibuk provider |

---

## 9. Referensi Dokumen

| Dokumen | Lokasi |
|---|---|
| Product Requirements Document (PRD) | `prd.md` |
| Functional Requirements — Modul A s.d. F | `functional-requirements/` |
| Black Box Testing (Test Cases Detail) | `black-box-testing.md` |
| Technical Architecture | `technical-architecture.md` |
| Database Definition Language (DDL) | `docs/DDL.sql` |
| Use Case Descriptions | `docs/use-case-descriptions.md` |
