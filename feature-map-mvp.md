# Feature Map (MVP)

---

## Priority Legend

| Level | Label | Keterangan |
|---|---|---|
| P0 | Must Have | Wajib ada untuk MVP — platform tidak bisa launch tanpa ini |
| P1 | Should Have | Sangat direkomendasikan — berikan nilai signifikan |
| P2 | Nice to Have | Tambahan jika waktu memungkinkan |

---

## Feature Map Lengkap

| Modul | Fitur | Prioritas | Sprint |
|---|---|---|---|
| **A. Core Payroll** | Company vault deployment & funding | P0 — Must | Sprint 1 |
| | Employee onboarding & stream setup | P0 — Must | Sprint 1 |
| | EWA live streaming & gasless claim | P0 — Must | Sprint 1 |
| | Auto-split 93/5/2 per claim | P0 — Must | Sprint 1 |
| **B. Work ID** | Login email/SSO via Privy (EVM WaaS) | P0 — Must | Sprint 3 |
| | Gasless tx via ERC-4337 Paymaster | P0 — Must | Sprint 3 |
| | Proof of Employment SBT ERC-5192 (opsional) | P2 — Nice | Sprint 3 |
| **C. Compliance** | Severance escrow otomatis (2%) | P0 — Must | Sprint 2 |
| | Multi-sig PHK guard (HR + Legal) | P0 — Must | Sprint 2 |
| | ComplianceVault BPJS/PPh21 routing | P0 — Must | Sprint 2 |
| | Rekonsiliasi manual akhir bulan | P1 — Should | Sprint 2 |
| **D. Cliff Vesting** | Bonus retensi cliff setup | P1 — Should | Sprint 4 |
| | Masa percobaan cliff (3 bulan) | P1 — Should | Sprint 4 |
| | ESOP cliff + vest bertahap | P2 — Nice | Sprint 4 |
| **E. Koperasi** | EmployeeLiquidityPool deposit & withdraw | P1 — Should | Sprint 5 |
| | Pinjaman karyawan + collateral stream | P1 — Should | Sprint 5 |
| | Auto-repayment via claim_salary external call | P1 — Should | Sprint 5 |
| **F. Dashboard** | HR dashboard (vault, stream, compliance) | P0 — Must | Sprint 6 |
| | Employee dashboard EWA live tracker | P0 — Must | Sprint 6 |
| | External transfer ke MetaMask/EVM wallet/exchange | P1 — Should | Sprint 6 |
| **G. Attendance & Cuti** | Clock In / Clock Out tracking | P1 — Should | Sprint 7 |
| | Pengajuan Cuti & Unpaid Leave | P1 — Should | Sprint 7 |
| | Auto-pause stream EWA jika Unpaid Leave | P1 — Should | Sprint 7 |
| **H. Expense & Reimburse**| Pengajuan bon operasional karyawan | P1 — Should | Sprint 7 |
| | HR Approval & instan payout (IDRX) | P1 — Should | Sprint 7 |
| **I. Bonus & Bounty** | Pembuatan Task/KPI Bounty board | P2 — Nice | Sprint 8 |
| | Peer-to-peer tipping IDRX antar karyawan | P2 — Nice | Sprint 8 |
| **J. Off-Ramping** | Manajemen rekening bank lokal | P1 — Should | Sprint 8 |
| | Simulasi tarik IDRX ke Rupiah (Payment Gateway) | P1 — Should | Sprint 8 |
| **K. Sistem Notifikasi & Audit**| Activity Log (HR Jejak Audit) | P0 — Must | Sprint 8 |
| | Notifikasi in-app alert (Lonceng) | P0 — Must | Sprint 8 |
| **L. Salary Privacy** | Encrypted salary storage via Inco FHE (`euint256`) | P1 — Should ✅ | Sprint 7 |
| | Employee self-decrypt: lihat gaji sendiri via `getEncryptedSalary()` | P1 — Should ✅ | Sprint 7 |
| | HR aggregate view: total payroll via `aggregateTotalPayroll()` | P1 — Should ✅ | Sprint 7 |
| | Compliance delegated decryption key via `grantViewingKey()` | P2 — Nice ✅ | Sprint 7 |

---

## Out of Scope (MVP)

Fitur-fitur berikut **tidak akan dikerjakan** pada MVP dan direncanakan untuk versi selanjutnya:

- ESOP dengan secondary market / likuiditas
- Payroll multi-chain
- Integrasi HRIS pihak ketiga (Talenta, Gadjian, SAP)
- Fiat on/off ramp langsung (beli IDRX dalam platform)
- Bridge IDRX antar chain (Base ↔ Ethereum mainnet)
- Notifikasi push mobile native (cukup email untuk MVP)
- **Stealth addresses** (EIP-5564) untuk menyembunyikan identitas penerima transfer — direncanakan post-MVP
- **Private streaming rate** (hide `flowRate` on-chain) — memerlukan migrasi penuh ke Inco FHE untuk `employeeStreams`

---

## Visualisasi Timeline

```text
Sprint 1-2: Core Payroll, Compliance & PHK
Sprint 3-4: Work ID, Auth, Cliff Vesting
Sprint 5-6: Koperasi, Dashboard & Launch
Sprint 7: Confidential Payroll (Inco FHE) + Attendance, Cuti, Expense & Reimburse
Sprint 8: Bonus, Bounty, Off-Ramping, Audit Log
```

---

## Mekanisme Auto-Split (Core)

Setiap `claim_salary` memicu split atomic dalam satu transaksi:

```
Accrued Amount
      │
      ├── 93% ──→ Work ID ATA (gaji bersih karyawan)
      ├──  5% ──→ ComplianceVault (BPJS Kesehatan + Ketenagakerjaan + PPh21)
      └──  2% ──→ SeveranceVault (pesangon on-chain, state: LOCKED)
```

> Persentase split dapat di-override oleh HR per karyawan (misal bracket PPh21 berbeda).
