# Program Design Language (PDL) / Pseudocode
**Proyek:** Payana (Payroll Web3 SaaS)  
**Tujuan:** Mendokumentasikan algoritma logika *Smart Contract* dan *Backend* untuk memenuhi kelengkapan bab perancangan (Ratusan fungsionalitas turunan).

---

## 1. Modul Vault & Pendanaan (HR)

### 1.1 `TopUpVault(amount)`
**Fungsi:** Menambah saldo kas perusahaan di dalam Smart Contract.
```pascal
PROCEDURE TopUpVault(amount)
BEGIN
    IF caller is NOT HR_Admin THEN
        RETURN ERROR "Unauthorized access"
    END IF

    IF amount <= 0 THEN
        RETURN ERROR "Amount must be greater than zero"
    END IF

    // Transfer token ERC20 (IDRX) dari dompet HR ke Smart Contract
    CALL ERC20.transferFrom(caller, contractAddress, amount)
    
    // Update state balance perusahaan
    VaultBalance = VaultBalance + amount

    // Emit event untuk di-index oleh Ponder
    EMIT VaultFunded(caller, amount, currentTimestamp)
END
```

### 1.2 `CalculateBurnRate()`
**Fungsi:** Menghitung total pengeluaran per bulan berdasarkan stream aktif.
```pascal
FUNCTION CalculateBurnRate() RETURNS Number
BEGIN
    totalRatePerSecond = 0
    FOR EACH stream IN activeStreams DO
        totalRatePerSecond = totalRatePerSecond + stream.ratePerSecond
    END FOR
    
    // 1 bulan = 2592000 detik
    burnRatePerMonth = totalRatePerSecond * 2592000
    RETURN burnRatePerMonth
END
```

---

## 2. Modul Streaming Gaji (HR ke Karyawan)

### 2.1 `CreateStream(employeeAddress, monthlySalary)`
**Fungsi:** Mendaftarkan aliran gaji baru.
```pascal
PROCEDURE CreateStream(employeeAddress, monthlySalary)
BEGIN
    IF caller is NOT HR_Admin THEN
        RETURN ERROR "Unauthorized"
    END IF

    IF VaultBalance < monthlySalary THEN
        RETURN ERROR "Insufficient Vault Balance for 1 month runway"
    END IF

    // Kalkulasi rate per detik
    ratePerSecond = monthlySalary / 2592000

    // Simpan ke mapping/database
    Stream.employee = employeeAddress
    Stream.ratePerSecond = ratePerSecond
    Stream.startTime = currentTimestamp
    Stream.totalWithdrawn = 0
    Stream.status = ACTIVE

    EMIT StreamCreated(employeeAddress, ratePerSecond)
END
```

---

## 3. Modul Earned Wage Access (Karyawan)

### 3.1 `CalculateClaimable(employeeAddress)`
**Fungsi:** Algoritma *real-time* penghitung gaji yang terakru detik ini.
```pascal
FUNCTION CalculateClaimable(employeeAddress) RETURNS Number
BEGIN
    stream = getStreamByAddress(employeeAddress)
    
    IF stream.status != ACTIVE THEN
        RETURN 0
    END IF

    timeElapsedInSeconds = currentTimestamp - stream.startTime
    totalAccrued = timeElapsedInSeconds * stream.ratePerSecond
    
    claimableAmount = totalAccrued - stream.totalWithdrawn
    RETURN claimableAmount
END
```

### 3.2 `ClaimSalary(requestedAmount)`
**Fungsi:** Memungkinkan karyawan menarik gajinya tanpa menunggu akhir bulan. Di sinilah **Fungsionalitas Split/Routing** berjalan.
```pascal
PROCEDURE ClaimSalary(requestedAmount)
BEGIN
    claimable = CalculateClaimable(caller)
    
    IF requestedAmount > claimable THEN
        RETURN ERROR "Exceeds accrued salary"
    END IF

    // Kalkulasi Potongan Kasbon Koperasi (jika ada)
    activeLoan = GetActiveLoan(caller)
    deduction = 0
    IF activeLoan exists THEN
        deduction = MIN(requestedAmount * 0.3, activeLoan.remainingDebt) // Potong maks 30% dari penarikan
        UpdateLoanBalance(caller, deduction)
    END IF

    // Net Amount setelah kasbon
    netAmount = requestedAmount - deduction

    // SPLIT LOGIC (Sesuai Skripsi)
    taxAmount = netAmount * 0.05       // 5% Pajak/BPJS
    severanceAmount = netAmount * 0.02 // 2% Dana Pesangon On-Chain
    finalTakeHome = netAmount - (taxAmount + severanceAmount)

    // Update state
    stream = getStreamByAddress(caller)
    stream.totalWithdrawn = stream.totalWithdrawn + requestedAmount

    // Transfer Token (Blockchain)
    CALL ERC20.transfer(caller, finalTakeHome)
    CALL ERC20.transfer(TaxWallet, taxAmount)
    CALL ERC20.transfer(SeveranceVault, severanceAmount)

    EMIT SalaryClaimed(caller, finalTakeHome, taxAmount, severanceAmount)
END
```

---

## 4. Modul Koperasi & Kasbon (DeFi Lending)

### 4.1 `RequestCashAdvance(amount)`
**Fungsi:** Mengajukan kasbon ke Koperasi (Liquidity Pool).
```pascal
PROCEDURE RequestCashAdvance(amount)
BEGIN
    stream = getStreamByAddress(caller)
    monthlySalary = stream.ratePerSecond * 2592000
    maxLoanLimit = monthlySalary * 0.8 // Maksimal 80% dari gaji
    
    IF amount > maxLoanLimit THEN
        RETURN ERROR "Loan exceeds maximum limit"
    END IF

    interest = amount * 0.015 // 1.5% Bunga
    totalDebt = amount + interest

    // Transfer dana dari Pool Koperasi ke karyawan
    CALL PoolContract.transfer(caller, amount)

    // Catat hutang
    SaveLoanRecord(caller, totalDebt)
    
    EMIT LoanDispensed(caller, amount)
END
```

*(Catatan untuk Skripsi: PDL di atas mewakili puluhan *use cases* jika di-breakdown. Misalnya: Validasi batas maksimal, Kalkulasi Bunga, Eksekusi Transfer, Pembaruan Status Database, dll, yang masing-masing bisa dihitung sebagai 1 poin fungsionalitas).*
