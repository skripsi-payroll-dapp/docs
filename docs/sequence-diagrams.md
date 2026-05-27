# Sequence Diagrams — Payana
> Platform Payroll & Earned Wage Access Berbasis Blockchain (Base Sepolia)

**Proyek:** Payana — Earned Wage Access & Payroll Berbasis Blockchain  
**Versi:** 1.0  
**Tanggal:** 27 Mei 2026  

Dokumen ini menyajikan sequence diagram untuk setiap alur utama sistem Payana menggunakan sintaks Mermaid (`sequenceDiagram`). Diagram menggambarkan interaksi antara aktor, komponen frontend, backend, smart contract, dan layanan eksternal.

---

## Daftar Diagram

| No. | Judul | Use Case Terkait |
|---|---|---|
| SD-01 | Login & Deteksi Role | UC-01 |
| SD-02 | Registrasi Karyawan & Persetujuan Owner | UC-02, UC-03 |
| SD-03 | Klaim EWA (Full Flow) | UC-05 |
| SD-04 | PHK Multi-Signature | UC-06 |
| SD-05 | Pinjaman Koperasi & Auto-Repay | UC-07 |

---

## SD-01: Login & Deteksi Role

Diagram ini menggambarkan alur autentikasi pengguna melalui Privy hingga sistem mendeteksi role dan mengarahkan pengguna ke halaman yang sesuai.

```mermaid
sequenceDiagram
    autonumber
    actor Pengguna
    participant FE as Frontend (Next.js)
    participant Privy as Privy Auth
    participant BE as Backend (NestJS)
    participant DB as Database (PostgreSQL)

    Pengguna->>FE: Buka aplikasi Payana
    FE->>FE: Periksa token JWT di localStorage

    alt Token JWT masih valid
        FE->>BE: GET /auth/me (Bearer JWT)
        BE->>DB: Query pengguna berdasarkan wallet address
        DB-->>BE: Data pengguna + role
        BE-->>FE: { role, profile, walletAddress }
    else Token tidak ada / kedaluwarsa
        FE->>Pengguna: Tampilkan halaman Login
        Pengguna->>FE: Klik "Login dengan Privy"
        FE->>Privy: Inisiasi autentikasi (email / Google / wallet)
        Privy->>Pengguna: Tampilkan modal autentikasi
        Pengguna->>Privy: Masukkan kredensial / konfirmasi
        Privy-->>FE: JWT + walletAddress (embedded wallet)
        FE->>BE: GET /auth/me (Bearer JWT baru)
        BE->>DB: Query pengguna berdasarkan wallet address
        DB-->>BE: Data pengguna + role
        BE-->>FE: { role, profile, walletAddress }
    end

    FE->>FE: Evaluasi nilai role

    alt role = "owner"
        FE->>Pengguna: Redirect ke /owner/dashboard
    else role = "hr"
        FE->>Pengguna: Redirect ke /hr/vault
    else role = "legal"
        FE->>Pengguna: Redirect ke /hr/phk
    else role = "employee"
        FE->>Pengguna: Redirect ke /employee/ewa
    else role = null
        FE->>Pengguna: Redirect ke /onboarding
    end
```

---

## SD-02: Registrasi Karyawan Baru & Persetujuan Owner SaaS

Diagram ini menggambarkan dua fase: (1) pengisian formulir pendaftaran oleh calon karyawan, dan (2) proses review serta persetujuan oleh Owner SaaS. Kedua fase ini dapat terjadi pada sesi yang berbeda.

```mermaid
sequenceDiagram
    autonumber
    actor Karyawan as Karyawan (Calon)
    actor Owner as Owner SaaS
    participant FE_K as Frontend (Karyawan)
    participant FE_O as Frontend (Owner)
    participant BE as Backend (NestJS)
    participant DB as Database (PostgreSQL)
    participant Notif as Notifikasi (Email/In-App)

    Note over Karyawan, DB: FASE 1 — Pengisian Formulir Registrasi

    Karyawan->>FE_K: Akses /onboarding (role = null)
    FE_K->>Karyawan: Tampilkan formulir pendaftaran
    Karyawan->>FE_K: Isi nama, NIK, nomor HP, email, nama perusahaan
    Karyawan->>FE_K: Klik tombol "Daftar"

    FE_K->>BE: POST /auth/profile (data PII mentah + JWT)
    BE->>BE: Enkripsi data PII menggunakan AES-256
    BE->>DB: Simpan profil terenkripsi (tabel users)
    DB-->>BE: Profil tersimpan
    BE-->>FE_K: 201 Created { profileId }

    FE_K->>BE: POST /registration/request (walletAddress, companyId + JWT)
    BE->>DB: Buat entri permohonan (status: pending)
    DB-->>BE: Permohonan tersimpan
    BE-->>FE_K: 201 Created { requestId, status: "pending" }

    FE_K->>Karyawan: Tampilkan halaman konfirmasi "Menunggu persetujuan"

    Note over Owner, DB: FASE 2 — Review & Persetujuan oleh Owner SaaS

    BE->>Notif: Kirim notifikasi ke Owner (permohonan baru masuk)
    Notif->>Owner: Notifikasi email / in-app

    Owner->>FE_O: Login dan akses /owner/dashboard
    FE_O->>BE: GET /registration/pending (JWT Owner)
    BE->>DB: Query semua permohonan berstatus pending
    DB-->>BE: Daftar permohonan
    BE-->>FE_O: Array permohonan pending
    FE_O->>Owner: Tampilkan daftar permohonan

    Owner->>FE_O: Klik nama karyawan untuk melihat detail
    FE_O->>BE: GET /registration/:requestId (JWT Owner)
    BE->>DB: Query detail permohonan + dekripsi PII untuk Owner
    DB-->>BE: Data detail karyawan
    BE-->>FE_O: Detail permohonan (PII terdekripsi)
    FE_O->>Owner: Tampilkan detail permohonan

    alt Owner menyetujui
        Owner->>FE_O: Klik "Setujui"
        FE_O->>BE: PATCH /registration/:address/approve (JWT Owner)
        BE->>DB: UPDATE status = "approved", role = "employee"
        DB-->>BE: Berhasil diperbarui
        BE->>Notif: Kirim notifikasi ke HR & Karyawan (disetujui)
        Notif->>Karyawan: Notifikasi "Pendaftaran Anda disetujui"
        BE-->>FE_O: 200 OK { status: "approved" }
        FE_O->>Owner: Tampilkan konfirmasi "Karyawan berhasil disetujui"
    else Owner menolak
        Owner->>FE_O: Klik "Tolak" + isi alasan penolakan
        FE_O->>BE: PATCH /registration/:address/reject { reason } (JWT Owner)
        BE->>DB: UPDATE status = "rejected", rejectionReason = reason
        DB-->>BE: Berhasil diperbarui
        BE->>Notif: Kirim notifikasi ke Karyawan (ditolak + alasan)
        Notif->>Karyawan: Notifikasi "Pendaftaran Anda ditolak: [alasan]"
        BE-->>FE_O: 200 OK { status: "rejected" }
        FE_O->>Owner: Tampilkan konfirmasi "Permohonan berhasil ditolak"
    end
```

---

## SD-03: Klaim EWA — Full Flow

Diagram ini menggambarkan alur lengkap klaim Earned Wage Access: dari interaksi karyawan di frontend, pengemasan UserOperation (ERC-4337), validasi backend, hingga eksekusi on-chain dan pembaruan status melalui webhook Alchemy.

```mermaid
sequenceDiagram
    autonumber
    actor Karyawan
    participant FE as Frontend (Next.js)
    participant Privy as Privy (Embedded Wallet)
    participant BE as Backend (NestJS)
    participant Paymaster as Paymaster (Alchemy)
    participant Bundler as Bundler (Base Sepolia)
    participant SC as CompanyVault (Smart Contract)
    participant Koperasi as EmployeeLiquidityContract
    participant Alchemy as Alchemy Webhook
    participant DB as Database (PostgreSQL)
    participant WS as WebSocket Server

    Karyawan->>FE: Akses /employee/ewa
    FE->>SC: eth_call: getAccruedBalance(walletAddress)
    SC-->>FE: Saldo terakruasi (IDRX)
    FE->>Karyawan: Tampilkan saldo real-time + tombol "Tarik Gaji"

    Karyawan->>FE: Klik tombol "Tarik Gaji"
    FE->>FE: Konstruksi UserOperation (callData: claimSalary())

    FE->>Privy: Minta tanda tangan UserOperation (silent signing)
    Note over Privy: Tidak ada popup konfirmasi tambahan<br/>Penandatanganan berjalan di background
    Privy-->>FE: UserOperation yang telah ditandatangani (signature)

    FE->>BE: POST /bundler/relay { signedUserOp, JWT }

    BE->>BE: Validasi JWT karyawan
    BE->>DB: Periksa rate limit (klaim < 10/jam untuk address ini)

    alt Rate limit belum tercapai
        DB-->>BE: Rate limit OK
        BE->>DB: Validasi stream aktif untuk walletAddress
        DB-->>BE: Stream aktif terkonfirmasi

        BE->>Paymaster: Minta sponsorship gas untuk UserOperation
        Paymaster-->>BE: UserOperation dengan paymasterData terlampir

        BE->>Bundler: eth_sendUserOperation (UserOperation + paymasterData)
        Bundler->>SC: Eksekusi CompanyVault.claimSalary(walletAddress)

        alt Karyawan memiliki pinjaman koperasi aktif
            SC->>Koperasi: autoRepay(walletAddress)
            Note over Koperasi: Potong cicilan dari jumlah klaim
            Koperasi-->>SC: Jumlah cicilan terpotong
        end

        SC->>SC: Hitung distribusi:<br/>93% → karyawan<br/>5% → Compliance Vault<br/>2% → Severance Vault
        SC->>SC: Transfer IDRX ke masing-masing penerima
        SC-->>Bundler: Event SalaryClaimed emitted

        Bundler-->>BE: Transaction hash

        Note over Alchemy, DB: Konfirmasi on-chain (~2 detik di Base)
        Alchemy->>BE: POST /webhook/alchemy (event SalaryClaimed)
        BE->>DB: Catat audit log transaksi (txHash, amount, timestamp)
        DB-->>BE: Log tersimpan

        BE->>WS: Emit event "salary_claimed" ke room karyawan
        WS->>FE: WebSocket message { txHash, netAmount, deductions }
        FE->>SC: Refresh: getAccruedBalance(walletAddress)
        SC-->>FE: Saldo = 0
        FE->>Karyawan: Tampilkan notifikasi sukses + saldo direset ke 0

        BE-->>FE: 200 OK { txHash, status: "submitted" }

    else Rate limit terlampaui
        DB-->>BE: Rate limit exceeded
        BE-->>FE: 429 Too Many Requests { retryAfterMinutes }
        FE->>Karyawan: Tampilkan pesan "Batas klaim tercapai, coba lagi dalam [X] menit"
    end
```

---

## SD-04: PHK Multi-Signature

Diagram ini menggambarkan alur Pemutusan Hubungan Kerja (PHK) yang memerlukan dua tanda tangan: proposal dari HR Manager dan persetujuan dari Legal Officer, sebelum HR dapat mengeksekusi terminasi secara on-chain.

```mermaid
sequenceDiagram
    autonumber
    actor HR as HR Manager
    actor Legal as Legal Officer
    participant FE_HR as Frontend (HR)
    participant FE_LG as Frontend (Legal)
    participant Privy_HR as Privy (HR Wallet)
    participant Privy_LG as Privy (Legal Wallet)
    participant BE as Backend (NestJS)
    participant SC as CompanyVault (Smart Contract)
    participant SBT as EmploymentSBT (Smart Contract)
    participant Alchemy as Alchemy Webhook
    participant DB as Database (PostgreSQL)
    participant Notif as Notifikasi (Email/In-App)

    Note over HR, DB: TAHAP 1 — HR Mengajukan Proposal PHK

    HR->>FE_HR: Akses /hr/phk → klik "Buat Proposal PHK"
    FE_HR->>HR: Tampilkan formulir proposal (nama karyawan, alasan, catatan)
    HR->>FE_HR: Isi formulir dan klik "Ajukan Proposal"

    FE_HR->>Privy_HR: Minta tanda tangan transaksi proposeTermination
    Privy_HR-->>FE_HR: Transaksi ditandatangani
    FE_HR->>SC: CompanyVault.proposeTermination(employeeAddr, reason)
    SC->>SC: Validasi HR_ROLE pemanggil
    SC->>SC: Simpan proposal (status: PENDING_LEGAL)
    SC-->>FE_HR: Event TerminationProposed emitted

    Alchemy->>BE: Webhook: event TerminationProposed
    BE->>DB: Catat proposal PHK (status: menunggu_legal)
    BE->>Notif: Kirim notifikasi ke Legal Officer
    Notif->>Legal: Email/in-app: "Ada proposal PHK yang perlu ditinjau"

    FE_HR->>HR: Tampilkan konfirmasi "Proposal PHK berhasil diajukan"

    Note over Legal, DB: TAHAP 2 — Legal Officer Meninjau & Menyetujui

    Legal->>FE_LG: Login → akses /hr/phk
    FE_LG->>BE: GET /termination/pending (JWT Legal)
    BE->>DB: Query proposal berstatus menunggu_legal
    DB-->>BE: Daftar proposal
    BE-->>FE_LG: Array proposal PHK
    FE_LG->>Legal: Tampilkan daftar proposal dengan status "Menunggu Persetujuan"

    Legal->>FE_LG: Klik proposal untuk melihat detail
    FE_LG->>Legal: Tampilkan detail: nama karyawan, alasan, tanggal pengajuan

    alt Legal menyetujui
        Legal->>FE_LG: Klik "Setujui"
        FE_LG->>Privy_LG: Minta tanda tangan approveTermination
        Privy_LG-->>FE_LG: Transaksi ditandatangani
        FE_LG->>SC: CompanyVault.approveTermination(employeeAddr)
        SC->>SC: Validasi LEGAL_ROLE pemanggil
        SC->>SC: Update status proposal → APPROVED
        SC-->>FE_LG: Event TerminationApproved emitted

        Alchemy->>BE: Webhook: event TerminationApproved
        BE->>DB: Update status → siap_dieksekusi
        BE->>Notif: Kirim notifikasi ke HR Manager
        Notif->>HR: "PHK disetujui Legal, siap dieksekusi"
        FE_LG->>Legal: Konfirmasi "Proposal PHK berhasil disetujui"

    else Legal menolak
        Legal->>FE_LG: Klik "Tolak" + isi alasan
        FE_LG->>Privy_LG: Minta tanda tangan rejectTermination
        Privy_LG-->>FE_LG: Transaksi ditandatangani
        FE_LG->>SC: CompanyVault.rejectTermination(employeeAddr, reason)
        SC->>SC: Update status proposal → REJECTED
        SC-->>FE_LG: Event TerminationRejected emitted

        Alchemy->>BE: Webhook: event TerminationRejected
        BE->>DB: Update status → ditolak_legal
        BE->>Notif: Kirim notifikasi ke HR Manager (+ alasan penolakan)
        Notif->>HR: "Proposal PHK ditolak Legal: [alasan]"
        FE_LG->>Legal: Konfirmasi "Proposal PHK berhasil ditolak"
    end

    Note over HR, DB: TAHAP 3 — HR Mengeksekusi PHK (hanya jika disetujui)

    HR->>FE_HR: Akses /hr/phk → lihat proposal berstatus "Siap Dieksekusi"
    HR->>FE_HR: Klik "Eksekusi PHK"
    FE_HR->>Privy_HR: Minta tanda tangan executeTermination
    Privy_HR-->>FE_HR: Transaksi ditandatangani
    FE_HR->>SC: CompanyVault.executeTermination(employeeAddr)

    SC->>SC: Validasi status proposal = APPROVED
    SC->>SC: Batalkan stream gaji karyawan (cancelStream)
    SC->>SBT: EmploymentSBT.revoke(employeeAddr)
    SBT-->>SC: SBT berhasil dicabut
    SC->>SC: Cairkan Severance Vault → transfer IDRX ke wallet karyawan
    SC-->>FE_HR: Event TerminationExecuted emitted

    Alchemy->>BE: Webhook: event TerminationExecuted
    BE->>DB: Update status karyawan → terminated
    BE->>DB: Catat audit log terminasi (txHash, timestamp, amount pesangon)
    DB-->>BE: Berhasil disimpan

    FE_HR->>HR: Konfirmasi "PHK berhasil dieksekusi. Pesangon telah dikirim."
```

---

## SD-05: Pinjaman Koperasi & Mekanisme Auto-Repay

Diagram ini menggambarkan dua sub-alur yang saling berkaitan: (1) pengajuan pinjaman oleh karyawan dari liquidity pool, dan (2) pemotongan cicilan otomatis (auto-repay) yang terjadi setiap kali karyawan melakukan klaim EWA berikutnya.

```mermaid
sequenceDiagram
    autonumber
    actor Karyawan
    participant FE as Frontend (Next.js)
    participant Privy as Privy (Embedded Wallet)
    participant BE as Backend (NestJS)
    participant Bundler as Bundler (Base Sepolia)
    participant Koperasi as EmployeeLiquidityContract
    participant SC as CompanyVault
    participant Alchemy as Alchemy Webhook
    participant DB as Database (PostgreSQL)
    participant WS as WebSocket Server

    Note over Karyawan, DB: SUB-ALUR 1 — Pengajuan Pinjaman Koperasi

    Karyawan->>FE: Akses /employee/koperasi → tab "Pinjam"
    FE->>Koperasi: eth_call: getLoanLimit(walletAddress)
    Koperasi-->>FE: Limit pinjaman (80% gaji bulanan)
    FE->>Koperasi: eth_call: getPoolBalance()
    Koperasi-->>FE: Saldo liquidity pool tersedia
    FE->>Koperasi: eth_call: getActiveLoan(walletAddress)
    Koperasi-->>FE: Status pinjaman aktif (null jika tidak ada)
    FE->>Karyawan: Tampilkan: limit, estimasi cicilan, saldo pool

    Karyawan->>FE: Masukkan jumlah pinjaman + klik "Ajukan Pinjaman"
    FE->>FE: Validasi frontend: jumlah <= limit maksimal

    FE->>Privy: Konstruksi & tanda tangan UserOperation (borrowFromPool)
    Note over Privy: Silent signing via embedded wallet
    Privy-->>FE: UserOperation ditandatangani

    FE->>BE: POST /bundler/relay { signedUserOp, JWT }
    BE->>BE: Validasi JWT + rate limit
    BE->>Bundler: eth_sendUserOperation

    Bundler->>Koperasi: EmployeeLiquidityContract.borrowFromPool(amount)
    Koperasi->>Koperasi: Validasi: amount <= 80% gaji
    Koperasi->>Koperasi: Validasi: pool likuiditas mencukupi
    Koperasi->>Koperasi: Validasi: tidak ada pinjaman aktif lain
    Koperasi->>Koperasi: Transfer IDRX dari pool ke wallet karyawan
    Koperasi->>Koperasi: Catat entri pinjaman aktif (amount, timestamp)
    Koperasi-->>Bundler: Event LoanDisbursed emitted

    Alchemy->>BE: Webhook: event LoanDisbursed
    BE->>DB: Catat transaksi pinjaman (amount, walletAddress, timestamp)
    DB-->>BE: Tersimpan

    BE->>WS: Emit "loan_disbursed" ke room karyawan
    WS->>FE: WebSocket message { loanAmount, repaymentSchedule }
    FE->>Karyawan: Notifikasi "Pinjaman berhasil. Dana [jumlah] IDRX masuk ke wallet Anda"
    FE->>FE: Perbarui tab "Pinjaman Aktif" dengan detail cicilan

    Note over Karyawan, DB: SUB-ALUR 2 — Auto-Repay Saat Klaim EWA Berikutnya

    Note over Karyawan, SC: (Alur ini terjadi otomatis dalam satu transaksi claimSalary)

    Karyawan->>FE: Akses /employee/ewa → klik "Tarik Gaji"
    FE->>Privy: Konstruksi & tanda tangan UserOperation (claimSalary)
    Privy-->>FE: UserOperation ditandatangani

    FE->>BE: POST /bundler/relay { signedUserOp, JWT }
    BE->>Bundler: eth_sendUserOperation (dengan Paymaster)
    Bundler->>SC: CompanyVault.claimSalary(walletAddress)

    SC->>Koperasi: autoRepay(walletAddress)
    Note over Koperasi: Periksa pinjaman aktif karyawan
    Koperasi->>Koperasi: Hitung jumlah cicilan yang jatuh tempo
    Koperasi->>Koperasi: Potong cicilan dari jumlah klaim
    Koperasi->>Koperasi: Transfer cicilan dari klaim ke pool likuiditas
    Koperasi->>Koperasi: Update saldo pinjaman (kurangi pokok)
    Koperasi-->>SC: Jumlah bersih setelah repayment

    SC->>SC: Distribusi sisa dana:
    Note over SC: 93% dari sisa → wallet karyawan<br/>5% → Compliance Vault<br/>2% → Severance Vault
    SC-->>Bundler: Event SalaryClaimedWithRepayment emitted

    Alchemy->>BE: Webhook: event SalaryClaimedWithRepayment
    BE->>DB: Catat audit log (grossAmount, repaymentAmount, netAmount)
    DB-->>BE: Tersimpan

    BE->>WS: Emit "salary_claimed" ke room karyawan
    WS->>FE: WebSocket { grossAmount, cicilan, netAmount }
    FE->>Karyawan: Tampilkan rincian: gaji bruto, potongan cicilan, gaji bersih diterima

    alt Pinjaman Lunas Sepenuhnya
        Koperasi->>Koperasi: Tandai pinjaman sebagai LUNAS
        Alchemy->>BE: Webhook: event LoanRepaid
        BE->>DB: Update status pinjaman → lunas
        BE->>WS: Emit "loan_repaid"
        WS->>FE: WebSocket { status: "loan_repaid" }
        FE->>Karyawan: Notifikasi "Selamat! Pinjaman koperasi Anda telah lunas."
    end
```

---

## Catatan Teknis

### Konvensi Penulisan Diagram

1. **`autonumber`** — Setiap pesan diberi nomor urut otomatis untuk memudahkan referensi dalam penjelasan naratif.
2. **`alt/else`** — Digunakan untuk menggambarkan percabangan kondisional (happy path vs. alternatif/pengecualian).
3. **`Note over`** — Digunakan untuk memberikan keterangan kontekstual pada blok interaksi tertentu.
4. **Garis padat (`->>`)** — Merepresentasikan pengiriman pesan/permintaan.
5. **Garis putus (`-->>`)** — Merepresentasikan balasan/respons.

### Komponen Sistem

| Komponen | Teknologi | Keterangan |
|---|---|---|
| Frontend | Next.js 15+ (App Router) | Antarmuka pengguna berbasis React |
| Backend | NestJS (Node.js) | REST API + WebSocket server |
| Database | PostgreSQL | Penyimpanan data off-chain |
| Auth | Privy | Embedded wallet + JWT autentikasi |
| Smart Contract | Solidity (EVM) | CompanyVault, EmployeeLiquidityContract, SBT |
| Blockchain | Base Sepolia | Layer 2 EVM (testnet) |
| Bundler | Alchemy (ERC-4337) | Memproses UserOperation batch |
| Paymaster | Alchemy | Mensponsori gas karyawan |
| Webhook | Alchemy Notify | Event listener on-chain → backend |
| Token | IDRX (ERC-20) | Stablecoin IDR digital |
