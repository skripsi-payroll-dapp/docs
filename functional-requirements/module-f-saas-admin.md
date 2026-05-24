# Functional Requirements: Module F - SaaS Super Admin (Owner)

## Deskripsi Modul
Modul ini mencakup sekumpulan fitur administratif tingkat tinggi (God Mode) yang dipegang secara eksklusif oleh pemilik *startup* SaaS (*Super Admin*). Arsitektur SaaS menggunakan **Factory Pattern**, yang menjamin pemisahan data mutlak antar-klien, dan mematuhi prinsip *Zero-Knowledge* & *Non-Custodial*.

---

## FR-F01: Global Analytics & Monitoring
* **Tujuan**: Memungkinkan *Owner* memantau kesehatan finansial platform secara keseluruhan.
* **Deskripsi**: Sistem menyediakan dasbor analitik agregat yang menampilkan metrik lintas *tenant*:
  * Total Value Locked (TVL) dari seluruh klien.
  * *Platform Revenue* (Monthly Recurring Revenue / MRR).
  * Jumlah Perusahaan Klien (Tenant) Aktif.
  * Estimasi konsumsi gas pada *Paymaster* ERC-4337.
* **Status**: ✅ Selesai (Frontend `app/owner/page.tsx`).

## FR-F02: Manajemen Lifecycle Klien (Tenant Onboarding)
* **Tujuan**: Mengizinkan *Owner* mencetak brankas eksklusif untuk klien baru.
* **Deskripsi**: 
  * Saat klien baru disetujui, *Owner* dapat menekan tombol "Deploy Vault".
  * Tindakan ini akan memicu *Smart Contract* `PayrollFactory.sol` untuk mencetak *instance* baru dari `CompanyVault.sol` secara spesifik untuk alamat dompet HR klien tersebut.
  * *Smart Contract* yang dicetak sepenuhnya terisolasi dari klien lain (Siloing).
* **Smart Contract Logic**: `PayrollFactory.deployVault(hrAuthority, companyName)`.

## FR-F03: Penangguhan Akses (Suspension)
* **Tujuan**: Mencegah klien yang menunggak biaya *SaaS License* untuk menggunakan platform.
* **Deskripsi**: 
  * *Owner* dapat mengubah status klien menjadi "Suspended".
  * Akses antarmuka HR (berbasis JWT) akan dicabut.
  * Meskipun akses UI dicabut, integritas dana dan logika pencairan *Smart Contract* tetap berjalan normal (karyawan masih bisa mencairkan EWA mereka).

## FR-F04: Penarikan Protocol Fee (Pajak Platform)
* **Tujuan**: Monetisasi platform berbasis Web3 (pengganti *Convenience Fee* EWA).
* **Deskripsi**:
  * Sistem meniadakan biaya potongan tarik gaji kepada karyawan.
  * Sebagai gantinya, platform menerapkan "pajak" sebesar **1% (100 BPS)** yang diambil murni dari *Yield* (Bunga Koperasi/DeFi) yang didapatkan oleh perusahaan penyedia likuiditas.
  * *Super Admin* dapat memanggil fungsi `claimProtocolFee()` pada `EmployeeLiquidityContract` untuk memindahkan cuan ini ke dompet bendahara (Treasury) SaaS.

## FR-F05: Zero-Knowledge & Non-Custodial Guarantee
* **Tujuan**: Menghindari risiko manipulasi data dan sengketa hukum terkait uang klien.
* **Deskripsi**:
  * *Super Admin* **tidak** diizinkan memanggil fungsi `withdrawVault()` pada `CompanyVault` milik klien (dilindungi oleh modifier `onlyHR`).
  * *Super Admin* **tidak** memiliki akses baca terhadap nama asli, email, NIK, dan nominal gaji spesifik milik individu karyawan klien di basis data terpusat (Siloed Database Architecture).
