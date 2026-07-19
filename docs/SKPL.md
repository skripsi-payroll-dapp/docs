# SPESIFIKASI KEBUTUHAN PERANGKAT LUNAK
# Payana — Sistem Payroll Terdesentralisasi Berbasis Smart Contract

**Disusun oleh:**
Bonaventura Octavito
[NPM]

Program Studi Informatika
Fakultas Teknologi Industri
Universitas Atma Jaya Yogyakarta

---

## Daftar Revisi

| Revisi | Deskripsi | Ditulis oleh | Diperiksa oleh | Disetujui oleh |
|--------|-----------|--------------|----------------|----------------|
| A      | Dokumen awal | Bonaventura Octavito | - | - |
| B      | Sinkronisasi dengan DPPL Revisi E: penambahan FR-PAYANA-1201–1203 (Kelompok L, kontrak `IDRXPriceOracle`), fungsi produk ke-13, UC-21, entri Chainlink pada tabel antarmuka perangkat lunak; perbaikan referensi mati ke `skpl_part2.md` | Bonaventura Octavito | - | - |
| C      | Penghapusan Kelompok L (FR-PAYANA-1201–1203, UC-21, fungsi produk ke-13, kontrak `IDRXPriceOracle`/Chainlink) — IDRX dirancang 1:1 terhadap Rupiah sehingga price oracle tidak punya kasus penggunaan nyata; kontrak dihapus total dari kodebase. Konsolidasi Diagram Use Case menjadi satu diagram utuh (sebelumnya dipecah per aktor: HR Admin / Karyawan / Legal+Owner+Pihak Ketiga). | Bonaventura Octavito | - | - |
| D      | Revisi NFR-PAYANA-01 berdasarkan stress test aktual (k6 + InfluxDB + Grafana, 50→100 concurrent users) — target awal "≤500ms P99 @ 1.000 concurrent users via Datadog APM" tidak pernah divalidasi (Datadog tidak pernah diintegrasikan); diganti dengan hasil ukur nyata dan catatan bahwa endpoint terautentikasi (`/auth/login`, `/compliance/*`) belum mencapai threshold pada skala 100 concurrent di deployment single-instance saat ini | Bonaventura Octavito | - | - |
| E      | NFR-PAYANA-07 (retry otomatis + fallback RPC) sebelumnya hanya didokumentasikan tanpa implementasi nyata — `isHr()`/`canViewEmployeeData()` di `authz.ts` menelan semua error RPC (termasuk 429 transien) langsung jadi "tidak diizinkan" tanpa retry. Diimplementasikan `backend/src/services/rpcRetry.ts` (3x retry exponential backoff + fallback RPC publik) sesuai deskripsi requirement; ditambahkan hasil probe ceiling RPC Alchemy free-tier (~15-20 `eth_call` bersamaan) serta hasil soak test (40 concurrent/14 menit, 0 error 5xx) dan spike test (lonjakan instan 0→100 VU, 0 error 5xx, pulih bersih) sebagai bukti validasi — lihat `stress-test/README.md` Run 3 & Run 4 | Bonaventura Octavito | - | - |

---

## 1. Pendahuluan

### 1.1 Tujuan Penulisan Dokumen

Dokumen Spesifikasi Kebutuhan Perangkat Lunak (SKPL) ini ditulis untuk mendefinisikan secara lengkap dan formal seluruh kebutuhan fungsional dan non-fungsional dari sistem **Payana** — sebuah platform penggajian (payroll) terdesentralisasi berbasis teknologi blockchain yang dikembangkan sebagai proyek penelitian skripsi pada Program Studi Informatika, Universitas Atma Jaya Yogyakarta.

Tujuan penulisan dokumen ini mencakup:

1. Memberikan deskripsi yang tepat, tidak ambigu, dan dapat diverifikasi mengenai perilaku sistem yang diharapkan kepada seluruh pemangku kepentingan, yang meliputi pengembang, penguji, pembimbing akademik, dan pengguna akhir.
2. Menjadi acuan kontrak teknis antara analisis kebutuhan dan tahap perancangan serta implementasi sistem, sehingga setiap keputusan desain dapat ditelusuri kembali ke kebutuhan yang terdokumentasi.
3. Memfasilitasi verifikasi dan validasi perangkat lunak pada tahap pengujian dengan menyediakan kriteria penerimaan yang terukur untuk setiap kebutuhan fungsional.
4. Mendokumentasikan asumsi, kekangan, dan kebergantungan sistem secara eksplisit sehingga risiko teknis dan bisnis dapat diidentifikasi sejak dini.

Dokumen ini disusun dengan mengikuti standar IEEE 830-1998 (*IEEE Recommended Practice for Software Requirements Specifications*) sebagai panduan struktural, dengan adaptasi yang disesuaikan terhadap konteks sistem berbasis blockchain dan kebutuhan akademik.

Pembaca yang dituju adalah:
- **Pengembang sistem** yang akan merancang dan mengimplementasikan Payana.
- **Tim penguji** yang akan memverifikasi pemenuhan kebutuhan.
- **Dosen pembimbing dan penguji** yang akan mengevaluasi produk penelitian.
- **HR Admin dan Karyawan** sebagai pengguna akhir yang perlu memahami ruang lingkup sistem. (Peran Legal Officer eksis sebagai konsep AccessControl on-chain — lihat §3.1 — namun dalam pengoperasian nyata dijalankan oleh HR Admin yang sama, bukan pengguna berbeda.)

### 1.2 Ruang Lingkup

Payana adalah platform perangkat lunak berbasis web yang menyediakan layanan penggajian real-time terdesentralisasi untuk perusahaan dengan skala 50 hingga 500 karyawan di Indonesia. Sistem ini beroperasi di atas jaringan blockchain **Base** (Ethereum Layer-2) dan menggunakan stablecoin **IDRX** (ERC-20 berpegged Rupiah Indonesia) sebagai medium pembayaran gaji.

Ruang lingkup sistem Payana mencakup dua belas fungsi utama yang dikelompokkan ke dalam delapan modul, diberi label alfabetis A–H secara berurutan sesuai urutan penyajian pada bagian ini. *(Catatan: Modul A–H di bagian ini adalah ringkasan level tinggi, sedangkan kebutuhan fungsional rinci di §3.2 dipecah lebih halus menjadi sembilan belas "Kelompok" A–S. Setiap Modul memiliki satu Kelompok "anchor" berhuruf sama sebagai representasi utamanya (mis. Modul E ↔ Kelompok E: Mesin Pajak & Kasbon), namun karena satu Modul dapat mencakup lebih dari satu Kelompok, urutan tampil Kelompok A–S di §3.2 mengikuti pengelompokan per-Modul ini — bukan urutan penomoran FR aslinya. Kelompok non-anchor lain yang tidak diwakili langsung oleh satu huruf Modul mengisi sisa huruf I–S secara berurutan.)*

1. **Modul Core Payroll (A):** Pengelolaan vault dana perusahaan, pendaftaran karyawan ke dalam sistem stream, distribusi gaji real-time detik per detik, penarikan mandiri gaji yang sudah diperoleh (Earned Wage Access / EWA) dengan mekanisme auto-split 93% (gaji bersih) / 5% (kepatuhan BPJS dan PPh21) / 2% (pesangon).

2. **Modul Work ID (B):** Autentikasi berbasis tanda tangan kriptografi EIP-191 melalui embedded wallet Privy, pemrosesan transaksi tanpa biaya gas bagi karyawan (gasless) menggunakan ERC-4337 Paymaster, dan penerbitan Sertifikat Ketenagakerjaan berbasis Soulbound Token (SBT) ERC-5192.

3. **Modul Compliance (C):** Escrow pesangon otomatis yang terkunci on-chain, perlindungan Pemutusan Hubungan Kerja (PHK) dengan mekanisme multi-tanda tangan dua peran on-chain (`HR_ROLE` dan `LEGAL_ROLE`, lihat §3.1 untuk penjelasan kenapa kedua peran ini dalam praktiknya digenggam oleh alamat HR Admin yang sama), dan routing dana kepatuhan ke ComplianceVault untuk BPJS dan PPh21.

4. **Modul Cliff Vesting (D):** Pengaturan bonus retensi dengan periode cliff, penanganan masa percobaan karyawan, dan skema ESOP.

5. **Modul Mesin Pajak & Kasbon (E):** Pemotongan PPh21 TER dan BPJS otomatis on-chain saat klaim gaji berdasarkan konfigurasi HR, serta fasilitas kasbon (uang muka gaji) hingga 80% gaji bulanan dengan pelunasan otomatis saat klaim gaji berikutnya.

6. **Modul Dashboard (F):** Antarmuka HR untuk manajemen vault, stream, laporan kepatuhan, dan persetujuan PHK (termasuk langkah persetujuan `LEGAL_ROLE` yang secara default digenggam HR sendiri, lihat §3.1); antarmuka karyawan untuk pemantauan EWA secara langsung.

7. **Modul Audit dan Notifikasi (G):** Jejak audit aktivitas HR yang immutable dan sistem notifikasi in-app.

8. **Modul Keamanan Vault (H):** Deteksi anomali otomatis untuk pola yang konsisten dengan wallet HR yang dikompromikan — penarikan vault tidak wajar, perubahan peran (`HR_ROLE`/`DEFAULT_ADMIN_ROLE`) mendadak ke alamat tak dikenal, dan aktivitas sensitif beruntun — beserta antarmuka Owner untuk meninjau dan menandai selesai setiap alert.

Sistem yang berada **di luar ruang lingkup** MVP ini antara lain: integrasi HRIS pihak ketiga (Talenta, Gadjian, SAP), fiat on/off ramp langsung dalam platform, payroll multi-chain, ESOP dengan secondary market, notifikasi push mobile native, stealth addresses (EIP-5564), dan private streaming rate on-chain.

### 1.3 Definisi, Akronim, dan Singkatan

#### Definisi

| Istilah | Definisi |
|---------|----------|
| Smart Contract | Program komputer yang dieksekusi secara otomatis di atas jaringan blockchain tanpa intervensi pihak ketiga terpusat; logika dan status kontrak disimpan permanen di jaringan dan tidak dapat diubah unilateral setelah di-deploy. |
| Blockchain | Struktur data terdistribusi berupa rantai blok transaksi yang divalidasi secara kriptografis dan direplikasi di ribuan node jaringan, sehingga data yang telah tercatat bersifat immutable dan dapat diaudit siapapun. |
| Streaming Payment | Mekanisme pembayaran di mana dana ditransfer secara kontinyu detik per detik berdasarkan laju alir (flowRate) yang telah dikonfigurasi, berbeda dengan sistem batch bulanan konvensional; dalam konteks Payana, streaming dilakukan dengan mengakumulasi nilai akrual yang dapat diklaim kapan saja oleh karyawan. |
| Earned Wage Access (EWA) | Kemampuan karyawan untuk mengakses porsi gaji yang sudah mereka peroleh (accrued) sebelum tanggal gajian resmi; dalam Payana, EWA diimplementasikan melalui fungsi `claimSalary()` yang dapat dipanggil kapan saja selama stream aktif. |
| Vault | Kontrak penyimpanan dana perusahaan di atas blockchain; dalam Payana, setiap perusahaan memiliki satu `CompanyVault` terisolasi yang menyimpan saldo IDRX dan mengelola seluruh stream karyawan miliknya. |
| Soulbound Token (SBT) | Token non-fungible yang tidak dapat dipindahtangankan (non-transferable) dan melekat permanen pada satu alamat wallet; digunakan dalam Payana sebagai Sertifikat Ketenagakerjaan digital berbasis standar ERC-5192. |
| IDRX | Stablecoin ERC-20 yang dilatunilai terhadap Rupiah Indonesia (1 IDRX = 1 IDR), digunakan sebagai medium pembayaran gaji dalam ekosistem Payana. |
| Wallet | Sepasang kunci kriptografi (kunci publik dan kunci privat) yang merepresentasikan identitas dan kepemilikan aset di blockchain; dalam Payana disebut "Akun Gaji" untuk menghindari jargon teknis di antarmuka karyawan. |
| Stream | Konfigurasi pembayaran per-karyawan yang mendefinisikan laju alir gaji (flowRate dalam satuan IDRX per detik), waktu mulai, dan status aktif/jeda; disimpan dalam `employeeStreams` mapping di `CompanyVault`. |
| flowRate | Laju akrual gaji karyawan dalam satuan IDRX per detik yang dikonfigurasi oleh HR saat mendaftarkan karyawan; dari flowRate ini total gaji yang sudah diperoleh pada waktu tertentu dihitung sebagai `flowRate × (block.timestamp − lastWithdrawnTs)`. |
| Severance Vault | Bagian dari `CompanyVault` yang menyimpan akumulasi dana pesangon karyawan (2% dari setiap klaim gaji) dalam status terkunci (LOCKED) hingga kondisi PHK atau resign yang sah terpenuhi; dirancang agar tidak dapat dicairkan secara unilateral oleh HR. |
| Compliance Vault | Bagian dari `CompanyVault` yang menampung 5% dari setiap klaim gaji untuk kebutuhan pembayaran iuran BPJS Kesehatan, BPJS Ketenagakerjaan, dan PPh21; dana ditransfer secara manual oleh HR ke institusi terkait pada akhir periode. |
| Multi-sig (Multi-Tanda Tangan) | Mekanisme yang mensyaratkan persetujuan dari lebih dari satu peran berwenang sebelum suatu tindakan dapat dilaksanakan; dalam Payana, PHK mensyaratkan persetujuan dua peran on-chain berurutan (`HR_ROLE` lalu `LEGAL_ROLE`) — lihat §3.1 untuk penjelasan bahwa kedua peran ini saat ini digenggam alamat yang sama (HR Admin). |
| Gasless Transaction | Mekanisme di mana biaya gas (ongkos komputasi blockchain) dibayar oleh pihak ketiga (Paymaster) sehingga pengguna akhir (karyawan) dapat mengirimkan transaksi tanpa memiliki ETH; diimplementasikan menggunakan standar ERC-4337 Account Abstraction. |
| Factory Pattern | Pola desain kontrak di mana satu kontrak induk (`PayrollFactory`) bertanggung jawab men-deploy dan melacak kontrak-kontrak anak (`CompanyVault`) secara terisolasi per tenant, memungkinkan arsitektur multi-tenant on-chain. |
| Cliff Vesting | Mekanisme di mana sejumlah dana (bonus, ESOP) dikunci untuk jangka waktu tertentu (periode cliff) dan baru dapat dicairkan sekaligus setelah periode tersebut berakhir. |

#### Akronim dan Singkatan

| Akronim | Kepanjangan |
|---------|-------------|
| SKPL | Spesifikasi Kebutuhan Perangkat Lunak |
| FR | Functional Requirement (Kebutuhan Fungsional) |
| NFR | Non-Functional Requirement (Kebutuhan Non-Fungsional) |
| UC | Use Case |
| IDRX | Indonesian Rupiah Token (stablecoin ERC-20 berpegged IDR) |
| EWA | Earned Wage Access |
| SBT | Soulbound Token |
| PHK | Pemutusan Hubungan Kerja |
| JWT | JSON Web Token |
| EOA | Externally Owned Account (akun blockchain yang dikendalikan kunci privat biasa, bukan smart contract) |
| EIP | Ethereum Improvement Proposal |
| AES | Advanced Encryption Standard |
| GCM | Galois/Counter Mode (mode operasi enkripsi simetrik) |
| API | Application Programming Interface |
| REST | Representational State Transfer |
| RPC | Remote Procedure Call |
| L2 | Layer 2 (solusi skalabilitas blockchain di atas jaringan utama Ethereum) |
| SaaS | Software as a Service |
| HR | Human Resources |
| NIK | Nomor Induk Kependudukan |
| UU PDP | Undang-Undang Pelindungan Data Pribadi (UU No. 27 Tahun 2022) |
| BPJS | Badan Penyelenggara Jaminan Sosial |
| PPh21 | Pajak Penghasilan Pasal 21 (pemotongan pajak karyawan) |
| ERC | Ethereum Request for Comments (standar token/kontrak Ethereum) |
| MPC | Multi-Party Computation |
| APM | Application Performance Monitoring |
| RTO | Recovery Time Objective |
| RPO | Recovery Point Objective |
| SSO | Single Sign-On |
| PII | Personally Identifiable Information (Data Pribadi yang Dapat Mengidentifikasi) |
| HSM | Hardware Security Module |
| TPS | Transactions Per Second |
| KYC | Know Your Customer |
| OJK | Otoritas Jasa Keuangan |
| DJP | Direktorat Jenderal Pajak |

### 1.4 Referensi

| No | Dokumen / Standar | Keterangan |
|----|-------------------|------------|
| 1 | IEEE 830-1998: *IEEE Recommended Practice for Software Requirements Specifications* | Standar utama yang menjadi panduan struktur dan konten dokumen SKPL ini. |
| 2 | Undang-Undang Republik Indonesia No. 13 Tahun 2003 tentang Ketenagakerjaan | Landasan hukum hubungan kerja, komponen gaji, dan kewajiban pesangon. |
| 3 | Undang-Undang Republik Indonesia No. 6 Tahun 2023 tentang Cipta Kerja (Pasal 156) | Formula perhitungan uang pesangon, uang penghargaan masa kerja, dan uang penggantian hak yang menjadi dasar kalkulasi SeveranceVault. |
| 4 | Undang-Undang Republik Indonesia No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP) | Kewajiban pengelolaan data pribadi karyawan (NIK, nama, nomor telepon) secara off-chain dan terenkripsi. |
| 5 | Peraturan Pemerintah No. 36 Tahun 2021 tentang Pengupahan | Komponen gaji minimum dan struktur iuran BPJS yang menjadi dasar split ComplianceVault. |
| 6 | EIP-191: *Signed Data Standard* | Standar tanda tangan pesan Ethereum yang digunakan dalam alur autentikasi Payana (login via personal_sign). |
| 7 | EIP-721: *Non-Fungible Token Standard* | Standar dasar NFT yang menjadi fondasi implementasi EmploymentSBT. |
| 8 | EIP-5192: *Minimal Soulbound NFTs* | Ekstensi ERC-721 yang menonaktifkan fungsi transfer token; digunakan untuk EmploymentSBT Payana. |
| 9 | EIP-4337: *Account Abstraction Using Alt Mempool* | Standar yang mendasari implementasi Smart Account karyawan dan mekanisme Paymaster gasless di Payana. |
| 10 | OpenZeppelin Contracts v5.6.1 — Dokumentasi Resmi | Referensi untuk penggunaan `AccessControl`, `ReentrancyGuard`, `Pausable`, dan `ERC20` dalam kontrak Payana. |
| 11 | Base Network — *Developer Documentation* | Dokumentasi jaringan Base L2 (Ethereum rollup), termasuk spesifikasi finality, gas pricing, dan RPC endpoint. |
| 12 | Privy — *Embedded Wallets Documentation* | Referensi integrasi Privy WaaS (Wallet-as-a-Service) untuk autentikasi email-to-wallet karyawan. |
| 13 | Peraturan Menteri Keuangan (PMK) No. 168/2023 tentang Pemotongan PPh Pasal 21 | Landasan hukum skema Tarif Efektif Rata-rata (TER) yang diimplementasikan pada perhitungan PPh21 otomatis on-chain (`PayrollMath.calcPPh21TerBps()`). |
| 14 | OJK POJK No. 77/POJK.01/2016 tentang Layanan Pinjam Meminjam Uang Berbasis Teknologi Informasi | Regulasi yang dihindari oleh fitur kasbon: dana kasbon bersumber langsung dari `vaultBalance` perusahaan pemberi kerja (bukan pool lender/investor pihak ketiga), sehingga tidak termasuk cakupan pengawasan sebagai layanan pinjam-meminjam berbasis teknologi informasi. |
| 15 | S. Nakamoto, *Bitcoin: A Peer-to-Peer Electronic Cash System*, 2008. [Online]. Tersedia: https://bitcoin.org/bitcoin.pdf | Whitepaper fondasi teknologi blockchain yang menjadi landasan konseptual sistem desentralisasi Payana. |
| 16 | V. Buterin, *Ethereum: A Next-Generation Smart Contract and Decentralized Application Platform*, Ethereum Foundation, 2014. [Online]. Tersedia: https://ethereum.org/whitepaper | Whitepaper Ethereum yang mendasari penggunaan smart contract Solidity dan jaringan Base L2. |
| 17 | G. Wood, *Ethereum: A Secure Decentralised Generalised Transaction Ledger (Yellow Paper)*, Ethereum Foundation, 2014. [Online]. Tersedia: https://ethereum.github.io/yellowpaper/paper.pdf | Spesifikasi teknis EVM yang menjadi acuan perilaku eksekusi smart contract dan mekanisme gas. |
| 18 | Peraturan Pemerintah No. 44 Tahun 2015 tentang Penyelenggaraan Program Jaminan Kecelakaan Kerja dan Jaminan Kematian | Dasar hukum kalkulasi iuran BPJS Ketenagakerjaan yang terakumulasi di ComplianceVault. |
| 19 | Peraturan Pemerintah No. 84 Tahun 2013 tentang Perubahan atas PP No. 14 Tahun 1993 tentang Penyelenggaraan Jaminan Sosial Tenaga Kerja | Dasar hukum iuran BPJS Kesehatan yang menjadi komponen split payroll Payana. |
| 20 | M. Bartoletti dan L. Pompianu, "An Empirical Analysis of Smart Contracts: Platforms, Applications, and Design Patterns," dalam *Financial Cryptography and Data Security*, Springer, 2017. | Kajian pola desain smart contract yang menjadi acuan arsitektur CompanyVault. |
| 21 | *Foundry Book — Ethereum Development Toolkit*, Paradigm, 2023. [Online]. Tersedia: https://book.getfoundry.sh | Dokumentasi resmi framework pengembangan dan pengujian smart contract Solidity yang digunakan dalam proyek ini. |

### 1.5 Ikhtisar Dokumen

Dokumen SKPL Payana disusun dalam empat bab utama dan satu lampiran, dengan uraian sebagai berikut.

**Bab 1 — Pendahuluan** menjelaskan konteks dan motivasi penulisan dokumen, mendefinisikan ruang lingkup sistem secara ringkas, menyediakan glosarium istilah teknis dan akronim yang digunakan sepanjang dokumen, serta mencantumkan seluruh referensi standar, regulasi, dan dokumen internal yang menjadi landasan penulisan.

**Bab 2 — Deskripsi Umum Kebutuhan** memberikan gambaran makro tentang sistem Payana tanpa masuk ke spesifikasi detail. Bab ini menjelaskan posisi Payana dalam ekosistem teknologi yang lebih luas dan hubungan antar komponen arsitekturalnya (Bagian 2.1), merangkum dua belas fungsi produk beserta rasional keberadaannya (Bagian 2.2), mendeskripsikan karakteristik empat kelompok pengguna utama beserta hak aksesnya (Bagian 2.3), mengidentifikasi kekangan teknis, regulasi, dan bisnis yang membatasi ruang solusi (Bagian 2.4), serta mendaftarkan asumsi dan kebergantungan eksternal yang harus terpenuhi agar sistem berfungsi (Bagian 2.5).

**Bab 3 — Kebutuhan Rinci** merinci seluruh kebutuhan fungsional dalam format Use Case dan daftar FR berpenomoran, disertai kebutuhan non-fungsional (performa, keamanan, kepatuhan, kebergunaan, skalabilitas, privasi, dan observabilitas) dengan kriteria penerimaan yang terukur.

**Bab 4 — Penutup** menyajikan simpulan atas keseluruhan spesifikasi kebutuhan yang telah didefinisikan, mencakup status implementasi dan validasi tiap modul terhadap sistem yang sudah berjalan, serta saran dan catatan pengembangan lanjutan untuk revisi dokumen dan iterasi produk di masa mendatang.

**Lampiran** menyediakan materi pendukung seperti diagram alur data, diagram urutan interaksi, dan pemetaan antara kebutuhan fungsional dengan komponen implementasi.

---

## 2. Deskripsi Umum Kebutuhan

### 2.1 Perspektif Produk

Payana adalah produk perangkat lunak mandiri (bukan modul dari sistem yang lebih besar) yang dirancang untuk menggantikan alur kerja penggajian konvensional berbasis transfer bank batch bulanan. Dalam ekosistem teknologi Indonesia, Payana berdiri di persimpangan antara platform SaaS Sumber Daya Manusia (HRIS) dan infrastruktur keuangan terdesentralisasi (DeFi), namun dengan antarmuka yang dibuat sepenuhnya ramah bagi pengguna non-teknis sehingga tidak memerlukan pengetahuan blockchain apa pun dari sisi karyawan.

Sistem Payana dibangun di atas empat lapisan arsitektur yang terstruktur dan saling bergantung. Lapisan pertama dan paling fundamental adalah **lapisan Smart Contract** yang berjalan di atas jaringan Base (Ethereum Layer-2). Pada lapisan ini, terdapat tiga kontrak Solidity utama yang sudah di-deploy permanen di Base Sepolia (testnet, Chain ID 84532): `PayrollFactory` sebagai penyelia multi-tenant yang men-deploy dan melacak `CompanyVault` per perusahaan (beralamat `0x73926c8abdbd2ebcc09f5e6af7def1bb3af156de`, hasil redeploy — lihat Lampiran A.2), `CompanyVault` sebagai kontrak terisolasi per tenant yang menyimpan seluruh logika penggajian (streaming, klaim, pesangon, vesting, PHK, mesin pajak, dan kasbon), dan `EmploymentSBT` sebagai penerbit sertifikat ketenagakerjaan soulbound. Seluruh nilai moneter dalam sistem dinyatakan dalam token **IDRX** (ERC-20 berpegged Rupiah), sehingga karyawan berinteraksi dengan unit yang familiar secara nominal tanpa perlu memahami konversi mata uang kripto.

Lapisan kedua adalah **lapisan Ponder Indexer** yang bertugas mengindeks seluruh event blockchain secara real-time ke dalam basis data relasional yang dapat dikueri. Ponder (versi 0.16.6) berlangganan event dari kontrak Payana melalui RPC Alchemy dan menyimpan data terstruktur seperti informasi stream, riwayat klaim, dan status pesangon ke dalam tabel PostgreSQL. Lapisan ini menyediakan REST API berbasis Hono (versi 4.5.0) yang dikonsumsi oleh lapisan backend untuk mempercepat pembacaan data on-chain tanpa harus melakukan RPC call langsung pada setiap permintaan dashboard.

Lapisan ketiga adalah **lapisan Backend API** yang diimplementasikan menggunakan Node.js dengan framework Express (versi 5.2.1), Drizzle ORM (versi 0.45.2) untuk manajemen basis data PostgreSQL off-chain, dan library viem (versi 2.47.17) untuk interaksi dengan blockchain. Backend bertanggung jawab atas autentikasi (EIP-191 + JWT), penerusan UserOperation ERC-4337 ke jaringan (fungsi Bundler Relay), penerimaan webhook Alchemy untuk pembaruan data real-time, dan penyimpanan data PII karyawan off-chain sesuai amanat UU PDP 2022. Backend di-deploy pada Azure App Service region Indonesia Central untuk meminimalkan latensi bagi pengguna domestik.

Lapisan keempat dan yang langsung berinteraksi dengan pengguna adalah **lapisan Frontend** yang dibangun menggunakan Next.js (versi 16.2.6), React (versi 19.2.4), Tailwind CSS (versi 4), Shadcn/UI, dan wagmi (versi 2.15.0) + viem (versi 2.47.0) sebagai adaptor Web3. Privy SDK (`@privy-io/react-auth` versi 2.10.0) diintegrasikan untuk menyediakan embedded wallet berbasis email yang mengabstraksi seluruh kompleksitas kriptografi dari karyawan. Frontend menyajikan tiga antarmuka utama: HR Dashboard untuk manajemen penggajian, Employee Dashboard untuk pemantauan EWA real-time, dan Legal Dashboard untuk persetujuan PHK.

### 2.2 Fungsi Produk

**1. Manajemen Vault Perusahaan**

Deskripsi  : Sistem menyediakan fungsi bagi HR Admin untuk men-deploy vault perusahaan yang terisolasi on-chain melalui `PayrollFactory.deployVault()`, mengisi saldo IDRX ke dalam vault (`fundVault()`), memantau saldo vault secara real-time, dan menarik saldo yang tidak terpakai (`withdrawVault()`). Setiap vault bersifat independen per perusahaan (Factory Pattern), sehingga aset satu perusahaan tidak bercampur dengan perusahaan lain. SaaS Admin (Owner) terlebih dahulu harus menyetujui registrasi HR sebelum vault dapat di-deploy.

Rasional   : Model vault terisolasi per perusahaan memastikan keamanan aset tenant dalam lingkungan multi-tenant. Tanpa isolasi ini, satu perusahaan berpotensi mengakses dana perusahaan lain. Mekanisme persetujuan SaaS Admin diperlukan untuk mencegah penyalahgunaan platform oleh pihak tidak sah.

**2. Streaming Gaji Real-Time**

Deskripsi  : Sistem menyediakan fungsi bagi HR Admin untuk mendaftarkan karyawan ke dalam sistem streaming gaji dengan mengkonfigurasi `flowRate` (dalam satuan IDRX per detik), waktu mulai stream, dan persentase split (default: 93% gaji bersih / 5% kepatuhan / 2% pesangon). Gaji terakumulasi secara kontinyu berdasarkan selisih waktu antara `block.timestamp` saat ini dan `lastWithdrawnTs`. HR dapat menjeda (`pauseStream()`), melanjutkan (`resumeStream()`), dan membatalkan (`cancelStream()`) stream sesuai kebutuhan.

Rasional   : Model streaming menggantikan siklus batch bulanan dengan distribusi nilai berkelanjutan, mengeliminasi penantian 14–30 hari yang menjadi sumber financial stress bagi karyawan berpenghasilan rendah. Implementasi on-chain menjamin bahwa gaji yang sudah diperoleh tidak dapat ditahan secara unilateral oleh perusahaan.

**3. Penarikan Gaji Mandiri (EWA)**

Deskripsi  : Sistem menyediakan fungsi bagi karyawan untuk mengklaim gaji yang telah terakumulasi kapan saja melalui fungsi `claimSalary()`. Setiap klaim memicu distribusi atomic dalam satu transaksi: platform fee, cicilan kasbon (jika ada), PPh21+BPJS ke ComplianceVault, porsi severance ke SeveranceVault, dan sisanya ke alamat Work ID karyawan. Karyawan tidak perlu memiliki ETH karena biaya gas ditanggung oleh sistem Paymaster (ERC-4337). Laju klaim dibatasi maksimum 10 kali per jam per karyawan untuk mencegah penyalahgunaan. Jika karyawan memiliki kasbon yang belum lunas, mekanisme auto-repay dipicu secara otomatis saat klaim.

Rasional   : EWA mengatasi kebutuhan mendesak karyawan akan akses dana sebelum jadwal gajian, sekaligus mengeliminasi ketergantungan pada pinjaman online berbunga tinggi. Mekanisme gasless memastikan bahwa hambatan teknis (memiliki ETH) tidak menghalangi karyawan yang membutuhkan.

**4. Pemberhentian Karyawan Multi-Tanda Tangan (PHK)**

Deskripsi  : Sistem menyediakan alur PHK dua tahap yang memerlukan persetujuan dua peran berbeda secara on-chain: `HR_ROLE` mengajukan proposal PHK (`proposeTermination()`), kemudian pemegang `LEGAL_ROLE` menyetujuinya (`approveTermination()`), setelah itu eksekusi final dapat dilakukan (`executeTermination()`). Saat eksekusi, stream karyawan dihentikan, dan dana SeveranceVault karyawan dilepas sesuai formula pesangon berdasarkan masa kerja (UU Cipta Kerja Pasal 156). Karyawan juga dapat mengajukan resign secara mandiri (`resignEmployee()`). Dalam pengoperasian saat ini, `LEGAL_ROLE` di-auto-grant ke alamat HR Admin sendiri saat onboarding vault (lihat §3.1) — HR Admin yang sama menjalankan kedua langkah persetujuan.

Rasional   : Mekanisme multi-tanda tangan mencegah PHK sewenang-wenang oleh satu pihak dan memastikan pesangon dibayarkan sesuai regulasi. Dengan pesangon tersimpan on-chain sejak hari pertama karyawan bekerja (akumulasi 2% per klaim), risiko perusahaan tidak mampu membayar pesangon saat pailit dapat dieliminasi.

**5. Vesting dan Bonus**

Deskripsi  : Sistem menyediakan fungsi bagi HR Admin untuk mengkonfigurasi bonus retensi atau ESOP dengan periode cliff (`createCliffVest()`), di mana dana dikunci hingga tanggal cliff tercapai. Setelah periode cliff berlalu, karyawan atau HR dapat memicu pencairan (`claimCliffVest()`). HR dapat membatalkan cliff vest yang belum jatuh tempo jika karyawan meninggalkan perusahaan sebelum waktunya (`cancelCliffVest()`).

Rasional   : Mekanisme cliff vesting on-chain memberikan kepastian hukum kepada karyawan bahwa bonus retensi yang dijanjikan tidak dapat ditarik kembali secara unilateral oleh perusahaan, sekaligus memberikan insentif yang terverifikasi bagi karyawan untuk bertahan hingga masa cliff selesai.

**6. Mesin Pajak & Kasbon**

Deskripsi  : Sistem menghitung dan memotong PPh21 (Tarif Efektif Rata-rata/TER sesuai PMK 168/2023, dengan opsi override tarif tetap oleh HR) dan BPJS secara otomatis on-chain pada setiap klaim gaji. Sistem juga menyediakan fasilitas kasbon (uang muka gaji): karyawan dapat mengajukan kasbon hingga 80% gaji bulanan (`requestAdvance()`), HR menyetujui atau menolak pengajuan (`approveAdvance()`/`rejectAdvance()`), dan pelunasan terjadi otomatis melalui pemotongan sebagian dari setiap klaim gaji berikutnya.

Rasional   : Perhitungan pajak on-chain menjamin konsistensi dan auditability penuh, menggantikan perhitungan off-chain yang rawan drift dari nilai riil. Dana kasbon berasal langsung dari `vaultBalance` perusahaan pemberi kerja (bukan pool lender/investor pihak ketiga), sehingga fasilitas ini berada di luar cakupan regulasi peer-to-peer lending (POJK No. 77/2016) sekaligus menjaga proses talangan tetap sederhana dan sepenuhnya berada dalam kendali perusahaan.

**7. Sertifikasi Ketenagakerjaan Berbasis SBT**

Deskripsi  : Sistem menyediakan fungsi penerbitan Sertifikat Ketenagakerjaan digital berupa Soulbound Token (SBT) yang mengikuti standar ERC-5192 (`mintSBT()`). Token ini melekat permanen pada Work ID karyawan, tidak dapat dipindahtangankan, dan dapat dibakar (`burnSBT()`) saat karyawan mengakhiri hubungan kerja. Token ini berfungsi sebagai bukti keanggotaan aktif dalam ekosistem Payana dan dapat digunakan sebagai verifikasi status ketenagakerjaan.

Rasional   : SBT memberikan representasi digital yang terverifikasi dan tidak dapat dipalsukan atas status ketenagakerjaan seseorang. Sifat on-chain yang immutable membuatnya lebih tahan manipulasi dibandingkan dokumen kertas atau sertifikat PDF yang dapat dipalsukan.

**8. Pelaporan Kepatuhan (BPJS dan PPh21)**

Deskripsi  : Sistem menyediakan laporan kepatuhan bagi HR Admin yang merangkum akumulasi dana di ComplianceVault (BPJS Kesehatan, BPJS Ketenagakerjaan, PPh21) berdasarkan data dari Ponder Indexer dan Backend API. HR dapat mengunduh rekapitulasi bulanan untuk keperluan rekonsiliasi dan pembayaran manual ke DJP dan BPJS. Persentase potongan PPh21 dapat dikonfigurasi per karyawan oleh HR sesuai bracket pajak yang berlaku, tanpa di-hardcode dalam kontrak.

Rasional   : Otomatisasi akumulasi dan pelaporan kepatuhan secara signifikan mengurangi beban kerja manual HR, meminimalkan risiko kesalahan perhitungan, dan menyediakan audit trail on-chain yang immutable untuk keperluan pemeriksaan pajak dan jaminan sosial.

**9. Administrasi Platform SaaS**

Deskripsi  : Sistem menyediakan antarmuka administrasi bagi Owner SaaS (SaaS Admin) untuk mengelola registrasi perusahaan baru. HR yang ingin bergabung mengajukan permohonan melalui antarmuka onboarding (`POST /registration/request`). Owner meninjau daftar permohonan yang masuk (`GET /registration/pending`) dan dapat menyetujui (`PATCH /registration/:address/approve`) atau menolak (`DELETE /registration/:address`) setiap permohonan. Owner juga memiliki akses fungsi darurat `emergencyFreezeAll()` untuk membekukan seluruh vault dalam kondisi insiden keamanan. Platform menghasilkan pendapatan melalui platform fee berbasis persentase (`platformFeeBps`) yang dipotong dari setiap klaim gaji karyawan secara otomatis dan langsung ditransfer ke `protocolTreasury` pada saat itu juga (bukan diakumulasi lalu diklaim terpisah). Owner dapat mengonfigurasi `platformFeeBps` dan `protocolTreasury` kapan saja melalui `PayrollFactory`.

Rasional   : Gerbang persetujuan SaaS Admin mencegah penggunaan platform oleh entitas yang tidak terverifikasi. Fungsi darurat diperlukan sebagai mekanisme mitigasi risiko terhadap potensi eksploitasi kontrak atau keadaan darurat lainnya. Platform fee dari payroll volume memberikan model bisnis yang transparan, dapat diaudit, dan pendapatannya berkorelasi langsung dengan skala penggunaan.

**10. Autentikasi Berbasis Wallet**

Deskripsi  : Sistem mengimplementasikan autentikasi tanpa kata sandi berbasis tanda tangan kriptografi standar EIP-191. Pengguna (HR, karyawan, legal, owner) masuk dengan menandatangani pesan yang mengandung timestamp Unix menggunakan wallet mereka. Backend memverifikasi tanda tangan menggunakan `recoverMessageAddress` (viem), memeriksa replay protection (selisih timestamp ≤ 300 detik), dan menerbitkan pasangan token akses (JWT, 15 menit) dan token penyegaran (JWT, 7 hari). Peran pengguna (HR, karyawan, legal, owner) dideteksi secara on-chain oleh frontend setelah autentikasi berhasil melalui hook `useRole.ts`.

Rasional   : Autentikasi berbasis tanda tangan kriptografi mengeliminasi risiko pencurian kata sandi dan memungkinkan sistem tanpa basis data kredensial terpusat yang rentan. JWT stateless memungkinkan skalabilitas horizontal backend. Deteksi peran on-chain memastikan bahwa peran yang ditampilkan selalu konsisten dengan status kontrak yang sebenarnya.

**11. Gasless Transaction untuk Karyawan**

Deskripsi  : Sistem menyediakan mekanisme agar seluruh transaksi yang dilakukan karyawan (terutama klaim EWA) tidak memerlukan ETH sebagai biaya gas. Transaksi dikemas sebagai `UserOperation` sesuai standar ERC-4337 dan dikirim ke Backend Bundler Relay, yang kemudian melampirkan tanda tangan Paymaster sebelum meneruskannya ke `EntryPoint` contract di Base. Backend memantau saldo ETH Paymaster secara aktif dan memberi peringatan jika di bawah ambang batas 0,05 ETH.

Rasional   : Persyaratan memiliki ETH sebagai biaya gas merupakan hambatan onboarding terbesar bagi pengguna non-kripto. Dengan menanggung biaya gas, perusahaan menjamin bahwa karyawan dapat mengakses hak gajinya kapan saja tanpa biaya tambahan apapun, sesuai dengan proposisi nilai "zero Web3 knowledge required".

**12. Deteksi Anomali Keamanan Vault**

Deskripsi  : Sistem memantau event on-chain dari setiap `CompanyVault` secara berkala (siklus 2 menit) untuk tiga pola yang konsisten dengan wallet HR yang dikompromikan: (1) penarikan vault (`withdrawVault()`) dengan jumlah jauh di atas rata-rata historis vault tersebut atau ke alamat penerima yang belum pernah menerima penarikan sebelumnya (termasuk penarikan pertama yang pernah tercatat, yang secara definisi tidak punya penerima yang terverifikasi); (2) pemberian peran `HR_ROLE`/`DEFAULT_ADMIN_ROLE` ke alamat yang bukan `hrAuthority` terdaftar untuk vault tersebut; (3) rangkaian ≥3 aksi sensitif (penarikan/perubahan peran) dari satu vault dalam satu siklus pemeriksaan. Setiap anomali tersimpan sebagai alert terstruktur (jenis, tingkat keparahan, detail, tautan transaksi) yang dapat ditinjau dan ditandai selesai oleh Owner SaaS melalui `/owner/security`, serta didorong sebagai notifikasi in-app real-time.

Rasional   : Wallet HR yang dikompromikan (phishing, malware, kebocoran kunci privat) adalah risiko keamanan yang tidak dapat dicegah sepenuhnya oleh kontrol akses on-chain saja — begitu penyerang menguasai kunci privat HR, seluruh operasi `onlyHR`/`DEFAULT_ADMIN_ROLE` (termasuk `withdrawVault()` dan `grantRole()`) tampak sah secara kriptografis. Lapisan deteksi anomali off-chain memberi Owner SaaS visibilitas dan waktu respons terhadap eksploitasi yang sedang berlangsung, alih-alih hanya mengetahuinya setelah dana hilang. Fitur ini divalidasi dengan simulasi serangan nyata di Base Sepolia (`testing-scripts/attacker-sim.mjs`) — lihat PDHUPL_v2.md KU-32.

### 2.3 Karakteristik Pengguna

**HR Admin**

HR Admin adalah pengguna utama platform Payana dari sisi perusahaan. Persona ini merupakan staf atau manajer departemen sumber daya manusia atau keuangan pada perusahaan dengan 50 hingga 500 karyawan. HR Admin tidak diasumsikan memiliki pengetahuan teknis tentang blockchain, smart contract, atau kriptografi; antarmuka sistem dirancang untuk mengabstraksi seluruh kompleksitas tersebut. HR Admin menggunakan platform dengan frekuensi tinggi — setidaknya beberapa kali per minggu untuk memantau status stream, saldo vault, dan laporan kepatuhan, serta lebih intensif di akhir bulan untuk rekonsiliasi. Hak akses HR Admin mencakup: deploy dan manajemen CompanyVault, pendaftaran dan penghentian stream karyawan, pengajuan proposal PHK, konfigurasi cliff vesting, pengelolaan laporan ComplianceVault, dan pembacaan seluruh data stream perusahaannya. HR Admin membutuhkan antarmuka yang bersih, pesan error dalam Bahasa Indonesia yang informatif, dan visualisasi real-time yang mudah dipahami.

**Karyawan (Employee)**

Karyawan adalah pengguna utama platform dari sisi individu. Persona ini adalah pekerja tetap atau kontrak pada perusahaan yang menggunakan Payana. Karyawan sama sekali tidak diasumsikan memiliki pengetahuan tentang blockchain, wallet, atau DeFi — antarmuka yang mereka hadapi menggunakan terminologi sehari-hari ("Tarik Gaji", "Akun Gaji", "Saldo Tersedia"). Karyawan menggunakan platform secara insidental — kapan saja mereka ingin mengakses gaji yang sudah diperoleh, memantau saldo pesangon, mengajukan kasbon, atau melihat status bonus mereka. Hak akses karyawan mencakup: klaim EWA dari stream mereka sendiri, pembacaan saldo stream dan pesangon milik sendiri, pengajuan kasbon (uang muka gaji), dan pembacaan informasi cliff vesting milik sendiri. Karyawan tidak dapat membaca atau mengakses data stream, gaji, atau pesangon karyawan lain.

**Legal Officer (peran on-chain, saat ini digenggam HR Admin)**

`LEGAL_ROLE` adalah peran `AccessControl` kedua pada kontrak `CompanyVault`, terpisah dari `HR_ROLE`, yang secara desain dimaksudkan sebagai pihak kedua independen dalam mekanisme persetujuan PHK multi-tanda tangan (mis. pejabat hukum internal atau direktur perusahaan). Kontrak itu sendiri tidak peduli siapa pemegang `LEGAL_ROLE` — `approveTermination()` hanya memvalidasi `hasRole(LEGAL_ROLE, msg.sender)`, sehingga secara on-chain alamat mana pun bisa diberi peran ini.

Namun, dalam implementasi produk saat ini, `LEGAL_ROLE` **secara default di-auto-grant ke alamat HR Admin itu sendiri** saat wizard onboarding vault berjalan (`hr/onboarding`, "Auto-grant LEGAL_ROLE to HR's own address so HR can run the full PHK flow solo") — sehingga HR Admin dapat menjalankan seluruh alur PHK sendirian tanpa menunggu pihak lain. HR Admin memang dapat secara opsional menetapkan alamat legal terpisah melalui halaman `/hr/settings` (field `legalAddress`, yang memanggil `grantRole(LEGAL_ROLE, legalAddress)` on-chain) — tetapi hook deteksi peran frontend (`useRole.ts`, lihat DPPL §2.4.5) tidak memiliki cabang pemeriksaan `LEGAL_ROLE` sama sekali, dan `useRoleGuard` pada layout `/hr/*` hanya meloloskan `role === "hr"`. Akibatnya, sebuah alamat yang benar-benar terpisah dan hanya memegang `LEGAL_ROLE` (bukan `HR_ROLE`) akan mendapat `role: null` dari sistem dan diarahkan kembali ke halaman onboarding — **tidak ada jalur produk (UI) bagi Legal Officer yang benar-benar terpisah untuk mengakses dashboard PHK saat ini**, meski secara teori kontrak tetap mengizinkan alamat tersebut memanggil `approveTermination()` langsung (mis. lewat Etherscan atau interaksi wallet manual di luar aplikasi).

**Kesimpulan persona:** Legal Officer bukan persona pengguna terpisah dalam produk saat ini — perannya digambarkan sebagai bagian dari domain HR Admin (lihat catatan pada diagram use case §3.3). Deskripsi "pihak kedua independen" tetap valid sebagai desain arsitektur AccessControl on-chain (dan menjadi dasar untuk pengembangan lanjutan bila dashboard Legal terpisah suatu saat diimplementasikan), tetapi bukan mencerminkan siapa yang benar-benar mengoperasikan sistem hari ini.

**Owner / SaaS Admin**

Owner adalah pengguna tertinggi dalam hierarki platform Payana, diidentifikasi secara unik melalui alamat wallet yang dikonfigurasi dalam variabel lingkungan `OWNER_ADDRESS` backend. Persona ini adalah pemilik atau operator platform Payana itu sendiri. Owner menggunakan platform dengan frekuensi rendah hingga sedang — terutama untuk meninjau dan menyetujui registrasi perusahaan baru. Hak akses Owner adalah yang paling luas: persetujuan dan penolakan registrasi HR baru, akses ke seluruh data registrasi yang tertunda, dan aktivasi fungsi darurat `emergencyFreezeAll()` melalui antarmuka admin. Owner diasumsikan memiliki pemahaman teknis yang memadai tentang operasional platform, termasuk pemahaman dasar tentang smart contract dan manajemen blockchain.

### 2.4 Kekangan

**(a) Kekangan Teknis**

1. **Ketergantungan pada Jaringan Base Sepolia / Base Mainnet:** Seluruh logika bisnis inti (streaming, klaim, pesangon, PHK) dieksekusi on-chain di jaringan Base. Sistem tidak dapat berfungsi jika jaringan Base mengalami gangguan, downtime, atau reorganisasi rantai. Meskipun Base memiliki uptime yang sangat tinggi sebagai Ethereum L2, ketergantungan ini tidak dapat dieliminasi sepenuhnya.

2. **Ketergantungan pada Alchemy sebagai Penyedia RPC dan Webhook:** Seluruh komunikasi antara backend/Ponder dengan blockchain Base dilakukan melalui node RPC Alchemy. Demikian pula, pembaruan data real-time di backend bergantung pada webhook Alchemy untuk menerima notifikasi event on-chain. Kegagalan atau degradasi layanan Alchemy akan mempengaruhi kemampuan sistem untuk membaca status blockchain secara real-time, meskipun integritas data on-chain tetap terjaga.

3. **Persyaratan Browser Modern dengan Dukungan Web Cryptography API:** Embedded wallet Privy dan interaksi Web3 membutuhkan browser modern yang mendukung Web Cryptography API (Chrome 37+, Firefox 34+, Safari 11+). Pengguna dengan browser lawas tidak dapat menggunakan platform.

4. **Biaya Gas sebagai Kekangan Anggaran Operasional:** Meskipun karyawan tidak membayar gas (ditanggung Paymaster), perusahaan secara tidak langsung menanggung biaya gas melalui subsidi Paymaster. Lonjakan harga gas di jaringan Base dapat meningkatkan biaya operasional per klaim. Saldo ETH Paymaster harus dipantau dan diisi secara berkala.

5. **Soliditas Solidity 0.8.26 dan Ketidakcocokan Versi Compiler:** Kontrak Payana dikompilasi dengan Solidity 0.8.26 dan OpenZeppelin v5.6.1. Upgrade ke versi Solidity yang lebih baru atau penggantian versi OpenZeppelin memerlukan pengujian regresi menyeluruh dan redeployment kontrak.

6. **Kapasitas Penyimpanan Blockchain yang Mahal:** Seluruh data yang disimpan on-chain (mapping karyawan, status vault, vest, pinjaman) menimbulkan biaya gas. Desain sistem meminimalkan penyimpanan on-chain (data PII disimpan off-chain), namun kompleksitas fungsional tetap memiliki batas efisiensi biaya.

**(b) Kekangan Regulasi**

7. **Kepatuhan UU Ketenagakerjaan No. 13/2003 dan UU Cipta Kerja (Pasal 156):** Formula pesangon yang diimplementasikan dalam SeveranceVault harus mengikuti ketentuan undang-undang yang berlaku. Perubahan regulasi pesangon dari pemerintah memerlukan pembaruan konfigurasi atau logika kontrak.

8. **Kepatuhan UU Pelindungan Data Pribadi (UU PDP) No. 27/2022:** Data pribadi karyawan (NIK, nama lengkap, nomor telepon, email) dilarang disimpan on-chain; wajib disimpan off-chain dalam basis data terenkripsi. Pelanggaran kewajiban ini membawa konsekuensi hukum bagi operator platform.

9. **Kepatuhan Regulasi BPJS dan Perpajakan PPh21:** Persentase potongan BPJS dan PPh21 tidak boleh di-hardcode dalam kontrak karena tarif resmi dapat berubah melalui regulasi pemerintah. Sistem harus menyediakan mekanisme konfigurasi ulang oleh HR tanpa redeployment kontrak.

10. **Kasbon Bukan Produk Pinjaman Pihak Ketiga:** Dana kasbon bersumber langsung dari `vaultBalance` milik perusahaan pemberi kerja (bukan pool lender/investor eksternal), sehingga tidak termasuk cakupan pengawasan POJK No. 77/2016 tentang layanan pinjam-meminjam berbasis teknologi informasi.

**(c) Kekangan Bisnis**

11. **Perusahaan Harus Mendanai Vault Terlebih Dahulu:** Sistem streaming gaji hanya berfungsi jika `CompanyVault` memiliki saldo IDRX yang cukup untuk menutup seluruh kewajiban stream aktif. Perusahaan harus secara proaktif mendanai vault sebelum periode penggajian. Kegagalan mendanai vault menyebabkan klaim karyawan gagal.

12. **Ketergantungan pada Likuiditas dan Stabilitas Peg IDRX:** Seluruh nilai pembayaran dalam sistem dinyatakan dalam IDRX. Jika IDRX mengalami depegging terhadap Rupiah (kehilangan 1:1 parity), nilai gaji yang diterima karyawan dalam istilah fiat akan berubah. Risiko ini berada di luar kendali platform Payana.

13. **Adopsi Privy WaaS Mensyaratkan Akses Internet Stabil:** Proses pembuatan embedded wallet dan penandatanganan transaksi melalui Privy memerlukan koneksi internet ke server Privy. Penggunaan di lingkungan dengan konektivitas terbatas atau jaringan yang memblokir domain Privy dapat mengganggu alur autentikasi.

### 2.5 Asumsi dan Kebergantungan

1. **Ketersediaan Jaringan Base Sepolia/Mainnet:** Sistem diasumsikan bahwa jaringan Base beroperasi dengan uptime ≥ 99,9% sesuai track record historisnya sebagai Ethereum L2 yang dikelola Coinbase. Finality transaksi diasumsikan ≈ 2 detik (optimistic finality), cukup untuk kebutuhan UX real-time Payana.

2. **Ketersediaan dan Keandalan Layanan Alchemy:** Backend dan Ponder diasumsikan dapat mengakses Alchemy RPC dan webhook dengan latensi < 500ms pada persentil ke-99. Alchemy diasumsikan memiliki SLA ≥ 99,9% uptime untuk paket berbayar.

3. **Stabilitas Peg IDRX terhadap Rupiah:** Sistem diasumsikan bahwa 1 IDRX senilai dengan 1 IDR (1 Rupiah Indonesia) secara konsisten. Deviasi signifikan dari parity ini berada di luar model kebutuhan sistem dan menjadi risiko bisnis yang perlu dikelola secara terpisah.

4. **Pengguna Memiliki Browser Modern yang Didukung:** Pengguna (HR, karyawan, legal) diasumsikan mengakses platform melalui browser yang mendukung Web Cryptography API dan JavaScript modern. Dukungan browser minimum: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+.

5. **HR Admin Memiliki Wallet Ethereum yang Valid:** HR Admin diasumsikan telah memiliki alamat wallet Ethereum (EOA atau Smart Account) yang akan digunakan sebagai identitas `hr_authority` pada `PayrollFactory`. Wallet ini diasumsikan aman dan kunci privatnya tidak bocor.

6. **Ketersediaan Layanan Privy WaaS:** Autentikasi karyawan dan penandatanganan transaksi bergantung pada ketersediaan layanan Privy. Diasumsikan bahwa Privy beroperasi dengan uptime ≥ 99,5% sesuai SLA penyedia. Gangguan Privy akan memblokir alur login karyawan hingga layanan pulih.

7. **Saldo ETH Paymaster Selalu Tercukupi:** Sistem diasumsikan bahwa operator platform secara rutin memantau dan mengisi saldo ETH Paymaster sebelum mencapai ambang kritis 0,05 ETH. Kegagalan dalam pemantauan ini akan menyebabkan seluruh transaksi karyawan gagal karena tidak ada sponsor gas.

8. **Ketersediaan Azure App Service di Region Indonesia Central:** Backend dan Ponder di-deploy pada Azure App Service di region Indonesia Central (Jakarta). Diasumsikan Azure menyediakan ketersediaan ≥ 99,5% pada SKU Basic (B1) atau lebih tinggi. Degradasi layanan Azure di region ini akan mempengaruhi seluruh operasional backend Payana.

9. **Karyawan Memiliki Akses Internet Selama Proses Klaim:** Proses klaim EWA membutuhkan koneksi internet untuk: (a) memuat antarmuka Next.js dari CDN, (b) berkomunikasi dengan Privy untuk penandatanganan silent, dan (c) mengirimkan UserOperation ke backend. Diasumsikan karyawan memiliki akses internet yang memadai saat menggunakan fitur ini.

10. **Perusahaan Menyediakan Data Karyawan yang Akurat saat Onboarding:** Sistem diasumsikan bahwa HR Admin memasukkan data karyawan (nama, email, NIK, alamat wallet) secara akurat saat onboarding. Kesalahan data pada tahap ini dapat menyebabkan stream diarahkan ke alamat yang salah, dengan konsekuensi finansial yang tidak dapat dipulihkan tanpa intervensi on-chain.

11. **Penggunaan Platform untuk Tujuan yang Sah Sesuai Regulasi Ketenagakerjaan Indonesia:** Diasumsikan bahwa perusahaan-perusahaan yang menggunakan Payana beroperasi sebagai entitas hukum yang sah di Indonesia dan tunduk pada regulasi ketenagakerjaan yang berlaku. Platform tidak didesain untuk memfasilitasi praktik ketenagakerjaan ilegal.


---

### 3.1 Kebutuhan Antarmuka Eksternal

#### 3.1.1 Antarmuka Pengguna

Payana menyediakan antarmuka berbasis web yang dapat diakses melalui browser standar. Antarmuka dirancang secara responsif untuk mendukung pengguna di perangkat desktop maupun mobile, dengan terminologi yang disesuaikan per peran pengguna sehingga karyawan tidak perlu memahami konsep blockchain untuk menggunakan sistem. Seluruh jargon teknis blockchain disembunyikan dan digantikan dengan istilah yang familiar, seperti "Akun Gaji" untuk wallet dan "Tarik Gaji" untuk klaim salary.

Payana memiliki antarmuka pengguna berikut:

| No | Nama Form / Halaman | Deskripsi Fungsi |
|----|---------------------|------------------|
| 1 | Halaman Login | Autentikasi pengguna melalui tanda tangan kriptografi EIP-191 menggunakan embedded wallet Privy. Pengguna menandatangani pesan tantangan yang mengandung timestamp Unix untuk membuktikan kepemilikan alamat dompet. |
| 2 | Halaman Onboarding (Umum) | Halaman `/onboarding` sekarang khusus untuk **registrasi karyawan** (invitation-only, lihat UC-21): mengharuskan parameter `?invite=<token>` yang valid dari HR, tanpa pilihan bebas perusahaan. Registrasi company (calon HR Admin) memiliki formulir terpisah yang menyertakan alamat dompet, email, nama, NPWP, NIB, data direktur, dan dokumen akta pendirian; pengguna dapat memantau status permohonan setelah pengajuan. |
| 3 | Dashboard Owner SaaS | Dasbor agregat untuk operator platform Payana: ringkasan Total Value Locked (TVL), jumlah tenant aktif, estimasi Monthly Recurring Revenue, daftar antrian pendaftaran HR baru, dan tombol persetujuan atau penolakan pendaftaran. |
| 4 | Dashboard Vault HR | Manajemen treasury perusahaan: saldo vault IDRX saat ini, total flow rate penggajian bulanan, tombol deposit dana ke vault, tombol penarikan saldo bebas, dan indikator peringatan saldo rendah. |
| 5 | Manajemen Karyawan HR | Daftar seluruh karyawan aktif beserta status stream, flow rate masing-masing, dan saldo gaji yang telah terakumulasi secara real-time. Menyediakan navigasi ke detail per karyawan. |
| 6 | Detail Karyawan HR | Detail stream individual karyawan: flow rate aktif, saldo severance yang terakumulasi, riwayat klaim, serta tombol untuk menjeda, melanjutkan, memperbarui, atau membatalkan stream gaji karyawan tersebut. |
| 7 | Onboarding Karyawan HR | Formulir penambahan karyawan baru ke dalam sistem: input Work ID (alamat dompet karyawan), pengaturan flow rate IDRX per detik, dan konfigurasi persentase split (karyawan, kepatuhan, severance). |
| 8 | Manajemen PHK HR | Antrian proposal Pemutusan Hubungan Kerja: daftar proposal aktif beserta status persetujuan `HR_ROLE` dan `LEGAL_ROLE` (keduanya dijalankan HR Admin yang sama, lihat §3.1), formulir pengajuan proposal PHK baru, dan tombol eksekusi setelah kedua langkah persetujuan terpenuhi. |
| 9 | Manajemen Vesting HR | Daftar cliff vest aktif per karyawan: tombol pembuatan vest baru (dengan pilihan tipe Retention, Probation, atau ESOP, jumlah IDRX, dan tanggal cliff), serta tombol pembatalan vest yang belum matang. |
| 10 | Kasbon HR | Daftar pengajuan kasbon karyawan (Pending/Active/Rejected/Repaid), tombol setujui/tolak, dan riwayat pemotongan pajak (PPh21 + BPJS) per klaim gaji. |
| 11 | Laporan Kepatuhan HR | Pratinjau ringkasan kepatuhan bulanan (jumlah karyawan, total gaji diklaim, total compliance, total severance) dan tombol unduh laporan CSV BPJS/PPh21 per periode bulan. |
| 12 | Audit Log HR | Riwayat seluruh aksi yang direkam dalam audit log off-chain untuk perusahaan yang bersangkutan, mencakup relay transaksi, ekspor laporan, dan likuidasi pinjaman, dilengkapi timestamp dan hash transaksi. |
| 13 | Pengaturan HR | Konfigurasi parameter vault perusahaan: tarif BPJS (bpjsBps), tarif PPh21 (pph21Bps), dan threshold persentase peringatan saldo rendah (lowBalanceThresholdBps). |
| 14 | Halaman Reimburse HR | Manajemen klaim reimbursement (penggantian biaya operasional) yang diajukan oleh karyawan: daftar klaim masuk, tombol persetujuan, dan pencatatan pembayaran. |
| 15 | Halaman Bounty HR | Manajemen program bounty atau insentif kinerja berbasis penyelesaian tugas: pembuatan papan bounty, penetapan hadiah IDRX, dan pencatatan klaim yang disetujui. |
| 16 | Dashboard EWA Karyawan | Tampilan utama karyawan: saldo gaji yang telah terakumulasi secara real-time berdasarkan flow rate aktif, tombol "Tarik Gaji" untuk melakukan klaim melalui transaksi gasless, dan riwayat penarikan sebelumnya. |
| 17 | Pesangon Karyawan | Tampilan saldo dana pesangon karyawan yang terakumulasi on-chain (2% dari setiap klaim gaji), beserta status dana (Terkunci atau Cair) dan estimasi besaran berdasarkan masa kerja. |
| 18 | Vesting Karyawan | Daftar cliff vest yang dimiliki karyawan: jumlah IDRX yang terkunci, tanggal cliff yang harus dicapai sebelum pencairan, tipe vest, dan status (Terkunci atau Telah Diklaim). |
| 19 | Kasbon Karyawan | Status kasbon aktif beserta sisa yang harus dilunasi, tombol pengajuan kasbon baru, dan rincian potongan PPh21/BPJS pada setiap klaim gaji. |
| 20 | Transfer Karyawan | Fasilitas transfer IDRX dari dompet karyawan ke alamat EVM lain di luar sistem, misalnya ke rekening MetaMask atau bursa kripto. |
| 21 | Audit Log Karyawan | Riwayat klaim gaji dan transaksi kasbon milik karyawan yang sedang login, dengan tampilan timestamp dan jumlah IDRX setiap transaksi. |
| 22 | Pengaturan Karyawan | Pembaruan profil pribadi karyawan: nama lengkap, NIK 16 digit, dan nomor telepon. Data disimpan dalam bentuk terenkripsi AES-256-GCM di server off-chain. |
| 23 | Reimburse Karyawan | Formulir pengajuan klaim reimbursement oleh karyawan: input keterangan biaya, jumlah IDRX yang diminta, dan unggah bukti pendukung, disertai status persetujuan dari HR. |
| 24 | Bounty Karyawan | Tampilan daftar program bounty atau tugas berbasis insentif yang tersedia untuk karyawan, beserta tombol klaim hadiah IDRX setelah menyelesaikan tugas yang ditetapkan. |
| 25 | Notifikasi Karyawan | Daftar notifikasi milik karyawan yang sedang login (maksimum 50 terbaru, urut terbaru dulu), dengan aksi tandai satu atau seluruh notifikasi sebagai telah dibaca. Lihat UC-24. |
| 26 | Slip Gaji (Payslip) Karyawan | Rincian breakdown satu transaksi klaim gaji tertentu: gaji bruto terakumulasi, potongan platform fee, cicilan kasbon, pajak/BPJS, severance, dan gaji bersih yang diterima. Dapat diakses oleh karyawan pemilik klaim atau HR terkait. Lihat UC-25. |
| 27 | Bukti Potong Pajak (Tax Cert) Karyawan | Agregasi tahunan total gaji bruto, dana kepatuhan, severance, dan gaji bersih karyawan per tahun pajak, untuk keperluan pelaporan SPT pribadi. Lihat UC-26. |
| 28 | Surat Keterangan Kerja | Pengajuan permohonan surat keterangan kerja oleh karyawan (dengan tujuan penggunaan seperti KPR, Kredit, Visa) kepada HR, serta pengunduhan dokumen setelah disetujui. Lihat UC-27. |
| 29 | Direktori Karyawan HR | Daftar seluruh karyawan suatu perusahaan beserta departemen dan jabatan, dengan kemampuan HR meng-assign/memperbarui department dan position per karyawan. Lihat UC-28. |

Selain halaman di atas, Payana juga menyediakan laporan berikut:

| No | Nama Report | Deskripsi Fungsi |
|----|-------------|------------------|
| 1 | Laporan Kepatuhan Bulanan | Laporan CSV per karyawan yang memuat alamat dompet, nama (didekripsi), NIK (didekripsi), nomor telepon (didekripsi), jumlah klaim, total gaji yang diklaim, total dana kepatuhan BPJS/PPh21, dan total dana severance untuk periode bulan tertentu. Digunakan untuk rekonsiliasi dengan DJP dan BPJS. |
| 2 | Ringkasan Payroll Bulanan | Respons JSON agregat yang memuat jumlah karyawan unik, total gaji diklaim, total compliance, dan total severance untuk satu perusahaan pada bulan tertentu. Ditampilkan sebagai pratinjau sebelum ekspor CSV. |
| 3 | Audit Log Platform | Tampilan daftar seluruh aksi signifikan backend yang terekam (BUNDLER_RELAY, COMPLIANCE_EXPORT, LOAN_LIQUIDATED) dengan informasi aktor, hash transaksi atau UserOperation, dan metadata tambahan. Dapat difilter per peran pengguna. |

---

#### 3.1.2 Antarmuka Perangkat Keras

Sistem Payana berbasis web dan tidak memiliki persyaratan perangkat keras khusus di sisi pengguna. Seluruh komputasi berat dilakukan di server backend, Ponder indexer, dan jaringan blockchain. Persyaratan minimum perangkat klien adalah sebagai berikut.

Dari sisi browser, pengguna memerlukan Google Chrome versi 90 ke atas, Mozilla Firefox versi 88 ke atas, atau Safari versi 14 ke atas, dengan dukungan JavaScript ES2020 dan WebCrypto API yang digunakan untuk proses tanda tangan kriptografi di sisi klien. Dari sisi koneksi internet, dibutuhkan minimal 1 Mbps untuk penggunaan dasar, sementara 5 Mbps atau lebih direkomendasikan untuk memperoleh pembaruan saldo real-time yang mulus melalui koneksi WebSocket. Dari sisi perangkat mobile, sistem mendukung Android 10 ke atas dan iOS 14 ke atas melalui browser mobile, tanpa memerlukan instalasi aplikasi native. Dari sisi resolusi layar, antarmuka dirancang secara mobile-first dengan lebar minimum 375 piksel dan mendukung tampilan penuh hingga 1440 piksel pada monitor desktop.

---

#### 3.1.3 Antarmuka Perangkat Lunak

Perangkat lunak sisi server dan blockchain:

| No | Nama | Versi | Sumber | Deskripsi |
|----|------|-------|--------|-----------|
| 1 | Node.js | 18 LTS (minimum) | nodejs.org | Runtime JavaScript server-side untuk backend Express dan layanan Ponder indexer. |
| 2 | Express | 5.2.1 | expressjs.com | Framework HTTP server untuk REST API backend Payana. |
| 3 | TypeScript | 6.0.2 (backend) | typescriptlang.org | Superset JavaScript dengan type safety yang digunakan di seluruh lapisan kode. |
| 4 | Drizzle ORM | 0.45.2 | orm.drizzle.team | ORM type-safe untuk akses database PostgreSQL dari backend Node.js. |
| 5 | PostgreSQL | Flexible Server (Azure) | azure.microsoft.com | Database relasional untuk penyimpanan data off-chain: sesi, profil karyawan terenkripsi, audit log, dan data yang diindeks oleh Ponder. |
| 6 | jsonwebtoken | 9.0.3 | npmjs.com | Library pembuatan dan verifikasi JSON Web Token untuk manajemen sesi backend. |
| 7 | viem (backend) | 2.47.17 | viem.sh | Library EVM low-level yang digunakan backend untuk verifikasi tanda tangan EIP-191 pada proses login. |
| 8 | ws | 8.18.0 | npmjs.com | Library WebSocket server untuk pengiriman notifikasi real-time dari backend ke klien. |
| 9 | node-cron | 4.2.1 | npmjs.com | Scheduler untuk tugas berkala di backend, seperti pemantauan Paymaster dan pemrosesan event. |
| 10 | Ponder | 0.16.6 | ponder.sh | Framework indeksasi event blockchain real-time ke PostgreSQL; menyediakan API untuk query data historis. |
| 11 | Hono | 4.5.0 | hono.dev | Framework HTTP ringan yang digunakan oleh layanan Ponder untuk mengekspos API query. |
| 12 | Solidity | 0.8.26 | soliditylang.org | Bahasa pemrograman smart contract untuk keempat kontrak on-chain Payana. |
| 13 | Foundry (Forge) | Latest | getfoundry.sh | Framework kompilasi, pengujian unit, dan deployment smart contract Solidity. |
| 14 | OpenZeppelin Contracts | v5 | openzeppelin.com | Library smart contract teraudit: AccessControl, ReentrancyGuard, ERC-721, SafeERC20. |

Perangkat lunak sisi klien:

| No | Nama | Versi | Sumber | Deskripsi |
|----|------|-------|--------|-----------|
| 1 | Next.js | 16.2.6 | nextjs.org | Framework React dengan App Router untuk keseluruhan frontend SaaS Payana. |
| 2 | React | 19.2.4 | react.dev | Library antarmuka pengguna berbasis komponen yang menjadi fondasi frontend. |
| 3 | TypeScript | 5.x | typescriptlang.org | Superset JavaScript dengan type safety untuk kode sisi klien. |
| 4 | Tailwind CSS | 4.x | tailwindcss.com | Framework CSS utility-first untuk styling seluruh komponen antarmuka. |
| 5 | wagmi | 2.15.0 | wagmi.sh | Library React hooks untuk interaksi EVM: pembacaan kontrak, pengiriman transaksi, dan manajemen koneksi wallet. |
| 6 | viem (frontend) | 2.47.0 | viem.sh | Library EVM low-level untuk encoding calldata, decoding hasil kontrak, dan operasi kriptografi di sisi klien. |
| 7 | Privy SDK | 2.10.0 (@privy-io/react-auth) | privy.io | SDK embedded wallet dan autentikasi; memungkinkan pengguna login via email atau media sosial tanpa seed phrase. |
| 8 | framer-motion | 12.40.0 | framer.com | Library animasi React untuk transisi halaman dan komponen antarmuka. |
| 9 | recharts | 3.8.1 | recharts.org | Library visualisasi data dan grafik untuk dashboard saldo, flow rate, dan riwayat transaksi. |
| 10 | lucide-react | 1.16.0 | lucide.dev | Library ikon SVG untuk komponen antarmuka pengguna. |

---

#### 3.1.4 Antarmuka Komunikasi

1. HTTPS (TLS 1.3) digunakan untuk seluruh komunikasi dua arah antara browser klien dan server backend Express, memastikan kerahasiaan dan integritas data yang ditransmisikan termasuk JWT dan data PII karyawan.

2. JSON-RPC 2.0 via HTTPS digunakan oleh backend untuk berkomunikasi dengan node Alchemy RPC (pembacaan state kontrak dan pengiriman transaksi HR) serta Pimlico Bundler (pengiriman UserOperation ERC-4337 untuk transaksi gasless karyawan).

3. WebSocket (protokol ws) digunakan untuk koneksi persisten antara server backend dan browser karyawan, memungkinkan pengiriman notifikasi real-time seperti konfirmasi klaim gaji berhasil tanpa perlu polling berulang dari klien.

4. HMAC-SHA256 Webhook digunakan untuk memverifikasi keaslian event yang dikirimkan oleh Alchemy Webhook ke endpoint backend. Setiap payload webhook ditandatangani oleh Alchemy; backend memvalidasi tanda tangan sebelum memproses event untuk mencegah pemalsuan data.

5. HTTP Bearer JWT (JSON Web Token) digunakan sebagai mekanisme autentikasi pada seluruh endpoint API terproteksi. Access token dengan masa berlaku 15 menit disisipkan di header Authorization: Bearer <token> pada setiap permintaan dari frontend ke backend.

---

#### 3.1.5 Antarmuka Sistem

Payana akan berhubungan dengan sistem-sistem berikut:

1. Base Blockchain (Ethereum L2) adalah jaringan eksekusi utama di mana seluruh smart contract Payana (PayrollFactory, CompanyVault, EmploymentSBT) di-deploy dan berjalan. Sistem menggunakan Chain ID 84532 untuk Base Sepolia (testnet) dan Chain ID 8453 untuk Base Mainnet (produksi). Finality optimistik Base adalah sekitar 2 detik dan digunakan sebagai dasar konfirmasi transaksi untuk keperluan UX aplikasi.

2. IDRX Token Contract adalah kontrak ERC-20 stablecoin berbasis Rupiah Indonesia dengan rasio 1 IDRX = 1 IDR dan presisi 18 desimal, yang di-deploy di jaringan Base. Seluruh operasi keuangan dalam sistem Payana menggunakan IDRX sebagai satu-satunya token pembayaran.

3. Alchemy digunakan sebagai penyedia layanan RPC premium untuk komunikasi backend ke jaringan Base, serta sebagai infrastruktur webhook yang mendorong event blockchain secara real-time ke backend Payana. QuickNode direncanakan sebagai penyedia RPC fallback.

4. Pimlico digunakan sebagai ERC-4337 Bundler yang menerima, memvalidasi, dan menyebarkan UserOperation dari karyawan ke EntryPoint contract di Base. Pimlico mensponsori biaya gas melalui Paymaster contract sehingga karyawan tidak perlu memiliki ETH. Alchemy Bundler direncanakan sebagai fallback.

5. Privy digunakan sebagai Wallet-as-a-Service (WaaS) yang memungkinkan pengguna mendapatkan embedded wallet Ethereum (Smart Account kompatibel ERC-4337) melalui login email atau akun media sosial, tanpa perlu menyimpan seed phrase secara manual.

6. Azure Database for PostgreSQL (Flexible Server) digunakan sebagai database relasional off-chain yang menyimpan data sesi JWT, profil karyawan terenkripsi (nama, NIK, telepon dalam format AES-256-GCM), audit log backend, data pendaftaran HR, serta tabel-tabel yang diindeks oleh Ponder. Server berlokasi di region Indonesia Central (Jakarta) untuk memenuhi persyaratan residensi data sesuai UU PDP No. 27/2022.

7. Azure App Service digunakan sebagai platform hosting backend Node.js/Express dan layanan Ponder indexer, juga berlokasi di region Indonesia Central untuk menjaga latensi rendah dan kepatuhan residensi data.

---

### 3.2 Kebutuhan Fungsional

#### Kelompok A: Onboarding dan Manajemen Vault Perusahaan

#### 3.2.10. Deployment Vault Perusahaan
ID Requirement : FR-PAYANA-201
Deskripsi      : Sistem harus memampukan Owner SaaS untuk mendeploy vault CompanyVault baru melalui kontrak PayrollFactory bagi HR Admin yang telah mendapatkan persetujuan. Setiap vault yang dideploy sepenuhnya terisolasi dari vault perusahaan lain — tidak ada dana atau state yang dibagikan antar-tenant. Satu alamat HR hanya dapat memiliki satu vault, dan upaya deployment kedua untuk alamat yang sama ditolak oleh kontrak PayrollFactory.

#### 3.2.11. Pendanaan Vault (Deposit IDRX)
ID Requirement : FR-PAYANA-202
Deskripsi      : Sistem harus memampukan HR Admin untuk mendepositkan IDRX ke vault perusahaannya melalui fungsi fundVault() pada kontrak CompanyVault. HR Admin wajib terlebih dahulu memberikan persetujuan ERC-20 (approve) kepada kontrak vault dengan jumlah yang setara atau lebih dari yang akan didepositkan. Saldo vault (vaultBalance) bertambah sebesar jumlah yang berhasil ditransfer dari dompet HR ke kontrak.

#### 3.2.12. Penarikan Saldo Bebas Vault
ID Requirement : FR-PAYANA-203
Deskripsi      : Sistem harus memampukan HR Admin untuk menarik IDRX dari saldo bebas vault ke alamat penerima yang ditentukan melalui fungsi withdrawVault(). Sistem menolak penarikan jika saldo bebas vault tidak mencukupi jumlah yang diminta. Setelah penarikan berhasil, sistem secara otomatis memeriksa apakah saldo yang tersisa berada di bawah threshold peringatan saldo rendah dan memancarkan event LowVaultBalance jika kondisi tersebut terpenuhi.

#### 3.2.13. Konfigurasi Parameter Vault
ID Requirement : FR-PAYANA-204
Deskripsi      : Sistem harus memampukan HR Admin untuk mengonfigurasi parameter operasional vault perusahaannya melalui fungsi setCompanyConfig() pada kontrak CompanyVault, yaitu tarif BPJS (bpjsBps), tarif PPh21 (pph21Bps), dan threshold persentase peringatan saldo rendah (lowBalanceThresholdBps). Tarif BPJS selalu dipakai langsung sebagai tarif tetap. Untuk PPh21, nilai pph21Bps bersifat opsional: jika HR mengisinya (> 0), sistem memakainya sebagai tarif tetap; jika dibiarkan pada nilai default (0), sistem menghitung tarif secara dinamis berdasarkan Tarif Efektif Rata-rata (TER) sesuai PMK 168/2023 melalui PayrollMath.calcPPh21TerBps(), berbasis estimasi gaji tahunan karyawan.

#### 3.2.14. Jeda dan Lanjutkan Operasi Vault
ID Requirement : FR-PAYANA-205
Deskripsi      : Sistem harus memampukan HR Admin untuk menjeda seluruh operasi vault sementara melalui fungsi pauseVault() (mengubah status menjadi Paused) dan mengaktifkannya kembali melalui fungsi resumeVault() (mengubah status menjadi Active). Vault yang sedang dijeda tidak memungkinkan karyawan melakukan klaim gaji melalui claimSalary(). Operasi jeda dan lanjut tidak tersedia apabila vault telah berada dalam status Frozen yang bersifat permanen.

#### 3.2.15. Pembekuan Vault Darurat
ID Requirement : FR-PAYANA-206
Deskripsi      : Sistem harus memampukan Owner SaaS untuk membekukan vault perusahaan secara permanen melalui fungsi freezeVault() yang dipanggil dari kontrak PayrollFactory, atau membekukan seluruh vault yang terdaftar secara bersamaan melalui fungsi emergencyFreezeAll(). Pembekuan bersifat irreversible — vault yang telah dibekukan tidak dapat dipulihkan ke status Active oleh siapapun. Fungsi ini diperuntukkan sebagai respons darurat terhadap insiden keamanan global.

#### 3.2.16. Pemantauan dan Peringatan Saldo Vault Rendah
ID Requirement : FR-PAYANA-207
Deskripsi      : Sistem harus secara otomatis memancarkan event LowVaultBalance on-chain setiap kali operasi yang mengurangi saldo vault menyebabkan saldo bebas turun di bawah threshold yang dikonfigurasi relatif terhadap kebutuhan penggajian bulanan agregat (totalFlowRate dikali 2.592.000 detik). Mekanisme ini berjalan otomatis setelah setiap operasi yang memengaruhi vaultBalance dan memperingatkan HR Admin agar segera mengisi ulang vault sebelum terjadi kegagalan pembayaran gaji.

#### 3.2.17. Penarikan Dana Kepatuhan
ID Requirement : FR-PAYANA-208
Deskripsi      : Sistem harus memampukan HR Admin untuk menarik dana yang telah terakumulasi di sub-pool kepatuhan (complianceBalance) ke alamat agen pajak atau rekening BPJS yang ditentukan melalui fungsi withdrawCompliance() pada kontrak CompanyVault. Sistem menolak penarikan jika complianceBalance tidak mencukupi jumlah yang diminta. Dana kepatuhan ini merupakan 5% (default) dari setiap klaim gaji karyawan yang secara otomatis diarahkan ke sub-pool ini saat claimSalary() dipanggil.

---

#### Kelompok B: Manajemen Akun dan Autentikasi

#### 3.2.1. Login Berbasis Tanda Tangan Kriptografi
ID Requirement : FR-PAYANA-101
Deskripsi      : Sistem harus memampukan pengguna untuk masuk ke platform dengan menggunakan tanda tangan kriptografi EIP-191 dari dompet Ethereum mereka. Pengguna membuat pesan tantangan yang mengandung timestamp Unix, menandatanganinya menggunakan embedded wallet Privy, dan mengirimkannya bersama alamat dompet ke server. Sistem memverifikasi keaslian tanda tangan melalui library viem dan menolak pesan yang selisih waktunya antara timestamp dalam pesan dengan waktu server melebihi 5 menit, guna mencegah serangan replay. Setelah verifikasi berhasil, sistem menerbitkan access token JWT (berlaku 15 menit) dan refresh token JWT (berlaku 7 hari) yang sesi aktifnya disimpan di database.

#### 3.2.2. Pembaruan Token Akses
ID Requirement : FR-PAYANA-102
Deskripsi      : Sistem harus memampukan pengguna untuk memperbarui access token yang telah kadaluarsa dengan menggunakan refresh token yang masih valid, tanpa perlu melakukan proses tanda tangan ulang. Sistem memvalidasi bahwa sesi yang terkait dengan refresh token masih tercatat aktif di database berdasarkan nilai jti sebelum menerbitkan access token baru. Jika sesi telah dicabut atau kadaluarsa, sistem menolak permintaan dan mengharuskan pengguna melakukan login ulang melalui tanda tangan.

#### 3.2.3. Pencabutan Sesi (Logout)
ID Requirement : FR-PAYANA-103
Deskripsi      : Sistem harus memampukan pengguna yang sedang terautentikasi untuk mengakhiri sesinya secara aktif. Saat logout, sistem menghapus rekaman sesi yang terkait berdasarkan nilai jti JWT dari database, sehingga refresh token yang bersangkutan tidak dapat digunakan kembali untuk memperbarui access token di masa mendatang. Proses ini memastikan pencabutan sesi yang deterministik dan tidak bergantung pada waktu kadaluarsa token semata.

#### 3.2.4. Pendaftaran dan Pembaruan Profil Pengguna
ID Requirement : FR-PAYANA-104
Deskripsi      : Sistem harus memampukan pengguna yang telah terautentikasi untuk mendaftarkan atau memperbarui data profilnya yang mencakup nama lengkap, NIK (Nomor Induk Kependudukan 16 digit), dan nomor telepon. Sistem memvalidasi bahwa NIK terdiri dari tepat 16 digit numerik sebelum penyimpanan. Seluruh data PII tersebut dienkripsi menggunakan AES-256-GCM sebelum disimpan di database off-chain, sesuai ketentuan UU PDP No. 27/2022.

#### 3.2.5. Pengambilan Data Profil Pengguna
ID Requirement : FR-PAYANA-105
Deskripsi      : Sistem harus memampukan pengguna yang telah terautentikasi untuk mengambil data profilnya sendiri. Sistem mendekripsi data PII yang tersimpan (nama, NIK, nomor telepon) sebelum mengirimkannya ke klien, sehingga klien menerima data dalam bentuk plaintext. Pengguna hanya dapat mengakses profil miliknya sendiri berdasarkan alamat dompet yang terekam pada JWT yang digunakan saat permintaan.

#### 3.2.6. Resolusi Peran Pengguna
ID Requirement : FR-PAYANA-106
Deskripsi      : Sistem harus secara otomatis menentukan peran yang dimiliki pengguna setelah autentikasi berhasil, dengan memeriksa kondisi on-chain. Urutan prioritas pemeriksaan adalah: Owner SaaS (dicocokkan terhadap OWNER_ADDRESS dalam konfigurasi sistem), kemudian HR Admin (diperiksa berdasarkan kepemilikan CompanyVault melalui PayrollFactory), kemudian Karyawan (diperiksa berdasarkan keberadaan stream aktif atau riwayat PHK yang sah). Pengguna yang tidak memenuhi kriteria peran manapun diarahkan ke halaman onboarding untuk mengajukan permohonan akses. **Catatan implementasi:** hook deteksi peran (`useRole.ts`) tidak memiliki cabang pemeriksaan `LEGAL_ROLE` — pemegang `LEGAL_ROLE` yang bukan juga `HR_ROLE` akan mendapat `role: null` dan diarahkan ke onboarding, bukan ke dashboard khusus Legal (lihat §3.1 dan DPPL §2.4.5 untuk penjelasan lengkap).

#### 3.2.7. Pengajuan Permohonan Pendaftaran HR Admin
ID Requirement : FR-PAYANA-107
Deskripsi      : Sistem harus memampukan calon HR Admin untuk mengajukan permohonan akses platform dengan menyertakan alamat dompet, email, dan nama. Permohonan disimpan di database dengan status awal "pending" dan menunggu persetujuan dari Owner SaaS sebelum deployment vault dapat dilakukan. Jika permohonan dengan alamat yang sama sudah ada, sistem memperbarui data yang tersimpan dengan informasi terbaru tanpa membuat entri duplikat.

#### 3.2.8. Peninjauan Antrian Pendaftaran oleh Owner SaaS
ID Requirement : FR-PAYANA-108
Deskripsi      : Sistem harus memampukan Owner SaaS untuk mengambil dan menampilkan daftar seluruh permohonan pendaftaran HR yang tersimpan di database, diurutkan berdasarkan waktu pengajuan. Sistem memastikan endpoint ini hanya dapat diakses oleh pengguna yang terautentikasi dan memiliki hak akses Owner SaaS berdasarkan konfigurasi OWNER_ADDRESS sistem.

#### 3.2.9. Persetujuan atau Penolakan Pendaftaran HR
ID Requirement : FR-PAYANA-109
Deskripsi      : Sistem harus memampukan Owner SaaS untuk menyetujui atau menolak permohonan pendaftaran HR Admin berdasarkan alamat dompet yang diajukan. Persetujuan mengubah status permohonan menjadi "approved" di database sehingga calon HR dapat melanjutkan ke tahap deployment vault; penolakan mengubah status menjadi "rejected". Tindakan ini hanya dapat dilakukan oleh pengguna yang terautentikasi dengan hak akses Owner SaaS.

---

### Kelompok C: Kepatuhan dan Pelaporan

Kelompok ini mendefinisikan kebutuhan fungsional yang berkaitan dengan pengumpulan, pengelolaan, dan pelaporan dana kepatuhan regulasi Indonesia, mencakup akumulasi iuran BPJS dan Pajak Penghasilan Pasal 21 (PPh21) per karyawan, serta kemampuan HR untuk mengunduh laporan rekonsiliasi bulanan dan menarik dana kepatuhan ke agen pajak.

---

#### 3.2.12. Akumulasi Dana Kepatuhan per Karyawan

ID Requirement : FR-PAYANA-801

Deskripsi      : Sistem harus secara otomatis mengakumulasikan porsi kepatuhan (complianceBps, default 5%) dari setiap klaim gaji yang dilakukan oleh karyawan ke dalam sub-pool kepatuhan vault perusahaan yang dilacak melalui variabel `complianceBalance`. Setiap karyawan harus memiliki catatan akumulasi kepatuhan individual yang disimpan dalam mapping `employeeComplianceAccumulated` sehingga HR dapat melakukan rekonsiliasi per karyawan untuk keperluan pelaporan BPJS dan PPh21. Akumulasi ini terjadi secara atomik dalam transaksi yang sama dengan distribusi gaji karyawan dan penambahan saldo pesangon, sehingga ketiga komponen split tidak dapat dieksekusi secara parsial. Karyawan tidak dapat mengakses atau menarik dana kepatuhan yang telah diakumulasikan atas namanya; hanya HR yang memiliki akses untuk mengelola dana ini.

---

#### 3.2.13. Konfigurasi Tarif BPJS dan PPh21 oleh HR

ID Requirement : FR-PAYANA-802

Deskripsi      : Sistem harus memampukan HR Admin untuk mengonfigurasi tarif BPJS (bpjsBps) dan, secara opsional, tarif tetap PPh21 (pph21Bps) dalam satuan basis points melalui fungsi `setCompanyConfig()`. Tarif BPJS selalu dipakai langsung sebagai potongan tetap saat `claimSalary()`. Untuk PPh21, jika HR mengisi `pph21Bps` (> 0), nilai tersebut dipakai sebagai override tarif tetap; jika dibiarkan pada nilai default (0), sistem menghitung tarif secara dinamis mengikuti skema Tarif Efektif Rata-rata (TER) sesuai PMK 168/2023 melalui `PayrollMath.calcPPh21TerBps()` (lihat FR-PAYANA-701), sehingga platform tidak perlu update smart contract setiap kali bracket tarif berubah. Sistem harus memastikan bahwa perubahan tarif hanya dapat dilakukan oleh pengguna dengan `HR_ROLE` pada vault perusahaan yang bersangkutan, dan setiap perubahan konfigurasi harus berlaku untuk klaim gaji yang terjadi setelah perubahan tersebut, tidak berlaku surut.

> Catatan: FR-PAYANA-802 ini menjelaskan mekanisme konfigurasi yang sama dengan FR-PAYANA-204 (§3.2.13 pada seksi Kelompok D). Duplikasi ini adalah isu penomoran subbab lama yang sudah diketahui (dua section "3.2 Kebutuhan Fungsional" terpisah dalam dokumen ini) dan perlu dirapikan pada revisi renumbering berikutnya.

---

#### 3.2.14. Penarikan Dana Kepatuhan oleh HR ke Agen Pajak

ID Requirement : FR-PAYANA-803

Deskripsi      : Sistem harus memampukan HR Admin untuk menarik akumulasi dana kepatuhan dari sub-pool komplianse vault ke alamat tujuan yang ditentukan (misalnya dompet agen pajak atau rekening bridging pembayaran BPJS) melalui fungsi `withdrawCompliance()`. Sistem harus memvalidasi bahwa jumlah yang akan ditarik tidak melebihi saldo `complianceBalance` yang tersedia; jika tidak mencukupi, transaksi ditolak dengan error `InsufficientComplianceBalance`. Fungsi ini hanya dapat dipanggil oleh pengguna dengan `HR_ROLE` dan transfer dilakukan langsung ke alamat penerima yang ditentukan oleh HR, bukan ke alamat HR itu sendiri secara implisit. Event `ComplianceWithdrawn` diterbitkan setelah penarikan berhasil untuk keperluan audit trail on-chain.

---

#### 3.2.15. Unduhan Laporan Kepatuhan oleh HR

ID Requirement : FR-PAYANA-804

Deskripsi      : Sistem harus memampukan HR Admin untuk mengunduh laporan kepatuhan bulanan dalam format CSV yang berisi rincian akumulasi dana kepatuhan per karyawan, mencakup total IDRX yang diakumulasikan untuk periode tertentu, estimasi alokasi BPJS Kesehatan, BPJS Ketenagakerjaan, dan PPh21 berdasarkan tarif yang dikonfigurasi, serta saldo komplianse yang belum ditarik. Laporan ini dihasilkan oleh layanan backend berdasarkan data yang diindeks oleh Ponder dari event `SalaryClaimed` dan `ComplianceWithdrawn` on-chain, yang dipadankan dengan data karyawan (nama, NIK terenkripsi) dari basis data off-chain. Data PII karyawan hanya didekripsi sementara pada saat ekspor laporan dan tidak disimpan dalam bentuk plaintext di server, sesuai dengan kewajiban UU PDP No. 27/2022. Laporan yang diekspor harus mencantumkan periode pelaporan dan cap waktu ekspor untuk keperluan audit.

---

#### 3.2.16. Pemantauan Status Kepatuhan per Karyawan

ID Requirement : FR-PAYANA-805

Deskripsi      : Sistem harus memampukan HR Admin untuk memantau akumulasi dana kepatuhan per karyawan secara individual melalui dashboard, termasuk total IDRX yang telah diakumulasikan sejak karyawan bergabung (`employeeComplianceAccumulated`) dan estimasi kewajiban BPJS serta PPh21 yang telah terpenuhi. Data ini harus ditampilkan dalam bentuk yang mudah dibandingkan dengan kewajiban nominal yang seharusnya dibayarkan ke DJP dan BPJS, sehingga HR dapat mengidentifikasi selisih jika ada. [Perlu dikonfirmasi] Mekanisme rekonsiliasi otomatis antara saldo `complianceBalance` on-chain dan kewajiban pembayaran aktual ke DJP/BPJS belum diimplementasikan pada versi MVP dan memerlukan spesifikasi lebih lanjut untuk integrasi dengan sistem pemerintah.

---

### Kelompok D: Vesting dan Bonus

Kelompok ini mendefinisikan kebutuhan fungsional yang berkaitan dengan mekanisme penguncian insentif karyawan (cliff vesting), mencakup seluruh siklus hidup dari pembuatan jadwal vesting, pengelolaan oleh HR, pencairan oleh karyawan, hingga penyitaan dana saat karyawan keluar sebelum cliff date terpenuhi.

---

#### 3.2.1. Pembuatan Cliff Vest oleh HR

ID Requirement : FR-PAYANA-601

Deskripsi      : Sistem harus memampukan HR Admin untuk membuat entri cliff vest baru bagi seorang karyawan dengan menetapkan jumlah IDRX yang dikunci, tanggal cliff (cliff timestamp), dan tipe vest (Retention, Probation, atau ESOP). Pada saat fungsi `createCliffVest()` berhasil dieksekusi, sejumlah IDRX yang ditentukan dipindahkan secara atomik dari saldo bebas vault perusahaan ke bucket internal vest dengan status Locked, sehingga dana tersebut tidak dapat digunakan untuk keperluan lain sebelum cliff date terpenuhi atau vest diforfeiture. Sistem harus menjamin bahwa cliff timestamp yang ditetapkan selalu lebih besar dari waktu blok saat ini, dan jika saldo vault tidak mencukupi, transaksi harus dibalik seluruhnya dengan error `InsufficientVaultBalance`. Setiap entri vest diberi identifikasi unik (vestId) yang digunakan dalam seluruh operasi selanjutnya, dan event `CliffVestCreated` diterbitkan untuk keperluan audit dan indeksasi oleh layanan Ponder.

---

#### 3.2.2. Pencairan Cliff Vest oleh Karyawan

ID Requirement : FR-PAYANA-602

Deskripsi      : Sistem harus memampukan karyawan untuk mencairkan cliff vest miliknya secara mandiri setelah cliff date terpenuhi, dengan memanggil fungsi `claimCliffVest()` menggunakan vestId yang relevan. Sistem harus memvalidasi bahwa pemanggil (msg.sender) adalah karyawan pemilik vest tersebut, bahwa timestamp blok saat ini sudah melampaui atau sama dengan cliffTs yang ditetapkan, dan bahwa status vest masih dalam kondisi Locked. Jika semua kondisi terpenuhi, sejumlah IDRX sesuai dengan nilai vest ditransfer langsung ke alamat Work ID karyawan, status vest diperbarui menjadi Claimed, dan event `CliffVestClaimed` diterbitkan. Jika cliff date belum terpenuhi, sistem harus menolak transaksi dengan error `CliffNotReached` tanpa mengubah state apa pun.

---

#### 3.2.3. Pembatalan dan Penyitaan Cliff Vest oleh HR

ID Requirement : FR-PAYANA-603

Deskripsi      : Sistem harus memampukan HR Admin untuk membatalkan cliff vest seorang karyawan yang masih berstatus Locked dengan memanggil fungsi `cancelCliffVest()`, baik sebagai tindakan eksplisit maupun sebagai bagian dari proses resign atau PHK. Pada saat pembatalan, seluruh IDRX yang sebelumnya dikunci dalam vest dikembalikan ke saldo bebas vault perusahaan, status vest diperbarui menjadi Forfeited, dan event `CliffVestForfeited` diterbitkan. Sistem juga harus mengeksekusi penyitaan otomatis seluruh cliff vest berstatus Locked milik seorang karyawan melalui fungsi internal `_forfeitAllVests()` setiap kali proses `resignEmployee()` atau `executeTermination()` berhasil dijalankan, sehingga tidak ada vest yang tertinggal dalam status Locked setelah hubungan kerja berakhir.

---

#### 3.2.4. Pengelolaan Jadwal Vesting oleh HR

ID Requirement : FR-PAYANA-604

Deskripsi      : Sistem harus memampukan HR Admin untuk melihat seluruh cliff vest yang pernah dibuat untuk setiap karyawan, termasuk jumlah IDRX yang dikunci, tanggal cliff, tipe vest, dan status terkini (Locked, Claimed, atau Forfeited), melalui fungsi view `cliffVests` yang dapat diakses secara publik dari on-chain dan diindeks oleh layanan Ponder. Informasi jadwal vesting ini harus dapat ditampilkan di dashboard HR dalam format yang mudah dipahami, mencakup sisa waktu menuju cliff date dalam satuan hari, agregat total IDRX yang sedang dikunci di seluruh vest aktif, serta histori vest yang telah dicairkan atau disita. Data jadwal vesting per karyawan harus dapat diakses oleh karyawan yang bersangkutan melalui dashboard karyawan sehingga mereka mengetahui kapan bonus atau insentif mereka dapat dicairkan.

---

#### 3.2.5. Dukungan Beberapa Tipe Vest dalam Satu Periode

ID Requirement : FR-PAYANA-605

Deskripsi      : Sistem harus mendukung pembuatan lebih dari satu cliff vest aktif secara bersamaan untuk karyawan yang sama, misalnya bonus retensi enam bulan yang berjalan paralel dengan vest masa percobaan tiga bulan. Setiap vest diidentifikasi secara unik melalui kombinasi alamat karyawan dan vestId yang dihasilkan dari counter global `vestCounter`, sehingga operasi pada satu vest tidak memengaruhi vest lainnya. Sistem harus mendukung tiga tipe vest yang berbeda — Retention untuk bonus retensi karyawan kunci, Probation untuk insentif masa percobaan, dan ESOP untuk program kepemilikan saham karyawan — di mana masing-masing tipe memiliki semantik bisnis yang berbeda meskipun mekanisme penguncian dan pencairan on-chain identik. Informasi tipe vest harus disimpan on-chain dan dapat digunakan oleh frontend untuk menampilkan label yang kontekstual kepada karyawan.

---

### Kelompok E: Mesin Pajak & Kasbon

Kelompok ini mendefinisikan kebutuhan fungsional untuk pemotongan otomatis PPh21 (skema Tarif Efektif Rata-rata/TER sesuai PMK 168/2023) dan BPJS pada setiap klaim gaji, serta fasilitas kasbon (uang muka gaji) yang memampukan karyawan menarik sebagian gaji yang belum accrued sebagai talangan, dengan pelunasan otomatis saat klaim gaji berikutnya.

---

#### 3.2.6. Kalkulasi PPh21 TER Otomatis Saat Klaim Gaji

ID Requirement : FR-PAYANA-701

Deskripsi      : Sistem harus menghitung tarif PPh21 Tarif Efektif Rata-rata (TER) secara otomatis pada setiap pemanggilan `claimSalary()`, berdasarkan estimasi gaji tahunan (flowRate dikali estimasi detik per tahun), kecuali HR telah mengonfigurasi tarif tetap (`pph21Bps` > 0, lihat FR-PAYANA-204) yang akan digunakan sebagai override. Sistem harus menerapkan skema bracket sesuai PMK 168/2023: 0% untuk estimasi gaji tahunan hingga Rp60.000.000, 5% hingga Rp250.000.000, 15% hingga Rp500.000.000, 25% hingga Rp5.000.000.000, dan 30% di atas Rp5.000.000.000. Perhitungan dinamis dilakukan oleh fungsi murni `PayrollMath.calcPPh21TerBps()` yang mengembalikan tarif dalam basis poin.

---

#### 3.2.7. Pemotongan BPJS Sesuai Konfigurasi HR

ID Requirement : FR-PAYANA-702

Deskripsi      : Sistem harus memampukan HR Admin mengonfigurasi tarif BPJS (`bpjsBps`) melalui `setCompanyConfig()`. Pada setiap `claimSalary()`, sistem harus memotong jumlah sebesar `accrued × bpjsBps / 10000` sebagai iuran BPJS, dikombinasikan dengan hasil perhitungan PPh21 (FR-PAYANA-701), dan menggabungkan keduanya ke dalam `complianceBalance` vault perusahaan untuk ditarik HR ke instansi terkait (DJP/BPJS). Perubahan tarif hanya berlaku untuk klaim gaji setelah perubahan dilakukan, tidak berlaku surut.

---

#### 3.2.8. Riwayat Pemotongan Pajak dan BPJS per Klaim Gaji

ID Requirement : FR-PAYANA-703

Deskripsi      : Sistem harus menerbitkan event `TaxWithheld(employee, pph21Amount, bpjsAmount, timestamp)` pada setiap klaim gaji yang memuat pemotongan pajak, dan mengindeksnya melalui Ponder. HR dan karyawan yang bersangkutan harus dapat melihat riwayat pemotongan ini pada halaman Compliance/Kasbon masing-masing, termasuk breakdown antara komponen PPh21 dan BPJS per transaksi klaim.

---

#### 3.2.9. Pengajuan Kasbon oleh Karyawan

ID Requirement : FR-PAYANA-704

Deskripsi      : Sistem harus memampukan karyawan dengan stream gaji aktif untuk mengajukan kasbon (uang muka gaji) dengan memanggil `requestAdvance()` secara gasless melalui Paymaster. Sistem harus memvalidasi bahwa jumlah kasbon tidak melebihi 80% dari estimasi gaji bulanan karyawan (`MAX_ADVANCE_BPS = 8000`) dan bahwa karyawan tidak memiliki kasbon aktif atau pending lainnya (satu kasbon aktif dalam satu waktu). Status kasbon berubah menjadi `Pending` dan event `AdvanceRequested` diterbitkan.

---

#### 3.2.10. Persetujuan dan Penolakan Kasbon oleh HR

ID Requirement : FR-PAYANA-705

Deskripsi      : Sistem harus memampukan HR Admin menyetujui pengajuan kasbon karyawan melalui `approveAdvance(employee)`, dengan validasi bahwa `vaultBalance` perusahaan mencukupi jumlah yang diajukan; dana kasbon langsung ditransfer ke karyawan dan status berubah menjadi `Active`, event `AdvanceApproved` diterbitkan. Sistem juga harus memampukan HR menolak pengajuan melalui `rejectAdvance(employee)`, mengubah status menjadi `Rejected` (event `AdvanceRejected`) dan memampukan karyawan mengajukan kembali.

---

#### 3.2.11. Pelunasan Kasbon Otomatis Saat Klaim Gaji

ID Requirement : FR-PAYANA-706

Deskripsi      : Sistem harus memotong `min(20% dari accrued, sisa kasbon)` dari setiap klaim gaji karyawan yang memiliki kasbon berstatus `Active`, sebagai cicilan otomatis, sebelum pemotongan PPh21/BPJS dan pesangon. Ketika sisa kasbon mencapai nol, status berubah menjadi `Repaid`. Event `AdvanceRepaid(employee, repaidAmount, remainingDebt)` diterbitkan pada setiap cicilan. Pada `resignEmployee()` atau `executeTermination()`, sisa kasbon yang belum lunas dihapus (bad debt — trade-off yang disengaja untuk MVP; pesangon yang telah terakumulasi tetap dapat diklaim penuh oleh karyawan).

---

### Kelompok F: Administrasi Platform (Owner SaaS)

Kelompok ini mendefinisikan kebutuhan fungsional untuk operator platform Payana (Super Admin) dalam mengelola seluruh siklus hidup tenant, memonetisasi platform, memantau kondisi keseluruhan sistem, serta menjalankan tindakan darurat apabila diperlukan.

---

#### 3.2.22. Deployment Vault Perusahaan Baru oleh Owner SaaS

ID Requirement : FR-PAYANA-1001

Deskripsi      : Sistem harus memampukan operator platform Payana yang memiliki `SUPERADMIN_ROLE` pada kontrak `PayrollFactory` untuk mendeploy instance CompanyVault baru yang terisolasi bagi setiap perusahaan klien yang bergabung, dengan memanggil fungsi `deployVault()`. Fungsi ini menerima parameter alamat HR yang akan menjadi administrator vault (hrAuthority), nama perusahaan (companyName), serta alamat kontrak SBT yang bersifat bersama (shared) antar seluruh tenant. Sistem harus menjamin bahwa satu alamat HR hanya dapat memiliki satu CompanyVault; upaya mendeploy vault kedua untuk alamat HR yang sama harus ditolak dengan error `HRAlreadyHasVault`. Alamat vault yang baru dibuat dicatat dalam mapping `companyVaults` dan ditambahkan ke array `allVaults` untuk keperluan operasi darurat. Event `VaultDeployed` diterbitkan dan dapat diindeks oleh layanan Ponder untuk pemantauan platform secara agregat.

---

#### 3.2.23. Pemantauan Seluruh Perusahaan di Platform

ID Requirement : FR-PAYANA-1002

Deskripsi      : Sistem harus memampukan Owner SaaS untuk memantau kondisi keseluruhan platform melalui dashboard `/owner` yang menampilkan metrik agregat lintas tenant, mencakup jumlah total CompanyVault yang telah di-deploy melalui fungsi `getTotalVaults()`, Total Value Locked (TVL) dari seluruh vault yang dikalkulasi secara off-chain oleh layanan Ponder dengan mengagregasi event `VaultFunded` dan `VaultWithdrawn`, jumlah tenant aktif dan inaktif, serta estimasi konsumsi gas Paymaster ERC-4337. Data ini diambil oleh layanan backend dari indeks Ponder dan disajikan ke dashboard Owner tanpa memerlukan iterasi langsung ke seluruh vault on-chain. Akses ke dashboard `/owner` harus dibatasi hanya untuk alamat dompet yang terdaftar sebagai pemegang `SUPERADMIN_ROLE` pada kontrak `PayrollFactory`.

---

#### 3.2.24. Konfigurasi Platform Fee dan Treasury oleh Owner SaaS

ID Requirement : FR-PAYANA-1003

Deskripsi      : Sistem harus memampukan Owner SaaS mengonfigurasi `platformFeeBps` (maksimum 1%) dan alamat `protocolTreasury` pada kontrak `PayrollFactory`. Platform fee dipotong otomatis dan langsung ditransfer ke `protocolTreasury` pada setiap klaim gaji karyawan (lihat FR-PAYANA-401) — tidak ada mekanisme akumulasi-lalu-klaim terpisah.

---

#### 3.2.25. Emergency Freeze Seluruh Vault oleh Owner SaaS

ID Requirement : FR-PAYANA-1004

Deskripsi      : Sistem harus memampukan Owner SaaS untuk membekukan seluruh CompanyVault yang pernah di-deploy melalui platform secara serentak dalam satu transaksi dengan memanggil fungsi `emergencyFreezeAll()` pada kontrak `PayrollFactory`, khusus digunakan sebagai respons terhadap eksploitasi global atau kerentanan kritis yang terdeteksi. Fungsi ini hanya dapat dipanggil oleh pemegang `SUPERADMIN_ROLE` dan akan mengeksekusi `freezeVault()` pada setiap vault yang terdaftar dalam array `allVaults`. Vault yang telah dibekukan (status Frozen) tidak dapat kembali ke status Active atau Paused; ini adalah state final yang bersifat irreversible sebagai perlindungan maksimal terhadap eksploitasi. Biaya gas operasi ini berskala linear sesuai jumlah vault yang ada, sehingga Owner SaaS harus memastikan saldo ETH yang memadai sebelum memanggil fungsi ini dalam kondisi darurat.

---

#### 3.2.26. Penangguhan Akses Klien yang Menunggak

ID Requirement : FR-PAYANA-1005

Deskripsi      : Sistem harus memampukan Owner SaaS untuk menangguhkan akses antarmuka HR dari perusahaan klien yang menunggak biaya SaaS dengan mencabut sesi JWT aktif dan memblokir pembuatan sesi baru untuk alamat HR tersebut melalui mekanisme blocklist berbasis backend. Penangguhan di level antarmuka tidak memengaruhi integritas smart contract — vault perusahaan tetap dalam status Active secara on-chain, sehingga karyawan masih dapat mengklaim gaji yang telah terakumulasi melalui antarmuka karyawan yang terpisah. Status penangguhan klien disimpan dalam basis data off-chain backend dan dicek setiap kali HR mencoba membuat sesi baru. Pemulihan akses (reaktivasi) dilakukan Owner SaaS melalui `DELETE /suspension/:hrAddress`, yang menghapus baris blocklist sehingga HR dapat login kembali dari sesi baru.

---

#### 3.2.27. Konfigurasi Platform Fee oleh Owner SaaS

ID Requirement : FR-PAYANA-1006

Deskripsi      : Sistem harus memampukan Owner SaaS untuk menetapkan dan memperbarui besaran platform fee dalam satuan basis points (`platformFeeBps`) melalui fungsi `setPlatformFee()` pada kontrak `PayrollFactory`. Nilai `platformFeeBps` yang dikonfigurasi akan digunakan oleh seluruh CompanyVault yang terdaftar sebagai acuan pemotongan fee saat fungsi `claimSalary()` dieksekusi. Sistem harus memvalidasi bahwa `platformFeeBps` tidak melebihi batas maksimum yang ditetapkan (misalnya 100 bps = 1%) untuk mencegah penetapan fee yang tidak wajar yang merugikan karyawan. Perubahan `platformFeeBps` hanya berlaku untuk klaim yang terjadi setelah perubahan tersebut dikonfirmasi di blockchain, tidak berlaku surut terhadap klaim yang sudah terjadi. Event `PlatformFeeUpdated` diterbitkan setiap kali nilai fee diperbarui untuk keperluan audit trail on-chain.

---

#### 3.2.28. Pemotongan Platform Fee dari Klaim Gaji

ID Requirement : FR-PAYANA-1007

Deskripsi      : Sistem harus secara otomatis memotong platform fee dari setiap klaim gaji karyawan yang berhasil dieksekusi melalui fungsi `claimSalary()` pada kontrak CompanyVault, dan mentransfer potongan tersebut langsung ke alamat `protocolTreasury` yang dikonfigurasi di `PayrollFactory`. Pemotongan dihitung berdasarkan total akumulasi gaji bruto sebelum distribusi split (bukan dari porsi bersih karyawan), menggunakan formula: `platformCut = totalAccrued * platformFeeBps / 10_000`. Sisa setelah pemotongan platform fee kemudian didistribusikan mengikuti split normal (93% karyawan, 5% kepatuhan, 2% severance). Jika `platformFeeBps` bernilai nol, langkah pemotongan dilewati tanpa overhead gas tambahan. Event `PlatformFeePaid` diterbitkan bersamaan dengan event `SalaryClaimed` untuk setiap klaim yang melibatkan pemotongan fee.

---

#### 3.2.29. Penarikan Saldo Platform Fee dari Treasury

ID Requirement : FR-PAYANA-1008

Deskripsi      : Sistem harus memampukan Owner SaaS untuk melihat dan menarik total platform fee yang telah terakumulasi di alamat `protocolTreasury` secara on-chain. Karena platform fee ditransfer langsung ke `protocolTreasury` saat setiap klaim gaji (bukan diakumulasikan di dalam kontrak), Owner SaaS dapat menarik saldo IDRX dari alamat treasury kapan saja menggunakan fungsi standar transfer ERC-20. Dashboard Owner harus menampilkan estimasi total platform fee yang diterima berdasarkan data event `PlatformFeePaid` yang diindeks oleh Ponder, sehingga Owner dapat memantau pendapatan platform tanpa harus mengquery langsung ke blockchain.

---

> **Catatan (FR-PAYANA-1101 s.d. 1801):** Delapan kelompok fungsional pada rentang FR-PAYANA-1101
> s.d. 1801 sudah disamakan penomorannya dengan `SPESIFIKASI KEBUTUHAN PERANGKAT LUNAK.docx`.
> Setelah label huruf Kelompok diselaraskan dengan huruf Modul di §1.2 (§1.2 memakai skema huruf
> terpisah yang tidak lagi mengikuti urutan penomoran FR — lihat catatan di §1.2), kedelapan
> kelompok ini kini tersebar sebagai **Kelompok G, M, N, O, P, Q, R, dan S** — bukan blok huruf
> yang berurutan. Tujuh di antaranya — **Kelompok G, M, N, O, P, Q, dan R** (FR-PAYANA-1101 s.d.
> 1701) — sudah diimplementasikan penuh (backend/frontend berfungsi, diuji nyata — lihat
> PDHUPL_v2.md KU-21 s.d. KU-27, KU-29).

> **[FLAG-BARU-VS-DOCX]** Kelompok H (Deteksi Anomali Keamanan Vault, FR-PAYANA-1901 s.d. 1904)
> tidak memiliki padanan di docx — seluruh kelompok lain pada rentang FR-PAYANA-1101 s.d. 1801
> (Kelompok G, M, N, O, P, Q, R, S) sudah disamakan penomorannya dengan docx. Kelompok H
> melanjutkan pola penomoran per-ratus docx (blok berikutnya setelah FR-PAYANA-1801). Pasangan
> dari UC-22 s.d. UC-30.

### Kelompok G: Notifikasi

---

#### 3.2.35. Notifikasi Real-Time Berbasis Peristiwa

ID Requirement : FR-PAYANA-1301

Deskripsi      : Sistem harus memampukan setiap pengguna untuk melihat daftar notifikasi miliknya sendiri melalui `GET /notifications` (maksimum 50 notifikasi terbaru, terurut dari yang paling baru), serta menandai satu (`PATCH /notifications/:id/read`) atau seluruh (`PATCH /notifications/read-all`) notifikasi sebagai telah dibaca. Sistem harus menolak (403 Forbidden) upaya menandai notifikasi yang bukan milik pengguna yang sedang login. Notifikasi diterbitkan otomatis oleh backend pada peristiwa signifikan yang relevan bagi penerima (mis. reimbursement disetujui/ditolak).

---

### Kelompok H: Deteksi Anomali Keamanan Vault

Kelompok ini mendefinisikan kebutuhan fungsional untuk pemantauan otomatis terhadap event on-chain setiap `CompanyVault`, mendeteksi pola yang konsisten dengan wallet HR yang dikompromikan, dan menyediakan antarmuka Owner SaaS untuk meninjau serta menindaklanjuti setiap temuan.

---

#### 3.2.41. Deteksi Penarikan Vault Tidak Wajar

ID Requirement : FR-PAYANA-1901

Deskripsi      : Sistem harus memeriksa setiap event `VaultWithdrawn` baru pada siklus 2 menit dan membandingkannya dengan riwayat penarikan vault yang sama. Sistem harus menghasilkan alert `SUSPICIOUS_WITHDRAWAL` apabila: (a) vault belum pernah memiliki riwayat penarikan sebelumnya (penerima secara definisi belum terverifikasi); (b) jumlah penarikan melebihi 3 kali rata-rata historis vault tersebut; atau (c) alamat penerima belum pernah menerima penarikan dari vault tersebut sebelumnya. Tingkat keparahan `critical` diberikan apabila lebih dari satu kondisi terpenuhi sekaligus, selain itu `high`.

Rasional   : `withdrawVault()` hanya dapat dipanggil oleh `HR_ROLE`, sehingga secara kriptografis selalu tampak sah — pembeda antara penarikan legitimate dan penarikan hasil kompromi kunci privat HR hanya bisa dideteksi dari pola perilaku (jumlah dan tujuan), bukan dari validitas tanda tangan.

---

#### 3.2.42. Deteksi Perubahan Peran Tidak Terduga

ID Requirement : FR-PAYANA-1902

Deskripsi      : Sistem harus memeriksa setiap event `RoleGranted` baru pada `CompanyVault` (termasuk peran bawaan `AccessControl` milik OpenZeppelin yang diwarisi kontrak) pada siklus 2 menit. Sistem harus menghasilkan alert `UNEXPECTED_ROLE_GRANT` apabila peran diberikan ke alamat yang bukan `hrAuthority` terdaftar untuk vault tersebut. Tingkat keparahan `critical` diberikan untuk `HR_ROLE` atau `DEFAULT_ADMIN_ROLE` (peran admin inti); tingkat keparahan `medium` diberikan untuk `LEGAL_ROLE` (delegasi ke pihak legal terpisah adalah skenario yang lebih wajar, meski tetap dicatat untuk visibilitas).

Rasional   : Pemberian `HR_ROLE`/`DEFAULT_ADMIN_ROLE` ke alamat baru adalah indikator kompromi yang paling kuat — ini adalah langkah yang secara khas diambil penyerang untuk membangun akses persisten (backdoor) yang bertahan meski kunci HR asli kemudian diputar/dicabut.

---

#### 3.2.43. Deteksi Aktivitas Sensitif Beruntun

ID Requirement : FR-PAYANA-1903

Deskripsi      : Sistem harus menghitung jumlah aksi sensitif (penarikan vault dan perubahan peran yang diberikan) dari satu vault dalam satu siklus pemeriksaan (2 menit). Sistem harus menghasilkan alert `HIGH_FREQUENCY_ACTIVITY` dengan tingkat keparahan `high` apabila jumlah tersebut mencapai atau melebihi 3.

Rasional   : Penyerang yang sudah menguasai kunci HR biasanya bertindak cepat sebelum terdeteksi — rangkaian aksi sensitif dalam waktu singkat adalah sinyal tambahan yang independen dari besaran/tujuan masing-masing transaksi individual.

---

#### 3.2.44. Tinjauan dan Penyelesaian Alert Keamanan oleh Owner SaaS

ID Requirement : FR-PAYANA-1904

Deskripsi      : Sistem harus memampukan Owner SaaS untuk melihat seluruh alert keamanan (aktif dan riwayat) melalui `GET /security/alerts`, terurut dengan alert yang belum ditangani ditampilkan lebih dulu. Owner SaaS harus dapat menandai satu alert sebagai selesai ditangani melalui `PATCH /security/alerts/:id/resolve`. Endpoint ini harus ditolak (403 Forbidden) untuk pemanggil yang bukan Owner SaaS. Setiap alert baru juga didorong sebagai notifikasi in-app real-time (`SECURITY_ANOMALY`) ke Owner SaaS.

Rasional   : Deteksi otomatis tanpa jalur tindak lanjut yang jelas tidak memberikan nilai operasional — Owner SaaS memerlukan satu tempat tunggal untuk meninjau seluruh sinyal keamanan lintas tenant dan mencatat bahwa suatu temuan sudah ditindaklanjuti (baik berupa investigasi manual maupun tindakan lain di luar sistem).

---

#### Kelompok I: Manajemen Stream Gaji Karyawan

#### 3.2.18. Aktivasi Stream Gaji Karyawan
ID Requirement : FR-PAYANA-301
Deskripsi      : Sistem harus memampukan HR Admin untuk memulai stream gaji karyawan baru melalui fungsi startStream(employee, flowRate, severanceSplitBps) pada kontrak CompanyVault, dengan menentukan flow rate dalam satuan IDRX wei per detik serta persentase porsi severance (severanceSplitBps, basis poin, maksimum 10.000). Porsi karyawan dan kepatuhan (BPJS/PPh21) tidak ditentukan per-stream, melainkan dihitung dinamis saat klaim gaji berdasarkan konfigurasi `bpjsBps`/`pph21Bps` tingkat perusahaan (lihat FR-PAYANA-204). Sistem secara otomatis mencatat timestamp mulai stream, menginisialisasi vault severance karyawan dalam status Locked, dan menerbitkan Soulbound Token (ERC-5192) sebagai sertifikat ketenagakerjaan on-chain ke alamat Work ID karyawan.

#### 3.2.19. Jeda Stream Gaji
ID Requirement : FR-PAYANA-302
Deskripsi      : Sistem harus memampukan HR Admin untuk menjeda stream gaji karyawan yang sedang aktif melalui fungsi pauseStream(). Sebelum menjeda, sistem terlebih dahulu menyelesaikan (settle) saldo yang telah terakumulasi sejak klaim terakhir ke dalam settledBalance karyawan, sehingga tidak ada gaji yang hilang akibat operasi jeda. Stream yang dijeda tidak mengakumulasi gaji baru, namun saldo yang telah tersimpan di settledBalance tetap dapat diklaim oleh karyawan.

#### 3.2.20. Lanjutkan Stream Gaji
ID Requirement : FR-PAYANA-303
Deskripsi      : Sistem harus memampukan HR Admin untuk melanjutkan stream gaji karyawan yang sedang dalam status dijeda (Paused) melalui fungsi resumeStream(). Setelah dilanjutkan, akumulasi gaji kembali berjalan berdasarkan flow rate yang telah ditetapkan, dimulai dari waktu dilanjutkan. Sistem memperbarui lastWithdrawnTs ke timestamp saat ini sehingga perhitungan akumulasi berikutnya dimulai dari nol dan tidak ada penghitungan ganda atas periode jeda.

#### 3.2.21. Pembaruan Flow Rate Gaji
ID Requirement : FR-PAYANA-304
Deskripsi      : Sistem harus memampukan HR Admin untuk memperbarui flow rate gaji karyawan yang sedang aktif melalui fungsi updateFlowRate(). Sebelum beralih ke flow rate baru, sistem menetapkan (settle) saldo yang telah terakumulasi pada flow rate lama ke dalam settledBalance agar tidak terjadi pembayaran lebih atau kurang pada periode peralihan. Total flow rate vault (totalFlowRate) diperbarui secara atomik bersamaan dengan perubahan flow rate individual karyawan untuk menjaga akurasi penghitungan kebutuhan penggajian bulanan.

#### 3.2.22. Pembaruan Persentase Split Stream
ID Requirement : FR-PAYANA-305
Deskripsi      : Sistem harus memampukan HR Admin untuk memperbarui konfigurasi persentase split (employeeBps, complianceBps, severanceBps) pada stream karyawan yang sedang aktif atau dijeda melalui fungsi updateStreamSplits(). Jumlah ketiga persentase harus tetap berjumlah tepat 10.000 basis points; sistem menolak konfigurasi yang tidak memenuhi syarat ini. Apabila stream sedang aktif, sistem terlebih dahulu menetapkan saldo terakumulasi menggunakan persentase split lama sebelum menerapkan konfigurasi baru.

#### 3.2.23. Pembatalan Stream Gaji
ID Requirement : FR-PAYANA-306
Deskripsi      : Sistem harus memampukan HR Admin untuk membatalkan stream gaji karyawan melalui fungsi cancelStream() pada kontrak CompanyVault. Jika stream sedang aktif saat pembatalan, sistem menetapkan saldo terakumulasi ke dalam settledBalance karyawan dan mengurangi totalFlowRate vault. Stream yang telah dibatalkan tidak mengakumulasi gaji baru, namun karyawan masih dapat mengklaim saldo yang tersimpan di settledBalance. Pembatalan stream tidak secara otomatis mencabut Soulbound Token karyawan.

---

#### Kelompok J: Penarikan Gaji — Earned Wage Access (EWA)

#### 3.2.24. Klaim Gaji (Earned Wage Access)
ID Requirement : FR-PAYANA-401
Deskripsi      : Sistem harus memampukan karyawan untuk menarik seluruh saldo gaji yang telah terakumulasi kapan saja melalui fungsi claimSalary() pada kontrak CompanyVault, tanpa menunggu tanggal gajian bulanan. Sistem melakukan distribusi atomik dalam satu transaksi: platform fee dipotong terlebih dahulu, kemudian apabila karyawan memiliki kasbon aktif, hingga 20% dari total klaim dialokasikan untuk melunasi kasbon secara otomatis (lihat FR-PAYANA-706). Sisanya dipotong PPh21 dan BPJS (dihitung dinamis atau tarif tetap, lihat FR-PAYANA-701/702) ke sub-pool complianceBalance, porsi severance (default 2%) ditambahkan ke vault pesangon karyawan, dan sisa bersih ditransfer langsung ke alamat Work ID karyawan.

#### 3.2.25. Kalkulasi Saldo Gaji Terakumulasi
ID Requirement : FR-PAYANA-402
Deskripsi      : Sistem harus memungkinkan pembacaan saldo gaji yang telah terakumulasi secara real-time untuk setiap karyawan melalui fungsi view getAccrued() pada kontrak CompanyVault. Formula kalkulasi adalah: saldo_total = settledBalance + (flowRate x (waktu_sekarang - lastWithdrawnTs)). Fungsi ini dapat dipanggil kapan saja tanpa biaya gas karena bersifat view-only dan mengembalikan saldo dalam satuan IDRX wei dengan presisi penuh.

#### 3.2.26. Relay Transaksi Gasless via ERC-4337
ID Requirement : FR-PAYANA-403
Deskripsi      : Sistem harus memampukan karyawan melakukan klaim gaji tanpa membayar biaya gas blockchain melalui mekanisme ERC-4337 (Account Abstraction). Karyawan menandatangani UserOperation menggunakan embedded wallet Privy, kemudian frontend mengirimkannya ke endpoint POST /bundler/relay di backend. Backend memverifikasi kesesuaian alamat JWT dengan sender UserOperation, memeriksa batas laju klaim, lalu meneruskan UserOperation ke Pimlico Bundler yang mensponsori biaya gas melalui Paymaster contract. Hash UserOperation dikembalikan ke klien sebagai referensi pemantauan.

#### 3.2.27. Pembatasan Laju Klaim Gaji
ID Requirement : FR-PAYANA-404
Deskripsi      : Sistem harus membatasi frekuensi klaim gaji yang dapat diteruskan oleh backend melalui relayer, dengan batas maksimal 10 kali per jam per alamat karyawan. Permintaan yang melampaui batas ini ditolak oleh backend dengan kode status HTTP 429 sebelum UserOperation diteruskan ke Pimlico, sehingga biaya Paymaster tidak terbuang pada permintaan yang berlebihan.

#### 3.2.28. Pemantauan Status Transaksi
ID Requirement : FR-PAYANA-405
Deskripsi      : Sistem harus memampukan pengguna memeriksa status transaksi yang sebelumnya dikirimkan melalui backend relay dengan menggunakan hash UserOperation yang dikembalikan saat pengiriman. Backend meneruskan permintaan ke Pimlico Bundler menggunakan metode eth_getUserOperationReceipt dan mengembalikan receipt transaksi kepada klien, mencakup status keberhasilan dan hash transaksi on-chain yang dihasilkan jika transaksi telah dikonfirmasi.

---

#### Kelompok K: Pemberhentian Karyawan (PHK dan Resign)

#### 3.2.29. Pengajuan Proposal Pemutusan Hubungan Kerja
ID Requirement : FR-PAYANA-501
Deskripsi      : Sistem harus memampukan HR Admin untuk mengajukan proposal Pemutusan Hubungan Kerja (PHK) terhadap karyawan melalui fungsi proposeTermination() pada kontrak CompanyVault. Proposal menyimpan hash dari alasan PHK on-chain (alasan lengkap disimpan off-chain untuk menjaga privasi), snapshot flow rate karyawan saat pengajuan untuk keperluan kalkulasi pesangon, serta timestamp kadaluarsa yang ditetapkan 7 hari sejak pengajuan. HR Admin secara otomatis memberikan persetujuan pertama (`hrApproved`) dengan mengajukan proposal; persetujuan `LEGAL_ROLE` (`legalApproved`) masih diperlukan sebagai langkah kedua sebelum eksekusi dapat dilakukan — lihat §3.1 untuk siapa yang menjalankan langkah kedua ini dalam praktik.

#### 3.2.30. Persetujuan Proposal PHK oleh Pemegang LEGAL_ROLE
ID Requirement : FR-PAYANA-502
Deskripsi      : Sistem harus memampukan pemegang `LEGAL_ROLE` untuk memberikan persetujuan atas proposal PHK yang aktif melalui fungsi approveTermination() pada kontrak CompanyVault. Sistem memvalidasi bahwa proposal belum kadaluarsa, bahwa pemanggil memiliki `LEGAL_ROLE` pada vault yang bersangkutan, dan bahwa persetujuan dari alamat yang sama belum pernah diberikan sebelumnya. Proposal yang mendapat kedua persetujuan (`hrApproved` dan `legalApproved`) dapat segera dieksekusi oleh HR Admin (`executeTermination()` hanya dapat dipanggil oleh `HR_ROLE`) sebelum masa kadaluarsa berakhir. Dalam operasional saat ini, `LEGAL_ROLE` di-auto-grant ke alamat HR Admin sendiri (lihat §3.1), sehingga langkah persetujuan kedua ini secara de facto juga dijalankan oleh HR Admin — sistem tidak menyediakan dashboard atau alur login terpisah bagi pemegang `LEGAL_ROLE` yang berbeda dari HR Admin.

#### 3.2.31. Eksekusi Pemutusan Hubungan Kerja
ID Requirement : FR-PAYANA-503
Deskripsi      : Sistem harus memampukan eksekusi PHK melalui fungsi executeTermination() setelah kedua persetujuan terpenuhi dan proposal belum melewati masa kadaluarsa 7 hari. Eksekusi secara atomik melakukan serangkaian operasi berikut: penghentian stream gaji dengan settlement saldo terakumulasi, penghitungan pesangon wajib sesuai formula UU Cipta Kerja Pasal 156 berdasarkan tenureMonths dan flowRateSnapshot, pengisian kekurangan pesangon dari saldo bebas vault jika dana pesangon karyawan tidak mencukupi, transfer dana pesangon ke Work ID karyawan, pencabutan Soulbound Token ketenagakerjaan, serta pembatalan seluruh cliff vest yang belum matang dengan pengembalian dana ke saldo bebas vault.

#### 3.2.32. Penghitungan Pesangon Sesuai UU Cipta Kerja
ID Requirement : FR-PAYANA-504
Deskripsi      : Sistem harus menghitung uang pesangon yang wajib dibayarkan berdasarkan masa kerja karyawan (tenureMonths) menggunakan pengali yang ditetapkan dalam UU Cipta Kerja Pasal 156 melalui fungsi PayrollMath.severanceMultiplier(). Gaji bulanan bruto dihitung dari snapshot flow rate saat pengajuan PHK dikalikan dengan jumlah detik dalam satu bulan (2.592.000 detik). Apabila dana dalam vault pesangon karyawan tidak mencukupi jumlah wajib, sistem mengambil kekurangan dari saldo bebas vault; jika saldo bebas vault pun tidak mencukupi, sistem mentransfer seluruh dana yang tersedia dan memancarkan event SeveranceShortfall on-chain sebagai bukti kekurangan pembayaran.

#### 3.2.33. Proses Pengunduran Diri (Resign) Karyawan
ID Requirement : FR-PAYANA-505
Deskripsi      : Sistem harus memampukan HR Admin untuk memproses pengunduran diri sukarela karyawan melalui fungsi resignEmployee() pada kontrak CompanyVault. Saat pengunduran diri diproses, sistem menghentikan stream gaji karyawan dengan terlebih dahulu menetapkan saldo terakumulasi ke settledBalance, mengembalikan seluruh dana pesangon yang pernah terakumulasi ke saldo bebas vault perusahaan (bukan ke karyawan, sesuai ketentuan resign sukarela), membatalkan seluruh cliff vest yang belum matang dengan pengembalian dana ke vault, dan mencabut Soulbound Token ketenagakerjaan karyawan yang bersangkutan.

#### 3.2.34. Pencairan Dana Pesangon Otomatis Pasca-PHK
ID Requirement : FR-PAYANA-506
Deskripsi      : Sistem harus memastikan bahwa seluruh dana pesangon yang menjadi hak karyawan setelah eksekusi PHK ditransfer langsung ke alamat Work ID karyawan dalam satu transaksi atomik yang sama dengan eksekusi PHK. Tidak ada langkah manual tambahan yang diperlukan dari karyawan untuk menerima pesangon; sistem secara otomatis mengubah status SeveranceVault dari Locked menjadi Released dan mentransfer dana ke karyawan segera setelah eksekusi dikonfirmasi di blockchain, termasuk dana top-up dari saldo bebas vault jika pesangon yang terakumulasi tidak memenuhi jumlah wajib.

### Kelompok L: Sertifikasi Ketenagakerjaan (SBT)

Kelompok ini mendefinisikan kebutuhan fungsional untuk sistem penerbitan dan pengelolaan Soulbound Token (SBT) berbasis standar ERC-5192, yang berfungsi sebagai sertifikat ketenagakerjaan on-chain yang dapat diverifikasi oleh pihak ketiga tanpa ekspos data pribadi karyawan.

---

#### 3.2.17. Penerbitan SBT saat Onboarding Karyawan

ID Requirement : FR-PAYANA-901

Deskripsi      : Sistem harus secara otomatis menerbitkan (mint) Soulbound Token kepada karyawan setiap kali HR Admin berhasil memulai stream gaji melalui fungsi `startStream()` pada kontrak CompanyVault. Proses penerbitan SBT dilakukan oleh CompanyVault yang bertindak sebagai pengemban `MINTER_ROLE` pada kontrak `EmploymentSBT`, dengan memanggil fungsi `mint()` secara otomatis di akhir proses startStream. Jika kontrak EmploymentSBT belum dikonfigurasi atau terjadi error (misalnya MINTER_ROLE belum diberikan), proses startStream harus tetap berhasil — kegagalan penerbitan SBT tidak boleh membatalkan aktivasi stream gaji. Token yang diterbitkan bersifat permanen terkunci (locked) dan tidak dapat dipindahtangankan ke alamat lain, sesuai dengan implementasi ERC-5192 yang memblokir semua transfer peer-to-peer melalui override fungsi `_update`.

---

#### 3.2.18. Kandungan Metadata Ketenagakerjaan dalam SBT

ID Requirement : FR-PAYANA-902

Deskripsi      : Sistem harus menyimpan rekaman ketenagakerjaan (employment record) secara on-chain untuk setiap SBT yang diterbitkan, mencakup nama perusahaan (companyName) sebagaimana yang dikonfigurasi pada vault, alamat HR yang mengotorisasi stream (hrAuthority), dan timestamp blok pada saat stream dimulai (startTs). Data ini disimpan dalam mapping `employmentRecords` yang terpetakan dari tokenId, dan dapat diakses secara publik oleh pihak ketiga mana pun yang memiliki tokenId atau alamat karyawan tanpa memerlukan izin khusus. Jabatan (job title) karyawan tidak disimpan on-chain pada versi MVP untuk menghindari ekspos data sensitif di blockchain publik, melainkan disimpan off-chain dan dapat diakses melalui URI metadata token (tokenURI). Sistem harus menjamin bahwa hanya satu SBT aktif yang dapat dimiliki oleh satu alamat karyawan dalam satu waktu; upaya penerbitan SBT kedua ke alamat yang sama akan ditolak dengan error `AlreadyHasToken`.

---

#### 3.2.19. Pencabutan SBT saat Offboarding Karyawan

ID Requirement : FR-PAYANA-903

Deskripsi      : Sistem harus secara otomatis mencabut (revoke/burn) Soulbound Token milik karyawan ketika hubungan kerja berakhir, baik melalui proses resign yang diprakarsai HR via `resignEmployee()` maupun melalui eksekusi PHK via `executeTermination()`. Pencabutan SBT dilakukan oleh CompanyVault dengan memanggil fungsi `revoke()` pada kontrak `EmploymentSBT` melalui fungsi internal `_revokeSBT()`. Jika karyawan tidak memiliki SBT aktif (tokenId = 0) atau terjadi error pada proses pencabutan, proses resign atau PHK harus tetap dilanjutkan dan berhasil — kegagalan pencabutan SBT tidak boleh membatalkan proses pemutusan hubungan kerja. Setelah pencabutan, entri `employeeTokenId[employee]` dan `employmentRecords[tokenId]` dihapus dari storage on-chain, dan event `EmploymentRevoked` diterbitkan oleh CompanyVault untuk keperluan indeksasi.

---

#### 3.2.20. Akses Karyawan terhadap SBT di Wallet

ID Requirement : FR-PAYANA-904

Deskripsi      : Sistem harus memampukan karyawan untuk melihat Soulbound Token ketenagakerjaan mereka melalui dashboard karyawan, yang menampilkan informasi nama perusahaan, tanggal mulai bekerja berdasarkan startTs yang tersimpan on-chain, dan status keaktifan token. Karena SBT adalah token ERC-721 standar, token ini juga secara otomatis terlihat di dompet Ethereum yang mendukung tampilan NFT (seperti MetaMask dan Rainbow), meskipun token tersebut tidak dapat dipindahtangankan. Sistem frontend harus menggunakan fungsi `employeeTokenId(address)` untuk mengambil tokenId aktif karyawan dan kemudian `employmentRecords(tokenId)` untuk mengambil data ketenagakerjaan yang ditampilkan. Dashboard harus menampilkan pesan yang jelas ketika karyawan tidak memiliki SBT aktif (belum di-onboard atau sudah di-offboard).

---

#### 3.2.21. Verifikasi SBT oleh Pihak Ketiga

ID Requirement : FR-PAYANA-905

Deskripsi      : Sistem harus menyediakan mekanisme verifikasi ketenagakerjaan yang dapat digunakan oleh pihak ketiga (seperti institusi keuangan atau calon pemberi kerja) untuk mengkonfirmasi status ketenagakerjaan aktif seorang karyawan tanpa harus mengakses data PII dari basis data terpusat. Verifikasi dapat dilakukan secara on-chain dengan mengquery fungsi `employeeTokenId(address)` pada kontrak `EmploymentSBT`; nilai non-nol mengindikasikan karyawan tersebut saat ini dalam status aktif bekerja. Pihak ketiga juga dapat mengquery `employmentRecords(tokenId)` untuk mendapatkan nama perusahaan dan tanggal mulai kerja, serta menggunakan fungsi `locked(tokenId)` yang selalu mengembalikan nilai true untuk mengkonfirmasi bahwa token adalah SBT yang sah dan tidak dapat dipindahtangankan. Sistem harus mendukung antarmuka `IERC5192` sehingga platform verifikasi pihak ketiga yang mengenal standar ERC-5192 dapat mendeteksi keabsahan SBT secara programatik melalui `supportsInterface`.

---

### Kelompok M: Reimburse Karyawan & HR

Kelompok ini mendefinisikan kebutuhan fungsional untuk penggantian biaya operasional (reimbursement) yang diajukan karyawan dan ditinjau HR. Modul ini murni off-chain (backend/database), dengan pembayaran aktual berupa transfer IDRX manual dari wallet HR yang diverifikasi backend terhadap transaksi on-chain nyata — bukan fungsi smart contract khusus.

---

#### 3.2.30. Pengajuan Klaim Reimbursement oleh Karyawan

ID Requirement : FR-PAYANA-1101

Deskripsi      : Sistem harus memampukan karyawan untuk mengajukan klaim reimbursement kepada HR perusahaannya melalui `POST /reimburse` dengan menyertakan kategori biaya, jumlah IDRX yang diminta, keterangan, dan tautan bukti pendukung (opsional). Klaim tersimpan dengan status awal `pending` dan hanya dapat dilihat oleh karyawan pengaju serta HR perusahaan terkait (`hrAddress` yang disertakan saat pengajuan).

---

#### 3.2.31. Peninjauan Klaim Reimbursement oleh HR

ID Requirement : FR-PAYANA-1102

Deskripsi      : Sistem harus memampukan HR untuk menyetujui atau menolak klaim reimbursement milik karyawan di perusahaannya melalui `PATCH /reimburse/:id/approve` atau `/reject`. Persetujuan mensyaratkan HR menyertakan `txHash` transfer IDRX on-chain nyata sejumlah klaim ke alamat karyawan; sistem memverifikasi keabsahan transfer tersebut (`verifyIdrxTransfer`) sebelum mengubah status menjadi `approved` — persetujuan dengan `txHash` yang tidak sesuai ditolak. Sistem harus menolak (403 Forbidden) upaya peninjauan oleh HR yang bukan pemilik `hrAddress` klaim tersebut, dan menolak (409 Conflict) peninjauan ulang atas klaim yang statusnya sudah tidak lagi `pending`.

---

### Kelompok N: Bounty & Tip

Kelompok ini mendefinisikan kebutuhan fungsional untuk program insentif berbasis tugas (bounty) yang dibuat HR, serta fasilitas tip peer-to-peer antar karyawan. Sama seperti Kelompok M, modul ini murni off-chain dengan pembayaran diverifikasi terhadap transfer on-chain nyata.

---

#### 3.2.32. Pembuatan dan Klaim Program Bounty

ID Requirement : FR-PAYANA-1201

Deskripsi      : Sistem harus memampukan HR untuk membuat program bounty melalui `POST /bounty` dengan judul, deskripsi, besaran hadiah IDRX per klaim, dan kuota jumlah klaim yang dapat disetujui. Karyawan dapat mengajukan klaim atas bounty yang berstatus `open` melalui `POST /bounty/:id/claim`. Begitu jumlah klaim yang disetujui mencapai kuota, status bounty otomatis berubah menjadi `closed` dan klaim baru ditolak (`409 BOUNTY_CLOSED`).

---

#### 3.2.33. Persetujuan dan Pembayaran Klaim Bounty

ID Requirement : FR-PAYANA-1202

Deskripsi      : Sistem harus memampukan HR untuk menyetujui klaim bounty karyawan dan mencatat pembayarannya melalui `PATCH /bounty/claim/:id/paid` dengan menyertakan `txHash` transfer IDRX nyata sejumlah hadiah bounty, diverifikasi dengan mekanisme yang sama seperti FR-PAYANA-1102.

---

#### 3.2.34. Tip Peer-to-Peer Antar Karyawan

ID Requirement : FR-PAYANA-1203

Deskripsi      : Sistem harus memampukan karyawan untuk mencatat pemberian tip IDRX kepada karyawan lain melalui `POST /bounty/tip` dengan menyertakan alamat penerima, jumlah, dan `txHash` transfer yang telah dilakukan secara independen oleh pengirim. Riwayat tip harus dapat diakses baik oleh pengirim maupun penerima melalui `GET /bounty/tips/:address`.

---

### Kelompok O: Slip Gaji (Payslip)

---

#### 3.2.36. Slip Gaji Digital per Klaim

ID Requirement : FR-PAYANA-1401

Deskripsi      : Sistem harus memampukan karyawan (atau HR perusahaan terkait) untuk melihat rincian slip gaji digital dari satu transaksi klaim gaji spesifik melalui `GET /payslip/:claimId`, mencakup gaji bruto terakumulasi, potongan platform fee, cicilan kasbon yang dipotong, potongan pajak/BPJS, potongan severance, dan gaji bersih yang diterima — seluruhnya dihitung dari data `salary_claim` yang diindeks Ponder. Sistem harus menolak (403 Forbidden) akses oleh pihak yang bukan karyawan pemilik klaim maupun HR terkait, dan mengembalikan 404 Not Found untuk `claimId` yang tidak ada.

---

### Kelompok P: Bukti Potong Pajak (Tax Cert)

---

#### 3.2.37. Bukti Potong Pajak Tahunan

ID Requirement : FR-PAYANA-1501

Deskripsi      : Sistem harus memampukan karyawan untuk melihat agregasi tahunan (`GET /tax-cert/:year`) dari total gaji bruto terakumulasi, total dana kepatuhan (BPJS/PPh21), total severance, dan total gaji bersih untuk keperluan pelaporan SPT pribadi, dihitung dari seluruh `salary_claim` pada tahun pajak yang diminta. HR dapat mengakses agregasi milik karyawan di perusahaannya melalui `GET /tax-cert/hr/:employee/:year`, namun sistem harus menolak (403 Forbidden) akses oleh HR yang bukan `hr_authority` dari karyawan tersebut. Sistem harus menolak (400 Bad Request) permintaan dengan tahun di luar rentang valid (2020–2100).

---

### Kelompok Q: Surat Keterangan Kerja

---

#### 3.2.38. Pengajuan dan Penerbitan Surat Keterangan Kerja

ID Requirement : FR-PAYANA-1601

Deskripsi      : Sistem harus memampukan karyawan dengan status stream `Active` di suatu perusahaan untuk mengajukan permohonan surat keterangan kerja melalui `POST /employment-letter/request` dengan menyertakan tujuan penggunaan dari daftar tetap (KPR, Kredit, Visa, Umum, Lainnya). Sistem harus menolak (400 Bad Request) tujuan di luar daftar tersebut, dan menolak (400 NOT_EMPLOYEE) permohonan dari karyawan yang tidak memiliki stream aktif di perusahaan yang dituju. HR meninjau dan menyetujui/menolak permohonan melalui `PATCH /employment-letter/:id/approve|reject`; dokumen surat hanya dapat diunduh (`GET /employment-letter/:id/document`) setelah berstatus `approved` — permintaan atas surat yang masih `pending` ditolak (400 NOT_APPROVED).

---

### Kelompok R: Direktori Karyawan

---

#### 3.2.39. Direktori dan Penugasan Departemen/Jabatan Karyawan

ID Requirement : FR-PAYANA-1701

Deskripsi      : Sistem harus memampukan HR untuk melihat direktori seluruh karyawan di perusahaannya melalui `GET /directory/:hrAddress`, mencakup nama, departemen, jabatan, status, dan flow rate masing-masing karyawan. Sistem harus menolak (403 Forbidden) akses oleh HR yang meminta direktori perusahaan lain. HR dapat menetapkan atau memperbarui departemen dan jabatan karyawan melalui `PATCH /directory/:address`, yang hasilnya harus tercermin saat karyawan tersebut melihat profilnya sendiri melalui `GET /directory/me`.

---

### Kelompok S: Pengaturan Perusahaan (Branding)

---

#### 3.2.40. Konfigurasi Branding dan Preferensi Perusahaan

ID Requirement : FR-PAYANA-1801

Deskripsi      : Sistem harus memampukan HR untuk menyimpan dan memperbarui pengaturan branding serta preferensi perusahaannya melalui `GET`/`PUT /company-settings`, mencakup nama tampilan, negara, URL logo, batas EWA (`ewaLimitBps`), tarif yield (`yieldRateBps`), dan alamat kontak legal. Operasi bersifat upsert — HR yang belum pernah menyimpan pengaturan menerima `null` pada `GET`, dan `PUT` pertama membuat baris baru sementara `PUT` berikutnya memperbarui baris yang sudah ada. Pengaturan ini murni kosmetik/preferensi tampilan dan tidak memengaruhi logika keuangan on-chain.

---

### 3.3 Diagram Use Case

> **Catatan untuk Pembaca:** Sistem Payana adalah sistem hybrid tiga lapisan (smart contract on-chain, REST API backend, antarmuka web frontend). Use case di bawah ini menggambarkan interaksi pengguna dengan sistem secara end-to-end tanpa memisahkan lapisan teknis.

| ID | Nama Use Case | Aktor | FR Terkait |
|----|---------------|-------|------------|
| UC-01 | Login dan Autentikasi | HR Admin / Employee | FR-PAYANA-101, 102, 103 |
| UC-02 | Onboarding Perusahaan dan Deploy Vault | Owner SaaS / HR Admin | FR-PAYANA-201, 202 |
| UC-03 | Deposit IDRX ke Vault Perusahaan | HR Admin | FR-PAYANA-203, 204 |
| UC-04 | Onboarding Karyawan dan Inisiasi Stream Gaji | HR Admin | FR-PAYANA-301, 302, 303 |
| UC-05 | Karyawan Klaim Gaji Terakumulasi (EWA) | Karyawan | FR-PAYANA-401, 402 |
| UC-06 | Inisiasi PHK oleh HR Admin | HR Admin | FR-PAYANA-501, 502 |
| UC-07 | Persetujuan PHK (mode Legal) | HR Admin | FR-PAYANA-503, 504 |
| UC-08 | Karyawan Resign Mandiri | Karyawan | FR-PAYANA-505 |
| UC-09 | HR Grant Vesting Schedule ke Karyawan | HR Admin | FR-PAYANA-601, 602 |
| UC-10 | Karyawan Claim Vested Bonus | Karyawan | FR-PAYANA-603 |
| UC-11 | Karyawan Mengajukan dan Melunasi Kasbon | Karyawan | FR-PAYANA-704, 706 |
| UC-12 | HR Menyetujui/Menolak Kasbon | HR Admin | FR-PAYANA-705 |
| UC-13 | HR Generate Laporan Kepatuhan (BPJS/PPh21) | HR Admin | FR-PAYANA-801, 802 |
| UC-14 | Verifikasi Sertifikat Ketenagakerjaan (SBT) | HR Admin | FR-PAYANA-901, 902 |
| UC-15 | Owner SaaS Deploy Company Vault Baru | Owner SaaS | FR-PAYANA-1001 |
| UC-20 | Owner SaaS Konfigurasi dan Klaim Platform Fee | Owner SaaS | FR-PAYANA-1006, 1007, 1008 |
| UC-16 | HR Lihat Dashboard Vault dan Status Stream | HR Admin | FR-PAYANA-204, 303 |
| UC-21 | Registrasi & Persetujuan Akun (Company & Employee) | Owner SaaS / HR Admin / Karyawan | FR-PAYANA-107, 108, 109 |
| UC-22 | Reimburse Karyawan & HR | Karyawan / HR Admin | FR-PAYANA-1101, 1102 |
| UC-23 | Bounty & Tip | HR Admin / Karyawan | FR-PAYANA-1201, 1202, 1203 |
| UC-24 | Notifikasi | HR Admin / Karyawan | FR-PAYANA-1301 |
| UC-25 | Slip Gaji (Payslip) | Karyawan / HR Admin | FR-PAYANA-1401 |
| UC-26 | Bukti Potong Pajak (Tax Cert) | Karyawan / HR Admin | FR-PAYANA-1501 |
| UC-27 | Surat Keterangan Kerja | Karyawan / HR Admin | FR-PAYANA-1601 |
| UC-28 | Direktori Karyawan | HR Admin | FR-PAYANA-1701 |
| UC-29 | Pengaturan Perusahaan (Branding) | HR Admin | FR-PAYANA-1801 |
| UC-30 | Deteksi Anomali & Tinjauan Keamanan Vault | Owner SaaS | FR-PAYANA-1901, 1902, 1903, 1904 |

---

#### Diagram Use Case

Diagram berikut menggambarkan seluruh aktor sistem Payana beserta use case yang dapat mereka lakukan, dalam satu diagram utuh — tidak dipecah per aktor/kelompok agar relasi antar use case (termasuk yang dipakai bersama oleh lebih dari satu aktor, seperti UC-01) tetap terlihat dalam satu pandangan.

```mermaid
graph LR
    HR(["👤 HR Admin"])
    EMP(["👤 Karyawan"])
    OWNER(["👤 Owner SaaS"])

    HR --> UC01["UC-01\nLogin & Autentikasi"]
    HR --> UC21["UC-21\nRegistrasi &\nPersetujuan Akun"]
    HR --> UC02["UC-02\nOnboarding Perusahaan\n& Deploy Vault"]
    HR --> UC03["UC-03\nDeposit IDRX\nke Vault"]
    HR --> UC04["UC-04\nOnboarding Karyawan\n& Start Stream"]
    HR --> UC06["UC-06\nInisiasi PHK"]
    HR --> UC07["UC-07\nPersetujuan PHK\n(mode Legal)"]
    HR --> UC09["UC-09\nGrant Vesting\nSchedule"]
    HR --> UC12["UC-12\nSetujui/Tolak\nKasbon"]
    HR --> UC13["UC-13\nGenerate Laporan\nKepatuhan"]
    HR --> UC14["UC-14\nVerifikasi SBT\nKetenagakerjaan"]
    HR --> UC16["UC-16\nDashboard Vault\n& Status Stream"]
    HR --> UC22["UC-22\nReimburse\nKaryawan & HR"]
    HR --> UC23["UC-23\nBounty & Tip"]
    HR --> UC24["UC-24\nNotifikasi"]
    HR --> UC28["UC-28\nDirektori\nKaryawan"]
    HR --> UC29["UC-29\nPengaturan\nPerusahaan"]

    EMP --> UC01
    EMP --> UC21
    EMP --> UC05["UC-05\nKlaim Gaji EWA"]
    EMP --> UC08["UC-08\nResign Mandiri"]
    EMP --> UC10["UC-10\nClaim Vested\nBonus"]
    EMP --> UC11["UC-11\nAjukan & Lunasi\nKasbon"]
    EMP --> UC22
    EMP --> UC23
    EMP --> UC24
    EMP --> UC25["UC-25\nSlip Gaji"]
    EMP --> UC26["UC-26\nBukti Potong\nPajak"]
    EMP --> UC27["UC-27\nSurat Keterangan\nKerja"]

    OWNER --> UC01
    OWNER --> UC21
    OWNER --> UC15["UC-15\nDeploy Company\nVault Baru"]
    OWNER --> UC20["UC-20\nKonfigurasi\nPlatform Fee"]
    OWNER --> UC30["UC-30\nDeteksi Anomali &\nKeamanan Vault"]

    style HR fill:#dbeafe,stroke:#2563eb
    style EMP fill:#dcfce7,stroke:#16a34a
    style OWNER fill:#fce7f3,stroke:#db2777
```

> **Catatan:** Diagram disederhanakan menjadi tiga aktor persona utama (HR Admin, Karyawan, Owner SaaS). Persetujuan PHK (UC-07) digambarkan sebagai bagian dari domain HR Admin bukan sekadar penyederhanaan diagram, melainkan mencerminkan implementasi nyata: `LEGAL_ROLE` di-auto-grant ke alamat HR Admin sendiri saat onboarding, dan tidak ada dashboard/alur login terpisah di frontend bagi pemegang `LEGAL_ROLE` yang berbeda dari HR Admin (lihat §3.1 untuk detail lengkap serta keterbatasannya). Verifikasi SBT (UC-14) tetap murni domain HR Admin.
>
> **Catatan (UC-21):** Nomor UC-21 sengaja ditempatkan setelah UC-20 (bukan disisipkan di antara
> UC-01/UC-02) agar tidak menggeser nomor UC yang sudah dirujuk di tempat lain pada dokumen ini
> maupun di DPPL/PDHUPL — urutan nomor UC pada dokumen ini tidak selalu mencerminkan urutan
> eksekusi kronologis pengguna (registrasi secara logis terjadi sebelum UC-02, walau bernomor
> lebih besar).

---

#### Spesifikasi Use Case

#### UC-01: Login dan Autentikasi

```mermaid
sequenceDiagram
    actor User as Pengguna
    participant FE as Frontend
    participant Privy
    participant BE as Backend
    participant Base as Base Blockchain

    User->>FE: Buka halaman /login
    FE->>Privy: Inisiasi embedded wallet
    Privy-->>FE: Alamat wallet
    FE->>FE: Buat pesan EIP-191 + timestamp
    FE->>Privy: signMessage(pesan)
    Privy-->>FE: signature
    FE->>BE: POST /auth/login {address, message, signature}
    BE->>BE: recoverMessageAddress() — validasi EIP-191
    BE->>BE: Cek replay protection (≤300 detik)
    BE->>BE: Buat sesi JWT (access 15 mnt, refresh 7 hari)
    BE-->>FE: {accessToken, refreshToken}
    FE->>Base: companyVaults(address) — deteksi role
    Base-->>FE: vaultAddress
    FE-->>User: Redirect ke dashboard sesuai role
```

| | |
|-|-|
| **Nama Use Case** | Login dan Autentikasi |
| **Deskripsi Singkat** | Pengguna (HR Admin atau Karyawan) melakukan autentikasi ke sistem Payana menggunakan tanda tangan kriptografis dari dompet digital mereka. |
| **Aktor** | HR Admin / Karyawan |
| **Pre Kondisi** | Pengguna memiliki dompet Ethereum (MetaMask atau embedded wallet via Privy) dan telah terdaftar di sistem dengan role yang valid. |
| **Pos Kondisi** | Sistem menerbitkan JWT token; pengguna diarahkan ke dashboard sesuai perannya (HR atau Employee). |
| **Basic Flow** | 1. Pengguna membuka halaman login Payana. <br> 2. Sistem menampilkan opsi autentikasi melalui Privy (email, Google, atau koneksi langsung wallet). <br> 3. Pengguna memilih metode autentikasi dan menyetujui permintaan tanda tangan pesan EIP-191 melalui dompet digital. <br> 4. Privy memproses autentikasi dan mengembalikan JWT serta alamat wallet pengguna ke frontend. <br> 5. Frontend mengirim JWT ke backend API melalui endpoint `GET /auth/me`. <br> 6. Backend memverifikasi JWT, mengambil data profil pengguna dari database, dan menentukan role berdasarkan alamat wallet yang terdaftar on-chain (`useRole.ts`: Owner → HR → Karyawan). <br> 7. Backend menerbitkan JWT token dengan klaim role dan wallet address, lalu mengembalikan data profil lengkap ke frontend. <br> 8. Frontend membaca nilai role dan mengarahkan pengguna ke dashboard yang sesuai: HR Admin ke `/hr/vault` (termasuk akses ke antrian PHK di `/hr/phk`, lihat §3.1 soal `LEGAL_ROLE`), Karyawan ke `/employee/ewa`, atau Owner ke `/owner/dashboard`. |
| **Alternative Flow** | A1. Apabila pengguna sudah memiliki sesi JWT yang masih valid di browser, frontend langsung memanggil `GET /auth/me` tanpa menampilkan halaman login, sehingga pengguna otomatis diarahkan ke dashboard sesuai role. |
| **Error Flow** | E1. Apabila JWT tidak valid atau telah kedaluwarsa, backend mengembalikan status `401 Unauthorized`. Sistem menghapus token dari penyimpanan lokal dan menampilkan kembali halaman login dengan pesan "Sesi Anda telah berakhir. Silakan login kembali." <br> E2. Apabila wallet address tidak ditemukan dalam sistem (role null), pengguna diarahkan ke halaman `/onboarding` dengan pesan "Akun tidak ditemukan dalam sistem. Silakan lakukan pendaftaran." <br> E3. Apabila layanan Privy mengalami gangguan, frontend menampilkan pesan "Layanan autentikasi sedang tidak tersedia. Silakan coba beberapa saat lagi." dan menolak melanjutkan proses login. |

---

#### UC-02: Onboarding Perusahaan dan Deploy Vault

> **Catatan:** Sebelum use case ini berjalan, HR Admin harus sudah melalui dan lulus **UC-21
> (Registrasi & Persetujuan Akun)** — pengajuan profil perusahaan (NPWP/NIB/dokumen) dan
> persetujuan Owner SaaS bukan lagi bagian dari UC-02, melainkan didokumentasikan penuh di
> UC-21 (termasuk alur invitation-only untuk registrasi karyawan). UC-02 di bawah ini murni
> mencakup tahap SETELAH akun disetujui: konfigurasi split alokasi dana dan deploy vault.

```mermaid
sequenceDiagram
    actor HR as HR Admin
    participant FE as Frontend
    participant SC as PayrollFactory
    participant Base as Base Blockchain

    Note over HR,SC: Prasyarat: HR sudah lulus UC-21 (Registrasi & Persetujuan Akun)
    HR->>FE: Buka /hr/onboarding — wizard deploy vault
    HR->>FE: Konfigurasi split alokasi dana (93/5/2 default)
    FE->>SC: deployVault(hrAuthority, companyName, sbtContract)
    SC->>SC: Validasi HRAlreadyHasVault
    SC->>Base: Deploy instance CompanyVault baru
    Base-->>SC: vaultAddress
    SC-->>FE: event VaultDeployed
    FE-->>HR: Vault siap, redirect ke /hr/vault
```

| | |
|-|-|
| **Nama Use Case** | Onboarding Perusahaan dan Deploy Vault |
| **Deskripsi Singkat** | HR Admin yang akunnya sudah disetujui (lihat UC-21) mengonfigurasi parameter alokasi dana gaji dan men-deploy smart contract CompanyVault ke blockchain Base Sepolia melalui PayrollFactory. |
| **Aktor** | Owner SaaS / HR Admin |
| **Pre Kondisi** | HR Admin telah login dengan role `hr`. Akun HR Admin telah disetujui oleh Owner SaaS (UC-21). Perusahaan belum memiliki vault aktif di sistem Payana. |
| **Pos Kondisi** | Smart contract CompanyVault berhasil di-deploy ke Base Sepolia. Alamat vault tersimpan di database backend. HR Admin diarahkan ke dashboard `/hr/vault` untuk mulai mengelola karyawan dan melakukan deposit awal. |
| **Basic Flow** | 1. HR Admin (yang akunnya sudah disetujui via UC-21) mengakses halaman `/hr/onboarding`. <br> 2. Sistem menampilkan wizard onboarding: Konfigurasi Split Alokasi Dana dan Deploy Vault. <br> 3. HR Admin meninjau dan mengonfirmasi parameter split alokasi dana default: 93% ke wallet karyawan, 5% ke Compliance Vault (BPJS/Pajak), dan 2% ke Severance Vault (pesangon). HR Admin dapat menyesuaikan nilai dalam satuan Basis Points (BPS) selama total tetap 10.000 BPS. <br> 4. HR Admin mengklik "Deploy Vault". Frontend memanggil fungsi `PayrollFactory.deployVault(hrAddress, companyName, sbtContract)` melalui Privy. <br> 5. Transaksi on-chain ditandatangani oleh HR Admin dan dikirim ke jaringan Base Sepolia. Frontend menampilkan indikator progres dengan pesan "Sedang men-deploy vault ke blockchain...". <br> 6. Setelah transaksi dikonfirmasi, backend menerima webhook dari Alchemy dan menyimpan alamat vault baru beserta konfigurasi split ke database. <br> 7. Sistem menampilkan konfirmasi keberhasilan dan mengarahkan HR Admin ke halaman `/hr/vault`. |
| **Alternative Flow** | A1. Apabila HR Admin mengubah parameter split pada langkah 3, frontend memvalidasi bahwa total BPS tepat 10.000. Jika valid, nilai kustom digunakan sebagai parameter deploy. <br> A2. HR Admin dapat melewati deposit awal dan melakukannya di lain waktu melalui `/hr/vault`. Namun, stream gaji karyawan tidak dapat dimulai sebelum vault memiliki saldo IDRX yang mencukupi. |
| **Error Flow** | E1. Apabila HR Admin belum lulus UC-21 (belum disetujui Owner) mencoba mengakses `/hr/onboarding`, sistem mengarahkan kembali ke halaman status pendaftaran dengan pesan "Akun Anda masih menunggu persetujuan Owner SaaS." <br> E2. Apabila transaksi deploy gagal (revert) di smart contract karena parameter tidak valid, frontend menampilkan pesan "Deploy vault gagal. Silakan periksa konfigurasi dan coba kembali." <br> E3. Apabila wallet HR Admin tidak memiliki saldo ETH yang cukup untuk membayar gas, frontend menampilkan pesan "Saldo ETH tidak mencukupi untuk membayar gas. Silakan isi saldo ETH terlebih dahulu." |

---

#### UC-03: Deposit IDRX ke Vault Perusahaan

```mermaid
sequenceDiagram
    actor HR as HR Admin
    participant FE as Frontend
    participant IDRX as IDRX Token
    participant CV as CompanyVault

    HR->>FE: Input jumlah deposit di /hr/vault
    FE->>IDRX: approve(vaultAddress, amount)
    IDRX-->>FE: Approval dikonfirmasi
    FE->>CV: fundVault(amount)
    CV->>IDRX: transferFrom(hr, vault, amount)
    IDRX-->>CV: Transfer berhasil
    CV->>CV: vaultBalance += amount
    CV-->>FE: event VaultFunded(amount)
    FE-->>HR: Saldo vault diperbarui
```

| | |
|-|-|
| **Nama Use Case** | Deposit IDRX ke Vault Perusahaan |
| **Deskripsi Singkat** | HR Admin melakukan deposit token IDRX ke dalam CompanyVault perusahaan untuk memastikan ketersediaan likuiditas guna membayar akumulasi gaji karyawan, iuran kepatuhan, dan pesangon. |
| **Aktor** | HR Admin |
| **Pre Kondisi** | HR Admin telah login dengan role `hr`. CompanyVault perusahaan telah di-deploy dan aktif. HR Admin memiliki saldo IDRX yang cukup di wallet yang terhubung. |
| **Pos Kondisi** | Saldo IDRX dalam CompanyVault bertambah sesuai jumlah yang didepositkan. Audit log transaksi deposit tercatat di database backend. |
| **Basic Flow** | 1. HR Admin mengakses halaman `/hr/vault` dan melihat ringkasan saldo vault saat ini. <br> 2. HR Admin mengklik tombol "Deposit IDRX". <br> 3. Sistem menampilkan formulir deposit dengan informasi saldo IDRX yang tersedia di wallet HR Admin. <br> 4. HR Admin memasukkan jumlah IDRX yang akan didepositkan ke vault. <br> 5. HR Admin mengklik "Konfirmasi Deposit". Frontend terlebih dahulu memanggil fungsi `IDRX.approve(vaultAddress, amount)` untuk memberikan izin kepada vault mengambil token dari wallet HR Admin. <br> 6. Setelah approval on-chain dikonfirmasi, frontend memanggil `CompanyVault.deposit(amount)`. <br> 7. Smart contract menarik IDRX dari wallet HR Admin ke dalam vault dan memperbarui saldo vault on-chain. <br> 8. Backend menerima webhook dari Alchemy, mencatat transaksi deposit di audit log, dan memperbarui saldo vault di database. <br> 9. Frontend menampilkan notifikasi "Deposit berhasil. Saldo vault bertambah sebesar [jumlah] IDRX." dan memperbarui tampilan saldo vault secara real-time. |
| **Alternative Flow** | A1. Apabila HR Admin ingin melihat riwayat deposit sebelumnya, sistem menyediakan tab "Riwayat Transaksi" yang menampilkan daftar deposit beserta tanggal, jumlah, dan hash transaksi on-chain. |
| **Error Flow** | E1. Apabila vault sedang dalam kondisi dibekukan (`VaultFrozen`), smart contract menolak seluruh operasi deposit dan mengembalikan error. Frontend menampilkan pesan "Vault perusahaan sedang dibekukan oleh administrator. Seluruh operasi ditangguhkan hingga pembekuan dicabut." <br> E2. Apabila saldo IDRX di wallet HR Admin tidak mencukupi jumlah yang ingin didepositkan, transaksi approval akan gagal. Frontend menampilkan pesan "Saldo IDRX di wallet Anda tidak mencukupi untuk melakukan deposit sebesar [jumlah]." <br> E3. Apabila terjadi kegagalan transaksi on-chain pada tahap approval atau deposit, frontend menampilkan pesan "Transaksi gagal. Silakan periksa koneksi jaringan dan coba kembali." |

---

#### UC-04: Onboarding Karyawan dan Inisiasi Stream Gaji

```mermaid
sequenceDiagram
    actor HR as HR Admin
    participant FE as Frontend
    participant CV as CompanyVault
    participant SBT as EmploymentSBT

    HR->>FE: Isi form onboarding karyawan (workId, flowRate, severanceSplitBps)
    FE->>CV: startStream(employee, flowRate, severanceSplitBps)
    CV->>CV: Validasi flowRate > 0 dan severanceSplitBps <= 10.000 bps
    CV->>CV: Validasi StreamAlreadyActive
    CV->>CV: Inisiasi EmployeeStream + SeveranceVault (Locked)
    CV->>SBT: mint(employee, companyName, hrAuthority)
    SBT-->>CV: tokenId diterbitkan
    CV-->>FE: event StreamStarted + EmploymentCertified
    FE-->>HR: Karyawan berhasil di-onboard
```

| | |
|-|-|
| **Nama Use Case** | Onboarding Karyawan dan Inisiasi Stream Gaji |
| **Deskripsi Singkat** | HR Admin mendaftarkan karyawan baru ke dalam sistem Payana secara on-chain, menetapkan besaran gaji per detik (flow rate), dan memulai stream gaji real-time melalui CompanyVault. Karyawan akan mulai mengakumulasi gaji secara langsung setelah stream diaktifkan. |
| **Aktor** | HR Admin |
| **Pre Kondisi** | HR Admin telah login dengan role `hr`. CompanyVault perusahaan telah di-deploy dan memiliki saldo IDRX yang mencukupi. Karyawan yang akan di-onboarding telah terdaftar dan disetujui dalam sistem dengan role `employee`, serta memiliki alamat wallet yang valid. |
| **Pos Kondisi** | Data karyawan tersimpan on-chain di CompanyVault. Stream gaji karyawan berjalan aktif. Karyawan mulai mengakumulasi gaji secara real-time. Sertifikat ketenagakerjaan (EmploymentSBT) diterbitkan ke wallet karyawan. |
| **Basic Flow** | 1. HR Admin mengakses halaman `/hr/employees` dan mengklik "Tambah Karyawan". <br> 2. Sistem menampilkan formulir onboarding karyawan. HR Admin mengisi data: nama lengkap karyawan, alamat wallet karyawan, besaran gaji bulanan (dalam IDRX), dan tanggal mulai bekerja. <br> 3. Sistem menghitung flow rate per detik secara otomatis berdasarkan gaji bulanan yang dimasukkan (`flowRate = gajiPerBulan / (30 * 24 * 3600)`). <br> 4. HR Admin meninjau/menyesuaikan porsi severance (`severanceSplitBps`, default 200 = 2%); porsi karyawan dan kepatuhan (BPJS/PPh21) mengikuti konfigurasi `bpjsBps`/`pph21Bps` tingkat perusahaan yang berlaku saat klaim, bukan parameter per-stream. <br> 5. HR Admin mengklik "Mulai Stream". Frontend memanggil `CompanyVault.startStream(employeeAddress, flowRate, severanceSplitBps)` melalui Privy. <br> 6. Smart contract mendaftarkan karyawan, mencatat flow rate, dan memulai streaming gaji secara on-chain. <br> 7. Smart contract menerbitkan EmploymentSBT (ERC-5192) ke wallet karyawan sebagai bukti hubungan kerja yang tidak dapat ditransfer. <br> 8. Backend menerima webhook dari Alchemy, menyimpan data karyawan dan status stream ke database, serta mencatat waktu mulai stream. <br> 9. Frontend menampilkan konfirmasi "Stream gaji berhasil dimulai. [Nama Karyawan] kini mulai mengakumulasi gaji secara real-time." |
| **Alternative Flow** | A1. Apabila HR Admin ingin menetapkan konfigurasi split khusus (misalnya karena bracket PPh21 karyawan berbeda), sistem menyediakan opsi override persentase split sebelum stream dimulai. Nilai baru divalidasi agar totalnya tetap 100%. |
| **Error Flow** | E1. Apabila stream untuk alamat wallet karyawan tersebut sudah pernah diaktifkan sebelumnya dan masih berjalan (`StreamAlreadyActive`), smart contract menolak dan mengembalikan error. Frontend menampilkan pesan "Stream gaji untuk karyawan ini sudah berjalan. Hentikan stream yang ada terlebih dahulu sebelum membuat stream baru." <br> E2. Apabila HR Admin tidak memiliki `HR_ROLE` yang valid di smart contract (`Unauthorized`), transaksi akan di-revert. Frontend menampilkan pesan "Akses ditolak. Anda tidak memiliki wewenang untuk memulai stream gaji." <br> E3. Apabila saldo vault tidak mencukupi untuk memulai stream (`InsufficientVaultBalance`), smart contract menolak operasi. Frontend menampilkan pesan "Saldo vault tidak mencukupi. Silakan lakukan deposit IDRX terlebih dahulu." |

---

#### UC-05: Karyawan Klaim Gaji Terakumulasi (EWA)

```mermaid
sequenceDiagram
    actor EMP as Karyawan
    participant FE as Frontend
    participant Privy
    participant BE as Backend
    participant Pimlico
    participant CV as CompanyVault
    participant IDRX as IDRX Token

    EMP->>FE: Klik "Tarik Gaji" di /employee/ewa
    FE->>CV: getAccrued(employeeAddress) — view
    CV-->>FE: Jumlah akrual (wei)
    FE->>FE: Build UserOperation {callData: claimSalary()}
    FE->>Privy: signUserOperation(userOp)
    Privy-->>FE: Signed UserOperation
    FE->>BE: POST /bundler/relay {userOp, jwt}
    BE->>BE: Validasi JWT + rate limit (max 10/jam)
    BE->>Pimlico: eth_sendUserOperation
    Pimlico->>CV: claimSalary() via EntryPoint
    CV->>CV: Potong platform fee
    CV->>CV: [Jika kasbon Active] Potong min(20% accrued, sisa kasbon)
    CV->>CV: Hitung PPh21 (TER/override) + BPJS -> complianceBalance
    CV->>CV: Hitung severance -> severanceVault
    CV->>IDRX: transfer(employee, netToEmployee)
    CV-->>FE: event SalaryClaimed(..., kasbonRepaid)
    CV-->>FE: event TaxWithheld(pph21Amount, bpjsAmount)
    FE-->>EMP: Notifikasi sukses + saldo reset
```

| | |
|-|-|
| **Nama Use Case** | Karyawan Klaim Gaji Terakumulasi (EWA) |
| **Deskripsi Singkat** | Karyawan mengakses fitur Earned Wage Access (EWA) untuk menarik gaji yang telah diakumulasikan secara real-time dari streaming contract. Transaksi dikemas sebagai UserOperation (ERC-4337), ditandatangani secara diam-diam oleh Privy, dan dieksekusi tanpa biaya gas (gasless) melalui Paymaster platform. |
| **Aktor** | Karyawan |
| **Pre Kondisi** | Karyawan telah login dengan role `employee`. HR Admin telah memulai stream gaji untuk karyawan tersebut dan stream dalam kondisi aktif. Terdapat saldo IDRX yang telah terakumulasi dan belum diklaim (lebih dari 0). |
| **Pos Kondisi** | Saldo IDRX terakumulasi direset ke nol. Karyawan menerima sisa akumulasi di wallet mereka setelah dipotong platform fee, cicilan kasbon (jika ada), PPh21+BPJS, dan porsi severance (2% default). Audit log transaksi tercatat di database. |
| **Basic Flow** | 1. Karyawan membuka halaman `/employee/ewa`. <br> 2. Frontend membaca saldo terakumulasi secara real-time dari smart contract dan menampilkan nilai dalam IDRX beserta estimasi setara Rupiah. <br> 3. Karyawan mengklik tombol "Tarik Gaji". <br> 4. Frontend mengonstruksi UserOperation (ERC-4337) yang memanggil fungsi `CompanyVault.claimSalary()`. Privy menandatangani UserOperation secara diam-diam menggunakan kunci privat embedded wallet karyawan tanpa popup konfirmasi tambahan. <br> 5. Frontend mengirimkan UserOperation yang telah ditandatangani ke backend melalui `POST /bundler/relay` beserta JWT autentikasi karyawan. <br> 6. Backend memvalidasi JWT, memeriksa rate limit klaim, dan melampirkan Paymaster agar gas dibayarkan oleh platform (karyawan tidak perlu memiliki saldo ETH). <br> 7. Backend mengirimkan UserOperation ke bundler on-chain di jaringan Base Sepolia. <br> 8. Smart contract `CompanyVault.claimSalary()` dieksekusi: platform fee dipotong, lalu apabila karyawan memiliki kasbon berstatus `Active`, cicilan `min(20% accrued, sisa kasbon)` dipotong otomatis (lihat UC-11). Sisanya dipotong PPh21 (TER atau override HR) + BPJS ke Compliance Vault, dan porsi severance ke Severance Vault. Sisa bersih ditransfer ke wallet karyawan. <br> 9. Backend menerima webhook dari Alchemy, memperbarui audit log, dan mengirimkan notifikasi melalui WebSocket ke frontend. <br> 10. Frontend memperbarui tampilan saldo (direset ke nol) dan menampilkan notifikasi "Penarikan berhasil! Dana sebesar [jumlah] IDRX telah dikirim ke wallet Anda." |
| **Alternative Flow** | A1. Apabila karyawan memiliki kasbon aktif, frontend menampilkan rincian potongan cicilan sebelum klaim dieksekusi, sehingga karyawan mengetahui jumlah bersih yang akan diterima. <br> A2. Apabila karyawan mengklik "Batal" setelah langkah 3 namun sebelum UserOperation dikirim ke bundler, proses dibatalkan tanpa efek on-chain apapun. |
| **Error Flow** | E1. Apabila stream gaji karyawan belum aktif atau telah dihentikan (`StreamNotActive`), smart contract menolak klaim. Frontend menampilkan pesan "Stream gaji Anda belum aktif. Hubungi HR Admin untuk memulai stream." <br> E2. Apabila tidak ada akumulasi gaji yang dapat diklaim (`NothingToClaim`), backend menolak permintaan dengan pesan "Tidak ada saldo yang dapat ditarik saat ini. Saldo Anda akan diperbarui seiring berjalannya waktu." <br> E3. Apabila saldo CompanyVault tidak mencukupi untuk membayar klaim (`InsufficientVaultBalance`), smart contract menolak transaksi. Frontend menampilkan pesan "Dana vault perusahaan tidak mencukupi. Silakan hubungi HR Admin Anda." <br> E4. Apabila batas klaim per jam terlampaui, backend menolak permintaan dengan status `429 Too Many Requests` dan pesan "Batas klaim telah tercapai. Anda dapat melakukan klaim kembali dalam [X] menit." |

---

#### UC-06: Inisiasi PHK oleh HR Admin

```mermaid
sequenceDiagram
    actor HR as HR Admin
    participant FE as Frontend
    participant CV as CompanyVault

    HR->>FE: Buka /hr/phk — pilih karyawan + isi alasan
    FE->>CV: proposeTermination(employee, reasonHash)
    CV->>CV: Validasi TerminationAlreadyProposed
    CV->>CV: Simpan proposal: hrApproved=true, expiresAt=now+7hari
    CV->>CV: Simpan flowRateSnapshot untuk kalkulasi pesangon
    CV-->>FE: event TerminationProposed
    FE-->>HR: Proposal PHK aktif — menunggu persetujuan LEGAL_ROLE
```

| | |
|-|-|
| **Nama Use Case** | Inisiasi PHK oleh HR Admin |
| **Deskripsi Singkat** | HR Admin mengajukan proposal Pemutusan Hubungan Kerja (PHK) terhadap karyawan tertentu melalui smart contract CompanyVault. Proposal ini memerlukan persetujuan kedua dari pemegang `LEGAL_ROLE` sebelum dapat dieksekusi, sebagai mekanisme pengamanan dua-peran (multi-signature) — lihat §3.1 SKPL untuk penjelasan bahwa `LEGAL_ROLE` saat ini digenggam HR Admin sendiri secara default. |
| **Aktor** | HR Admin |
| **Pre Kondisi** | HR Admin telah login dengan role `hr`. Karyawan yang akan di-PHK memiliki status aktif dengan stream gaji yang sedang berjalan. Belum ada proposal PHK aktif untuk karyawan tersebut. |
| **Pos Kondisi** | Proposal PHK tersimpan di smart contract dengan `hrApproved=true`, `legalApproved=false`, dan `expiresAt` 7 hari sejak pengajuan. Stream gaji karyawan tetap berjalan sampai eksekusi final. |
| **Basic Flow** | 1. HR Admin mengakses halaman `/hr/phk` dan mengklik "Buat Proposal PHK". <br> 2. Sistem menampilkan formulir proposal PHK. HR Admin memilih nama karyawan dari daftar karyawan aktif perusahaan. <br> 3. HR Admin mengisi formulir: alasan PHK (restrukturisasi, pelanggaran berat, berakhirnya kontrak, atau lainnya) dan catatan tambahan pendukung — alasan lengkap dikirim terpisah ke backend (`POST /termination/reason`) untuk disimpan plaintext off-chain, sementara on-chain hanya menyimpan hash-nya. <br> 4. HR Admin mengklik "Ajukan Proposal". Frontend memanggil `CompanyVault.proposeTermination(employeeAddress, reasonHash)` melalui Privy. <br> 5. Smart contract memverifikasi bahwa HR Admin memiliki `HR_ROLE` yang valid dan tidak ada proposal PHK aktif untuk karyawan tersebut. <br> 6. Proposal tersimpan on-chain dengan `hrApproved=true` dan `expiresAt = now + 7 hari`. <br> 7. Backend menerima webhook dari Alchemy dan menyimpan data proposal ke database. <br> 8. Frontend menampilkan konfirmasi "Proposal PHK berhasil diajukan dan sedang menunggu persetujuan kedua." |
| **Alternative Flow** | A1. Apabila HR Admin ingin membatalkan proposal sebelum persetujuan kedua diberikan, HR dapat memanggil `CompanyVault.cancelProposal(employeeAddress)`. Proposal dihapus dari state on-chain (`expiresAt` direset ke 0). |
| **Error Flow** | E1. Apabila sudah terdapat proposal PHK aktif yang belum selesai diproses untuk karyawan yang sama (`TerminationAlreadyProposed`), smart contract menolak pengajuan baru. Frontend menampilkan pesan "Proposal PHK untuk karyawan ini sudah pernah diajukan dan masih dalam proses. Selesaikan atau batalkan proposal yang ada sebelum membuat proposal baru." <br> E2. Apabila HR Admin tidak memiliki `HR_ROLE` yang valid di smart contract (`Unauthorized`), transaksi akan di-revert. Frontend menampilkan pesan "Akses ditolak. Anda tidak memiliki wewenang untuk mengajukan proposal PHK." <br> E3. Apabila karyawan yang dipilih tidak ditemukan atau sudah dalam status non-aktif, backend mengembalikan error `404 Not Found`. Frontend menampilkan pesan "Karyawan tidak ditemukan atau sudah tidak aktif dalam sistem." |

---

#### UC-07: Persetujuan PHK oleh Pemegang LEGAL_ROLE

> **Catatan implementasi:** Use case ini secara arsitektur adalah langkah persetujuan independen oleh pemegang `LEGAL_ROLE` — namun dalam produk saat ini, `LEGAL_ROLE` di-auto-grant ke alamat HR Admin sendiri saat onboarding vault, dan frontend tidak memiliki dashboard/alur login terpisah untuk pemegang `LEGAL_ROLE` yang berbeda dari HR Admin (lihat §3.1 untuk detail lengkap). Diagram dan alur di bawah karenanya menunjukkan HR Admin sebagai pelaku, memanggil fungsi kontrak yang sama seolah bertindak sebagai pemegang `LEGAL_ROLE` terpisah — bukan aktor lain yang login sendiri.

```mermaid
sequenceDiagram
    actor HR as HR Admin (pemegang LEGAL_ROLE)
    participant FE as Frontend
    participant CV as CompanyVault
    participant SBT as EmploymentSBT
    participant IDRX as IDRX Token

    HR->>FE: Buka /hr/phk — lihat proposal menunggu persetujuan
    FE->>CV: approveTermination(employee)
    CV->>CV: Validasi LEGAL_ROLE
    CV->>CV: Validasi AlreadyApproved + ProposalExpired
    CV->>CV: legalApproved = true
    CV-->>FE: event TerminationApproved — kedua langkah persetujuan terpenuhi
    HR->>FE: Klik "Eksekusi PHK"
    FE->>CV: executeTermination(employee)
    CV->>CV: Hitung pesangon (PayrollMath.severanceMultiplier)
    CV->>CV: _forfeitAllVests(employee)
    CV->>SBT: revoke(tokenId)
    CV->>IDRX: transfer(employee, severanceDue)
    CV-->>FE: event TerminationExecuted
    FE-->>HR: PHK berhasil dieksekusi
```

| | |
|-|-|
| **Nama Use Case** | Persetujuan PHK oleh Pemegang LEGAL_ROLE |
| **Deskripsi Singkat** | Pemegang `LEGAL_ROLE` pada `CompanyVault` — dalam praktik HR Admin sendiri, lihat catatan implementasi di atas — meninjau proposal PHK yang diajukan dan memberikan persetujuan kedua. Setelah kedua persetujuan (`hrApproved` dan `legalApproved`) terpenuhi, HR Admin dapat menjalankan eksekusi PHK final on-chain. |
| **Aktor** | HR Admin (pemegang `LEGAL_ROLE`) |
| **Pre Kondisi** | HR Admin telah login dengan role `hr`. Terdapat minimal satu proposal PHK dengan `hrApproved=true` dan `legalApproved=false` yang belum kedaluwarsa (dalam 7 hari sejak pengajuan). |
| **Pos Kondisi** | `legalApproved` berubah menjadi `true` on-chain. HR Admin dapat langsung melanjutkan ke eksekusi PHK final, yang akan mencabut SBT karyawan, menghentikan stream, dan mencairkan pesangon. |
| **Basic Flow** | 1. HR Admin mengakses halaman `/hr/phk` dan melihat daftar proposal dengan status menunggu persetujuan kedua. <br> 2. HR Admin membuka detail proposal: nama karyawan, alasan PHK (dibaca dari `GET /termination/reason/:employeeAddress`), dan tanggal pengajuan. <br> 3. HR Admin mengklik "Setujui". Frontend memanggil `CompanyVault.approveTermination(employeeAddress)`. <br> 4. Smart contract memverifikasi pemanggil memiliki `LEGAL_ROLE`, proposal masih aktif dan belum kedaluwarsa, serta belum pernah disetujui sebelumnya dari langkah ini. <br> 5. `legalApproved` berubah menjadi `true` on-chain; event `TerminationApproved` diterbitkan. <br> 6. Frontend menampilkan konfirmasi dan tombol "Eksekusi PHK" menjadi aktif. <br> 7. HR Admin mengklik "Eksekusi PHK" — memanggil `executeTermination(employeeAddress)`, yang menghitung pesangon, mencabut SBT, dan mentransfer dana pesangon ke karyawan dalam satu transaksi. |
| **Alternative Flow** | A1. Tidak ada fungsi `rejectTermination()` pada kontrak — untuk membatalkan proposal sebelum persetujuan kedua, HR Admin memanggil `cancelProposal(employeeAddress)` (lihat UC-06, A1). Sistem tidak menyediakan mekanisme "tolak dengan alasan" yang terpisah dari pembatalan. |
| **Error Flow** | E1. Apabila persetujuan kedua untuk proposal yang sama sudah pernah diberikan (`AlreadyApproved`), smart contract menolak dan mengembalikan error. Frontend menampilkan pesan "Persetujuan untuk proposal PHK ini sudah pernah diberikan sebelumnya." <br> E2. Apabila proposal PHK telah melampaui batas waktu 7 hari (`ProposalExpired`), smart contract menolak aksi approval. Frontend menampilkan pesan "Proposal PHK ini telah kedaluwarsa. HR Admin perlu mengajukan proposal baru." <br> E3. Apabila pemanggil tidak memiliki `LEGAL_ROLE` yang valid di smart contract (`Unauthorized`), transaksi akan di-revert. Frontend menampilkan pesan "Akses ditolak. Alamat ini tidak memiliki wewenang LEGAL_ROLE untuk menyetujui PHK." Ini adalah satu-satunya jalur bagi alamat terpisah (bukan HR Admin) yang diberi `LEGAL_ROLE` via `/hr/settings` untuk berinteraksi dengan fungsi ini — melalui panggilan kontrak langsung di luar aplikasi, karena frontend tidak merutekan mereka ke halaman ini (lihat §3.1). |

---

#### UC-08: Karyawan Resign Mandiri

```mermaid
sequenceDiagram
    actor EMP as Karyawan
    actor HR as HR Admin
    participant FE as Frontend
    participant CV as CompanyVault
    participant SBT as EmploymentSBT

    EMP->>HR: Ajukan pengunduran diri (di luar sistem)
    HR->>FE: Proses resign di /hr/employees/[id]
    FE->>CV: resignEmployee(employee)
    CV->>CV: Stop stream + _settle(employee)
    CV->>CV: Kembalikan severanceVault.balance ke vaultBalance
    CV->>CV: _forfeitAllVests(employee)
    CV->>SBT: revoke(tokenId)
    CV-->>FE: event EmployeeResigned
    FE-->>HR: Karyawan berhasil di-offboard
```

| | |
|-|-|
| **Nama Use Case** | Karyawan Resign Mandiri |
| **Deskripsi Singkat** | Karyawan mengajukan pengunduran diri secara mandiri melalui aplikasi Payana. Sistem memproses permintaan resign, menghentikan stream gaji setelah periode pemberitahuan (notice period) berakhir, dan memproses hak-hak karyawan sesuai ketentuan yang berlaku. |
| **Aktor** | Karyawan |
| **Pre Kondisi** | Karyawan telah login dengan role `employee`. Karyawan memiliki stream gaji yang sedang berjalan secara aktif. Karyawan belum memiliki proses resign atau PHK yang sedang berjalan. |
| **Pos Kondisi** | Pengajuan resign tercatat di sistem dengan status `dalam_proses`. Stream gaji tetap berjalan selama notice period. Setelah notice period berakhir, stream dihentikan, SBT dicabut, sisa akumulasi gaji dapat diklaim, dan dana Severance Vault diproses sesuai kebijakan perusahaan. |
| **Basic Flow** | 1. Karyawan mengakses halaman `/employee/profile` dan mengklik menu "Pengajuan Resign". <br> 2. Sistem menampilkan formulir pengajuan resign beserta informasi notice period yang berlaku (umumnya 30 hari) dan estimasi hak-hak yang akan diterima. <br> 3. Karyawan mengisi alasan resign (opsional) dan memilih tanggal efektif yang diinginkan (minimal setelah notice period). <br> 4. Karyawan mengklik "Ajukan Resign" dan mengonfirmasi tindakan pada dialog konfirmasi. <br> 5. Frontend mengirimkan permintaan `POST /employee/resign` ke backend beserta JWT autentikasi dan data formulir. <br> 6. Backend mencatat pengajuan resign di database dengan status `dalam_proses` dan menghitung tanggal efektif berdasarkan notice period perusahaan. <br> 7. Backend mengirimkan notifikasi ke HR Admin bahwa karyawan telah mengajukan resign. <br> 8. Pada tanggal efektif yang telah ditentukan, backend secara otomatis memicu pemanggilan `CompanyVault.stopStream(employeeAddress)` dan `EmploymentSBT.revoke(employeeAddress)` melalui mekanisme scheduler. <br> 9. Sisa saldo akumulasi gaji dapat diklaim oleh karyawan dalam periode tertentu setelah stream dihentikan. <br> 10. Frontend menampilkan konfirmasi "Pengajuan resign Anda telah diterima. Stream gaji akan dihentikan pada [tanggal efektif]." |
| **Alternative Flow** | A1. Apabila karyawan ingin membatalkan pengajuan resign sebelum tanggal efektif, karyawan dapat mengakses halaman yang sama dan mengklik "Batalkan Resign". Backend memperbarui status menjadi `dibatalkan` dan HR Admin menerima notifikasi pembatalan. |
| **Error Flow** | E1. Apabila stream karyawan sudah tidak aktif (`StreamNotActive`) saat sistem mencoba menghentikannya pada tanggal efektif (misalnya karena sudah dihentikan oleh HR Admin karena alasan lain), sistem mencatat kondisi ini dan melanjutkan proses pencabutan SBT dan penyelesaian hak tanpa menghentikan stream. <br> E2. Apabila karyawan sudah memiliki proses resign atau PHK yang sedang berjalan dan mencoba mengajukan resign kembali, backend mengembalikan error `409 Conflict` dengan pesan "Anda sudah memiliki proses pengunduran diri yang sedang berlangsung." <br> E3. Apabila terjadi kegagalan on-chain saat eksekusi penghentian stream pada tanggal efektif, sistem mengirimkan notifikasi kepada HR Admin untuk melakukan eksekusi manual. |

---

#### UC-09: HR Grant Vesting Schedule ke Karyawan

```mermaid
sequenceDiagram
    actor HR as HR Admin
    participant FE as Frontend
    participant CV as CompanyVault

    HR->>FE: Isi form vest (karyawan, jumlah, cliff date, tipe)
    FE->>CV: createCliffVest(employee, amount, cliffTs, vestType)
    CV->>CV: Validasi cliffTs > block.timestamp
    CV->>CV: Validasi InsufficientVaultBalance
    CV->>CV: vaultBalance -= amount
    CV->>CV: Simpan CliffVest{Locked}, vestId = vestCounter++
    CV-->>FE: event CliffVestCreated(employee, vestId, amount, cliffTs)
    FE-->>HR: Vest berhasil dibuat
```

| | |
|-|-|
| **Nama Use Case** | HR Grant Vesting Schedule ke Karyawan |
| **Deskripsi Singkat** | HR Admin mengunci sejumlah IDRX dalam mekanisme cliff vesting untuk karyawan tertentu sebagai bentuk insentif retensi, bonus kinerja tahunan, atau kompensasi jangka panjang. Dana terkunci hingga tanggal cliff terlewati, setelah itu karyawan dapat mengklaim secara mandiri. |
| **Aktor** | HR Admin |
| **Pre Kondisi** | HR Admin telah login dengan role `hr`. CompanyVault perusahaan memiliki saldo IDRX yang mencukupi untuk dikunci dalam vesting. Karyawan yang menjadi target vesting memiliki status aktif dan stream gaji yang berjalan. |
| **Pos Kondisi** | Entri vesting baru tercatat on-chain di CompanyVault dengan status `terkunci`. Sejumlah IDRX dikunci eksklusif untuk karyawan penerima hingga tanggal cliff. Karyawan menerima notifikasi bahwa vesting telah dibuat. |
| **Basic Flow** | 1. HR Admin mengakses halaman `/hr/vesting` yang menampilkan daftar vesting aktif seluruh karyawan. <br> 2. HR Admin mengklik "Buat Vesting Baru". Sistem menampilkan formulir pembuatan vesting. <br> 3. HR Admin mengisi formulir: pilih karyawan penerima dari daftar karyawan aktif, masukkan jumlah IDRX yang akan dikunci, tentukan tanggal cliff (tanggal mulai karyawan dapat mengklaim), dan pilih jenis vesting (bonus tahunan, insentif kinerja, retensi jangka panjang, atau lainnya). <br> 4. Sistem menampilkan ringkasan vesting untuk dikonfirmasi oleh HR Admin, termasuk perhitungan jumlah hari hingga cliff. <br> 5. HR Admin mengklik "Buat Vesting". Frontend memanggil `CompanyVault.createCliffVest(employeeAddress, amount, cliffTimestamp, vestType)` melalui Privy. <br> 6. Smart contract memvalidasi bahwa saldo vault mencukupi, lalu mengunci sejumlah `amount` IDRX secara eksklusif untuk karyawan tersebut dengan ID vesting unik yang digenerate. <br> 7. Backend menerima webhook dari Alchemy dan mencatat entri vesting baru di database dengan status `locked` beserta metadata cliff. <br> 8. Backend mengirimkan notifikasi ke karyawan bahwa vesting telah dibuat atas nama mereka. <br> 9. Frontend menampilkan konfirmasi "Cliff vesting berhasil dibuat. Dana [jumlah] IDRX akan dapat diklaim oleh [nama karyawan] mulai tanggal [tanggal cliff]." |
| **Alternative Flow** | A1. Apabila HR Admin ingin membatalkan vesting sebelum karyawan mengklaimnya, HR dapat memanggil `CompanyVault.cancelVesting(vestId)`. Dana dikembalikan ke saldo vault yang tersedia dan karyawan menerima notifikasi pembatalan. |
| **Error Flow** | E1. Apabila saldo vault tidak mencukupi untuk mengunci jumlah yang dimasukkan (`InsufficientVaultBalance`), smart contract menolak transaksi. Frontend menampilkan pesan "Saldo vault tidak mencukupi untuk membuat vesting sebesar [jumlah] IDRX. Silakan lakukan deposit terlebih dahulu." <br> E2. Apabila HR Admin tidak memiliki `HR_ROLE` yang valid (`Unauthorized`), transaksi akan di-revert. Frontend menampilkan pesan "Akses ditolak. Anda tidak memiliki wewenang untuk membuat vesting schedule." <br> E3. Apabila tanggal cliff yang dimasukkan sudah terlewati (tanggal di masa lalu), frontend memvalidasi dan menampilkan pesan "Tanggal cliff tidak valid. Tanggal cliff harus berada di masa mendatang." |

---

#### UC-10: Karyawan Claim Vested Bonus

```mermaid
sequenceDiagram
    actor EMP as Karyawan
    participant FE as Frontend
    participant CV as CompanyVault
    participant IDRX as IDRX Token

    EMP->>FE: Buka /employee/vesting — lihat daftar vest
    FE->>CV: cliffVests(employee, vestId) — view
    CV-->>FE: Status vest + cliffTs
    EMP->>FE: Klik "Cairkan" pada vest yang matang
    FE->>CV: claimCliffVest(vestId)
    CV->>CV: Validasi CliffNotReached (block.timestamp >= cliffTs)
    CV->>CV: Validasi VestAlreadySettled
    CV->>CV: status = Claimed
    CV->>IDRX: transfer(employee, amount)
    CV-->>FE: event CliffVestClaimed
    FE-->>EMP: Bonus berhasil dicairkan
```

| | |
|-|-|
| **Nama Use Case** | Karyawan Claim Vested Bonus |
| **Deskripsi Singkat** | Karyawan mengklaim dana bonus yang telah melampaui periode cliff vesting. Setelah tanggal cliff terlewati, karyawan dapat mengeksekusi klaim secara mandiri on-chain dan menerima dana IDRX langsung ke wallet mereka. |
| **Aktor** | Karyawan |
| **Pre Kondisi** | Karyawan telah login dengan role `employee`. HR Admin telah membuat entri vesting untuk karyawan tersebut. Tanggal saat ini telah melampaui tanggal cliff yang ditetapkan. Dana vesting belum pernah diklaim sebelumnya. |
| **Pos Kondisi** | Dana IDRX yang terkunci dalam vesting dicairkan dan dikirim ke wallet karyawan. Status entri vesting berubah menjadi `claimed` di database dan on-chain. Audit log klaim tercatat di backend. |
| **Basic Flow** | 1. Karyawan membuka halaman `/employee/vesting` yang menampilkan daftar seluruh entri vesting milik karyawan tersebut. <br> 2. Sistem menampilkan setiap entri vesting dengan informasi: jenis vesting, jumlah IDRX, tanggal cliff, status (terkunci atau siap klaim), dan sisa waktu hingga cliff apabila belum jatuh tempo. <br> 3. Apabila tanggal saat ini sudah melewati tanggal cliff, tombol "Klaim" pada entri tersebut aktif. Apabila belum, tombol ditampilkan dalam kondisi nonaktif dengan countdown waktu tersisa. <br> 4. Karyawan mengklik tombol "Klaim" pada entri vesting yang sudah jatuh tempo. <br> 5. Frontend memanggil `CompanyVault.claimCliffVest(vestId)` melalui UserOperation (ERC-4337) yang ditandatangani Privy secara diam-diam. <br> 6. Smart contract memvalidasi bahwa `block.timestamp >= cliffTimestamp`, vesting belum pernah diklaim, dan `vestId` adalah milik pemanggil. <br> 7. Dana IDRX dicairkan dari vault ke wallet karyawan secara on-chain. <br> 8. Backend menerima webhook, memperbarui status vesting menjadi `claimed` di database, dan mencatat transaksi di audit log. <br> 9. Frontend menampilkan notifikasi "Dana vesting sebesar [jumlah] IDRX berhasil diklaim dan telah masuk ke wallet Anda." dan memperbarui tampilan daftar vesting. |
| **Alternative Flow** | A1. Apabila karyawan memiliki beberapa entri vesting yang siap diklaim secara bersamaan, karyawan dapat mengklaim satu per satu dari daftar yang tersedia di halaman yang sama. |
| **Error Flow** | E1. Apabila karyawan mencoba mengklaim sebelum tanggal cliff tercapai (`CliffNotReached`), smart contract menolak transaksi. Frontend menampilkan pesan "Dana vesting belum dapat diklaim. Cliff period belum tercapai. Tersisa [X hari Y jam] lagi." <br> E2. Apabila vesting sudah pernah diklaim sebelumnya (`VestAlreadySettled`), smart contract menolak transaksi karena flag `settled` sudah bernilai benar. Frontend menampilkan pesan "Vesting ini sudah pernah diklaim sebelumnya. Silakan periksa riwayat transaksi Anda." <br> E3. Apabila ID vesting yang dikirimkan tidak ditemukan atau bukan milik karyawan yang memanggil (`VestNotFound`), smart contract mengembalikan error. Frontend menampilkan pesan "Entri vesting tidak ditemukan atau Anda tidak memiliki akses untuk mengklaim vesting ini." <br> E4. Apabila saldo vault tidak mencukupi saat klaim dieksekusi akibat kondisi tidak terduga (`InsufficientVaultBalance`), transaksi di-revert. Frontend menampilkan pesan "Terjadi kesalahan sistem. Silakan hubungi HR Admin Anda." |

---

#### UC-11: Karyawan Mengajukan dan Melunasi Kasbon

```mermaid
sequenceDiagram
    actor EMP as Karyawan
    participant FE as Frontend
    participant CV as CompanyVault

    EMP->>FE: Input jumlah kasbon di /employee/kasbon
    FE->>CV: getStreamInfo(employee) — cek flowRate
    CV-->>FE: flowRate aktif
    FE->>CV: requestAdvance(amount) — gasless via Paymaster
    CV->>CV: Validasi amount <= 80% gaji bulanan (MAX_ADVANCE_BPS)
    CV->>CV: Validasi tidak ada kasbon Pending/Active lain
    CV->>CV: advances[employee] = {amount, 0, Pending}
    CV-->>FE: event AdvanceRequested(employee, amount)
    FE-->>EMP: Pengajuan kasbon terkirim, menunggu persetujuan HR

    Note over CV: Setelah HR approve (UC-12), status jadi Active dan dana ditransfer

    EMP->>FE: Klaim gaji berikutnya (UC-05)
    FE->>CV: claimSalary()
    CV->>CV: Potong min(20% accrued, sisa kasbon) sebagai cicilan
    CV->>CV: advances[employee].repaid += kasbonRepaid
    alt sisa kasbon == 0
        CV->>CV: status = Repaid
    end
    CV-->>FE: event AdvanceRepaid(employee, kasbonRepaid, remainingDebt)
    FE-->>EMP: Gaji diterima, kasbon tercatat berkurang
```

| | |
|-|-|
| **Nama Use Case** | Karyawan Mengajukan dan Melunasi Kasbon |
| **Deskripsi Singkat** | Karyawan mengajukan uang muka gaji (kasbon) hingga 80% dari estimasi gaji bulanan yang belum accrued. Dana kasbon bersumber langsung dari `vaultBalance` perusahaan, disetujui manual oleh HR (UC-12), dan dilunasi otomatis melalui pemotongan sebagian dari setiap klaim gaji berikutnya. |
| **Aktor** | Karyawan |
| **Pre Kondisi** | Karyawan telah login dengan role `employee` dan memiliki stream gaji aktif. Karyawan tidak memiliki kasbon berstatus `Pending` atau `Active` lainnya. |
| **Pos Kondisi** | Pengajuan kasbon tercatat dengan status `Pending` menunggu persetujuan HR. Setelah disetujui dan dana ditransfer (status `Active`), setiap klaim gaji berikutnya otomatis memotong cicilan hingga status menjadi `Repaid`. |
| **Basic Flow** | 1. Karyawan membuka halaman `/employee/kasbon`. <br> 2. Sistem menampilkan estimasi gaji bulanan, limit kasbon maksimal (80% dari estimasi), dan status kasbon saat ini (jika ada). <br> 3. Karyawan memasukkan jumlah kasbon yang diinginkan (≤ limit) dan mengklik "Ajukan Kasbon". <br> 4. Frontend memanggil `requestAdvance(amount)` melalui UserOperation gasless (ERC-4337, ditandatangani Privy). <br> 5. Smart contract memvalidasi limit 80% dan ketiadaan kasbon aktif/pending lain, lalu mencatat status `Pending` dan menerbitkan event `AdvanceRequested`. <br> 6. Backend menerima webhook, mencatat pengajuan, dan mengirim notifikasi ke HR untuk ditinjau (lanjut ke UC-12). <br> 7. Setelah HR menyetujui, dana kasbon masuk ke wallet karyawan dan status berubah menjadi `Active`. <br> 8. Pada klaim gaji berikutnya (UC-05), sistem otomatis memotong `min(20% accrued, sisa kasbon)` sebagai cicilan sebelum menghitung PPh21/BPJS dan pesangon. <br> 9. Ketika sisa kasbon mencapai nol, status berubah menjadi `Repaid` dan karyawan dapat mengajukan kasbon baru. |
| **Alternative Flow** | A1. Apabila HR menolak pengajuan (UC-12), status berubah menjadi `Rejected` dan karyawan dapat mengajukan kembali. |
| **Error Flow** | E1. Apabila jumlah yang diajukan melebihi 80% estimasi gaji bulanan, smart contract menolak transaksi. Frontend menampilkan pesan "Jumlah kasbon melebihi batas maksimal 80% dari estimasi gaji bulanan Anda." <br> E2. Apabila karyawan masih memiliki kasbon berstatus `Pending` atau `Active`, smart contract menolak pengajuan baru. Frontend menampilkan pesan "Anda masih memiliki kasbon yang belum selesai. Selesaikan atau tunggu proses kasbon sebelumnya terlebih dahulu." <br> E3. Apabila karyawan resign atau di-PHK sebelum kasbon lunas, sisa kasbon dihapus sebagai bad debt (trade-off MVP) dan tidak mengurangi hak pesangon yang telah terakumulasi. |

---

#### UC-12: HR Menyetujui/Menolak Kasbon

```mermaid
sequenceDiagram
    actor HR as HR Admin
    participant FE as Frontend
    participant CV as CompanyVault
    participant IDRX as IDRX Token

    HR->>FE: Buka daftar kasbon Pending di /hr/kasbon
    alt HR menyetujui
        HR->>FE: Klik "Setujui"
        FE->>CV: approveAdvance(employee)
        CV->>CV: Validasi vaultBalance mencukupi
        CV->>IDRX: transfer(employee, amount)
        CV->>CV: advances[employee].status = Active
        CV-->>FE: event AdvanceApproved(employee, amount)
    else HR menolak
        HR->>FE: Klik "Tolak"
        FE->>CV: rejectAdvance(employee)
        CV->>CV: advances[employee].status = Rejected
        CV-->>FE: event AdvanceRejected(employee)
    end
    FE-->>HR: Status kasbon diperbarui
```

| | |
|-|-|
| **Nama Use Case** | HR Menyetujui/Menolak Kasbon |
| **Deskripsi Singkat** | HR Admin meninjau daftar pengajuan kasbon karyawan berstatus `Pending`, kemudian menyetujui (dana langsung ditransfer ke karyawan) atau menolak pengajuan tersebut. |
| **Aktor** | HR Admin |
| **Pre Kondisi** | HR Admin telah login dengan role `hr`. Terdapat minimal satu pengajuan kasbon berstatus `Pending` untuk perusahaannya. |
| **Pos Kondisi** | Status kasbon berubah menjadi `Active` (disertai transfer dana ke karyawan) atau `Rejected`. |
| **Basic Flow** | 1. HR Admin membuka halaman `/hr/kasbon` dan melihat daftar pengajuan kasbon berstatus `Pending`. <br> 2. HR Admin meninjau detail pengajuan: nama karyawan, jumlah yang diajukan, dan estimasi gaji bulanan karyawan. <br> 3. HR Admin mengklik "Setujui". Frontend memanggil `approveAdvance(employee)`. <br> 4. Smart contract memvalidasi `vaultBalance` mencukupi, mentransfer dana ke karyawan, dan mengubah status menjadi `Active`. <br> 5. Frontend menampilkan konfirmasi dan memperbarui daftar kasbon. |
| **Alternative Flow** | A1. HR Admin mengklik "Tolak" pada langkah 3. Frontend memanggil `rejectAdvance(employee)`, status berubah menjadi `Rejected`, dan karyawan dapat mengajukan kembali. |
| **Error Flow** | E1. Apabila `vaultBalance` perusahaan tidak mencukupi jumlah kasbon yang disetujui, smart contract menolak transaksi. Frontend menampilkan pesan "Saldo vault tidak mencukupi untuk menyetujui kasbon ini. Silakan danai vault terlebih dahulu." |

---

#### UC-13: HR Generate Laporan Kepatuhan (BPJS/PPh21)

```mermaid
sequenceDiagram
    actor HR as HR Admin
    participant FE as Frontend
    participant BE as Backend
    participant Ponder as Ponder Indexer
    participant PG as PostgreSQL

    HR->>FE: Buka /hr/compliance — pilih periode bulan
    FE->>BE: GET /compliance/summary/:hr?month=2026-05
    BE->>Ponder: Query SalaryClaimed events per vault
    Ponder-->>BE: Agregasi total klaim, compliance, severance
    BE-->>FE: JSON ringkasan kepatuhan
    FE-->>HR: Pratinjau laporan ditampilkan
    HR->>FE: Klik "Unduh CSV"
    FE->>BE: GET /compliance/export/:hr?month=2026-05
    BE->>Ponder: Query detail per karyawan
    Ponder-->>BE: Data on-chain per karyawan
    BE->>PG: Query nama/NIK/telepon karyawan
    PG-->>BE: Data PII terenkripsi
    BE->>BE: Dekripsi AES-256-GCM + generate CSV
    BE-->>FE: File CSV
    FE-->>HR: Download CSV berhasil
```

| | |
|-|-|
| **Nama Use Case** | HR Generate Laporan Kepatuhan (BPJS/PPh21) |
| **Deskripsi Singkat** | HR Admin menghasilkan laporan kepatuhan hukum berupa rekap iuran BPJS Kesehatan, BPJS Ketenagakerjaan, dan Pajak Penghasilan Pasal 21 (PPh21) untuk seluruh karyawan perusahaan dalam periode tertentu. Laporan bersumber dari data alokasi Compliance Vault on-chain. |
| **Aktor** | HR Admin |
| **Pre Kondisi** | HR Admin telah login dengan role `hr`. Terdapat minimal satu karyawan aktif yang telah melakukan klaim EWA dalam periode yang dipilih, sehingga Compliance Vault memiliki data akumulasi dana kepatuhan. |
| **Pos Kondisi** | Laporan kepatuhan berhasil digenerate dalam format yang dapat diekspor (PDF atau CSV). Data laporan mencerminkan total iuran yang teralokasi ke Compliance Vault dalam periode yang dipilih. Riwayat generate laporan tercatat di audit log. |
| **Basic Flow** | 1. HR Admin mengakses halaman `/hr/compliance` dan memilih menu "Generate Laporan". <br> 2. Sistem menampilkan formulir pemilihan parameter laporan: periode waktu (bulan dan tahun), jenis laporan (BPJS Kesehatan, BPJS Ketenagakerjaan, PPh21, atau gabungan), dan format ekspor yang diinginkan (PDF atau CSV). <br> 3. HR Admin mengisi parameter laporan dan mengklik "Generate". <br> 4. Backend mengambil data transaksi klaim EWA dari database dalam periode yang dipilih, mengekstrak alokasi 5% yang masuk ke Compliance Vault, dan menghitung besaran iuran per karyawan berdasarkan konfigurasi split yang berlaku. <br> 5. Backend juga membaca data Compliance Vault on-chain melalui Alchemy untuk verifikasi silang (cross-check) antara data database dan data on-chain. <br> 6. Backend menyusun laporan dengan rincian: nama karyawan, NIK, gaji bruto, potongan BPJS Kesehatan (persentase dan nominal), potongan BPJS Ketenagakerjaan (persentase dan nominal), potongan PPh21 (persentase dan nominal berdasarkan bracket), dan total iuran per karyawan. <br> 7. Backend menghasilkan file laporan dalam format yang diminta dan menyimpannya sementara di server. <br> 8. Backend mengembalikan URL unduhan laporan ke frontend. Frontend menampilkan pratinjau laporan dan tombol "Unduh". <br> 9. HR Admin mengunduh file laporan. Backend mencatat aktivitas generate laporan di audit log. |
| **Alternative Flow** | A1. Apabila HR Admin membutuhkan laporan untuk satu karyawan tertentu saja, sistem menyediakan filter berdasarkan nama karyawan atau NIK di dalam formulir laporan. <br> A2. Apabila HR Admin ingin menjadwalkan generate laporan otomatis setiap akhir bulan, sistem menyediakan opsi penjadwalan yang akan mengirimkan laporan ke email HR Admin secara periodik. |
| **Error Flow** | E1. Apabila tidak ada data transaksi dalam periode yang dipilih (tidak ada klaim EWA yang terjadi), backend mengembalikan laporan kosong dengan pesan "Tidak ada data transaksi dalam periode yang dipilih. Laporan tidak dapat digenerate." <br> E2. Apabila terjadi ketidaksesuaian signifikan antara data database dan data on-chain saat proses verifikasi silang, backend mencatat anomali di audit log dan menampilkan peringatan kepada HR Admin: "Terdeteksi ketidaksesuaian data. Silakan hubungi administrator sistem untuk rekonsiliasi manual." <br> E3. Apabila proses generate laporan gagal karena kesalahan sistem internal, backend mengembalikan error `500 Internal Server Error`. Frontend menampilkan pesan "Gagal menghasilkan laporan. Silakan coba kembali atau hubungi dukungan teknis." |

---

#### UC-14: Verifikasi Sertifikat Ketenagakerjaan (SBT)

```mermaid
sequenceDiagram
    actor THIRD as Pihak Ketiga
    participant FE as Frontend
    participant SBT as EmploymentSBT

    THIRD->>FE: Masukkan alamat wallet karyawan
    FE->>SBT: employeeTokenId(employeeAddress)
    SBT-->>FE: tokenId (0 jika tidak ada SBT aktif)
    alt tokenId != 0
        FE->>SBT: employmentRecords(tokenId)
        SBT-->>FE: {companyName, hrAuthority, startTs}
        FE->>SBT: locked(tokenId)
        SBT-->>FE: true (soulbound terkonfirmasi)
        FE-->>THIRD: Status aktif + data ketenagakerjaan
    else tokenId == 0
        FE-->>THIRD: Karyawan tidak memiliki SBT aktif
    end
```

| | |
|-|-|
| **Nama Use Case** | Verifikasi Sertifikat Ketenagakerjaan (SBT) |
| **Deskripsi Singkat** | Verifikasi keaslian dan keabsahan Soulbound Token (SBT) ketenagakerjaan yang diterbitkan sistem Payana sebagai bukti hubungan kerja yang tidak dapat dipalsukan. Halaman verifikasi bersifat publik (tanpa login) sehingga dapat diakses oleh pihak ketiga (bank, lembaga keuangan, calon pemberi kerja) maupun karyawan sendiri; pada level diagram use case, use case ini digambarkan sebagai bagian dari domain HR Admin karena HR Admin adalah pihak yang menerbitkan dan mengelola SBT yang diverifikasi. |
| **Aktor** | HR Admin (pengelola SBT); halaman verifikasi itu sendiri dapat diakses publik tanpa autentikasi |
| **Pre Kondisi** | Karyawan atau pihak ketiga memiliki alamat wallet karyawan yang akan diverifikasi. EmploymentSBT telah diterbitkan oleh sistem Payana ke wallet karyawan saat onboarding. |
| **Pos Kondisi** | Status verifikasi SBT ditampilkan: valid dan aktif (karyawan masih bekerja) atau tidak valid/dicabut (karyawan sudah tidak bekerja). Informasi ketenagakerjaan yang terenkripsi dapat dibaca oleh pihak yang berwenang. |
| **Basic Flow** | 1. Pengguna (pihak ketiga atau karyawan) mengakses halaman publik verifikasi SBT Payana di `/verify` tanpa perlu login. <br> 2. Pengguna memasukkan alamat wallet karyawan yang ingin diverifikasi pada kolom pencarian. <br> 3. Frontend mengirimkan permintaan ke backend `GET /verify/sbt/:walletAddress`. <br> 4. Backend membaca data SBT dari smart contract `EmploymentSBT` on-chain: memeriksa apakah token ada, apakah masih aktif (belum dicabut), dan metadata ketenagakerjaan yang terkait. <br> 5. Backend memverifikasi integritas data SBT dengan memeriksa konsistensi antara data on-chain dan database backend. <br> 6. Sistem menampilkan hasil verifikasi: status SBT (aktif atau telah dicabut), nama perusahaan, jabatan karyawan (jika tersedia), dan tanggal penerbitan SBT. <br> 7. Apabila verifikasi dilakukan oleh karyawan pemilik SBT yang sudah login, karyawan dapat membagikan tautan verifikasi unik (shareable link) kepada pihak yang membutuhkan tanpa harus membocorkan alamat wallet mereka. |
| **Alternative Flow** | A1. Apabila pihak ketiga memerlukan konfirmasi lebih lanjut, sistem menyediakan opsi untuk mengunduh sertifikat verifikasi dalam format PDF yang ditandatangani secara digital oleh sistem Payana, yang dapat diserahkan sebagai dokumen pendukung formal. |
| **Error Flow** | E1. Apabila ada pihak yang mencoba mentransfer SBT ke wallet lain (misalnya melalui interaksi langsung dengan smart contract di luar antarmuka Payana), smart contract menolak operasi transfer karena SBT adalah Soulbound Token yang tidak dapat dipindahtangankan (`SoulboundTransferNotAllowed`). Sistem mencatat percobaan transfer di audit log keamanan. <br> E2. Apabila alamat wallet yang dimasukkan tidak memiliki SBT yang diterbitkan oleh sistem Payana, backend mengembalikan status `404 Not Found`. Frontend menampilkan pesan "Sertifikat ketenagakerjaan tidak ditemukan untuk alamat wallet yang diberikan. Pastikan alamat wallet yang dimasukkan sudah benar." <br> E3. Apabila SBT ditemukan namun sudah dicabut (karyawan sudah tidak aktif bekerja), sistem menampilkan status "SBT Tidak Aktif" beserta tanggal pencabutan dan alasan pencabutan (PHK atau resign) untuk transparansi. |

---

#### UC-15: Owner SaaS Deploy Company Vault Baru

```mermaid
sequenceDiagram
    actor OWNER as Owner SaaS
    participant FE as Frontend
    participant PF as PayrollFactory
    participant CV as CompanyVault

    OWNER->>FE: Buka /owner — klik "Deploy Vault Baru"
    FE->>PF: deployVault(hrAuthority, companyName, sbtAddr)
    PF->>PF: Validasi SUPERADMIN_ROLE
    PF->>PF: Validasi HRAlreadyHasVault
    PF->>CV: new CompanyVault(params)
    CV-->>PF: vaultAddress
    PF->>PF: companyVaults[hr] = vaultAddress
    PF->>PF: allVaults.push(vaultAddress)
    PF-->>FE: event VaultDeployed(hr, vaultAddress, companyName)
    FE-->>OWNER: Vault baru berhasil di-deploy
```

| | |
|-|-|
| **Nama Use Case** | Owner SaaS Deploy Company Vault Baru |
| **Deskripsi Singkat** | Owner SaaS secara langsung men-deploy CompanyVault baru untuk perusahaan klien yang baru bergabung ke platform Payana. Proses ini dilakukan dari dashboard Owner dan mencakup konfigurasi parameter awal vault serta pendaftaran HR Admin perusahaan tersebut ke dalam sistem. |
| **Aktor** | Owner SaaS |
| **Pre Kondisi** | Owner SaaS telah login dengan role `owner`. Perusahaan klien baru telah menyelesaikan proses pendaftaran dan verifikasi di luar sistem (perjanjian kontrak, KYC perusahaan). HR Admin perusahaan tersebut telah terdaftar di sistem Payana dengan role `hr`. |
| **Pos Kondisi** | CompanyVault baru berhasil di-deploy ke Base Sepolia melalui PayrollFactory. Alamat vault terhubung ke profil perusahaan di database. HR Admin perusahaan dapat mengakses vault dan mulai melakukan onboarding karyawan. |
| **Basic Flow** | 1. Owner SaaS mengakses halaman `/owner/dashboard` dan mengklik "Deploy Vault Perusahaan Baru". <br> 2. Sistem menampilkan formulir konfigurasi vault: nama perusahaan klien, alamat wallet HR Admin perusahaan, dan alamat kontrak `EmploymentSBT` yang digunakan. <br> 3. Owner SaaS mengisi dan memverifikasi seluruh parameter konfigurasi. <br> 4. Owner SaaS mengklik "Deploy". Frontend memanggil `PayrollFactory.deployVault(hrAddress, companyName, sbtContract)` menggunakan akun Owner SaaS. <br> 5. Transaksi dikirim ke Base Sepolia. Frontend menampilkan indikator loading dengan pesan "Sedang men-deploy vault ke blockchain...". <br> 6. Setelah transaksi dikonfirmasi, smart contract `PayrollFactory` meng-emit event `VaultDeployed` dengan alamat vault baru. <br> 7. Backend menerima webhook dari Alchemy, mencatat alamat vault baru dan menghubungkannya dengan profil perusahaan di database, serta memberikan akses vault kepada HR Admin perusahaan. <br> 8. Backend mengirimkan notifikasi ke HR Admin perusahaan bahwa vault telah siap digunakan. <br> 9. Frontend menampilkan konfirmasi kepada Owner: "Vault perusahaan [nama perusahaan] berhasil di-deploy. HR Admin dapat mulai menggunakan sistem." |
| **Alternative Flow** | A1. Apabila Owner SaaS ingin mendeploy beberapa vault sekaligus untuk beberapa perusahaan klien, proses dilakukan satu per satu melalui antarmuka yang sama. |
| **Error Flow** | E1. Apabila alamat HR Admin yang dimasukkan tidak terdaftar dalam sistem Payana, backend memvalidasi dan menampilkan pesan "Alamat wallet HR Admin tidak ditemukan dalam sistem. Pastikan HR Admin sudah mendaftarkan akun Payana terlebih dahulu." <br> E2. Apabila perusahaan dengan nama yang sama sudah memiliki vault aktif, backend menampilkan peringatan "Perusahaan dengan nama ini sudah memiliki vault aktif. Konfirmasi apakah Anda ingin membuat vault tambahan untuk perusahaan ini." <br> E3. Apabila transaksi deploy gagal karena parameter tidak valid atau gas tidak cukup, frontend menampilkan pesan kesalahan spesifik dari smart contract dan memungkinkan Owner SaaS untuk mengoreksi parameter dan mencoba ulang. |

---

#### UC-16: HR Lihat Dashboard Vault dan Status Stream

```mermaid
sequenceDiagram
    actor HR as HR Admin
    participant FE as Frontend
    participant CV as CompanyVault
    participant Ponder as Ponder Indexer

    HR->>FE: Buka /hr/vault
    FE->>CV: vaultBalance() — view
    CV-->>FE: Saldo vault (wei)
    FE->>CV: totalFlowRate() — view
    CV-->>FE: Total flow rate semua karyawan
    FE->>Ponder: Query daftar stream aktif + karyawan
    Ponder-->>FE: Data stream per karyawan
    FE->>FE: Hitung burn rate bulanan = totalFlowRate × 2.592.000
    FE->>FE: Hitung estimasi saldo habis
    FE-->>HR: Dashboard vault + proyeksi kas ditampilkan
```

| | |
|-|-|
| **Nama Use Case** | HR Lihat Dashboard Vault dan Status Stream |
| **Deskripsi Singkat** | HR Admin mengakses dashboard terpusat yang menampilkan ringkasan kondisi vault perusahaan secara real-time: saldo IDRX tersedia, total kewajiban stream aktif per detik, daftar karyawan dengan status stream masing-masing, saldo Compliance Vault, dan saldo Severance Vault. |
| **Aktor** | HR Admin |
| **Pre Kondisi** | HR Admin telah login dengan role `hr`. CompanyVault perusahaan telah di-deploy. Terdapat minimal satu karyawan yang telah di-onboarding ke sistem. |
| **Pos Kondisi** | HR Admin mendapatkan gambaran menyeluruh kondisi keuangan vault dan status stream seluruh karyawan aktif dalam satu tampilan terpusat. Tidak ada perubahan state yang terjadi (use case bersifat baca-saja). |
| **Basic Flow** | 1. HR Admin mengakses halaman `/hr/vault` setelah login. <br> 2. Frontend secara paralel mengambil data dari beberapa sumber: saldo vault saat ini dari smart contract on-chain melalui Alchemy, daftar karyawan dan status stream dari database backend, saldo Compliance Vault dan Severance Vault, serta total flow rate aktif (akumulasi seluruh flow rate karyawan per detik). <br> 3. Sistem menampilkan kartu ringkasan di bagian atas: saldo vault tersedia, total pengeluaran stream per bulan, saldo Compliance Vault, dan saldo Severance Vault. <br> 4. Sistem menampilkan tabel daftar karyawan dengan kolom: nama, alamat wallet, besaran gaji bulanan, status stream (aktif/dihentikan), akumulasi gaji yang belum diklaim oleh karyawan, dan tanggal mulai bekerja. <br> 5. HR Admin dapat mengklik nama karyawan untuk melihat detail stream: riwayat klaim EWA, histori transaksi on-chain, dan informasi vesting aktif (jika ada). <br> 6. Sistem memperbarui saldo akumulasi karyawan secara real-time menggunakan kalkulasi berbasis `block.timestamp` tanpa perlu refresh halaman. |
| **Alternative Flow** | A1. Apabila saldo vault mendekati batas minimum operasional (kurang dari dana stream 7 hari ke depan), sistem menampilkan peringatan otomatis di bagian atas dashboard: "Peringatan: Saldo vault akan habis dalam [X] hari. Segera lakukan deposit." <br> A2. HR Admin dapat memfilter daftar karyawan berdasarkan status stream (aktif, dihentikan, atau semua) dan mengurutkan berdasarkan berbagai kolom untuk kemudahan navigasi. |
| **Error Flow** | E1. Apabila vault sedang dalam kondisi dibekukan (`VaultFrozen`), sistem menampilkan banner peringatan merah di bagian atas dashboard: "Vault sedang dalam kondisi dibekukan. Seluruh operasi ditangguhkan hingga pembekuan dicabut oleh administrator." <br> E2. Apabila koneksi ke node Alchemy mengalami gangguan sehingga data on-chain tidak dapat diambil, sistem menampilkan data dari cache database terakhir yang tersimpan dengan keterangan "Data mungkin tidak mencerminkan kondisi terbaru on-chain. Koneksi blockchain sedang terganggu." <br> E3. Apabila HR Admin mencoba mengakses vault perusahaan lain yang bukan miliknya, backend memvalidasi kepemilikan dan mengembalikan error `403 Forbidden`. |

---

#### UC-20: Owner SaaS Konfigurasi dan Klaim Platform Fee

```mermaid
sequenceDiagram
    actor OWNER as Owner SaaS
    participant FE as Frontend
    participant PF as PayrollFactory
    participant Ponder as Ponder Indexer

    OWNER->>FE: Buka tab "Monetisasi" di /owner
    FE->>PF: platformFeeBps() — baca konfigurasi saat ini
    PF-->>FE: feeBps aktif
    OWNER->>FE: Input feeBps baru (maks 100 bps = 1%)
    FE->>PF: setPlatformFee(feeBps)
    PF->>PF: Validasi SUPERADMIN_ROLE
    PF->>PF: Validasi FeeTooHigh (feeBps <= MAX_FEE)
    PF->>PF: platformFeeBps = feeBps
    PF-->>FE: event PlatformFeeUpdated(feeBps)
    FE->>Ponder: Query histori PlatformFeePaid events
    Ponder-->>FE: Total fee terkumpul per periode
    FE-->>OWNER: Dashboard pendapatan platform diperbarui
```

| | |
|-|-|
| **Nama Use Case** | Owner SaaS Konfigurasi dan Klaim Platform Fee |
| **Deskripsi Singkat** | Owner SaaS menetapkan besaran platform fee yang akan dipotong dari setiap klaim gaji seluruh karyawan di platform, lalu memantau dan menarik akumulasi fee ke alamat treasury. |
| **Aktor** | Owner SaaS |
| **Pre Kondisi** | Owner SaaS telah login dengan role `owner`. Minimal satu CompanyVault aktif telah di-deploy melalui `PayrollFactory`. |
| **Pos Kondisi** | `platformFeeBps` terkonfigurasi di `PayrollFactory`. Setiap klaim gaji berikutnya secara otomatis memotong fee ke `protocolTreasury`. Owner dapat melihat akumulasi fee di dashboard. |
| **Basic Flow** | 1. Owner SaaS membuka halaman `/owner` dan memilih tab "Monetisasi Platform". <br> 2. Owner memasukkan nilai `platformFeeBps` yang diinginkan (contoh: 10 bps = 0,1%) dan mengklik "Simpan Konfigurasi". <br> 3. Frontend mengirim transaksi `PayrollFactory.setPlatformFee(platformFeeBps)` melalui dompet Owner. <br> 4. Kontrak memvalidasi bahwa pemanggil memiliki `SUPERADMIN_ROLE` dan bahwa nilai `platformFeeBps` tidak melebihi batas maksimum. <br> 5. Nilai `platformFeeBps` tersimpan on-chain dan event `PlatformFeeUpdated` diterbitkan. <br> 6. Ponder mengindeks event tersebut; dashboard Owner memperbarui tampilan konfigurasi fee aktif. <br> 7. Owner memilih tab "Pendapatan" untuk melihat akumulasi `PlatformFeePaid` events yang diindeks Ponder: total fee terkumpul per bulan, per vault, dan keseluruhan. <br> 8. Owner menarik saldo IDRX dari alamat `protocolTreasury` menggunakan dompet yang terhubung. |
| **Alternative Flow** | A1. Apabila Owner ingin menonaktifkan platform fee sementara (misalnya untuk periode promosi), Owner dapat menetapkan `platformFeeBps = 0`. Kontrak melewati langkah pemotongan fee tanpa overhead gas tambahan. <br> A2. Owner dapat mengubah alamat `protocolTreasury` ke alamat multisig untuk keamanan dana yang lebih baik melalui fungsi `setProtocolTreasury()`. |
| **Error Flow** | E1. Apabila nilai `platformFeeBps` melebihi batas maksimum yang dikonfigurasi di kontrak (misalnya 100 bps = 1%), transaksi dibalik dengan `FeeTooHigh`. Frontend menampilkan "Nilai fee melebihi batas maksimum yang diizinkan (1%)." <br> E2. Apabila pemanggil tidak memiliki `SUPERADMIN_ROLE`, kontrak menolak dengan `Unauthorized`. Frontend menampilkan "Hanya Owner SaaS yang dapat mengubah konfigurasi platform fee." |

---

#### UC-21: Registrasi & Persetujuan Akun

> **Catatan:** UC ini ditambahkan untuk menutup celah nomor use case — FR-PAYANA-107/108/109
> ("Kelompok B: Manajemen Akun dan Autentikasi") sebelumnya tidak memiliki UC yang sesuai; alur
> registrasinya sempat tercampur (dan sebagian tumpang tindih secara keliru) dengan UC-02.
> Nomor UC-21 dipilih agar tidak menggeser nomor UC-01 s.d. UC-20 yang sudah dirujuk di tempat
> lain pada dokumen ini maupun di DPPL/PDHUPL. Mencakup DUA alur registrasi: **company** (oleh
> calon HR Admin, ditinjau Owner SaaS) dan **employee** (invitation-only, lihat Error Flow E3
> s.d. E6 — perubahan arsitektur yang menutup celah keamanan "pilih perusahaan bebas").

```mermaid
sequenceDiagram
    actor OWNER as Owner SaaS
    actor HR as HR Admin
    actor EMP as Karyawan
    participant FE as Frontend
    participant BE as Backend

    Note over HR,BE: Registrasi Company
    HR->>BE: POST /registration/request {address, email, nama, type:"company", npwp, nib, directorName, directorNik, deedUrl}
    BE->>BE: Validasi format NPWP (15/16 digit)/NIB (13 digit)/NIK Direktur (16 digit)
    BE-->>HR: Status pending
    OWNER->>FE: Buka /owner — lihat antrian pendaftaran company
    FE->>BE: GET /registration/pending?type=company
    BE-->>FE: Daftar permohonan company
    OWNER->>BE: PATCH /registration/:address/approve
    BE-->>OWNER: Status approved
    OWNER-->>HR: Notifikasi disetujui, lanjut ke UC-02

    Note over HR,EMP: Registrasi Employee (invitation-only)
    HR->>BE: POST /invitations {name?, email?}
    BE-->>HR: inviteToken unik (berlaku 7 hari, sekali pakai)
    HR-->>EMP: Bagikan link undangan berisi inviteToken
    EMP->>BE: POST /registration/request {address, type:"employee", inviteToken}
    BE->>BE: Validasi token (belum dipakai, belum kedaluwarsa)
    BE->>BE: Resolve hrAddress dari token (BUKAN dari input employee)
    BE-->>EMP: Status pending
    HR->>BE: GET /registration/pending/hr/:hrAddress
    BE-->>HR: Daftar permohonan employee miliknya
    HR->>BE: PATCH /registration/:address/approve
    BE-->>HR: Status approved
```

| | |
|-|-|
| **Nama Use Case** | Registrasi & Persetujuan Akun |
| **Deskripsi Singkat** | Calon HR Admin mengajukan profil perusahaan (NPWP, NIB, data direktur, akta) untuk ditinjau dan disetujui Owner SaaS; HR Admin yang sudah aktif membuat token undangan sekali pakai agar karyawannya dapat mendaftar tanpa bisa memilih perusahaan lain secara bebas, lalu menyetujui pendaftaran karyawan tersebut. |
| **Aktor** | Owner SaaS / HR Admin / Karyawan |
| **Pre Kondisi** | Untuk registrasi company: pemohon memiliki dompet Ethereum yang belum terdaftar. Untuk registrasi employee: HR Admin sudah memiliki akun aktif dan telah membuat `inviteToken` melalui `POST /invitations`. |
| **Pos Kondisi** | Company: status permohonan `approved`/`rejected` tersimpan; jika `approved`, HR Admin dapat melanjutkan ke UC-02. Employee: status permohonan `approved` tersimpan dengan `hrAddress` yang benar (di-resolve dari token, bukan input bebas); `inviteToken` yang dipakai berstatus `used` dan tidak dapat dipakai ulang. |
| **Basic Flow** | **Company:** 1. Calon HR Admin membuka halaman registrasi dan mengisi `{address, email, nama, npwp, nib, directorName, directorNik, deedUrl}`. <br> 2. Backend memvalidasi format NPWP (15 digit format lama, atau 16 digit berbasis NIK), NIB (tepat 13 digit), dan NIK Direktur (tepat 16 digit) apabila field-field tersebut diisi. <br> 3. Permohonan tersimpan berstatus `pending`. <br> 4. Owner SaaS membuka `/owner`, meninjau antrian `GET /registration/pending?type=company`. <br> 5. Owner menyetujui via `PATCH /registration/:address/approve` — status berubah `approved`, HR Admin dapat melanjutkan ke UC-02 (Deploy Vault). <br> **Employee (invitation-only):** 1. HR Admin yang sudah aktif membuka `/hr/employees`, membuat token undangan baru via `POST /invitations`. <br> 2. Sistem menghasilkan `inviteToken` unik, berlaku 7 hari, sekali pakai; `hrAddress` pada token diisi otomatis dari HR Admin pembuat (bukan input bebas). <br> 3. HR Admin membagikan link undangan (berisi `inviteToken`) kepada calon karyawan di luar sistem. <br> 4. Calon karyawan membuka `/onboarding?invite=<token>` dan mengirim `POST /registration/request {address, type:"employee", inviteToken}`. <br> 5. Backend memvalidasi token (ada, belum dipakai, belum kedaluwarsa) dan me-resolve `hrAddress` dari token tersebut — tidak pernah menerima `hrAddress` langsung dari input karyawan. <br> 6. Permohonan tersimpan `pending` dengan `hrAddress` yang benar; token ditandai `used`. <br> 7. HR Admin meninjau `GET /registration/pending/hr/:hrAddress` dan menyetujui via `PATCH /registration/:address/approve`. |
| **Alternative Flow** | A1. HR Admin dapat mencabut (`PATCH /invitations/:token/revoke`) token yang belum dipakai sebelum dibagikan ke karyawan yang salah. <br> A2. Field NPWP/NIB/directorName/directorNik/deedUrl bersifat opsional saat submit awal — dapat dilengkapi kemudian sebelum disetujui Owner, namun jika diisi harus lolos validasi format. |
| **Error Flow** | E1. Apabila NPWP yang diisi bukan 15 atau 16 digit (setelah tanda baca dibersihkan), backend mengembalikan `400 BAD_REQUEST`. <br> E2. Apabila NIB yang diisi bukan 13 digit, backend mengembalikan `400 BAD_REQUEST`. <br> E3. Apabila registrasi employee dikirim **tanpa** `inviteToken`, backend mengembalikan `400 BAD_REQUEST` — ini menutup celah keamanan sebelumnya di mana karyawan bisa memilih perusahaan mana pun dari dropdown tak terfilter. <br> E4. Apabila `inviteToken` sudah pernah dipakai karyawan lain, backend mengembalikan `409 Conflict`. <br> E5. Apabila `inviteToken` sudah dicabut (revoked) atau kedaluwarsa (>7 hari), backend mengembalikan `409 Conflict`. <br> E6. Apabila pihak yang bukan Owner SaaS dan bukan HR Admin pemilik `hrAddress` terkait mencoba menyetujui/menolak suatu permohonan, backend mengembalikan `403 Forbidden`. |

---

#### UC-22: Reimburse Karyawan & HR

```mermaid
sequenceDiagram
    actor EMP as Karyawan
    actor HR as HR Admin
    participant BE as Backend /reimburse

    EMP->>BE: POST /reimburse {hrAddress, category, amount, description, receiptUrl?}
    BE-->>EMP: Klaim tersimpan, status pending
    HR->>BE: GET /reimburse/hr/:hrAddress
    BE-->>HR: Daftar klaim masuk
    HR->>HR: Transfer IDRX manual ke karyawan (di luar sistem)
    HR->>BE: PATCH /reimburse/:id/approve {txHash}
    BE->>BE: verifyIdrxTransfer(txHash, employee, amount)
    BE-->>HR: Status approved
```

| | |
|-|-|
| **Nama Use Case** | Reimburse Karyawan & HR |
| **Deskripsi Singkat** | Karyawan mengajukan klaim penggantian biaya operasional kepada HR; HR meninjau, mentransfer IDRX secara manual, lalu mencatat bukti transfer untuk disetujui sistem. |
| **Aktor** | Karyawan / HR Admin |
| **Pre Kondisi** | Karyawan memiliki stream aktif di bawah `hrAddress` yang dituju. |
| **Pos Kondisi** | Klaim tersimpan dengan status `pending`/`approved`/`rejected`; klaim yang `approved` memiliki `txHash` transfer yang telah diverifikasi benar-benar terjadi on-chain sejumlah klaim. |
| **Basic Flow** | 1. Karyawan membuka `/employee/reimburse`, mengisi kategori, jumlah, keterangan, dan bukti (opsional). <br> 2. Klaim tersimpan `pending`, muncul di `GET /reimburse/me` (karyawan) dan `GET /reimburse/hr/:hrAddress` (HR). <br> 3. HR meninjau di `/hr/reimburse`, mentransfer IDRX ke karyawan secara manual melalui wallet-nya sendiri (di luar sistem). <br> 4. HR mencatat `txHash` transfer tersebut via `PATCH /reimburse/:id/approve`. <br> 5. Backend memverifikasi `txHash` benar-benar transfer IDRX sejumlah `amount` klaim ke alamat karyawan; jika valid, status berubah `approved` dan karyawan menerima notifikasi. |
| **Alternative Flow** | A1. HR dapat menolak klaim (`PATCH /reimburse/:id/reject`) tanpa memerlukan `txHash`. |
| **Error Flow** | E1. Apabila `txHash` yang disertakan bukan transfer IDRX yang sesuai (jumlah/penerima tidak cocok), backend mengembalikan `400 TRANSFER_NOT_VERIFIED`. <br> E2. Apabila HR yang bukan pemilik `hrAddress` klaim mencoba approve/reject, backend mengembalikan `403 Forbidden`. <br> E3. Apabila klaim yang sudah direview (bukan `pending`) ditinjau ulang, backend mengembalikan `409 ALREADY_REVIEWED`. |

---

#### UC-23: Bounty & Tip

```mermaid
sequenceDiagram
    actor HR as HR Admin
    actor EMP as Karyawan

    participant BE as Backend /bounty

    HR->>BE: POST /bounty {title, description, rewardIdrx, quota}
    BE-->>HR: Bounty tersimpan, status open
    EMP->>BE: POST /bounty/:id/claim
    BE-->>EMP: Klaim tercatat
    HR->>HR: Transfer IDRX manual ke karyawan
    HR->>BE: PATCH /bounty/claim/:id/paid {txHash}
    BE-->>HR: Status paid
    EMP->>BE: POST /bounty/tip {toAddress, amount, txHash}
    BE-->>EMP: Tip tercatat di riwayat kedua pihak
```

| | |
|-|-|
| **Nama Use Case** | Bounty & Tip |
| **Deskripsi Singkat** | HR membuat program insentif berbasis tugas (bounty) yang dapat diklaim karyawan; karyawan juga dapat saling mengirim tip IDRX peer-to-peer, keduanya tercatat di sistem dengan verifikasi transfer nyata. |
| **Aktor** | HR Admin / Karyawan |
| **Pre Kondisi** | HR memiliki akun aktif untuk membuat bounty; karyawan memiliki stream aktif untuk mengklaim. |
| **Pos Kondisi** | Bounty berstatus `open`/`closed` sesuai kuota; klaim yang dibayar memiliki `txHash` terverifikasi; tip tercatat dan terlihat oleh pengirim maupun penerima. |
| **Basic Flow** | 1. HR membuat bounty di `/hr/bounty` dengan judul, deskripsi, hadiah per klaim, dan kuota. <br> 2. Karyawan melihat daftar bounty terbuka di `/employee/bounty` dan mengklaim salah satu. <br> 3. HR menyetujui klaim, mentransfer IDRX secara manual, lalu mencatat `txHash` via `PATCH /bounty/claim/:id/paid` — backend memverifikasi transfer nyata sejumlah hadiah. <br> 4. Begitu jumlah klaim yang dibayar mencapai kuota, bounty otomatis `closed`. <br> 5. Karyawan dapat mengirim tip ke karyawan lain via `POST /bounty/tip` menyertakan `txHash` transfer yang sudah dilakukan sendiri. |
| **Alternative Flow** | A1. HR dapat menutup bounty secara manual sebelum kuota tercapai. |
| **Error Flow** | E1. Apabila karyawan mengklaim bounty yang sudah `closed` (kuota penuh), backend mengembalikan `409 BOUNTY_CLOSED`. |

---

#### UC-24: Notifikasi

```mermaid
sequenceDiagram
    actor U as Pengguna (HR/Karyawan)
    participant BE as Backend /notifications

    Note over BE: Notifikasi diterbitkan otomatis oleh backend pada peristiwa signifikan
    U->>BE: GET /notifications
    BE-->>U: Maks 50 notifikasi terbaru, urut createdAt desc
    U->>BE: PATCH /notifications/:id/read
    BE-->>U: read = true
    U->>BE: PATCH /notifications/read-all
    BE-->>U: Seluruh notifikasi read = true
```

| | |
|-|-|
| **Nama Use Case** | Notifikasi |
| **Deskripsi Singkat** | Pengguna menerima dan meninjau notifikasi peristiwa signifikan yang relevan bagi dirinya (mis. reimbursement disetujui), serta menandai satu atau seluruh notifikasi sebagai telah dibaca. |
| **Aktor** | HR Admin / Karyawan |
| **Pre Kondisi** | Pengguna telah login. |
| **Pos Kondisi** | Notifikasi yang ditandai berstatus `read = true`. |
| **Basic Flow** | 1. Pengguna membuka daftar notifikasi; sistem menampilkan maksimum 50 notifikasi terbaru miliknya, terurut dari yang paling baru. <br> 2. Pengguna dapat menandai satu notifikasi sebagai telah dibaca, atau seluruhnya sekaligus. |
| **Alternative Flow** | — |
| **Error Flow** | E1. Apabila pengguna mencoba menandai notifikasi milik pengguna lain sebagai telah dibaca, backend mengembalikan `403 Forbidden`. <br> E2. Apabila `id` notifikasi tidak ditemukan, backend mengembalikan `404 Not Found`. |

---

#### UC-25: Slip Gaji (Payslip)

```mermaid
sequenceDiagram
    actor EMP as Karyawan
    participant BE as Backend /payslip
    participant PO as Ponder (salary_claim)

    EMP->>BE: GET /payslip/:claimId
    BE->>PO: SELECT salary_claim WHERE id = claimId
    PO-->>BE: accrued, netToEmployee, toCompliance, toSeverance, kasbonRepaid
    BE-->>EMP: Breakdown lengkap slip gaji
```

| | |
|-|-|
| **Nama Use Case** | Slip Gaji (Payslip) |
| **Deskripsi Singkat** | Karyawan (atau HR terkait) melihat rincian breakdown satu transaksi klaim gaji tertentu dalam format slip gaji digital. |
| **Aktor** | Karyawan / HR Admin |
| **Pre Kondisi** | `claimId` yang diminta merupakan klaim gaji yang benar-benar sudah terjadi dan terindeks Ponder. |
| **Pos Kondisi** | — (operasi baca saja). |
| **Basic Flow** | 1. Karyawan (atau HR-nya) membuka slip gaji suatu klaim melalui `claimId`. <br> 2. Sistem mengambil data `salary_claim` terindeks Ponder dan menghitung breakdown: gaji bruto, potongan platform fee, cicilan kasbon, pajak/BPJS, severance, dan gaji bersih. |
| **Alternative Flow** | — |
| **Error Flow** | E1. Apabila `claimId` tidak ditemukan, backend mengembalikan `404 Not Found`. <br> E2. Apabila pemohon bukan karyawan pemilik klaim maupun HR terkait, backend mengembalikan `403 Forbidden`. |

---

#### UC-26: Bukti Potong Pajak (Tax Cert)

```mermaid
sequenceDiagram
    actor EMP as Karyawan
    actor HR as HR Admin
    participant BE as Backend /tax-cert
    participant PO as Ponder (salary_claim)

    EMP->>BE: GET /tax-cert/:year
    BE->>PO: SUM salary_claim WHERE employee, tahun
    PO-->>BE: Agregat tahunan
    BE-->>EMP: totalGrossAccrued, totalCompliance, totalSeverance, totalNet
    HR->>BE: GET /tax-cert/hr/:employee/:year
    BE-->>HR: Agregat sama (jika HR berwenang)
```

| | |
|-|-|
| **Nama Use Case** | Bukti Potong Pajak (Tax Cert) |
| **Deskripsi Singkat** | Karyawan melihat agregasi tahunan gaji dan potongan untuk keperluan pelaporan SPT pribadi; HR dapat melihat agregasi milik karyawan di perusahaannya sendiri. |
| **Aktor** | Karyawan / HR Admin |
| **Pre Kondisi** | Tahun pajak yang diminta berada dalam rentang valid (2020–2100). |
| **Pos Kondisi** | — (operasi baca saja). |
| **Basic Flow** | 1. Karyawan membuka `/employee/tax-cert`, memilih tahun pajak. <br> 2. Sistem mengagregasi seluruh `salary_claim` karyawan tersebut pada tahun itu: total gaji bruto, total kepatuhan, total severance, total bersih. <br> 3. HR dapat melihat agregasi yang sama untuk karyawan di perusahaannya via `GET /tax-cert/hr/:employee/:year`. |
| **Alternative Flow** | — |
| **Error Flow** | E1. Apabila tahun di luar rentang 2020–2100, backend mengembalikan `400 Bad Request`. <br> E2. Apabila HR yang meminta bukan `hr_authority` dari karyawan tersebut, backend mengembalikan `403 Forbidden`. |

---

#### UC-27: Surat Keterangan Kerja

```mermaid
sequenceDiagram
    actor EMP as Karyawan
    actor HR as HR Admin
    participant BE as Backend /employment-letter

    EMP->>BE: POST /employment-letter/request {hrAddress, purpose}
    BE->>BE: Validasi purpose (whitelist) & stream Active
    BE-->>EMP: Status pending
    HR->>BE: PATCH /employment-letter/:id/approve
    BE-->>HR: Status approved
    EMP->>BE: GET /employment-letter/:id/document
    BE-->>EMP: Dokumen surat (hanya jika approved)
```

| | |
|-|-|
| **Nama Use Case** | Surat Keterangan Kerja |
| **Deskripsi Singkat** | Karyawan mengajukan permohonan surat keterangan kerja dengan tujuan tertentu (KPR, Kredit, Visa, dst), ditinjau HR, dan diunduh setelah disetujui. |
| **Aktor** | Karyawan / HR Admin |
| **Pre Kondisi** | Karyawan memiliki stream berstatus `Active` di bawah `hrAddress` yang dituju. |
| **Pos Kondisi** | Permohonan berstatus `pending`/`approved`/`rejected`; dokumen hanya dapat diunduh setelah `approved`. |
| **Basic Flow** | 1. Karyawan mengajukan permohonan dengan memilih tujuan penggunaan dari daftar tetap. <br> 2. Sistem memvalidasi tujuan (whitelist) dan bahwa karyawan benar-benar punya stream aktif di perusahaan tsb. <br> 3. HR meninjau dan menyetujui/menolak permohonan. <br> 4. Setelah disetujui, karyawan dapat mengunduh dokumen surat. |
| **Alternative Flow** | — |
| **Error Flow** | E1. Apabila tujuan di luar whitelist, backend mengembalikan `400 Bad Request`. <br> E2. Apabila karyawan tidak memiliki stream aktif di `hrAddress` yang dituju, backend mengembalikan `400 NOT_EMPLOYEE`. <br> E3. Apabila dokumen diminta sebelum disetujui, backend mengembalikan `400 NOT_APPROVED`. |

---

#### UC-28: Direktori Karyawan

```mermaid
sequenceDiagram
    actor HR as HR Admin
    actor EMP as Karyawan
    participant BE as Backend /directory

    HR->>BE: GET /directory/:hrAddress
    BE-->>HR: Daftar karyawan (nama, departemen, jabatan, status, flowRate)
    HR->>BE: PATCH /directory/:address {department, position}
    BE-->>HR: Tersimpan
    EMP->>BE: GET /directory/me
    BE-->>EMP: Profil sendiri, mencerminkan perubahan HR
```

| | |
|-|-|
| **Nama Use Case** | Direktori Karyawan |
| **Deskripsi Singkat** | HR melihat direktori seluruh karyawan perusahaannya dan menetapkan/memperbarui departemen serta jabatan masing-masing karyawan. |
| **Aktor** | HR Admin |
| **Pre Kondisi** | HR memiliki akun aktif dengan `CompanyVault` terdaftar. |
| **Pos Kondisi** | Data departemen/jabatan karyawan ter-update dan tercermin saat karyawan melihat profilnya sendiri. |
| **Basic Flow** | 1. HR membuka `/hr/directory`, melihat daftar seluruh karyawannya. <br> 2. HR memperbarui departemen/jabatan seorang karyawan melalui `PATCH /directory/:address`. <br> 3. Karyawan yang bersangkutan melihat perubahan tersebut tercermin di `GET /directory/me`. |
| **Alternative Flow** | — |
| **Error Flow** | E1. Apabila HR meminta direktori `hrAddress` milik perusahaan lain, backend mengembalikan `403 Forbidden`. |

---

#### UC-29: Pengaturan Perusahaan (Branding)

```mermaid
sequenceDiagram
    actor HR as HR Admin
    participant BE as Backend /company-settings

    HR->>BE: GET /company-settings
    alt belum pernah disimpan
        BE-->>HR: null
    else sudah ada
        BE-->>HR: {name, country, logoUrl, ewaLimitBps, yieldRateBps, legalAddress}
    end
    HR->>BE: PUT /company-settings {name, country, logoUrl, ewaLimitBps, yieldRateBps, legalAddress}
    BE->>BE: Upsert by hrAddress
    BE-->>HR: Tersimpan
    HR->>BE: GET /company-settings
    BE-->>HR: Mencerminkan nilai yang baru disimpan
```

| | |
|-|-|
| **Nama Use Case** | Pengaturan Perusahaan (Branding) |
| **Deskripsi Singkat** | HR menyimpan dan memperbarui preferensi branding perusahaannya (nama tampilan, negara, logo, batas EWA, tarif yield, alamat legal) — murni kosmetik, tidak memengaruhi logika keuangan on-chain. |
| **Aktor** | HR Admin |
| **Pre Kondisi** | HR telah login dengan role `hr`. |
| **Pos Kondisi** | Pengaturan tersimpan (insert atau update) dan terbaca kembali persis sesuai yang disimpan. |
| **Basic Flow** | 1. HR membuka `/hr/settings`. <br> 2. Sistem memanggil `GET /company-settings` — mengembalikan `null` jika HR belum pernah menyimpan pengaturan sebelumnya. <br> 3. HR mengisi/mengubah nama tampilan, negara, URL logo, batas EWA, tarif yield, dan alamat legal, lalu menyimpan. <br> 4. Frontend memanggil `PUT /company-settings` — backend melakukan upsert (insert bila belum ada baris, update bila sudah ada) berdasarkan `hrAddress` caller. <br> 5. Pengaturan yang baru disimpan langsung tercermin saat `GET /company-settings` dipanggil kembali. |
| **Alternative Flow** | — |
| **Error Flow** | — (seluruh field opsional; tidak ada validasi format khusus pada pengaturan branding). |

---

#### UC-30: Deteksi Anomali & Tinjauan Keamanan Vault

```mermaid
sequenceDiagram
    participant CV as CompanyVault (on-chain)
    participant PD as Ponder Indexer
    participant AD as Backend anomalyDetector.ts (cron/2 menit)
    participant DB as PostgreSQL (app.anomaly_alerts)
    actor OWNER as Owner SaaS

    CV-->>PD: event VaultWithdrawn / RoleGranted
    PD->>PD: index ke vault_withdrawal / role_change
    AD->>PD: query event baru sejak siklus terakhir
    AD->>AD: evaluasi pola (jumlah/histori, peran, frekuensi)
    alt anomali terdeteksi
        AD->>DB: insert anomaly_alerts (type, severity, detail, txHash)
        AD-->>OWNER: broadcast notifikasi in-app (SECURITY_ANOMALY)
    end
    OWNER->>AD: GET /security/alerts
    AD-->>OWNER: daftar alert (belum ditangani lebih dulu)
    OWNER->>AD: PATCH /security/alerts/:id/resolve
    AD->>DB: update resolved=true
    AD-->>OWNER: {ok: true}
```

| | |
|-|-|
| **Nama Use Case** | Deteksi Anomali & Tinjauan Keamanan Vault |
| **Deskripsi Singkat** | Sistem memantau event on-chain setiap `CompanyVault` secara otomatis untuk pola yang konsisten dengan wallet HR yang dikompromikan (penarikan tidak wajar, perubahan peran mendadak, aktivitas beruntun), dan Owner SaaS meninjau serta menandai selesai setiap temuan melalui `/owner/security`. |
| **Aktor** | Owner SaaS (peninjau); sistem (`anomalyDetector.ts`) sebagai pendeteksi otomatis. |
| **Pre Kondisi** | Owner SaaS telah login dengan role `owner`. Layanan `anomalyDetector.ts` berjalan sebagai background cron di backend. |
| **Pos Kondisi** | Alert keamanan yang relevan tersimpan di `app.anomaly_alerts` dan dapat ditinjau; alert yang sudah ditindaklanjuti Owner ditandai `resolved = true`. |
| **Basic Flow** | 1. `CompanyVault` menerbitkan event `VaultWithdrawn` atau `RoleGranted` (baik dari aktivitas normal maupun aktivitas mencurigakan) — event ini terjadi independen dari use case ini. <br> 2. Ponder mengindeks event tersebut ke tabel `vault_withdrawal`/`role_change`. <br> 3. Setiap 2 menit, `anomalyDetector.ts` memeriksa event baru sejak siklus sebelumnya untuk masing-masing vault. <br> 4. Sistem mengevaluasi tiga pola (FR-PAYANA-1901/1902/1903): penarikan tidak wajar, peran tak terduga, dan aktivitas beruntun. <br> 5. Untuk setiap anomali yang terdeteksi, sistem menyimpan baris di `app.anomaly_alerts` (jenis, tingkat keparahan, detail, tautan transaksi) dan mendorong notifikasi in-app real-time ke Owner SaaS. <br> 6. Owner SaaS membuka `/owner/security`, melihat daftar alert dengan yang belum ditangani ditampilkan lebih dulu. <br> 7. Owner SaaS meninjau detail alert (termasuk tautan ke BaseScan untuk transaksi terkait) dan mengklik "Tandai Selesai" setelah menindaklanjuti (investigasi manual, kontak HR, dsb. — di luar sistem). <br> 8. Sistem memperbarui alert menjadi `resolved = true` dan mencatat waktu penyelesaian. |
| **Alternative Flow** | A1. Owner SaaS dapat beralih ke tab "Semua" untuk melihat riwayat lengkap termasuk alert yang sudah ditandai selesai, bukan hanya yang aktif. |
| **Error Flow** | E1. Apabila pemanggil `GET`/`PATCH /security/alerts` bukan Owner SaaS, sistem menolak dengan `403 Forbidden`. <br> E2. Apabila `id` alert pada `PATCH /security/alerts/:id/resolve` tidak ditemukan, sistem mengembalikan `404 Not Found`. <br> E3. Apabila siklus pemeriksaan gagal (mis. RPC/database sementara tidak tersedia), sistem mencatat galat ke log dan mencoba lagi pada siklus berikutnya tanpa menghentikan layanan secara keseluruhan. |

> **Catatan validasi:** Use case ini divalidasi dengan simulasi serangan nyata terhadap vault demo di Base Sepolia (`payroll-web3-saas/testing-scripts/attacker-sim.mjs`), bukan hanya pengujian unit — lihat PDHUPL_v2.md KU-32 untuk detail eksekusi dan bukti transaksi.

---

### 3.4 Kebutuhan Non-Fungsional

#### 3.4.1 Performance

ID Requirement : NFR-PAYANA-01
Deskripsi      : Response time API endpoint backend harus ≤ 500ms pada 99th percentile (P99) di bawah beban 50–100 concurrent users. **Status validasi (2026-06-25):** target awal dokumen ini ("≤500ms P99 @ 1.000 concurrent users, diukur via Datadog APM") tidak pernah benar-benar divalidasi dan Datadog tidak pernah diintegrasikan ke sistem — skala 1.000 concurrent juga tidak realistis diuji terhadap testnet publik Base Sepolia/Alchemy free-tier untuk keperluan skripsi. Stress test aktual dilakukan menggunakan k6 (50→100 concurrent users, ramping, ~2 menit) dengan hasil diukur via dashboard Grafana + InfluxDB (lihat `stress-test/README.md`): `GET /companies` (Ponder) P99 = 10,7ms (lulus jauh di bawah threshold); `POST /auth/login` P99 = 729ms dan `GET /compliance/summary/:hr` P99 = 799ms (keduanya **melebihi** threshold 500ms pada skala 100 concurrent, meski error rate tetap 0% — backend tidak gagal, hanya lebih lambat dari target awal pada deployment single-instance tanpa horizontal scaling/connection pooling). Threshold 500ms P99 dipertahankan sebagai target desain jangka panjang, namun pada kondisi MVP saat ini (single-instance, tanpa caching/scaling) baru tervalidasi tercapai untuk endpoint baca publik (Ponder); endpoint yang melibatkan verifikasi JWT + query database (`/auth/login`, `/compliance/*`) memerlukan optimasi lebih lanjut (connection pooling, caching sesi) sebelum threshold ini realistis tercapai di skala >50 concurrent users. `/bundler/relay` sengaja tidak diikutkan dalam stress test karena mengirim transaksi nyata ke Base Sepolia via Paymaster — lihat `stress-test/README.md` untuk justifikasi.
Rasional       : Dashboard HR dan karyawan menampilkan data gaji secara real-time. Respons lambat mengganggu kepercayaan pengguna terhadap platform, terutama saat karyawan memverifikasi saldo gaji terakumulasi.

ID Requirement : NFR-PAYANA-02
Deskripsi      : Waktu end-to-end proses klaim gaji (EWA) — mulai pengguna menekan tombol "Tarik Gaji" hingga konfirmasi transaksi diterima dari jaringan Base — harus selesai dalam ≤ 5 detik pada 95th percentile (P95).
Rasional       : Base Blockchain memiliki block finality optimistik sekitar 2 detik. Target 5 detik mencakup overhead relay UserOperation ERC-4337 melalui Pimlico Bundler dan konfirmasi webhook Alchemy.

ID Requirement : NFR-PAYANA-03
Deskripsi      : Ponder blockchain indexer harus mampu memproses dan menyimpan event dari smart contract ke PostgreSQL dalam ≤ 500ms setelah event diemit pada blok yang terkonfirmasi.
Rasional       : Dashboard real-time karyawan bergantung sepenuhnya pada data yang diindeks oleh Ponder. Lag indexer lebih dari 500ms akan menyebabkan tampilan saldo tidak konsisten dengan kondisi on-chain.

ID Requirement : NFR-PAYANA-04
Deskripsi      : Waktu aktivasi Work ID karyawan baru harus ≤ 3 menit sejak HR Admin mengkonfirmasi onboarding hingga event EmploymentCertified terdeteksi oleh Ponder indexer.
Rasional       : Proses melibatkan tiga tahap berurutan: persetujuan backend → eksekusi startStream on-chain → mint SBT. Target 3 menit mengakomodasi fluktuasi normal block time Base Sepolia.

ID Requirement : NFR-PAYANA-05
Deskripsi      : Uptime platform harus minimal 99,5% dalam periode rolling 30 hari, setara dengan downtime tidak lebih dari 3 jam 39 menit per bulan, diukur menggunakan Datadog synthetic monitoring.
Rasional       : Platform payroll bersifat kritikal — karyawan bergantung pada EWA untuk kebutuhan darurat. Downtime lebih dari target dapat menyebabkan kerugian finansial langsung bagi karyawan.

#### 3.4.2 Reliability

ID Requirement : NFR-PAYANA-06
Deskripsi      : Sistem harus memiliki Recovery Time Objective (RTO) ≤ 30 menit dan Recovery Point Objective (RPO) ≤ 5 menit untuk pemulihan dari kegagalan komponen backend atau database off-chain.
Rasional       : Data on-chain (smart contract state) bersifat immutable dan tidak dapat hilang. Namun data off-chain (sesi, profil PII, audit log) harus dipulihkan dengan cepat untuk menghindari gangguan operasional.

ID Requirement : NFR-PAYANA-07
Deskripsi      : Sistem harus mengimplementasikan mekanisme retry otomatis dengan exponential backoff untuk permintaan RPC ke Alchemy yang gagal, dengan maksimal 3 kali percobaan ulang dan fallback ke RPC alternatif jika Alchemy tidak merespons dalam 10 detik. **Status implementasi (2026-06-25):** sebelumnya hanya didokumentasikan di sini tanpa implementasi nyata — `backend/src/services/authz.ts` (`isHr()`, `canViewEmployeeData()`) menelan SETIAP kegagalan RPC (termasuk respons 429 rate-limit yang transien) langsung ke `catch { return false }`, mengubah gangguan infrastruktur sesaat menjadi keputusan otorisasi yang salah ("tidak diizinkan") tanpa pernah mencoba ulang. Sudah diperbaiki: kedua fungsi kini memanggil `readContractWithRetry()` (`backend/src/services/rpcRetry.ts`) yang menerapkan persis seperti dideskripsikan — 3 kali retry dengan backoff eksponensial (200ms/400ms/800ms), lalu fallback ke RPC publik `https://sepolia.base.org` jika RPC utama (Alchemy) tetap gagal. Diverifikasi lewat stress test RPC capacity (lihat `stress-test/README.md`) — hanya dua fungsi ini dan turunannya (`/termination/reason`, `/auth/profile/by-address/:address`, `/bounty/hr/:hrAddress`) yang benar-benar melakukan `eth_call` langsung; seluruh endpoint lain membaca dari Ponder (PostgreSQL terindeks), bukan RPC langsung, sehingga tidak terdampak oleh limit RPC sama sekali.
Rasional       : Ketergantungan pada satu penyedia RPC menimbulkan single point of failure. Mekanisme fallback memastikan operasional HR (deposit, onboarding) tidak terganggu saat terjadi gangguan infrastruktur Alchemy.

#### 3.4.3 Usability

ID Requirement : NFR-PAYANA-08
Deskripsi      : Karyawan harus dapat menyelesaikan proses penarikan gaji (EWA) dalam ≤ 3 interaksi (tap/klik) dari halaman dashboard utama: (1) tap tombol "Tarik Gaji", (2) konfirmasi jumlah, (3) konfirmasi tanda tangan wallet.
Rasional       : Mayoritas karyawan yang menjadi target pengguna tidak memiliki latar belakang teknis blockchain. Alur yang lebih dari 3 langkah berpotensi menyebabkan kebingungan dan tingkat konversi yang rendah.

ID Requirement : NFR-PAYANA-09
Deskripsi      : Seluruh istilah teknis blockchain (wallet, gas fee, transaction hash, smart contract) harus digantikan dengan terminologi yang familiar dalam antarmuka karyawan: "Akun Gaji" (wallet), "Tarik Gaji" (EWA), "Saldo Tersedia" (accrued balance). Istilah teknis hanya boleh muncul di antarmuka HR dan Owner.
Rasional       : Penelitian UX menunjukkan bahwa terminologi asing adalah hambatan utama adopsi aplikasi blockchain oleh pengguna non-teknis.

ID Requirement : NFR-PAYANA-10
Deskripsi      : Antarmuka harus menampilkan saldo gaji terakumulasi yang diperbarui setiap 10 detik tanpa perlu refresh halaman manual, menggunakan mekanisme polling atau WebSocket dari backend.
Rasional       : Mekanisme streaming payment per detik menciptakan ekspektasi pengguna bahwa saldo mereka berubah secara real-time. Pembaruan yang terlalu jarang dapat menyebabkan kebingungan terhadap nilai yang ditampilkan.

ID Requirement : NFR-PAYANA-11
Deskripsi      : Seluruh pesan kesalahan yang ditampilkan kepada pengguna harus menggunakan bahasa Indonesia yang mudah dipahami dengan panduan tindak lanjut yang jelas. Kode error teknis (misalnya custom error Solidity atau kode HTTP) hanya boleh ditampilkan di konsol developer, bukan di antarmuka pengguna.
Rasional       : Pesan seperti "InsufficientVaultBalance" atau "Error 403" tidak bermakna bagi pengguna non-teknis dan dapat menyebabkan frustrasi atau laporan support yang tidak perlu.

#### 3.4.4 Security

ID Requirement : NFR-PAYANA-12
Deskripsi      : Access token JWT harus memiliki masa berlaku 15 menit dan refresh token 7 hari. Setiap refresh token hanya dapat digunakan sekali (single-use via jti tracking di database). Signature JWT harus menggunakan algoritma HS256 dengan secret key minimal 256 bit yang dirotasi setiap 90 hari.
Rasional       : Access token berumur pendek membatasi dampak pencurian token. Refresh token single-use mencegah serangan replay. Rotasi kunci periodik meminimalkan risiko kompromi kunci jangka panjang.

ID Requirement : NFR-PAYANA-13
Deskripsi      : Seluruh data PII karyawan (nama, NIK, nomor telepon) harus dienkripsi menggunakan AES-256-GCM dengan IV unik per enkripsi sebelum disimpan di database PostgreSQL. Nilai plaintext tidak boleh pernah ditulis ke log sistem, file sementara, atau respons API yang tidak terenkripsi.
Rasional       : UU PDP No. 27/2022 mewajibkan perlindungan data pribadi dengan standar keamanan yang memadai. NIK adalah data sensitif yang dapat digunakan untuk pencurian identitas jika terekspos.

ID Requirement : NFR-PAYANA-14
Deskripsi      : Sistem harus membatasi frekuensi klaim gaji melalui relayer backend maksimal 10 permintaan per jam per alamat wallet karyawan, dengan penyimpanan state rate limit di tabel `rate_limits` database. Permintaan yang melebihi batas harus dikembalikan dengan HTTP 429 disertai header Retry-After.
Rasional       : Tanpa pembatasan laju, satu karyawan dapat menguras saldo Paymaster ERC-4337 melalui klaim berulang dalam waktu singkat, mengganggu layanan bagi karyawan lain.

ID Requirement : NFR-PAYANA-15
Deskripsi      : Seluruh event webhook dari Alchemy yang diterima oleh endpoint backend harus divalidasi keasliannya menggunakan HMAC-SHA256 dengan secret key yang dikonfigurasi di variabel lingkungan sebelum diproses. Payload yang tidak memiliki signature valid harus ditolak dengan HTTP 401 dan dicatat di audit log.
Rasional       : Endpoint webhook yang tidak divalidasi dapat dieksploitasi untuk menyuntikkan event palsu, misalnya event konfirmasi pembayaran yang tidak pernah terjadi on-chain.

ID Requirement : NFR-PAYANA-16
Deskripsi      : Smart contract CompanyVault harus mengimplementasikan pola checks-effects-interactions dan menggunakan modifier nonReentrant (OpenZeppelin ReentrancyGuard) pada seluruh fungsi yang melakukan transfer token ERC-20 eksternal, yaitu claimSalary(), withdrawVault(), withdrawCompliance(), executeTermination(), dan claimCliffVest().
Rasional       : Reentrancy adalah vektor serangan paling umum pada smart contract DeFi. Kegagalan mengimplementasikan perlindungan ini pada fungsi yang mentransfer dana dapat menyebabkan pengosongan vault secara tidak sah.

ID Requirement : NFR-PAYANA-19
Deskripsi      : Sistem harus mendeteksi dan memberi peringatan atas pola aktivitas on-chain yang konsisten dengan wallet HR yang dikompromikan (penarikan vault tidak wajar, pemberian peran admin ke alamat tak dikenal, aktivitas sensitif beruntun) dalam siklus tidak lebih dari 2 menit sejak event terjadi, dan mendorong notifikasi ke Owner SaaS. Lihat FR-PAYANA-1901 s.d. 1904 (Kelompok H) untuk kriteria deteksi rinci.
Rasional       : Kontrol akses on-chain (`onlyHR`, `AccessControl`) tidak dapat membedakan pemanggil sah dari penyerang yang telah menguasai kunci privat HR — keduanya menghasilkan transaksi yang valid secara kriptografis. Deteksi anomali berbasis pola perilaku adalah lapisan pertahanan kedua yang independen dari validitas tanda tangan, divalidasi dengan simulasi serangan nyata di Base Sepolia (lihat PDHUPL_v2.md KU-32).

#### 3.4.5 Maintainability

ID Requirement : NFR-PAYANA-17
Deskripsi      : Seluruh fungsi smart contract yang memiliki lebih dari satu kemungkinan kondisi revert harus menggunakan custom error Solidity (bukan string revert) untuk menghemat gas dan memudahkan identifikasi kegagalan. Setiap custom error harus terdokumentasi dalam NatSpec.
Rasional       : Custom error menghemat gas dibandingkan revert string karena tidak menyimpan string karakter di bytecode. Selain itu, custom error memungkinkan frontend menampilkan pesan yang spesifik berdasarkan tipe error.

ID Requirement : NFR-PAYANA-18
Deskripsi      : Seluruh endpoint API backend harus terdokumentasi dalam spesifikasi OpenAPI 3.0 yang diperbarui secara sinkron dengan perubahan kode. Dokumentasi harus mencakup semua parameter, skema request/response, dan kode status HTTP yang mungkin dikembalikan.
Rasional       : Dokumentasi API yang akurat mempersingkat waktu onboarding developer baru dan meminimalkan kesalahpahaman antara tim frontend dan backend saat integrasi.

---

### 3.5 Kebutuhan Data

#### Catatan Arsitektur Data

Sistem Payana menggunakan tiga lapisan penyimpanan data yang memiliki karakteristik dan tujuan yang berbeda. Pemahaman terhadap ketiga lapisan ini penting untuk menghindari kesalahpahaman yang umum terjadi ketika membandingkan sistem berbasis blockchain dengan sistem informasi konvensional.

**Lapisan Pertama: On-Chain Storage (Smart Contract State).** Data yang disimpan di dalam smart contract bersifat permanen, transparan, dan tidak dapat diubah secara sepihak oleh siapapun — termasuk tim pengembang. Setiap perubahan state memerlukan transaksi yang ditandatangani oleh pihak yang berwenang dan membayar biaya gas. Keunggulan utamanya adalah jaminan integritas: data gaji, pesangon, dan status PHK tidak dapat dipalsukan atau dihapus oleh pihak manapun. Kelemahannya adalah biaya penyimpanan yang mahal (setiap 32 byte data on-chain memiliki biaya gas) dan keterbatasan kemampuan query (tidak ada SQL JOIN, tidak ada full-text search). Oleh karena itu, hanya data yang memerlukan jaminan integritas tertinggi yang disimpan on-chain: stream gaji, saldo severance, proposal PHK, cliff vest, dan catatan SBT.

**Lapisan Kedua: Off-Chain PostgreSQL.** Data yang tidak memerlukan jaminan immutability blockchain tetapi memerlukan kemampuan query yang kaya disimpan dalam database PostgreSQL konvensional di server backend. Ini mencakup data PII karyawan (nama, NIK, nomor telepon) yang dienkripsi AES-256-GCM — data ini sengaja tidak disimpan on-chain karena nilai privasi karyawan lebih tinggi daripada kebutuhan immutability. Lapisan ini juga menyimpan data operasional backend: sesi JWT, audit log, pembatasan laju, dan data pendaftaran HR. PostgreSQL memungkinkan query SQL yang efisien untuk keperluan pelaporan dan pencarian, yang tidak dimungkinkan di blockchain.

**Lapisan Ketiga: Ponder Indexed Data.** Ponder adalah framework indeksasi blockchain yang secara real-time membaca event yang diemit oleh smart contract (seperti SalaryClaimed, StreamStarted, VaultDeployed) dan menyimpan data yang terstruktur ke dalam tabel PostgreSQL di skema publik. Tanpa indexer, untuk mengetahui "berapa total gaji yang sudah diklaim oleh semua karyawan di semua vault" seseorang harus mengiterasi setiap transaksi sejak genesis blok — sebuah operasi yang sangat tidak efisien. Ponder menyelesaikan masalah ini dengan memelihara snapshot state yang dapat diquery secara efisien, layaknya database konvensional, namun dengan sumber data yang terjamin berasal dari blockchain. Data Ponder bersifat dapat direkonstruksi ulang kapan saja dari event on-chain jika database rusak.

---

#### ERD On-Chain (Smart Contract State)

```mermaid
erDiagram
    CompanyVault {
        address hrAuthority
        string companyName
        uint256 vaultBalance
        uint256 complianceBalance
        uint256 totalFlowRate
        VaultStatus status
        uint256 bpjsBps
        uint256 pph21Bps
        uint256 lowBalanceThresholdBps
    }

    EmployeeStream {
        uint256 flowRate
        uint256 lastWithdrawnTs
        uint256 settledBalance
        uint256 employeeBps
        uint256 complianceBps
        uint256 severanceBps
        uint256 startTs
        StreamStatus status
    }

    SeveranceVault {
        uint256 balance
        SeveranceStatus status
        uint256 tenureMonths
        uint256 flowRateSnapshot
    }

    TerminationProposal {
        bool hrApproved
        bool legalApproved
        address proposedBy
        uint256 expiresAt
        bytes32 reasonHash
        uint256 flowRateSnapshot
    }

    CliffVest {
        uint256 amount
        uint256 cliffTs
        VestType vestType
        VestStatus status
    }

    EmploymentSBT {
        address employeeTokenId
        uint256 tokenId
    }

    EmploymentRecord {
        string companyName
        address hrAuthority
        uint256 startTs
    }

    SalaryAdvance {
        uint256 amount
        uint256 repaid
        uint256 requestedAt
        AdvanceStatus status
    }

    CompanyVault ||--o{ EmployeeStream : "employeeStreams[address]"
    CompanyVault ||--o{ SeveranceVault : "severanceVaults[address]"
    CompanyVault ||--o{ TerminationProposal : "terminationProposals[address]"
    CompanyVault ||--o{ CliffVest : "cliffVests[address][vestId]"
    CompanyVault ||--o{ SalaryAdvance : "salaryAdvances[address]"
    EmploymentSBT ||--|| EmploymentRecord : "employmentRecords[tokenId]"
```

---

#### ERD Off-Chain (PostgreSQL — Skema `app`)

```mermaid
erDiagram
    employees {
        text address PK
        text name_encrypted
        text nik_encrypted
        text phone_encrypted
        timestamp created_at
        timestamp updated_at
    }

    sessions {
        text id PK
        text address FK
        text jti
        timestamp expires_at
        timestamp created_at
    }

    audit_logs {
        text id PK
        text actor_address
        text action
        jsonb metadata
        text tx_hash
        timestamp created_at
    }

    rate_limits {
        text address
        text endpoint
        integer count
        timestamp window_start
    }

    webhook_events {
        text id PK
        text event_type
        integer block_number
        text tx_hash
        boolean processed
        timestamp created_at
    }

    pending_registrations {
        text address PK
        text email
        text name
        text status
        timestamp created_at
        timestamp updated_at
    }

    employees ||--o{ sessions : "address"
    employees ||--o{ audit_logs : "actor_address"
```

Catatan: Kolom `name_encrypted`, `nik_encrypted`, dan `phone_encrypted` di tabel `employees` disimpan dalam bentuk terenkripsi AES-256-GCM dengan IV unik per enkripsi. Nilai plaintext tidak pernah tersimpan di database.

---

#### ERD Ponder (Indexed Blockchain Data — Skema `public`)

Tabel-tabel berikut dihasilkan secara otomatis oleh Ponder framework berdasarkan definisi `onchainTable` di `ponder/ponder.schema.ts`. Setiap tabel merepresentasikan state teragregasi yang direkonstruksi dari event log smart contract dan diperbarui secara real-time setiap kali event baru terdeteksi pada blok yang terkonfirmasi. Karena Ponder menggunakan pendekatan state-tracking (bukan append-only event log), setiap baris mewakili state terkini dari entitas on-chain — bukan rekaman historis per event.

```mermaid
erDiagram
    company {
        hex id PK
        text name
        text status
        bigint vault_balance
        bigint created_at
        hex vault_address
    }

    employee_stream {
        hex id PK
        hex hr_authority
        bigint flow_rate
        bigint start_ts
        text status
        integer employee_bps
        integer compliance_bps
        integer severance_bps
    }

    salary_claim {
        text id PK
        hex employee
        hex hr_authority
        bigint accrued
        bigint net_to_employee
        bigint to_compliance
        bigint to_severance
        bigint block_number
        bigint timestamp
    }

    severance_vault {
        hex id PK
        hex hr_authority
        bigint amount
        text state
        bigint last_updated
    }

    termination_proposal {
        hex id PK
        hex hr_authority
        boolean hr_approved
        boolean legal_approved
        bigint expires_at
        bigint proposed_at
        bigint executed_at
    }

    cliff_vest {
        text id PK
        hex employee
        hex hr_authority
        bigint vest_id
        bigint amount
        bigint cliff_ts
        text vest_type
        text status
        bigint created_at
    }

    compliance_vault {
        hex id PK
        bigint accumulated
        bigint last_updated
    }

    salary_advance {
        hex id PK
        hex hr_authority
        bigint amount
        bigint repaid
        text status
        bigint requested_at
        bigint updated_at
    }

    employment_certificate {
        hex id PK
        bigint token_id
        hex hr_authority
        text company_name
        bigint issued_at
        bigint revoked_at
        boolean active
    }

    low_balance_alert {
        text id PK
        hex hr_authority
        bigint balance
        bigint monthly_need
        bigint timestamp
    }

    vault_withdrawal {
        text id PK
        hex hr_authority
        hex vault_address
        bigint amount
        hex recipient
        bigint block_number
        bigint timestamp
    }

    role_change {
        text id PK
        hex vault_address
        hex role
        hex account
        hex sender
        boolean granted
        bigint block_number
        bigint timestamp
    }

    company ||--o{ employee_stream : "hr_authority"
    company ||--o{ salary_claim : "hr_authority"
    company ||--o{ severance_vault : "hr_authority"
    company ||--o{ termination_proposal : "hr_authority"
    company ||--o{ cliff_vest : "hr_authority"
    company ||--|| compliance_vault : "hr_authority"
    company ||--o{ salary_advance : "hr_authority"
    company ||--o{ employment_certificate : "hr_authority"
    company ||--o{ low_balance_alert : "hr_authority"
    company ||--o{ vault_withdrawal : "hr_authority"
    company ||--o{ role_change : "vault_address"
    employee_stream ||--o{ salary_claim : "employee"
    employee_stream ||--o{ cliff_vest : "employee"
```

Keterangan kolom kunci:

- `company.id` — address `hrAuthority` yang sekaligus menjadi identifier unik vault perusahaan. Satu perusahaan = satu `hrAuthority` address = satu vault.
- `salary_claim.id` — komposit `${txHash}-${logIndex}` untuk memastikan uniqueness meskipun satu transaksi menghasilkan beberapa log event.
- `cliff_vest.id` — komposit `${employeeAddress}-${vestId}` karena satu karyawan dapat memiliki beberapa cliff vest bersamaan (Retention, Probation, ESOP).
- `severance_vault.state` — nilai enum: "Locked" (masih aktif bekerja), "Returned" (dikembalikan ke vault karena resign), "Released" (dicairkan ke karyawan pasca PHK).
- `employment_certificate.revoked_at` — `null` selama karyawan masih aktif bekerja; diisi timestamp saat SBT direvoke pada proses resign atau PHK.
- `low_balance_alert.id` — komposit `${txHash}-${logIndex}` karena satu vault dapat memicu lebih dari satu alert dalam satu transaksi deposit.
- `company.vault_address` — alamat kontrak `CompanyVault` (bukan `hrAuthority`); ditambahkan agar `role_change` (yang hanya membawa alamat vault, bukan `hrAuthority`, pada event `RoleGranted`/`RoleRevoked`) dapat di-resolve kembali ke perusahaan yang bersangkutan. Lihat FR-PAYANA-1901 s.d. 1904.
- `vault_withdrawal.id` / `role_change.id` — komposit `${txHash}-${logIndex}`, mengikuti pola tabel event-log lain di atas. Kedua tabel ini adalah sumber data untuk `anomalyDetector.ts` (lihat DPPL.md Lampiran B untuk detail layanan).
- `role_change.role` — hash `bytes32` mentah (`keccak256("HR_ROLE")`, `keccak256("LEGAL_ROLE")`, atau `0x00...00` untuk `DEFAULT_ADMIN_ROLE`), bukan nama peran dalam teks — interpretasi dilakukan di lapisan aplikasi (backend), bukan di Ponder.

---

## 4. Penutup

### 4.1 Simpulan

Dokumen ini telah mendefinisikan dua belas fungsi produk Payana yang dikelompokkan ke dalam delapan modul (Modul A s.d. H, §1.2), yang secara rinci direalisasikan oleh sembilan belas Kelompok kebutuhan fungsional (Kelompok A s.d. S, §3.2) — mencakup manajemen vault perusahaan, streaming gaji real-time, penarikan gaji mandiri (EWA), PHK multi-tanda tangan, cliff vesting, mesin pajak dan kasbon, sertifikasi ketenagakerjaan berbasis SBT, administrasi platform SaaS, autentikasi berbasis wallet, transaksi gasless, serta deteksi anomali keamanan vault (Kelompok H). Seluruh kebutuhan fungsional (FR-PAYANA-101 s.d. 1904) dan non-fungsional (NFR-PAYANA-01 s.d. 19) telah dirinci dengan kriteria penerimaan yang terukur.

Bagian terbesar dari kebutuhan yang didefinisikan telah diimplementasikan dan divalidasi terhadap sistem nyata: tiga kontrak Solidity (`PayrollFactory`, `CompanyVault`, `EmploymentSBT`) sudah di-deploy dan terverifikasi di Base Sepolia, backend dan frontend untuk Kelompok M s.d. U sudah berfungsi penuh (lihat PDHUPL_v2.md KU-21 s.d. KU-32), dan kebutuhan performa (NFR-PAYANA-01) serta reliabilitas (NFR-PAYANA-07) telah dikoreksi dan divalidasi berdasarkan hasil stress test aktual (k6 + InfluxDB + Grafana), bukan sekadar target yang belum diukur.

Beberapa keterbatasan penting perlu digarisbawahi sebagai bagian dari simpulan ini:

1. **`LEGAL_ROLE` belum menjadi persona pengguna terpisah dalam praktik** — meskipun kontrak `CompanyVault` mendukung `LEGAL_ROLE` sebagai peran `AccessControl` independen dari `HR_ROLE`, dalam operasional saat ini peran tersebut di-auto-grant ke alamat HR Admin yang sama (lihat §2.3), dan belum ada jalur produk (UI) bagi Legal Officer yang benar-benar terpisah untuk mengakses dashboard PHK.
2. **Sejumlah isu teknis minor telah teridentifikasi namun belum ditutup**, terdokumentasi lengkap di `KNOWN_ISSUES.md`: potensi guard coupling pada `cancelProposal()`, kesalahan interpretasi nilai null dari Ponder pada `getStream()`, perbandingan alamat mentah untuk deteksi HR-vs-Legal pada indexer, hilangnya lapisan pertahanan berlapis di backend untuk validasi `execute()` Kernel, serta belum adanya kuota gas on-chain per karyawan pada mekanisme Paymaster.
3. **Satu requirement yatim (`FR-PAYANA-1103`, dekripsi mandiri gaji melalui viewing key)** yang tercantum pada draf awal dokumen ini terkait dengan rancangan `ConfidentialCompanyVault` berbasis Fully Homomorphic Encryption (FHE) yang pada akhirnya tidak dilanjutkan ke implementasi produksi — kontrak tersebut tidak lagi menjadi bagian dari basis kode aktif (`src/`) dan requirement ini secara eksplisit tidak divalidasi (`[Perlu dikonfirmasi]`).

### 4.2 Saran dan Pengembangan Lanjutan

Untuk iterasi produk maupun revisi dokumen SKPL berikutnya, disarankan hal-hal berikut:

1. **Formalkan status `FR-PAYANA-1103`** sebagai *out of scope* atau *future work* secara eksplisit, alih-alih dibiarkan sebagai kebutuhan aktif tanpa bukti implementasi — mengingat kontrak confidential vault yang mendasarinya sudah ditinggalkan.
2. **Bangun dashboard Legal Officer yang benar-benar independen** dari HR Admin — menambahkan cabang pemeriksaan `LEGAL_ROLE` pada `useRole.ts` dan jalur akses terpisah pada `useRoleGuard`, sehingga desain multi-tanda tangan PHK (§2.2 Fungsi ke-4) dapat dioperasikan oleh dua pihak independen sesuai rasional aslinya, bukan hanya sebagai kemampuan kontrak yang tidak terpakai di lapisan produk.
3. **Tutup kelima isu pada `KNOWN_ISSUES.md`** sebelum evaluasi migrasi ke Base Mainnet, khususnya penambahan kuota gas per karyawan pada Paymaster (KI-005) dan pemulihan lapisan pertahanan berlapis pada `/bundler/relay` (KI-004), mengingat keduanya berdampak langsung pada risiko keamanan finansial platform.
4. **Evaluasi kembali butir-butir di luar ruang lingkup MVP** (§1.2) — integrasi HRIS pihak ketiga, fiat on/off ramp langsung, payroll multi-chain, ESOP dengan secondary market, notifikasi push mobile native, stealth address (EIP-5564), dan private streaming rate on-chain — sebagai kandidat pengembangan lanjutan setelah adopsi awal tervalidasi oleh perusahaan pilot.
5. **Selaraskan penomoran lampiran pemetaan FR-komponen** antara dokumen ini dengan `SPESIFIKASI KEBUTUHAN PERANGKAT LUNAK.docx` setelah Kelompok H (FR-PAYANA-1901 s.d. 1904) diporting ke docx, agar kedua dokumen konsisten sebagai satu kesatuan kontrak kebutuhan yang dapat ditelusuri balik ke implementasi.

---

## A. Lampiran

### A.1 Singkatan Tambahan

| Singkatan | Kepanjangan |
|-----------|-------------|
| SKPL | Spesifikasi Kebutuhan Perangkat Lunak |
| FR | Functional Requirement |
| NFR | Non-Functional Requirement |
| UC | Use Case |
| IDRX | Indonesian Rupiah eXtended (stablecoin 1:1 IDR) |
| EWA | Earned Wage Access |
| SBT | Soulbound Token |
| PHK | Pemutusan Hubungan Kerja |
| JWT | JSON Web Token |
| EOA | Externally Owned Account |
| EIP | Ethereum Improvement Proposal |
| AES | Advanced Encryption Standard |
| GCM | Galois/Counter Mode |
| API | Application Programming Interface |
| REST | Representational State Transfer |
| RPC | Remote Procedure Call |
| L2 | Layer 2 |
| SaaS | Software as a Service |
| HR | Human Resources |
| NIK | Nomor Induk Kependudukan |
| PDP | Pelindungan Data Pribadi |
| BPJS | Badan Penyelenggara Jaminan Sosial |
| PPh21 | Pajak Penghasilan Pasal 21 |
| ERC | Ethereum Request for Comments |
| TVL | Total Value Locked |
| PII | Personally Identifiable Information |
| RTO | Recovery Time Objective |
| RPO | Recovery Point Objective |
| TPS | Transactions Per Second |
| DJP | Direktorat Jenderal Pajak |
| OJK | Otoritas Jasa Keuangan |
| APM | Application Performance Monitoring |
| ERD | Entity-Relationship Diagram |
| ORM | Object-Relational Mapping |
| WaaS | Wallet as a Service |
| MRC | Monthly Recurring Cost |
| ESOP | Employee Stock Ownership Plan |

> **[FLAG-BARU-VS-DOCX]** subbab A.2 ini seluruhnya BARU — docx lama cuma punya A.1 Singkatan
> Tambahan dan A.2 Catatan Teknis (jadi A.3 di sini), tidak ada tabel alamat kontrak sama sekali.

### A.2 Alamat Kontrak Ter-Deploy

> Jaringan: Base Sepolia (Chain ID: 84532) — `PayrollFactory` diganti setelah ditemukan stale (lihat catatan di bawah)

| Kontrak | Alamat |
|---------|--------|
| PayrollFactory | 0x73926c8abdbd2ebcc09f5e6af7def1bb3af156de |
| EmploymentSBT | 0x8dA9B60814536364daF77a82cb56B31226De4B62 |
| MockIDRX (Testnet) | 0x0996e627cE22C4FE2D5c4788b159a83C065D6d09 |
| Admin/Treasury | 0x906B34db1a8DD333ff9a84255e4AEc13C054f120 |

> **[RESOLVED — sudah di-redeploy]** `PayrollFactory` lama
> (`0xF62dF08b38c6Fbde33E24208BA044907475ca815`) terkonfirmasi stale relatif terhadap `src/`
> saat ini (bytecode tidak cocok, `deployVault()` selalu revert) — lihat detail lengkap di
> DPPL.md §A.3 dan PDHUPL_v2.md Bab 5. Factory baru di atas sudah di-deploy dari source terkini
> dan diverifikasi berfungsi end-to-end; seluruh konfigurasi aplikasi (backend, ponder,
> frontend, deployment scripts) sudah diarahkan ke alamat baru ini, kecuali GitHub Actions
> secret yang perlu diupdate manual oleh pemilik repo. 2 company lama di factory lama sengaja
> diorphan (data dummy, dikonfirmasi aman) — lihat DPPL.md §A.3 untuk detail dampaknya.

> Catatan: IDRX yang digunakan di testnet adalah MockIDRX. IDRX mainnet resmi beralamat `0x18Bc5bcC660cf2B9cE3cd51a404aFe1a0cBD3C22`.

Seluruh kontrak di atas telah diverifikasi di Basescan.

### A.3 Catatan Teknis untuk Pembaca Non-Blockchain

**A.3.1 On-Chain Storage vs Database Konvensional**

Dalam sistem informasi konvensional, data disimpan di server database yang dikelola oleh pemilik aplikasi — artinya data tersebut dapat diubah, dihapus, atau bahkan dimanipulasi oleh administrator server. Blockchain bekerja secara fundamental berbeda. Data yang tersimpan dalam smart contract disebarkan ke ribuan komputer (node) di seluruh dunia secara bersamaan; mengubah data tersebut memerlukan konsensus dari mayoritas node sekaligus, yang secara praktis tidak mungkin dilakukan secara sepihak. Konsekuensinya adalah: data gaji, pesangon, dan riwayat PHK yang tersimpan di smart contract Payana tidak dapat dimanipulasi oleh siapapun — termasuk tim pengembang Payana sendiri. Ini memberikan jaminan integritas yang lebih kuat daripada database konvensional, namun dengan biaya penyimpanan yang jauh lebih tinggi dan kemampuan query yang lebih terbatas.

**A.3.2 Mengapa Ada Dua Lapisan Data (On-Chain dan PostgreSQL)**

Karena biaya penyimpanan on-chain sangat mahal (sekitar 20.000 gas per 32 byte, setara dengan puluhan rupiah per penyimpanan), menyimpan semua data di blockchain tidak ekonomis. Payana menggunakan strategi hibrida: data yang memerlukan jaminan integritas tertinggi (jumlah gaji, status PHK, saldo pesangon) disimpan on-chain, sementara data yang memerlukan kemampuan query yang kaya (profil karyawan, audit log, laporan) disimpan di PostgreSQL. Data PII seperti nama dan NIK sengaja tidak disimpan on-chain karena blockchain bersifat publik dan permanen — sekali tersimpan, data pribadi tidak dapat dihapus untuk memenuhi hak "right to be forgotten" yang diamanatkan UU PDP.

**A.3.3 Apa Itu Gasless Transaction dan Mengapa Karyawan Tidak Perlu Membayar Gas**

Setiap transaksi di jaringan Ethereum (termasuk Base) memerlukan biaya operasional yang disebut "gas", yang dibayar menggunakan ETH (mata uang kripto jaringan). Dalam skenario konvensional, karyawan harus memiliki ETH di dompet mereka sebelum dapat menarik gaji — sebuah hambatan yang tidak realistis bagi pengguna awam. Payana menyelesaikan ini menggunakan Account Abstraction (ERC-4337): karyawan menandatangani instruksi penarikan secara digital (seperti menandatangani dokumen elektronik), kemudian backend Payana meneruskan instruksi ini ke layanan "Bundler" (Pimlico) yang membayar biaya gas atas nama karyawan menggunakan "Paymaster" — sebuah kontrak yang didanai oleh operator platform. Dari sudut pandang karyawan, prosesnya terasa seperti transfer bank biasa: tap tombol, konfirmasi, selesai.

