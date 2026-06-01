# Open Questions

> Format ini dirancang sebagai **Notion Database**. Setiap entry memiliki properti terstruktur untuk tracking status, owner, dan deadline.

---

## Database Schema (Notion)

| Property | Type | Options |
|---|---|---|
| `ID` | Text | OQ-001, OQ-002, ... |
| `Pertanyaan` | Title | — |
| `Kategori` | Select | Tech, Legal, Product, Business |
| `Owner` | Person | Tech Lead, Legal, CEO/CTO, Product |
| `Deadline` | Date | Sprint number atau tanggal |
| `Status` | Select | Open, In Progress, Resolved, Blocked |
| `Dampak Jika Tidak Resolved` | Text | — |
| `Keputusan` | Text | Diisi saat resolved |

---

## Open Questions

---

### OQ-001 · Ketersediaan IDRX di Base / Ethereum

| Property | Value |
|---|---|
| **Kategori** | Tech |
| **Owner** | Tech Lead |
| **Deadline** | Sprint 1 (sebelum mulai implementasi token) |
| **Status** | ⬜ Open |

**Pertanyaan:**
> Apakah IDRX sudah tersedia sebagai ERC-20 di Base mainnet? Jika belum, apakah bridge dari Ethereum mainnet tersedia, atau USDC menjadi fallback untuk MVP?

**Konteks:**
IDRX diterbitkan oleh PT Xurya Daya Indonesia dan tersedia sebagai ERC-20 di Ethereum mainnet. Namun ketersediaan di Base L2 perlu dikonfirmasi. Jika hanya ada di Ethereum mainnet, biaya bridge perlu dipertimbangkan. Seluruh sistem dibangun di atas IDRX sebagai Rupiah stablecoin.

**Opsi yang Tersedia:**
| Opsi | Pro | Kon |
|---|---|---|
| IDRX native di Base | User familiar dengan Rupiah, biaya rendah | Perlu koordinasi dengan issuer |
| Bridge IDRX dari ETH mainnet | IDRX sudah ada di ETH mainnet | Bridge latency + biaya bridge |
| USDC sebagai fallback | Tersedia di Base, liquid | Bukan Rupiah — konversi diperlukan |
| Custom test token | Bisa test sekarang | Tidak production-ready |

**Dampak Jika Tidak Resolved Sebelum Sprint 1:**
Implementasi token logic akan menggunakan mock ERC-20 token — migrasi ke IDRX di Sprint 6 akan butuh re-test seluruh split logic.

**Keputusan:**
```
[ Diisi saat resolved ]
Tanggal: ___
Keputusan: ___
Alasan: ___
```

---

### OQ-002 · Formula Severance UU Cipta Kerja

| Property | Value |
|---|---|
| **Kategori** | Legal |
| **Owner** | Legal |
| **Deadline** | Sprint 2 (sebelum SeveranceVault diimplementasi) |
| **Status** | ⬜ Open |

**Pertanyaan:**
> Berapa persentase severance default per claim yang paling sesuai dengan UU Cipta Kerja Pasal 156? Bagaimana formula kalibrasi `tenure_months` on-chain?

**Konteks:**
Saat ini diasumsikan 2% per claim terakumulasi di SeveranceVault. Namun formula pesangon aktual bergantung pada masa kerja (`tenure_months`) dan gaji terakhir — bukan persentase flat per claim.

**Pertanyaan Turunan:**
1. Apakah akumulasi 2% per claim sudah cukup untuk memenuhi kewajiban pesangon sesuai UU?
2. Bagaimana jika dana di SeveranceVault kurang saat PHK? Siapa yang menanggung selisihnya?
3. Apakah ada komponen pesangon lain (UPMK, UPH) yang harus dipertimbangkan?

**Referensi:**
- UU Cipta Kerja No. 11/2020 Pasal 156
- PP 35/2021 tentang PKWT, Alih Daya, Waktu Kerja, Waktu Istirahat, dan PHK

**Dampak Jika Tidak Resolved Sebelum Sprint 2:**
`SeveranceVault` diimplementasi dengan formula salah — perlu refactor besar di Sprint 6.

**Keputusan:**
```
[ Diisi saat resolved ]
Tanggal: ___
Formula final: ___
Sumber hukum: ___
```

---

### OQ-003 · Firma Audit Smart Contract

| Property | Value |
|---|---|
| **Kategori** | Business |
| **Owner** | CEO / CTO |
| **Deadline** | Sprint 3 (engage firma audit sejak dini) |
| **Status** | ⬜ Open |

**Pertanyaan:**
> Firma audit Solidity/EVM mana yang akan digunakan? Berapa budget dan timeline audit?

**Konteks:**
Smart contract Solidity yang mengelola dana gaji karyawan HARUS diaudit sebelum mainnet. Audit biasanya butuh 4–8 minggu dan perlu di-engage sejak Sprint 3 agar bisa selesai di Sprint 6. Tools tambahan: Slither (static analysis) dan Mythril (symbolic execution) wajib dijalankan sebelum audit eksternal.

**Kandidat Firma Audit:**
| Firma | Spesialisasi | Estimasi Waktu | Estimasi Cost |
|---|---|---|---|
| Trail of Bits | EVM / multi-chain, sangat dalam | 6–10 minggu | $$$$ |
| OpenZeppelin | Solidity specialist | 4–8 minggu | $$$$ |
| ConsenSys Diligence | Ethereum native | 4–8 minggu | $$$ |
| Sherlock | Decentralized audit + contest | 2–4 minggu | $$$ |
| Code4rena | Audit contest (community) | 1–2 minggu | $$ |

**Dampak Jika Tidak Resolved Sebelum Sprint 3:**
Tidak bisa engage firma tepat waktu → audit tertunda → launch mainnet mundur.

**Keputusan:**
```
[ Diisi saat resolved ]
Tanggal: ___
Firma dipilih: ___
Budget disetujui: ___
Timeline audit: ___
```

---

### OQ-004 · Legalitas Koperasi Karyawan

| Property | Value |
|---|---|
| **Kategori** | Legal |
| **Owner** | Legal |
| **Deadline** | Sprint 5 (sebelum koperasi diimplementasi) |
| **Status** | ⬜ Open |

**Pertanyaan:**
> Apakah koperasi karyawan memerlukan izin Kemenkop UKM sebelum go-live, atau cukup dengan internal company policy?

**Konteks:**
Platform berencana membangun koperasi karyawan sebagai closed-loop (hanya karyawan 1 perusahaan) untuk menghindari regulasi OJK Pinjol. Namun koperasi formal di Indonesia memerlukan badan hukum dari Kemenkop UKM.

**Pertanyaan Turunan:**
1. Apakah closed-loop lending antar karyawan masuk dalam definisi "koperasi" per UU No. 25/1992?
2. Apakah ada threshold transaksi/peserta yang membuat wajib daftar ke OJK?
3. Bisakah distrukturkan sebagai "employee benefit program" tanpa izin koperasi formal?

**Referensi:**
- UU Perkoperasian No. 25/1992
- OJK POJK No. 77/2016 tentang Layanan Pinjam Meminjam Uang Berbasis Teknologi Informasi

**Dampak Jika Tidak Resolved Sebelum Sprint 5:**
Koperasi diimplementasi tanpa kepastian legal → risiko shutdown setelah launch.

**Keputusan:**
```
[ Diisi saat resolved ]
Tanggal: ___
Struktur legal yang dipilih: ___
Izin yang diperlukan: ___
```

---

### OQ-005 · Model Bisnis (Revenue)

| Property | Value |
|---|---|
| **Kategori** | Product |
| **Owner** | Product |
| **Deadline** | Pre-launch (sebelum Sprint 6 selesai) |
| **Status** | ⬜ Open |

**Pertanyaan:**
> Model bisnis mana yang dipilih: fee per klaim, SaaS bulanan per karyawan, atau revenue share dari bunga koperasi?

**Opsi yang Tersedia:**

| Model | Mekanisme | Pro | Kon |
|---|---|---|---|
| **Fee per claim** | 0.x% dari setiap EWA claim | Langsung dari transaksi | User merasa "dikenakan biaya" tiap tarik |
| **SaaS bulanan** | Rp X.000/karyawan/bulan ke perusahaan | Predictable revenue | Sales cycle lebih panjang |
| **Rev share koperasi** | % dari bunga pinjaman karyawan | Align insentif | Revenue hanya dari koperasi adopters |
| **Hybrid** | SaaS + rev share | Stable + upside | Pricing lebih kompleks |

**Dampak Terhadap Produk:**
- Fee per claim → perlu on-chain fee routing di `claim_salary`
- SaaS → cukup off-chain billing
- Rev share → perlu pembagian interest di `EmployeeLiquidityProgram`

**Keputusan:**
```
[ Diisi saat resolved ]
Tanggal: ___
Model dipilih: ___
Rate/pricing: ___
```

---

### OQ-006 · Konfigurasi PPh21

| Property | Value |
|---|---|
| **Kategori** | Legal / Product |
| **Owner** | Legal + HR Pilot Companies |
| **Deadline** | Sprint 2 (sebelum ComplianceVault diimplementasi) |
| **Status** | ⬜ Open |

**Pertanyaan:**
> Apakah PPh21 di-hardcode per bracket, atau HR input manual per karyawan per bulan?

**Konteks:**
PPh21 di Indonesia menggunakan sistem progresif (tarif berbeda per bracket penghasilan). Setiap karyawan bisa punya tarif efektif yang berbeda tergantung penghasilan tahunan dan PTKP (Penghasilan Tidak Kena Pajak).

**Opsi:**
| Opsi | Cara Kerja | Akurasi | Kompleksitas |
|---|---|---|---|
| Hardcode per bracket | Sistem hitung otomatis berdasarkan gaji | Sedang (estimasi) | Rendah |
| HR input manual | HR set pph21_bps per karyawan | Tinggi | Sedang |
| Integrasi kalkulator DJP | Sync dengan aturan terbaru | Sangat tinggi | Tinggi |

**Recommendation:**
HR input manual per karyawan (opsi 2) untuk MVP — fleksibel dan tidak bergantung pada hardcode yang bisa ketinggalan perubahan aturan.

**Dampak Jika Tidak Resolved Sebelum Sprint 2:**
`ComplianceVault` diimplementasi dengan asumsi salah → split PPh21 tidak akurat → rekonsiliasi gagal.

**Keputusan:**
```
[ Diisi saat resolved ]
Tanggal: ___
Mekanisme dipilih: ___
Update frequency: ___
```

---

---

### OQ-007 · Provider eKYC untuk Verifikasi NIK

| Property | Value |
|---|---|
| **Kategori** | Tech / Legal |
| **Owner** | Tech Lead + Legal |
| **Deadline** | Production Phase — sebelum onboarding user nyata |
| **Status** | ⬜ Open |

**Pertanyaan:**
> Provider eKYC mana yang digunakan untuk verifikasi NIK karyawan? Verihubs, Privy.id (layanan KYC terpisah dari Privy WaaS), atau integrasi langsung ke Dukcapil API?

**Konteks:**
Per UU PDP No. 27/2022 dan regulasi ketenagakerjaan, identitas karyawan harus terverifikasi sebelum stream gaji aktif. Platform menyimpan PII off-chain, namun verifikasi harus dilakukan oleh lembaga terpercaya.

**Opsi:**
| Provider | Pro | Kon | Estimasi Cost |
|---|---|---|---|
| Verihubs | Terintegrasi dengan Dukcapil, local support | Biaya per verifikasi ~Rp 2.000–5.000 | ~$0.15/user |
| Privy.id | Sudah punya nama di Indonesia, tanda tangan digital | Berbeda dari Privy WaaS — jangan tertukar | ~$0.20/user |
| Dukcapil API langsung | Paling akurat, official | Proses partnership panjang, butuh MoU | Gratis setelah MoU |
| Manual KTP upload | Cepat implementasi | Tidak terverifikasi real-time, fraud risk | Gratis |

**Dampak Jika Tidak Resolved:**
Tidak bisa onboarding user nyata — platform tidak compliant UU PDP.

**Keputusan:**
```
[ Diisi saat resolved ]
Tanggal: ___
Provider dipilih: ___
Estimasi cost per user: ___
Timeline integrasi: ___
```

---

### OQ-008 · Smart Account Standard: SimpleAccount atau Kernel

| Property | Value |
|---|---|
| **Kategori** | Tech |
| **Owner** | Tech Lead |
| **Deadline** | Production Phase — sebelum Smart Account deployment |
| **Status** | ⬜ Open |

**Pertanyaan:**
> Standard ERC-4337 Smart Account mana yang digunakan: OpenZeppelin SimpleAccount, ZeroDev Kernel, atau Biconomy Smart Account v3?

**Konteks:**
Pilihan Smart Account menentukan kompatibilitas dengan Paymaster, kemudahan upgrade, dan fitur seperti session key (untuk silent signing tanpa expose private key).

**Opsi:**
| Standard | Pro | Kon |
|---|---|---|
| SimpleAccount (OZ) | Minimal, audit lengkap, easy to understand | Tidak ada session key built-in |
| ZeroDev Kernel | Modular, session key support, active development | Lebih complex, dependency baru |
| Biconomy Smart Account v3 | Full stack (Bundler + Paymaster terintegrasi) | Vendor lock-in |
| Safe (Gnosis) | Battle-tested, multi-sig native | Berat untuk use case sederhana |

**Dampak Jika Tidak Resolved:**
Contract factory dan frontend integration tidak bisa dimulai.

**Keputusan:**
```
[ Diisi saat resolved ]
Tanggal: ___
Standard dipilih: ___
Factory address: ___
Alasan: ___
```

---

### OQ-009 · JWT Revocation: Redis Blocklist atau Server-Side Session

| Property | Value |
|---|---|
| **Kategori** | Tech |
| **Owner** | Tech Lead |
| **Deadline** | Production Phase — sebelum auth hardening |
| **Status** | ⬜ Open |

**Pertanyaan:**
> Untuk mendukung session revocation (logout paksa, compromised device), apakah menggunakan Redis token blocklist atau beralih ke server-side session (PostgreSQL)?

**Konteks:**
JWT saat ini stateless — sekali diterbitkan tidak bisa di-invalidasi sebelum expiry. Ini adalah celah keamanan jika karyawan melaporkan device hilang atau akun compromised.

**Opsi:**
| Pendekatan | Pro | Kon |
|---|---|---|
| Redis blocklist | Tetap stateless di happy path, revocation O(1) | Redis sebagai new dependency |
| Server-side session (DB) | Revocation mudah, audit lengkap | Setiap request = DB lookup |
| Hybrid: short-lived AT + refresh rotation | Access token pendek (5 menit), refresh rotation per-use | Kompleksitas lebih tinggi di frontend |

**Dampak Jika Tidak Resolved:**
Tidak bisa revoke session saat karyawan lapor device hilang.

**Keputusan:**
```
[ Diisi saat resolved ]
Tanggal: ___
Pendekatan dipilih: ___
Implementation notes: ___
```

---

### OQ-010 · Multi-Device Key Sync: iCloud Keychain atau MPC Provider

| Property | Value |
|---|---|
| **Kategori** | Tech |
| **Owner** | Tech Lead |
| **Deadline** | Production Phase v2 |
| **Status** | ⬜ Open |

**Pertanyaan:**
> Untuk mendukung login dari multiple device (HP baru, laptop kantor), bagaimana encrypted key di-sync? Via platform keychain (iCloud/Google) atau MPC key sharding via provider (Lit Protocol, Web3Auth)?

**Konteks:**
Saat ini jika user ganti device, Work ID hilang karena key hanya ada di localStorage browser lama. Untuk produksi, user harus bisa login dari device baru tanpa kehilangan address.

**Opsi:**
| Pendekatan | Pro | Kon |
|---|---|---|
| iCloud / Google Keychain | Native, zero infrastructure cost, user familiar | iOS-only atau Android-only, tidak cross-platform |
| MPC (Lit Protocol / Web3Auth) | Cross-platform, key tidak pernah utuh di satu tempat | External dependency, cost per user |
| Server-side encrypted backup | Platform kontrol, cross-platform | Perlu trust ke platform (key di server) |
| QR code transfer | Sederhana, no infrastructure | Manual, UX kurang mulus |

**Dampak Jika Tidak Resolved:**
User yang ganti HP kehilangan Work ID — masalah besar untuk produksi.

**Keputusan:**
```
[ Diisi saat resolved ]
Tanggal: ___
Pendekatan dipilih: ___
```

---

### OQ-011 · Enkripsi PII: Field-Level atau DB-Level Encryption

| Property | Value |
|---|---|
| **Kategori** | Tech / Legal |
| **Owner** | Tech Lead + Legal |
| **Deadline** | Production Phase — sebelum onboarding data nyata |
| **Status** | ⬜ Open |

**Pertanyaan:**
> Per UU PDP No. 27/2022, PII karyawan (nama, NIK, email, nomor HP) harus terenkripsi at rest. Apakah menggunakan field-level encryption di aplikasi atau DB-level transparent encryption?

**Opsi:**
| Pendekatan | Pro | Kon |
|---|---|---|
| Field-level (aplikasi) | Kontrol granular, query enkripsi per kolom, audit per field | Kompleksitas lebih tinggi, tidak bisa query plaintext |
| DB Transparent Data Encryption (TDE) | Transparan untuk aplikasi, mudah setup | Seluruh DB terenkripsi — bukan per-field |
| Kombinasi | TDE untuk storage + field-level untuk kolom ultra-sensitif (NIK) | Best of both worlds | Dua layer kompleksitas |

**Regulasi Referensi:**
- UU PDP No. 27/2022 Pasal 32 — kewajiban melindungi data pribadi
- Rekomendasi BSSN: enkripsi AES-256 untuk data sensitif

**Keputusan:**
```
[ Diisi saat resolved ]
Tanggal: ___
Pendekatan dipilih: ___
Kolom yang di-field-encrypt: ___
```

---

### OQ-012 · Legal Role Detection: On-Chain atau Backend Cache

| Property | Value |
|---|---|
| **Kategori** | Tech |
| **Owner** | Tech Lead |
| **Deadline** | Sprint 3 fix — segera |
| **Status** | ⬜ Open |

**Pertanyaan:**
> Bug: `useRole()` saat ini tidak mendeteksi `LEGAL_ROLE` — legal officer selalu jatuh ke "employee" role. Fix ini dilakukan dengan tambahkan check on-chain, atau caching role di JWT saat login?

**Konteks:**
Legal role perlu bisa approve PHK dari mobile. Saat ini halaman `/legal` tidak bisa diakses karena role resolution salah. Ini adalah bug blocking untuk demo PHK flow.

**Opsi:**
| Pendekatan | Pro | Kon |
|---|---|---|
| Tambahkan LEGAL_ROLE check di `useRole.ts` | Quick fix, on-chain authoritative | Extra RPC call saat load |
| Embed role di JWT payload (backend lookup saat login) | No RPC call saat load, faster UX | Stale role jika HR grant/revoke role saat user sudah login |
| Kombinasi: JWT + on-chain revalidasi setiap 5 menit | Best UX + freshness | Sedikit lebih complex |

**Dampak Jika Tidak Resolved:**
Legal officer tidak bisa approve PHK via UI — PHK flow blocked.

**Keputusan:**
```
[ Diisi saat resolved ]
Tanggal: ___
Fix yang dipilih: ___
File yang diubah: ___
```

---

### OQ-013 · Inco Lightning Co-Processor Trust Model

| Property | Value |
|---|---|
| **Kategori** | Tech |
| **Owner** | Tech Lead |
| **Deadline** | Sprint 7 (sebelum deploy ConfidentialCompanyVault) |
| **Status** | ⬜ Open |

**Pertanyaan:**
> Sejauh mana Inco Lightning co-processor bisa dipercaya? Apa yang terjadi jika Inco nodes dikompromis atau shutdown? Apakah ada mekanisme fallback?

**Konteks:**
Inco Lightning menggunakan FHE co-processor model — komputasi FHE berat dijalankan off-chain di Inco nodes, hasilnya (ciphertext) disimpan di Base Sepolia. Ini berarti **plaintext salary pernah ada di Inco infrastructure** saat enkripsi pertama kali. Ini bukan trustless — berbeda dari ZK proof yang trustless sepenuhnya. Pertanyaan ini penting untuk bagian threat model skripsi.

**Pertanyaan Turunan:**
1. Apakah Inco nodes memiliki akses ke plaintext saat enkripsi, atau enkripsi dilakukan sepenuhnya client-side?
2. Apakah ada SLA / uptime guarantee dari Inco untuk Base Sepolia?
3. Jika Inco sunset/shutdown, apakah ciphertext yang tersimpan on-chain masih bisa didecrypt?
4. Apakah ada audit keamanan yang dipublikasikan untuk Inco co-processor?

**Opsi Mitigasi:**
| Opsi | Pro | Kon |
|---|---|---|
| Terima trust model Inco, dokumentasikan di skripsi | Cepat, praktis | Tidak trustless |
| Fallback ke `CompanyVault` plaintext jika Inco down | Resilient | Dua contract path |
| Hybrid: Inco FHE + Circom ZK commitment untuk audit trail | Defense in depth | Kompleksitas tinggi |

**Dampak Jika Tidak Resolved Sebelum Sprint 7:**
`ConfidentialCompanyVault` di-deploy dengan trust assumption yang tidak terdokumentasi → celah di bab metodologi skripsi.

**Keputusan:**
```
[ Diisi saat resolved ]
Tanggal: ___
Trust model yang diterima: ___
Dokumentasi di skripsi: ___
```

---

### OQ-014 · Compliance Viewing Key: Siapa Pegang, Bagaimana Rotasi?

| Property | Value |
|---|---|
| **Kategori** | Tech / Legal |
| **Owner** | Tech Lead + Legal |
| **Deadline** | Sprint 7 (sebelum go-live FHE feature) |
| **Status** | ⬜ Open |

**Pertanyaan:**
> Siapa yang memegang compliance/auditor viewing key untuk mendecrypt gaji karyawan saat audit? Bagaimana key ini dirotasi jika auditor berganti atau ada pelanggaran?

**Konteks:**
Dengan Inco FHE, gaji terenkripsi. Untuk keperluan audit pajak (DJP), pemeriksaan BPJS, atau investigasi internal, pihak yang berwenang harus bisa mendecrypt nilai gaji. Inco mendukung delegated decryption — HR bisa grant viewing key ke pihak tertentu. Tapi siapa yang memegang key ini, dan bagaimana lifecycle-nya?

**Pertanyaan Turunan:**
1. Apakah compliance viewing key dipegang oleh: HR admin, Legal officer, atau external auditor?
2. Apakah key ini bisa di-revoke jika auditor resign atau kontrak berakhir?
3. Bagaimana jika HR admin yang pemegang key melakukan fraud — siapa yang bisa override?
4. Apakah regulasi Indonesia (UU PPh, BPJS) mengizinkan data gaji hanya tersedia via encrypted viewing key?

**Opsi Desain:**
| Model | Pro | Kon |
|---|---|---|
| HR admin pegang semua viewing key | Sederhana | Single point of failure + abuse risk |
| Multi-party viewing key (HR + Legal, 2-of-2) | Defense in depth | Kompleks untuk implementasi |
| Platform (SaaS admin) sebagai key custodian | Centralized control untuk compliance | Bertentangan dengan prinsip desentralisasi |
| Auditor minta disclosure via legal process | Tidak perlu sharing key | Tidak real-time — hanya untuk audit formal |

**Dampak Jika Tidak Resolved Sebelum Sprint 7:**
Delegated decryption diimplementasi tanpa governance yang jelas → risiko abuse atau compliance failure.

**Keputusan:**
```
[ Diisi saat resolved ]
Tanggal: ___
Model yang dipilih: ___
Key custodian: ___
Revocation mechanism: ___
```

---

## Dashboard View (Notion)

> Salin tabel ini ke Notion sebagai Database dengan filter dan grouping:

```
Group by: Status
Filter: Status = Open | In Progress

Sorted by: Deadline ASC

Views:
  1. All Questions (default)
  2. Open Only
  3. By Owner
  4. By Sprint Deadline
```

---

## Log Keputusan

*Diisi saat setiap open question resolved.*

| ID | Tanggal Resolved | Keputusan | Owner |
|---|---|---|---|
| OQ-001 | — | — | — |
| OQ-002 | — | — | — |
| OQ-003 | — | — | — |
| OQ-004 | — | — | — |
| OQ-005 | — | — | — |
| OQ-006 | — | — | — |
| OQ-007 | — | — | — |
| OQ-008 | — | — | — |
| OQ-009 | — | — | — |
| OQ-010 | — | — | — |
| OQ-011 | — | — | — |
| OQ-012 | — | — | — |
| OQ-013 | — | — | — |
| OQ-014 | — | — | — |
