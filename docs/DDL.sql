-- ==============================================================================
-- DATA DEFINITION LANGUAGE (DDL)
-- Proyek: Payana (Payroll Web3 SaaS)
-- Deskripsi: Skema basis data relasional untuk sistem Indexer (Backend)
-- yang melakukan sinkronisasi data dari Blockchain (Smart Contract).
-- Database Target: PostgreSQL
-- ==============================================================================

-- 1. Tabel Perusahaan (Company Vault)
CREATE TABLE companies (
    id VARCHAR(42) PRIMARY KEY, -- Address dompet perusahaan
    name VARCHAR(100) NOT NULL,
    vault_balance NUMERIC(38, 18) DEFAULT 0, -- Menyimpan presisi token ERC20 (18 desimal)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Karyawan (Employees)
CREATE TABLE employees (
    id VARCHAR(42) PRIMARY KEY, -- Address dompet Smart Account Karyawan
    company_id VARCHAR(42) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'Employee',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 3. Tabel Aliran Gaji (Payroll Streams)
CREATE TABLE payroll_streams (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(42) NOT NULL,
    rate_per_second NUMERIC(38, 18) NOT NULL, -- Gaji per detik
    start_time TIMESTAMP NOT NULL,
    stop_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, PAUSED, STOPPED
    total_withdrawn NUMERIC(38, 18) DEFAULT 0,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- 4. Tabel Histori Penarikan (Withdrawal Transactions)
CREATE TABLE withdrawals (
    tx_hash VARCHAR(66) PRIMARY KEY, -- Hash transaksi di Blockchain
    employee_id VARCHAR(42) NOT NULL,
    gross_amount NUMERIC(38, 18) NOT NULL,
    net_amount NUMERIC(38, 18) NOT NULL, -- Setelah dipotong pajak/kasbon
    tax_amount NUMERIC(38, 18) DEFAULT 0,
    severance_amount NUMERIC(38, 18) DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- 5. Tabel Koperasi / Pinjaman (Loans)
CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(42) NOT NULL,
    principal_amount NUMERIC(38, 18) NOT NULL,
    interest_rate NUMERIC(5, 2) DEFAULT 1.50, -- 1.5% APY
    total_debt NUMERIC(38, 18) NOT NULL,
    amount_repaid NUMERIC(38, 18) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, PAID, DEFAULT
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- 6. Tabel Deposit Koperasi (Liquidity Pool)
CREATE TABLE deposits (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(42) NOT NULL,
    amount NUMERIC(38, 18) NOT NULL,
    yield_earned NUMERIC(38, 18) DEFAULT 0,
    deposit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- ==============================================================================
-- INDEXING (Untuk mempercepat query dari Frontend)
-- ==============================================================================
CREATE INDEX idx_withdrawals_employee ON withdrawals(employee_id);
CREATE INDEX idx_streams_employee ON payroll_streams(employee_id);
CREATE INDEX idx_loans_employee ON loans(employee_id);
