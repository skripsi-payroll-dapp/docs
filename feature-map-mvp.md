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

---

## Out of Scope (MVP)

Fitur-fitur berikut **tidak akan dikerjakan** pada MVP dan direncanakan untuk versi selanjutnya:

- ESOP dengan secondary market / likuiditas
- Payroll multi-chain
- Integrasi HRIS pihak ketiga (Talenta, Gadjian, SAP)
- Fiat on/off ramp langsung (beli IDRX dalam platform)
- Bridge IDRX antar chain (Base ↔ Ethereum mainnet)
- Notifikasi push mobile native (cukup email untuk MVP)

---

## Visualisasi Timeline

```
Sprint 1   Sprint 2   Sprint 3   Sprint 4   Sprint 5   Sprint 6
─────────  ─────────  ─────────  ─────────  ─────────  ─────────
Core       Compliance Work ID    Cliff      Koperasi   Dashboard
Payroll    & PHK      & Auth     Vesting    & Pool     & Launch
(3 minggu) (3 minggu) (2 minggu) (2 minggu) (3 minggu) (4 minggu)
    │          │          │          │          │          │
    └──────────┴──────────┴──────────┴──────────┴──────────┘
                        ~17 minggu total
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
