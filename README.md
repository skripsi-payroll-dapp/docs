# Payroll SaaS — Documentation

> **Real-Time Payroll Berbasis Blockchain di Ethereum (Base L2)**
> Version: v1.0 MVP | Status: Draft | Token: IDRX | Chain: Base Mainnet (Ethereum L2)

---

## Struktur Dokumentasi

```
payroll-web3-saas/
├── README.md                          (index ini)
├── overview-background.md             (latar belakang & visi produk)
├── goals-kpi.md                       (tujuan bisnis & KPI)
├── feature-map-mvp.md                 (feature map & prioritas)
├── non-functional-requirements.md     (performance, security, compliance, UX)
├── technical-architecture.md          (tech stack, storage diagram, data flow)
├── sprint-planning.md                 (sprint breakdown, dependency, risiko)
├── open-questions.md                  (Notion-style database)
│
├── user-stories/
│   ├── hr-finance-admin.md            (US-HR-01 s/d US-HR-07)
│   ├── employee.md                    (US-EMP-01 s/d US-EMP-07)
│   └── legal-owner.md                 (US-LGL-01 s/d US-LGL-04)
│
├── black-box-testing.md               (37 test cases — happy & bad path per modul)
│
└── functional-requirements/
    ├── module-a-core-payroll.md       (vault, stream, auto-split claim)
    ├── module-b-work-id.md            (Privy WaaS, gasless relayer)
    ├── module-c-compliance.md         (severance escrow, multi-sig PHK)
    ├── module-d-cliff-vesting.md      (bonus, probasi, ESOP)
    └── module-e-koperasi.md           (liquidity pool, pinjaman, external call repayment)
```

---

## Quick Reference

### Auto-Split Formula (Core Mechanic)

```
Accrued = flow_rate × (block.timestamp − last_withdrawn_ts)

Per claim:
  93% → Work ID address      (gaji bersih karyawan)
   5% → ComplianceVault      (BPJS + PPh21)
   2% → SeveranceVault       (pesangon, LOCKED)
```

### 2 Smart Contracts

| Contract | Tanggung Jawab |
|---|---|
| `PayrollContract` | Vault, stream, claim, severance, compliance, cliff vest, PHK |
| `EmployeeLiquidityContract` | Pool koperasi, pinjaman, auto-repayment via external call |

### Sprint Overview

| Sprint | Scope | Durasi |
|---|---|---|
| 1 | Core Payroll (vault + stream + claim) | 3 minggu |
| 2 | Compliance (severance + PHK multi-sig) | 3 minggu |
| 3 | Work ID & Auth (Privy + gasless relayer) | 2 minggu |
| 4 | Cliff Vesting (bonus, probasi, ESOP) | 2 minggu |
| 5 | Koperasi (pool + pinjaman + external call) | 3 minggu |
| 6 | Dashboard + QA + Audit + Launch | 4 minggu |

### Open Questions Kritis

| ID | Pertanyaan | Deadline |
|---|---|---|
| OQ-001 | IDRX tersedia di Base/Ethereum mainnet sebagai ERC-20? Fallback USDC? | Sprint 1 |
| OQ-002 | Formula severance final sesuai UU Cipta Kerja? | Sprint 2 |
| OQ-003 | Firma audit Solidity dan budget? | Sprint 3 |
| OQ-004 | Izin legal koperasi karyawan? | Sprint 5 |
| OQ-005 | Model bisnis/revenue? | Pre-launch |
| OQ-006 | PPh21: hardcode atau HR input manual? | Sprint 2 |

---

## Cara Membaca Dokumentasi Ini

1. **Baru pertama kali?** Mulai dari `overview-background.md`
2. **Mau tau fitur apa saja?** Baca `feature-map-mvp.md`
3. **Mau implement sprint sekarang?** Baca `functional-requirements/module-a-core-payroll.md`
4. **Setup arsitektur?** Baca `technical-architecture.md`
5. **Review open issues?** Buka `open-questions.md` di Notion
