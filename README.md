# Finley Payroll — Product Requirements

> Infrastruktur payroll berbasis blockchain (Base L2) untuk perusahaan Indonesia.
> Token: IDRX (Rupiah stablecoin ERC-20). Network: Base Mainnet (prod) / Base Sepolia (dev).

---

## Dokumen Utama

| Dokumen | Deskripsi |
|---|---|
| [Overview & Background](overview-background.md) | Visi produk, latar belakang masalah, target pengguna |
| [Goals & KPI](goals-kpi.md) | Tujuan bisnis, KPI, definition of done |
| [Technical Architecture](technical-architecture.md) | Tech stack, contract structure, deployed addresses, data flow |
| [Feature Map](feature-map-mvp.md) | Peta fitur MVP + produksi dengan prioritas P0/P1/P2 |
| [Sprint Planning](sprint-planning.md) | Breakdown sprint, dependency map, timeline |
| [Non-Functional Requirements](non-functional-requirements.md) | Performance, security, compliance, usability, scalability |
| [Frontend Requirements](frontend-requirements.md) | Routing, UX principles, komponen, integrasi Web3 |
| [Open Questions](open-questions.md) | Pertanyaan teknis/legal/product yang belum resolved |
| [Black Box Testing](black-box-testing.md) | 37 test cases happy path & bad path per modul |

---

## Functional Requirements per Modul

| Modul | File | Sprint | Status |
|---|---|---|---|
| **A — Core Payroll** | [module-a-core-payroll.md](functional-requirements/module-a-core-payroll.md) | Sprint 1 | ✅ Deployed |
| **B — Work ID & Auth** | [module-b-work-id.md](functional-requirements/module-b-work-id.md) | Sprint 3 + Production | 🔧 Phase 2 pending |
| **C — Compliance & PHK** | [module-c-compliance.md](functional-requirements/module-c-compliance.md) | Sprint 2 | ✅ Deployed |
| **D — Cliff Vesting** | [module-d-cliff-vesting.md](functional-requirements/module-d-cliff-vesting.md) | Sprint 4 | ✅ Deployed |
| **E — Koperasi** | [module-e-koperasi.md](functional-requirements/module-e-koperasi.md) | Sprint 5 | ✅ Deployed |

---

## User Stories

| Persona | File |
|---|---|
| Karyawan | [user-stories/employee.md](user-stories/employee.md) |
| HR / Finance Admin | [user-stories/hr-finance-admin.md](user-stories/hr-finance-admin.md) |
| Legal / Owner | [user-stories/legal-owner.md](user-stories/legal-owner.md) |

---

## Status Implementasi (per 10 Mei 2026)

| Komponen | Status | Catatan |
|---|---|---|
| Smart Contracts (Foundry) | ✅ Deployed | Base Sepolia — 3 contracts |
| Ponder Indexer | ✅ Running | 10 onchain tables |
| Backend (Node.js) | ✅ Running | Port 3001 |
| Frontend — Phase 1 & 2 | ✅ Done | Landing, login, onboarding |
| Frontend — Phase 3 | 🔧 In Progress | EWA tracker, koperasi, HR dashboard |
| Work ID — Dev (self-hosted wallet) | ✅ Working | LocalStorage key, EIP-191 auth |
| Work ID — Production | 📋 Planned | Smart Account + KYC — lihat Module B |

---

## Deployed Contracts (Base Sepolia)

| Contract | Address |
|---|---|
| `PayrollContract` | `0x05b1DF6d82356CC256D1265cD185B4222E4745b3` |
| `EmployeeLiquidityContract` | `0x872af14287370BAFC883237EF390E367d38a8A33` |
| `EmploymentSBT` | `0xCB5118AF36907165496Dc028b441ad9152D2D264` |

---

## Core Mechanic

```
Setiap claimSalary() → split atomic:

  Accrued = flowRate × (block.timestamp − lastWithdrawnTs)

  [Auto-repay pinjaman koperasi dahulu, jika ada]

   93% → Work ID address      (gaji bersih karyawan)
    5% → ComplianceVault      (BPJS + PPh21)
    2% → SeveranceVault       (pesangon, state: LOCKED)
```

---

## Open Questions Kritis

| ID | Pertanyaan | Deadline | Status |
|---|---|---|---|
| OQ-001 | IDRX tersedia di Base mainnet sebagai ERC-20? | Sprint 1 | ⬜ Open |
| OQ-002 | Formula severance final sesuai UU Cipta Kerja? | Sprint 2 | ⬜ Open |
| OQ-003 | Firma audit Solidity dan budget? | Sprint 3 | ⬜ Open |
| OQ-004 | Izin legal koperasi karyawan (Kemenkop UKM)? | Sprint 5 | ⬜ Open |
| OQ-005 | Model bisnis / revenue? | Pre-launch | ⬜ Open |
| OQ-006 | PPh21: hardcode bracket atau HR input manual? | Sprint 2 | ⬜ Open |
| OQ-007 | Provider eKYC mana yang digunakan? | Production | ⬜ Open |
| OQ-008 | Smart Account standard: SimpleAccount atau Kernel? | Production | ⬜ Open |
| OQ-009 | Token blocklist untuk JWT revocation: Redis atau DB? | Production | ⬜ Open |
| OQ-010 | Multi-device key sync: iCloud Keychain atau MPC provider? | Production | ⬜ Open |
| OQ-011 | Enkripsi PII: field-level atau DB-level encryption? | Production | ⬜ Open |
| OQ-012 | Legal role detection: on-chain check atau backend cache? | Sprint 3 fix | ⬜ Open |
