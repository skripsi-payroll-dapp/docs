# Sprint Planning & Dependencies

---

## Ringkasan Sprint

| Sprint | Scope | Durasi | Output |
|---|---|---|---|
| **Sprint 1** | PayrollContract core: companies, vaultBalances, employeeStreams, claimSalary + split 93/5/2 | 3 minggu | Vault + streaming on Base Sepolia |
| **Sprint 2** | Compliance: severanceVaults, complianceVaults, multi-sig PHK (propose/approve/execute), Safe integration | 3 minggu | Severance + PHK flow on Base Sepolia |
| **Sprint 3** | Work ID: Privy EVM integration, ERC-4337 Paymaster, gasless claim, Alchemy indexer | 2 minggu | End-to-end gasless claim |
| **Sprint 4** | Cliff vesting: cliffVests mapping, create/claim/forfeit, 3 tipe vest | 2 minggu | Cliff vesting on Base Sepolia |
| **Sprint 5** | Koperasi: EmployeeLiquidityContract, pool/loan/external call auto-repayment, liquidation logic | 3 minggu | Koperasi on Base Sepolia |
| **Sprint 6** | Dashboard HR + Employee, frontend integration, QA E2E, security audit | 4 minggu | Demo-ready on Base Sepolia |
| **Sprint 7** | Confidential Payroll: Inco FHE `euint256` encrypted salary, viewing key, Ponder + backend integration | 3 minggu | ✅ Smart contract + infra done — frontend pending |

**Total estimasi:** ~20 minggu (~5 bulan)

---

## Dependency Map

```
Sprint 1 (Core Payroll)
    │
    ├──► Sprint 2 (Compliance)
    │        Severance tidak bisa terakumulasi tanpa claim
    │
    ├──► Sprint 3 (Work ID & Auth)
    │        Karyawan tidak bisa claim EWA tanpa stream
    │
    ├──► Sprint 4 (Cliff Vesting)
    │        Vault harus ada untuk lock IDRX
    │
    ├──► Sprint 5 (Koperasi)  ◄── Sprint 3 juga required
    │        claim_salary harus gasless sebelum auto-repayment external call bisa ditest
    │
    ├──► Sprint 6 (Dashboard & Launch) ◄── Sprint 1–5 semua selesai
    │        Dashboard tidak bisa diintegrasikan tanpa semua smart contract selesai
    │
    └──► Sprint 7 (Confidential Payroll) ◄── Sprint 6 selesai
             FHE hanya bisa diintegrasikan ke frontend setelah dashboard base selesai
```

| Sprint | Depends On | Blocker Jika Tidak Selesai |
|---|---|---|
| Sprint 1 | — | **Semua sprint berikutnya blocked** |
| Sprint 2 | Sprint 1 | Severance tidak bisa terakumulasi |
| Sprint 3 | Sprint 1 | Karyawan tidak bisa claim EWA |
| Sprint 4 | Sprint 1 | Tidak ada cliff vesting |
| Sprint 5 | Sprint 1 + Sprint 3 | Auto-repayment external call tidak bisa ditest |
| Sprint 6 | Sprint 1–5 semua | Dashboard tidak bisa diintegrasikan |
| Sprint 7 | Sprint 6 | FHE UI tidak bisa diintegrasikan tanpa base dashboard |

---

## Sprint 1 — Core Payroll (3 minggu)

### Goal
Vault perusahaan bisa di-deploy. Karyawan bisa didaftarkan. Streaming gaji berjalan. Claim EWA berhasil dengan split 93/5/2.

### Tasks

| # | Task | Komponen | Estimasi |
|---|---|---|---|
| 1.1 | Setup Foundry project, workspace, CI pipeline | Infrastructure | 1 hari |
| 1.2 | Implementasi `companies` mapping + `initializeVault()` | Smart Contract | 2 hari |
| 1.3 | Implementasi `vaultBalances` + IDRX ERC-20 deposit | Smart Contract | 1 hari |
| 1.4 | Implementasi `complianceVaults` mapping (deposit only — withdraw Sprint 2) | Smart Contract | 1 hari |
| 1.5 | Implementasi `employeeStreams` mapping + `startStream()` | Smart Contract | 2 hari |
| 1.6 | Implementasi `claimSalary()` + auto-split 93/5/2 | Smart Contract | 3 hari |
| 1.7 | Implementasi `pauseStream()`, `resumeStream()`, `cancelStream()` | Smart Contract | 2 hari |
| 1.8 | Unit tests semua fungsi (forge test) | Testing | 2 hari |
| 1.9 | Deploy ke Base Sepolia + manual QA | QA | 1 hari |

### Definition of Done Sprint 1
- [ ] `initializeVault()` berhasil setup company + vault + compliance state atomic
- [ ] `claimSalary()` split 93/5/2 berjalan tanpa error
- [ ] Semua fungsi diproteksi `onlyHR` / `onlyEmployee` modifier
- [ ] Unit test coverage > 90% (forge coverage)
- [ ] Contract terdeploy di Base Sepolia

---

## Sprint 2 — Compliance (3 minggu)

### Goal
Severance terakumulasi otomatis. PHK multi-sig flow berjalan end-to-end. BPJS/PPh21 routing tersedia.

### Tasks

| # | Task | Komponen | Estimasi |
|---|---|---|---|
| 2.1 | Implementasi `severanceVaults` mapping + state machine | Smart Contract | 2 hari |
| 2.2 | Integrasikan 2% severance ke `claimSalary()` (Sprint 1 update) | Smart Contract | 1 hari |
| 2.3 | Implementasi `resignEmployee()` → RETURNED | Smart Contract | 1 hari |
| 2.4 | Implementasi `terminations` mapping + `proposeTermination()` | Smart Contract | 2 hari |
| 2.5 | Implementasi `approveTermination()` (HR + Legal, order-independent) | Smart Contract | 2 hari |
| 2.6 | Implementasi `executeTermination()` + auto-expire 7 hari | Smart Contract | 2 hari |
| 2.7 | ComplianceVault withdraw + rekonsiliasi export | Smart Contract + Backend | 2 hari |
| 2.8 | ~~Safe Protocol integration~~ → Implementasi HR_ROLE + LEGAL_ROLE via OpenZeppelin AccessControl (built into PayrollContract — no external dependency) | Smart Contract | ✅ Done |
| 2.9 | Unit + integration tests PHK flow (forge test) | Testing | 2 hari |
| 2.10 | Deploy ke Base Sepolia + QA full flow | QA | 1 hari |

### Definition of Done Sprint 2
- [ ] `severanceVaults` accumulate otomatis dengan setiap claim
- [ ] PHK multi-sig flow selesai end-to-end (propose → approve HR → approve Legal → execute)
- [ ] Proposal expired otomatis setelah 7 hari
- [ ] Events emitted untuk semua state transitions (untuk indexer)

---

## Sprint 3 — Work ID & Auth (2 minggu)

### Goal
Karyawan bisa login dengan email, mendapat Work ID (Ethereum address) otomatis, dan claim EWA tanpa gas fee via ERC-4337.

### Tasks

| # | Task | Komponen | Estimasi |
|---|---|---|---|
| 3.1 | Setup Privy SDK (EVM mode) di Next.js frontend | Frontend | 1 hari |
| 3.2 | Implementasi login flow (Email OTP, Google SSO, SMS) | Frontend | 2 hari |
| 3.3 | Integrasi Privy embedded Smart Account + Work ID creation | Frontend | 1 hari |
| 3.4 | Setup ERC-4337 Bundler backend (Node.js) + Paymaster config (Pimlico) | Backend | 2 hari |
| 3.5 | Implementasi rate limiting (max 10 claim/jam) di Bundler | Backend | 1 hari |
| 3.6 | Paymaster ETH balance monitoring + alert | Backend | 1 hari |
| 3.7 | Setup Alchemy RPC + webhook event subscription | Backend | 1 hari |
| 3.8 | End-to-end test: login → claim EWA gasless via UserOperation | Testing | 2 hari |

### Definition of Done Sprint 3
- [ ] Karyawan login email → Work ID (Ethereum address) terbuat otomatis
- [ ] Claim EWA berhasil dalam < 5 detik end-to-end (Base L2)
- [ ] Zero gas fee untuk karyawan (Paymaster menanggung ETH gas)
- [ ] Rate limiting berfungsi (reject > 10 claim/jam)

---

## Sprint 4 — Cliff Vesting (2 minggu)

### Goal
HR bisa membuat cliff vest. Karyawan bisa claim setelah cliff date. Dana forfeited saat resign/PHK sebelum cliff.

### Tasks

| # | Task | Komponen | Estimasi |
|---|---|---|---|
| 4.1 | Implementasi `cliffVests` mapping + state machine | Smart Contract | 2 hari |
| 4.2 | Implementasi `createCliffVest()` (3 tipe: Retention, Probation, ESOP) | Smart Contract | 2 hari |
| 4.3 | Implementasi `claimCliffVest()` (setelah cliffTs) | Smart Contract | 1 hari |
| 4.4 | Implementasi `cancelCliffVest()` (FORFEITED — dana kembali ke vault) | Smart Contract | 1 hari |
| 4.5 | Integrasi forfeit ke `resignEmployee()` dan `executeTermination()` | Smart Contract | 2 hari |
| 4.6 | Unit tests semua skenario (forge test) | Testing | 2 hari |

### Definition of Done Sprint 4
- [ ] `createCliffVest()` mengunci IDRX dari vault ke contract
- [ ] `claimCliffVest()` hanya berhasil jika `block.timestamp >= cliffTs`
- [ ] FORFEITED saat resign/PHK sebelum cliff — dana kembali ke vault
- [ ] Events emitted untuk semua vest state transitions

---

## Sprint 5 — Koperasi (3 minggu)

### Goal
Karyawan bisa deposit idle EWA ke pool, pinjam dari pool, dan cicilan terpotong otomatis saat claim.

### Tasks

| # | Task | Komponen | Estimasi |
|---|---|---|---|
| 5.1 | Setup `EmployeeLiquidityContract.sol` sebagai contract baru | Smart Contract | 1 hari |
| 5.2 | Implementasi `pools` mapping + `initializePool()` | Smart Contract | 1 hari |
| 5.3 | Implementasi `depositToPool()` + `lenderDeposits` mapping | Smart Contract | 2 hari |
| 5.4 | Implementasi `borrowFromPool()` + `loanRecords` mapping | Smart Contract | 2 hari |
| 5.5 | Implementasi external call auto-repayment dari `claimSalary()` | Smart Contract | 3 hari |
| 5.6 | Implementasi `withdrawDeposit()` + yield calculation | Smart Contract | 2 hari |
| 5.7 | Implementasi liquidation logic (grace period 7 hari) | Smart Contract | 2 hari |
| 5.8 | Integration tests external call repayment end-to-end (forge test) | Testing | 2 hari |

### Definition of Done Sprint 5
- [ ] Pool deposit/withdraw berfungsi
- [ ] Pinjaman dibatasi 80% expected gaji
- [ ] Auto-repayment external call terpotong sebelum split 93/5/2
- [ ] Liquidation logic berfungsi setelah grace period

---

## Sprint 6 — Dashboard & Launch (4 minggu)

### Goal
Dashboard HR dan Employee live di Base Sepolia. QA E2E selesai. Siap demo untuk skripsi.

> **Catatan scope:** Proyek ini adalah prototipe skripsi yang berjalan di Base Sepolia (testnet).
> Deployment ke mainnet dan onboarding perusahaan berada di luar scope skripsi.

### Tasks

| # | Task | Komponen | Estimasi |
|---|---|---|---|
| 6.1 | HR Dashboard: vault management, employee list, compliance report | Frontend | 5 hari |
| 6.2 | Employee Dashboard: EWA tracker, severance, koperasi | Frontend | 4 hari |
| 6.3 | External transfer UI (ke MetaMask/exchange EVM) | Frontend | 2 hari |
| 6.4 | Integration testing E2E semua flow di Base Sepolia | QA | 5 hari |
| 6.5 | Static analysis: Slither + Mythril | Audit | 3 hari |
| 6.6 | Perbaikan temuan analisis statis | Smart Contract | 2 hari |

### Definition of Done Sprint 6
- [ ] Dashboard mobile-first berfungsi di semua major browsers
- [ ] Semua flow demo berjalan end-to-end di Base Sepolia
- [ ] Slither/Mythril: zero critical findings

---

## Sprint 7 — Confidential Payroll: Salary Privacy (3 minggu)

### Goal
Gaji karyawan tersimpan sebagai ciphertext terenkripsi on-chain. Employee hanya bisa lihat gaji sendiri. Employee lain yang query contract hanya mendapat ciphertext acak — salary amount tidak bisa diintip meski tahu wallet address rekannya.

### Konteks: Threat yang Diselesaikan
Base adalah public blockchain. Tanpa proteksi, siapapun yang tahu Work ID (wallet address) karyawan lain bisa membaca `employeeStreams[address].flowRate` dan menghitung gaji bulanannya. Sprint ini menutup celah tersebut menggunakan **Inco Lightning FHE** (Fully Homomorphic Encryption co-processor, live di Base Sepolia).

### Tasks

| # | Task | Komponen | Estimasi | Status |
|---|---|---|---|---|
| 7.1 | Setup `@inco/lightning` dependency (npm + foundry.toml remapping) | Infrastructure | 0.5 hari | ✅ Done |
| 7.2 | Buat `ConfidentialCompanyVault.sol` — ekstensi dari `CompanyVault` | Smart Contract | 2 hari | ✅ Done |
| 7.3 | Implementasi `encryptedSalaries: mapping(address => euint256)` (public) | Smart Contract | 1 hari | ✅ Done |
| 7.4 | Implementasi `setEncryptedSalary(address, bytes) payable` — HR only + Inco fee | Smart Contract | 1 hari | ✅ Done |
| 7.5 | Implementasi `getEncryptedSalary(address)` — employee self + HR | Smart Contract | 1 hari | ✅ Done |
| 7.6 | Implementasi `aggregateTotalPayroll()` — homomorphic sum untuk HR | Smart Contract | 1 hari | ✅ Done |
| 7.7 | Setup `grantViewingKey()` + `revokeAuditorAccess()` untuk compliance/auditor | Smart Contract | 2 hari | ✅ Done |
| 7.8 | Unit tests: 19 pass + 6 skip (FHE tests butuh Inco live node) | Testing | 2 hari | ✅ Done |
| 7.9 | Deploy `ConfidentialCompanyVault` ke Base Sepolia | Deployment | 0.5 hari | ✅ Done — `0x4560968670Dd852dACd73c7B8748695eC427e203` |
| 7.10 | Ponder: index EncryptedSalarySet + AuditorViewingKeyGranted events | Ponder | 1 hari | ✅ Done |
| 7.11 | Backend webhook: handle EncryptedSalarySet event | Backend | 0.5 hari | ✅ Done |
| 7.12 | Frontend: update HR salary input — enkripsi client-side sebelum kirim tx | Frontend | 2 hari | ⏳ Sprint 6 |
| 7.13 | Frontend: update Employee dashboard — decrypt + tampilkan gaji sendiri | Frontend | 2 hari | ⏳ Sprint 6 |
| 7.14 | QA: tes semua skenario akses (HR, employee, employee lain, auditor) | QA | 2 hari | ⏳ Sprint 6 |

### Definition of Done Sprint 7
- [x] `setEncryptedSalary()` berhasil menyimpan gaji sebagai ciphertext — tidak ada plaintext di storage atau event
- [x] `getEncryptedSalary()` mengembalikan euint256 handle yang bisa didecrypt oleh employee dan HR
- [x] Employee B tidak bisa membaca salary employee A (ACL-gated via Inco)
- [x] HR bisa melihat aggregate payroll via `aggregateTotalPayroll()` tanpa reveal individual salary
- [x] Delegated viewing key untuk auditor via `grantViewingKey()` dengan time expiry
- [x] `CompanyVault` existing tetap berjalan tanpa perubahan (FHE adalah ekstensi, bukan replacement)
- [ ] Frontend HR dan Employee dashboard terintegrasi dengan FHE flow (Sprint 6)
- [ ] Gas overhead terukur dan terdokumentasi (target: < 5x gas vs plaintext)

### Catatan Arsitektur
- `ConfidentialCompanyVault` adalah **ekstensi opsional** — core payroll (streaming, claim, split 93/5/2) tidak berubah
- `euint64` tidak tersedia di Inco Lightning v1 — digunakan `euint256` (documented di SKPL dan contract NatSpec)
- `flowRate` di `employeeStreams` masih plaintext — **known limitation** (OQ-013)
- Deploy terpisah via `script/DeployConfidential.s.sol`, bukan via PayrollFactory

---

## Risiko & Mitigasi

| Risiko | Probabilitas | Dampak | Mitigasi |
|---|---|---|---|
| Solidity/EVM learning curve tim (jika background Solana) | Sedang | Tinggi | Hire 1 Solidity dev senior; gunakan OpenZeppelin sebagai base |
| IDRX belum tersedia di Base L2 | Sedang | Tinggi | Gunakan USDC sebagai fallback; koordinasi dengan issuer IDRX untuk bridge |
| Audit smart contract mahal/lama | Sedang | Tinggi | Engage firma audit (Trail of Bits / OpenZeppelin) sejak Sprint 3; jalankan Slither lebih awal |
| Privy pricing di scale | Rendah | Sedang | Nego enterprise deal; siapkan migrasi custom MPC di v2 |
| Regulasi OJK untuk koperasi | Sedang | Sedang | Konsultasi legal; dokumentasi closed-loop dengan baik |
| Base L2 network congestion / RPC outage | Rendah | Sedang | Implement retry logic + gas tip di Bundler; fallback ke secondary RPC |
| Paymaster kehabisan ETH | Sedang | Tinggi | Monitor ETH balance Paymaster wallet; alert jika < threshold; auto top-up |
| Reentrancy attack pada contract | Rendah | Sangat Tinggi | Gunakan OpenZeppelin ReentrancyGuard; Checks-Effects-Interactions pattern |
| Inco co-processor downtime/kompromis | Rendah | Sedang | FHE adalah lapisan opsional — fallback ke `CompanyVault` plaintext jika Inco unavailable; dokumentasikan trust assumption di skripsi |
| `flowRate` masih bocor sebagian informasi | Tinggi (known) | Rendah | Didokumentasikan sebagai known limitation; full fix butuh private streaming (post-MVP) |

---

## Timeline Visual

```
     Minggu:  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20
Sprint 1:     [═══════════]
Sprint 2:              [═══════════]
Sprint 3:                       [══════]
Sprint 4:                             [══════]
Sprint 5:                                   [═══════════]
Sprint 6:                                            [════════════]
Sprint 7:                                                         [═══════════]
                                                                              │
                                                                         LAUNCH 🚀
```
