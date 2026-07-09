# Daftar Gambar — Skripsi Payana

> Kumpulan diagram (dibuat dengan Mermaid) untuk dilampirkan sebagai Gambar di naskah skripsi.
> Render tiap diagram (mis. via VS Code Mermaid preview, mermaid.live, atau `mmdc`) menjadi PNG/SVG
> sebelum ditempel ke dokumen Word/LaTeX skripsi — Word tidak merender kode Mermaid secara native.

---

## Gambar 3.1. Diagram Alur Tahapan Penelitian

> **Catatan:** 5 tahap penelitian di bawah diturunkan dari struktur dokumen rekayasa perangkat lunak
> yang sudah ada di proyek ini (`SKPL.md`, `DPPL.md`, `PDHUPL_v2.md`) dan konvensi umum skripsi
> rekayasa perangkat lunak. **Ini draf** — sesuaikan nama/urutan tahap dengan yang sudah kamu tulis
> di Bab 3 naskah skripsi kalau berbeda.

```mermaid
flowchart TD
    A["Tahap 1<br/>Studi Literatur &amp;<br/>Identifikasi Masalah"] --> B["Tahap 2<br/>Analisis Kebutuhan<br/>Perangkat Lunak (SKPL)"]
    B --> C["Tahap 3<br/>Perancangan<br/>Perangkat Lunak (DPPL)"]
    C --> D["Tahap 4<br/>Implementasi<br/>(Smart Contract, Backend, Frontend)"]
    D --> E["Tahap 5<br/>Pengujian &amp; Evaluasi<br/>(PDHUPL)"]
    E --> F["Penarikan Kesimpulan<br/>&amp; Penyusunan Laporan"]

    subgraph W["Pemetaan ke Model Waterfall"]
        direction TD
        W1["Requirements<br/>Analysis"]
        W2["System<br/>Design"]
        W3["Implementation"]
        W4["Verification<br/>(Testing)"]
        W1 --> W2 --> W3 --> W4
    end

    B -.->|selaras dengan| W1
    C -.->|selaras dengan| W2
    D -.->|selaras dengan| W3
    E -.->|selaras dengan| W4

    style A fill:#e8eef7,stroke:#4a6fa5
    style B fill:#e8eef7,stroke:#4a6fa5
    style C fill:#e8eef7,stroke:#4a6fa5
    style D fill:#e8eef7,stroke:#4a6fa5
    style E fill:#e8eef7,stroke:#4a6fa5
    style F fill:#e8eef7,stroke:#4a6fa5
    style W1 fill:#fdf3e0,stroke:#c99a3a
    style W2 fill:#fdf3e0,stroke:#c99a3a
    style W3 fill:#fdf3e0,stroke:#c99a3a
    style W4 fill:#fdf3e0,stroke:#c99a3a
```

**Penjelasan tiap tahap:**

| Tahap | Aktivitas | Luaran | Fase Waterfall |
|---|---|---|---|
| 1. Studi Literatur & Identifikasi Masalah | Kajian pustaka Web3 payroll, stablecoin IDRX, regulasi ketenagakerjaan (UU Cipta Kerja), penentuan rumusan masalah dan tujuan penelitian | Rumusan masalah, batasan penelitian | — (pra-Waterfall) |
| 2. Analisis Kebutuhan Perangkat Lunak | Identifikasi aktor, use case, dan kebutuhan fungsional/non-fungsional sistem | `SKPL.md` (29 Use Case, kebutuhan fungsional FR-PAYANA-1xx s.d. 2001) | Requirements Analysis |
| 3. Perancangan Perangkat Lunak | Perancangan arsitektur, basis data, antarmuka, dan smart contract | `DPPL.md` (rancangan data, API, UI, sequence diagram) | System Design |
| 4. Implementasi | Penulisan kode smart contract (Solidity/Foundry), backend (Express/Ponder), dan frontend (Next.js); deploy ke Base Sepolia testnet | Kode sumber, kontrak ter-deploy | Implementation |
| 5. Pengujian & Evaluasi | Pengujian unit (Foundry), pengujian fungsional black-box, verifikasi eksekusi nyata di UI | `PDHUPL_v2.md` (96 butir uji, status Handal) | Verification (Testing) |

> Fase **Maintenance** pada model Waterfall klasik tidak tercakup dalam ruang lingkup penelitian ini,
> karena sistem berstatus prototipe/purwarupa skripsi dan bukan produk produksi yang dipelihara
> berkelanjutan.

---

## Gambar 3.2. Diagram Perbedaan Arsitektur Web2 dan Web3

> **Catatan:** Diagram ini memvisualisasikan Tabel 3.1 (Perbandingan Arsitektur Sistem Penggajian
> Web2 dan Web3) — kedelapan dimensi perbandingan pada tabel dipetakan satu-per-satu ke pasangan
> komponen di bawah, supaya narasi teks dan gambar konsisten.

```mermaid
flowchart LR
    subgraph WEB2["Arsitektur Web2 — Sistem Penggajian Konvensional"]
        direction TB
        W2_ADMIN["Administrator Sistem<br/>(hak akses penuh)"]
        W2_SERVER["Server Terpusat<br/>(logika bisnis server-side,<br/>dapat dimodifikasi)"]
        W2_DB[("Basis Data Terpusat<br/>(mutable)")]
        W2_AUTH["Autentikasi<br/>Username / Kata Sandi"]
        W2_BANK["Payment Gateway<br/>Perbankan Pihak Ketiga"]
        W2_BATCH["Pembayaran Batch<br/>(akhir siklus penggajian)"]
        W2_EMP["Karyawan<br/>(tanpa visibilitas real-time)"]
        W2_ID["Rekam Kepegawaian<br/>(basis data internal)"]
        W2_LOG["Log Internal<br/>(akses terbatas)"]

        W2_ADMIN -->|kelola &amp; modifikasi| W2_DB
        W2_AUTH --> W2_SERVER
        W2_SERVER <--> W2_DB
        W2_SERVER -->|instruksi transfer| W2_BANK
        W2_BANK -->|penyaluran batch| W2_BATCH
        W2_BATCH -->|gaji diterima periodik| W2_EMP
        W2_SERVER --> W2_ID
        W2_SERVER --> W2_LOG
    end

    subgraph WEB3["Arsitektur Web3 — Payana (Diusulkan)"]
        direction TB
        W3_SC["Smart Contract<br/>(immutable, deterministik,<br/>otonom di blockchain)"]
        W3_VAULT[("Vault Perusahaan<br/>(dana tereksekusi sesuai<br/>aturan kontrak)")]
        W3_WAAS["Autentikasi Surel / SSO<br/>via WaaS (ERC-4337)"]
        W3_PAYMASTER["Paymaster<br/>(gasless untuk karyawan)"]
        W3_STREAM["Streaming Pembayaran<br/>(kontinu, detik-per-detik)"]
        W3_EMP["Karyawan<br/>(visibilitas real-time)"]
        W3_SBT["Soulbound Token<br/>ERC-5192 (identitas kepegawaian,<br/>on-chain)"]
        W3_LEDGER[("Ledger Terdistribusi<br/>(immutable, dapat diverifikasi<br/>publik)")]

        W3_WAAS --> W3_SC
        W3_SC <-->|aturan eksekusi| W3_VAULT
        W3_VAULT -->|dijamin Paymaster| W3_PAYMASTER
        W3_VAULT -->|alirkan dana| W3_STREAM
        W3_STREAM -->|kompensasi kontinu,<br/>tanpa intervensi manual| W3_EMP
        W3_SC --> W3_SBT
        W3_SC -->|catat setiap transaksi| W3_LEDGER
    end

    WEB2 -.->|"paradigma Web2.5:<br/>UX Web2, logika &amp; dana Web3"| WEB3

    style W2_ADMIN fill:#f3e0e0,stroke:#a54a4a
    style W2_SERVER fill:#f3e0e0,stroke:#a54a4a
    style W2_DB fill:#f3e0e0,stroke:#a54a4a
    style W2_AUTH fill:#f3e0e0,stroke:#a54a4a
    style W2_BANK fill:#f3e0e0,stroke:#a54a4a
    style W2_BATCH fill:#f3e0e0,stroke:#a54a4a
    style W2_EMP fill:#f3e0e0,stroke:#a54a4a
    style W2_ID fill:#f3e0e0,stroke:#a54a4a
    style W2_LOG fill:#f3e0e0,stroke:#a54a4a
    style W3_SC fill:#e6f0e6,stroke:#4a7a4a
    style W3_VAULT fill:#e6f0e6,stroke:#4a7a4a
    style W3_WAAS fill:#e6f0e6,stroke:#4a7a4a
    style W3_PAYMASTER fill:#e6f0e6,stroke:#4a7a4a
    style W3_STREAM fill:#e6f0e6,stroke:#4a7a4a
    style W3_EMP fill:#e6f0e6,stroke:#4a7a4a
    style W3_SBT fill:#e6f0e6,stroke:#4a7a4a
    style W3_LEDGER fill:#e6f0e6,stroke:#4a7a4a
```

**Pemetaan ke Tabel 3.1:**

| Dimensi (Tabel 3.1) | Komponen Web2 di diagram | Komponen Web3 di diagram |
|---|---|---|
| Penyimpanan data | Basis Data Terpusat (mutable) | Ledger Terdistribusi (immutable) |
| Logika bisnis | Server Terpusat (server-side, dapat dimodifikasi) | Smart Contract (immutable, deterministik) |
| Mekanisme pembayaran | Payment Gateway → Pembayaran Batch | Vault → Streaming Pembayaran (kontinu) |
| Autentikasi pengguna | Username / Kata Sandi | Surel/SSO via WaaS (ERC-4337) |
| Biaya transaksi karyawan | Ditanggung perusahaan via bank (implisit di alur Payment Gateway) | Paymaster (gasless) |
| Identitas kepegawaian | Rekam Kepegawaian (basis data internal) | Soulbound Token ERC-5192 (on-chain) |
| Audit trail | Log Internal (akses terbatas) | Ledger Terdistribusi (transaksi publik, dapat diverifikasi) |
| Ketergantungan perantara | Administrator Sistem + Payment Gateway (tinggi) | Smart Contract ↔ Vault langsung (minimal, trustless) |

---

## Gambar 4.1. Diagram Arsitektur Sistem Payana End-to-End

> **Catatan:** Komponen dan alur di bawah diverifikasi langsung dari kode (bukan diasumsikan):
> `docker-compose.yml` (services: backend, ponder, postgres, pgadmin), `ponder/ponder.config.ts`
> (indexer memantau `PayrollFactory` di Base Sepolia lalu otomatis mengikuti setiap `CompanyVault`
> yang di-deploy via event `VaultDeployed`), struktur folder `frontend/src/{app,application,domain,
> infrastructure}` (pola clean architecture), dan `backend/src/routes/*` (16 route group REST API).

```mermaid
flowchart TB
    subgraph CLIENT["Client Layer"]
        USER["Pengguna<br/>(HR / Karyawan / Owner SaaS)"]
        FE["Frontend — Next.js<br/>(app / application / domain / infrastructure)"]
        WALLET["Wallet<br/>(EOA / Smart Account, ERC-4337)"]
    end

    subgraph OFFCHAIN["Off-chain Layer"]
        BE["Backend API — Express<br/>16 route group: auth, registration, invitations,<br/>kasbon, reimburse, bounty, payslip, taxcert,<br/>employmentLetter, directory, termination,<br/>compliance, suspension, notifications,<br/>companySettings, bundler, webhook"]
        PONDER["Ponder Indexer<br/>(memantau event on-chain,<br/>mengikuti VaultDeployed secara dinamis)"]
        PG[("PostgreSQL<br/>(payroll_db)")]
    end

    subgraph ONCHAIN["On-chain Layer — Base Sepolia (Chain ID 84532)"]
        FACTORY["PayrollFactory<br/>(AccessControl — SUPERADMIN_ROLE)"]
        VAULT1["CompanyVault<br/>Tenant A<br/>(HR_ROLE, Paymaster ERC-4337)"]
        VAULT2["CompanyVault<br/>Tenant B, C, ..."]
        SBT["EmploymentSBT<br/>(sertifikat kerja, shared)"]
        IDRX["IDRX Token<br/>(ERC-20 stablecoin)"]
    end

    subgraph INFRA["Infrastruktur Blockchain"]
        RPC["RPC Provider<br/>(Alchemy — Base Sepolia)"]
        ENTRYPOINT["ERC-4337 EntryPoint v0.7<br/>(canonical, shared)"]
    end

    USER -->|klik UI| FE
    FE -->|tanda tangan transaksi| WALLET
    FE -->|REST API call| BE
    WALLET -->|kirim UserOp / transaksi| ENTRYPOINT

    BE -->|query data terindeks| PG
    BE -->|"baca/tulis data off-chain<br/>(profil, notifikasi, dokumen)"| PG
    PONDER -->|tulis event terindeks| PG
    PONDER -->|subscribe event via RPC| RPC

    RPC -->|JSON-RPC| FACTORY
    RPC -->|JSON-RPC| VAULT1
    RPC -->|JSON-RPC| VAULT2

    ENTRYPOINT -->|"validasi &amp; eksekusi UserOp<br/>(Paymaster: vault membayar gas)"| VAULT1

    FACTORY -->|deployVault· event VaultDeployed| VAULT1
    FACTORY -->|deployVault· event VaultDeployed| VAULT2
    VAULT1 -->|transfer/claim gaji, kasbon, severance| IDRX
    VAULT2 -->|transfer/claim gaji, kasbon, severance| IDRX
    VAULT1 -.->|referensi sertifikat kerja| SBT
    VAULT2 -.->|referensi sertifikat kerja| SBT

    style USER fill:#e8eef7,stroke:#4a6fa5
    style FE fill:#e8eef7,stroke:#4a6fa5
    style WALLET fill:#e8eef7,stroke:#4a6fa5
    style BE fill:#fdf3e0,stroke:#c99a3a
    style PONDER fill:#fdf3e0,stroke:#c99a3a
    style PG fill:#fdf3e0,stroke:#c99a3a
    style FACTORY fill:#f3e0e0,stroke:#a54a4a
    style VAULT1 fill:#f3e0e0,stroke:#a54a4a
    style VAULT2 fill:#f3e0e0,stroke:#a54a4a
    style SBT fill:#f3e0e0,stroke:#a54a4a
    style IDRX fill:#f3e0e0,stroke:#a54a4a
    style RPC fill:#e6f0e6,stroke:#4a7a4a
    style ENTRYPOINT fill:#e6f0e6,stroke:#4a7a4a
```

**Penjelasan alur:**

1. **Pengguna** berinteraksi dengan **Frontend (Next.js)**, yang mengikuti pola clean architecture (pemisahan `app`, `application`, `domain`, `infrastructure`).
2. Untuk aksi yang butuh transaksi on-chain, frontend meminta tanda tangan ke **Wallet** pengguna (EOA biasa, atau Smart Account via ERC-4337 jika memakai fitur gasless).
3. Untuk data yang tidak perlu on-chain (autentikasi, profil, notifikasi, dokumen seperti payslip/tax cert/surat kerja), frontend memanggil **Backend API (Express)** langsung — 16 grup route REST.
4. Transaksi on-chain (deploy vault, mulai gaji stream, klaim gaji, kasbon, severance, dll.) dikirim ke jaringan **Base Sepolia** lewat **RPC Provider (Alchemy)**, baik sebagai transaksi biasa maupun **UserOperation** lewat **ERC-4337 EntryPoint** (di mana `CompanyVault` bertindak sebagai Paymaster-nya sendiri, menanggung gas karyawan).
5. **PayrollFactory** adalah satu-satunya kontrak yang dideploy sekali per jaringan; setiap perusahaan (tenant) mendapat instance **CompanyVault** terisolasi lewat `deployVault()`, yang memancarkan event `VaultDeployed`.
6. **Ponder Indexer** memantau event on-chain lewat RPC — termasuk secara dinamis "mengikuti" setiap `CompanyVault` baru begitu event `VaultDeployed` terdeteksi (bukan alamat tetap) — lalu menulis hasil indexing ke **PostgreSQL**.
7. **Backend API** membaca data on-chain yang sudah diindeks dari PostgreSQL yang sama (kolom terpisah dari data off-chain), sehingga frontend cukup satu sumber kebenaran (`payroll_db`) untuk gabungan data on-chain + off-chain.
8. **EmploymentSBT** (Soulbound Token sertifikat kerja) dan **IDRX** (stablecoin ERC-20) adalah kontrak bersama (shared) yang direferensikan oleh setiap `CompanyVault`, bukan didplikasi per tenant.

---

## Gambar 4.3. Struktur Direktori Proyek Smart Contract

> **Catatan:** Struktur di bawah diambil langsung dari isi folder `finley-payroll/` (proyek Foundry).
> Hanya folder/file kode sumber yang relevan yang ditampilkan — folder hasil build/dependensi
> (`out/`, `cache/`, `broadcast/`, `node_modules/`, isi `lib/*` pihak ketiga) diringkas sebagai satu
> baris agar diagram tetap terbaca.

```mermaid
flowchart TD
    ROOT["finley-payroll/<br/>(Foundry project)"]

    ROOT --> SRC["src/"]
    ROOT --> TEST["test/"]
    ROOT --> SCRIPT["script/"]
    ROOT --> LIB["lib/<br/>(dependensi eksternal)"]
    ROOT --> BUILD["out/, cache/, broadcast/<br/>(hasil build &amp; deployment,<br/>auto-generated)"]
    ROOT --> CFG["foundry.toml, foundry.lock,<br/>package.json, Makefile"]

    SRC --> SRC1["CompanyVault.sol<br/>(vault per-tenant, gaji streaming,<br/>kasbon, severance, Paymaster ERC-4337)"]
    SRC --> SRC2["PayrollFactory.sol<br/>(entry-point SaaS, deploy CompanyVault<br/>per tenant, AccessControl)"]
    SRC --> SRC3["EmploymentSBT.sol<br/>(Soulbound Token ERC-5192,<br/>sertifikat kerja)"]
    SRC --> SRC_IF["interfaces/"]
    SRC --> SRC_LIB["libraries/"]
    SRC --> SRC_MOCK["mocks/"]

    SRC_IF --> IF1["ICompanyVault.sol"]
    SRC_IF --> IF2["IERC5192.sol"]
    SRC_LIB --> LIB1["PayrollMath.sol<br/>(perhitungan bps, pembagian split)"]
    SRC_MOCK --> MOCK1["MockIDRX.sol<br/>(token IDRX tiruan untuk test)"]

    TEST --> T1["CompanyVault.t.sol"]
    TEST --> T2["CompanyVaultPaymaster.t.sol"]
    TEST --> T3["EmploymentSBT.t.sol"]
    TEST --> T4["PayrollFactory.t.sol"]
    TEST --> T5["PayrollMath.t.sol"]

    SCRIPT --> S1["Deploy.s.sol<br/>(deploy awal ke Base Sepolia)"]
    SCRIPT --> S2["DeployMock.s.sol<br/>(deploy dengan MockIDRX, dev/test)"]
    SCRIPT --> S3["RedeployFactory.s.sol"]
    SCRIPT --> S4["RedeployGen8.s.sol"]

    LIB --> L1["forge-std"]
    LIB --> L2["openzeppelin-contracts<br/>&amp; openzeppelin-contracts-upgradeable"]
    LIB --> L3["account-abstraction<br/>(ERC-4337 EntryPoint interfaces)"]

    style ROOT fill:#e8eef7,stroke:#4a6fa5
    style SRC fill:#f3e0e0,stroke:#a54a4a
    style SRC1 fill:#f3e0e0,stroke:#a54a4a
    style SRC2 fill:#f3e0e0,stroke:#a54a4a
    style SRC3 fill:#f3e0e0,stroke:#a54a4a
    style SRC_IF fill:#f3e0e0,stroke:#a54a4a
    style SRC_LIB fill:#f3e0e0,stroke:#a54a4a
    style SRC_MOCK fill:#f3e0e0,stroke:#a54a4a
    style TEST fill:#e6f0e6,stroke:#4a7a4a
    style SCRIPT fill:#fdf3e0,stroke:#c99a3a
    style LIB fill:#eee,stroke:#888
    style BUILD fill:#eee,stroke:#888
    style CFG fill:#eee,stroke:#888
```

**Penjelasan struktur:**

| Folder/File | Isi |
|---|---|
| `src/CompanyVault.sol` | Kontrak utama per-tenant — logika gaji streaming, kasbon (salary advance), severance, dan bertindak sebagai Paymaster ERC-4337 untuk transaksi gasless karyawan. |
| `src/PayrollFactory.sol` | Entry-point SaaS — mendeploy `CompanyVault` baru per tenant via `deployVault()`, dilindungi `AccessControl` (`SUPERADMIN_ROLE`). |
| `src/EmploymentSBT.sol` | Soulbound Token (ERC-5192) untuk sertifikat kerja karyawan, kontrak bersama (shared) antar-tenant. |
| `src/interfaces/` | Interface `ICompanyVault.sol` dan `IERC5192.sol`. |
| `src/libraries/PayrollMath.sol` | Fungsi murni untuk perhitungan basis poin (bps) dan pembagian split gaji/severance. |
| `src/mocks/MockIDRX.sol` | Token IDRX tiruan, dipakai di unit test dan skrip deploy lokal (`DeployMock.s.sol`). |
| `test/` | 5 file `*.t.sol` — unit test dan fuzz test (Foundry) untuk seluruh kontrak di atas. |
| `script/` | 4 skrip deployment Foundry (`Deploy.s.sol` untuk Base Sepolia, `DeployMock.s.sol` untuk dev, plus 2 skrip redeploy historis). |
| `lib/` | Dependensi eksternal: `forge-std`, OpenZeppelin (contracts + upgradeable), `account-abstraction` (interface ERC-4337). |

---

*(Tambahkan gambar skripsi lain di file ini seiring kebutuhan, dengan format `## Gambar X.Y. <judul>` diikuti blok mermaid.)*
