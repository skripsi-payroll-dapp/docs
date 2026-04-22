# Functional Requirements — Module E: Koperasi Karyawan

> **Sprint:** 5 (3 minggu)
> **Output:** Employee liquidity pool + pinjaman + auto-repayment via external call
> **Dependency:** Sprint 1 + Sprint 3 (claimSalary harus gasless dulu sebelum auto-repayment bisa ditest)
> **Contract:** `EmployeeLiquidityContract.sol` (contract terpisah dari `PayrollContract.sol`)
> **Prioritas:** P1 (Should Have)

---

## Overview

Modul E menyediakan alternatif formal bagi karyawan yang butuh dana darurat — menggantikan pinjol berbunga tinggi. Sistem ini beroperasi sebagai **closed-loop koperasi**: hanya karyawan dalam satu perusahaan yang bisa berpartisipasi.

Mekanisme:
- Karyawan A (lender) deposit idle EWA ke pool → dapat yield
- Karyawan B (borrower) pinjam dari pool dengan jaminan gaji bulan depan
- Cicilan dipotong **otomatis** saat karyawan B claim EWA (via external call dari PayrollContract)

> **Compliance Note:** Beroperasi sebagai closed-loop (1 perusahaan) untuk menghindari regulasi OJK Pinjol.

---

## FR-E01 · Employee Liquidity Pool

### Storage yang Terlibat

| Mapping | Key | Konten | Contract |
|---|---|---|---|
| `pools` | `company_address` | `totalDeposited`, `totalLoansOutstanding`, `interestRateBps`, `yieldPerShareX18` | `EmployeeLiquidityContract` |
| `lenderDeposits` | `lender_address` | `principal`, `yieldEarned`, `depositedTs`, `companyAddress` | `EmployeeLiquidityContract` |
| `loanRecords` | `borrower_address` | `principal`, `interest`, `repaidAmount`, `dueTs`, `status` | `EmployeeLiquidityContract` |

> **Catatan implementasi:** Tidak ada mapping `poolBalances` terpisah. Likuiditas pool dilacak via field `pool.totalDeposited` di dalam struct `Pool` pada mapping `pools`. Saldo IDRX aktual dipegang langsung oleh contract (`IERC20.balanceOf(address(this))`).

### Requirements

- **[MUST]** System SHALL mengelola `pools[company]` per perusahaan dengan **flat interest rate** (MVP: 1.5%/30 hari)
- **[MUST]** System SHALL membuat entry di `lenderDeposits` saat karyawan deposit ke pool
- **[MUST]** System SHALL membuat entry di `loanRecords` saat karyawan borrow, dengan `dueTs = block.timestamp + 30 days`
- **[MUST]** System SHALL mencegah karyawan meminjam lebih dari **80%** dari expected gaji bulan depan
- **[MUST]** System SHALL memproses **auto-repayment via external call** dari `claimSalary()` **sebelum** split 93/5/2
- **[SHOULD]** System SHALL menerapkan liquidation logic jika borrower tidak claim gaji hingga `dueTs + 7 hari grace period`

---

## FR-E02 · Deposit & Withdraw (Lender)

### Requirements

- **[MUST]** `depositToPool()`: Transfer IDRX dari Work ID address ke EmployeeLiquidityContract, buat/update `lenderDeposits[lender]`
- **[MUST]** `withdrawDeposit()`: Transfer IDRX dari contract ke Work ID address, bayar yield yang sudah diperoleh
- **[MUST]** Withdraw gagal dengan error `InsufficientPoolLiquidity` jika pool tidak cukup (semua IDRX dipinjam)
- **[SHOULD]** Yield dihitung pro-rata berdasarkan lamanya deposit dan total bunga yang diterima pool

### Fungsi

```solidity
// Initialize pool untuk perusahaan baru
function initializePool(
    address companyAddress,
    uint16 interestRateBps   // 150 = 1.5% per 30 hari
) external;

// Karyawan deposit ke pool
function depositToPool(
    uint256 amount
) external;
// → IDRX dari msg.sender via IERC20.transferFrom()
// → lenderDeposits[msg.sender] dibuat/diupdate

// Karyawan tarik deposit + yield
function withdrawDeposit(
    uint256 amount
) external;
// Require: pools[company].totalLiquidity - totalLoansOutstanding >= amount
// → IDRX + yield dari contract → msg.sender via IERC20.transfer()
```

---

## FR-E03 · Pinjaman (Borrower)

### Validasi Sebelum Pinjam

```
Expected gaji bulan depan = flowRate × 30 × 24 × 3600
Max pinjaman = 80% × expected_gaji

Contoh:
  Gaji bulanan: Rp 5.000.000
  Max pinjaman: Rp 4.000.000

  Jika sudah ada pinjaman aktif Rp 2.000.000:
  Sisa max pinjam = Rp 4.000.000 - Rp 2.000.000 = Rp 2.000.000
```

### Requirements

- **[MUST]** `borrowFromPool()`: Buat `loanRecords[borrower]`, transfer IDRX dari contract ke Work ID address
- **[MUST]** Validasi: `totalUtangAktif + pinjamanBaru ≤ 80% × expected_gaji`
- **[MUST]** `dueTs = block.timestamp + (30 * 24 * 3600)`
- **[SHOULD]** Liquidation jika `block.timestamp > dueTs + (7 * 24 * 3600)` dan belum lunas

### Fungsi

```solidity
function borrowFromPool(
    uint256 amount
) external;
// Require: amount <= 80% expected gaji - existing loans
// Require: pools[company].totalLiquidity >= amount
// → loanRecords[msg.sender] dibuat
// → IDRX dari contract → msg.sender via IERC20.transfer()

// Repayment manual (jika ingin bayar lebih cepat)
function repayLoanManual(
    uint256 amount
) external;
// → IDRX dari msg.sender → contract via IERC20.transferFrom()
// → Update loanRecords[msg.sender].repaidAmount
// → Jika lunas, delete loanRecords[msg.sender]
```

---

## FR-E04 · Auto-Repayment via External Call

Ini adalah integrasi paling kritis antara `PayrollContract` dan `EmployeeLiquidityContract`.

### Urutan Eksekusi di claimSalary

```
claimSalary() dipanggil karyawan
          │
          ▼
1. Hitung accrued = flowRate × (block.timestamp - lastWithdrawnTs)
          │
          ▼
2. External call: IEmployeeLiquidity(liquidityContract).autoRepay(employee, accrued)
   → Jika ada loanRecords[employee] aktif:
     a. Hitung cicilan = min(accrued × repayFraction, outstandingBalance)
     b. Update loanRecords[employee].repaidAmount
     c. Jika lunas, delete loanRecords[employee]
   → Kembalikan sisa setelah repayment
          │
          ▼
3. sisa = accrued - cicilan_repayment
          │
          ▼
4. Effects first (Checks-Effects-Interactions):
   Update lastWithdrawnTs = block.timestamp
          │
          ▼
5. Transfer sisa:
   93% → Work ID address via IERC20.transfer()
    5% → complianceVaults[company]
    2% → severanceVaults[employee]
```

### Interface untuk External Call

```solidity
// IEmployeeLiquidity.sol
interface IEmployeeLiquidity {
    function autoRepay(
        address employee,
        uint256 accrued
    ) external returns (uint256 repaid);
}

// Di PayrollContract — claimSalary function
function claimSalary() external nonReentrant {
    // 1. Hitung accrued
    uint256 accrued = _calculateAccrued(msg.sender);

    // 2. External call ke EmployeeLiquidityContract
    uint256 repayment = IEmployeeLiquidity(liquidityContract)
        .autoRepay(msg.sender, accrued);

    // 3. Effects (sebelum transfer!)
    uint256 net = accrued - repayment;
    employeeStreams[msg.sender].lastWithdrawnTs = block.timestamp;

    // 4. Transfer split
    _transferSplit(msg.sender, net);
}
```

---

## Liquidation Logic (Should Have)

| Kondisi | Trigger | Aksi |
|---|---|---|
| Grace period habis | `block.timestamp > dueTs + 7 hari` | Dipicu oleh backend cron job |
| Tidak ada EWA claim | Stream masih aktif tapi tidak ada claim | Backend kirim reminder ke karyawan |
| Stream cancel | HR cancel stream borrower | Sisa stream dipakai repay, sisanya forfeited |

```solidity
// Dipanggil oleh backend EOA (ops wallet) jika grace period habis
function liquidateLoan(
    address borrower
) external onlyOps;
// Require: block.timestamp > loanRecords[borrower].dueTs + 7 days
// Require: loanRecords[borrower].repaidAmount < principal + interest
// → Ambil collateral (accrued dari stream) sebagai partial repayment
// → Mark loan sebagai Defaulted
// → emit LoanDefaulted(borrower, outstanding)
```

---

## Diagram Arsitektur Koperasi

```mermaid
flowchart TD
  subgraph CONTRACT["EmployeeLiquidityContract — closed loop"]
    PS["pools mapping\nkey: company_address\ntotalDeposited, totalLoansOutstanding, interestRateBps"]
    LD["lenderDeposits mapping\nkey: lender_address\nprincipal, yieldEarned"]
    LR["loanRecords mapping\nkey: borrower_address\nprincipal, dueTs, repaid"]
    DEP["Karyawan A\ndeposit idle EWA ke pool"]
    BOR["Karyawan B\npinjam dari pool\njaminan: gaji bulan depan"]
    REP["Auto-repayment via external call\npotong cicilan saat claimSalary()\nsebelum split 93/5/2"]
  end

  DEP -->|depositToPool()| PS --> LD
  PS -->|borrowFromPool()| BOR --> LR
  LR -->|dilunasi oleh| REP --> PS
```

---

## Batasan Koperasi (Compliance)

| Batasan | Alasan |
|---|---|
| Closed-loop 1 perusahaan | Menghindari regulasi OJK Pinjol (butuh izin fintech) |
| Max pinjam 80% gaji | Mencegah over-leverage karyawan |
| Interest flat 1.5%/30 hari | MVP sederhana; bisa dikonfigurasi per perusahaan di v2 |
| No secondary market | Tidak ada jual-beli deposit/loan antar karyawan |
| Grace period 7 hari | Buffer wajar sebelum liquidation (bukan pinjol agresif) |
| nonReentrant modifier | Semua fungsi yang transfer token harus dilindungi dari reentrancy |
