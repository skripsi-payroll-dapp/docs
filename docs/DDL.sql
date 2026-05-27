-- ==============================================================================
-- DATA DEFINITION LANGUAGE (DDL)
-- Proyek  : Payana — Platform Payroll Web3 SaaS (Skripsi)
-- Database: PostgreSQL
-- Tanggal : 2026-05-27
--
-- Arsitektur basis data terdiri dari dua lapisan:
--   1. Skema "app"    — data off-chain yang dikelola oleh backend aplikasi
--   2. Skema "public" — data on-chain yang di-index oleh Ponder dari event
--                       smart contract di jaringan Base Sepolia
--
-- Catatan Unit:
--   - Kolom bertipe BIGINT yang menyimpan nilai token IDRX menggunakan satuan
--     "wei" dengan 6 angka desimal (1 IDRX = 1.000.000 unit/wei).
--   - Kolom bertipe BIGINT yang menyimpan waktu menggunakan Unix timestamp
--     (jumlah detik sejak 1 Januari 1970 UTC).
--   - Kolom bertipe TEXT yang menyimpan alamat blockchain menggunakan format
--     hexadecimal lowercase dengan awalan "0x" (panjang 42 karakter).
-- ==============================================================================


-- ==============================================================================
-- BAGIAN 1 — SKEMA BACKEND APLIKASI (app.*)
-- Menyimpan data operasional off-chain: PII karyawan (terenkripsi),
-- sesi autentikasi, audit log, rate limiting, dan pendaftaran tertunda.
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS app;


-- ------------------------------------------------------------------------------
-- app.employees
-- Menyimpan data identitas karyawan (Personally Identifiable Information / PII).
-- Seluruh kolom sensitif (name, nik, phone) dienkripsi dengan AES-256-GCM
-- sebelum disimpan; backend mendekripsi saat mengambil data.
-- Primary key adalah alamat wallet karyawan (Smart Account ERC-4337).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.employees (
    address     TEXT        NOT NULL,   -- Alamat wallet karyawan (lowercase hex, 0x...)
    name        TEXT        NOT NULL,   -- Nama lengkap karyawan (terenkripsi AES-256-GCM)
    nik         TEXT        NOT NULL,   -- NIK 16-digit (terenkripsi AES-256-GCM)
    phone       TEXT        NOT NULL,   -- Nomor telepon karyawan (terenkripsi AES-256-GCM)
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),  -- Waktu data karyawan pertama kali dibuat
    updated_at  TIMESTAMP   NOT NULL DEFAULT NOW(),  -- Waktu terakhir data karyawan diperbarui

    CONSTRAINT employees_pkey PRIMARY KEY (address)
);

COMMENT ON TABLE  app.employees             IS 'Data identitas karyawan (PII) dalam kondisi terenkripsi AES-256-GCM.';
COMMENT ON COLUMN app.employees.address     IS 'Alamat wallet karyawan sebagai primary key, format lowercase hex (0x...).';
COMMENT ON COLUMN app.employees.name        IS 'Nama lengkap karyawan; disimpan dalam ciphertext AES-256-GCM.';
COMMENT ON COLUMN app.employees.nik         IS 'Nomor Induk Kependudukan 16 digit; disimpan dalam ciphertext AES-256-GCM.';
COMMENT ON COLUMN app.employees.phone       IS 'Nomor telepon karyawan; disimpan dalam ciphertext AES-256-GCM.';
COMMENT ON COLUMN app.employees.created_at  IS 'Timestamp pembuatan record (server time).';
COMMENT ON COLUMN app.employees.updated_at  IS 'Timestamp pembaruan terakhir record (server time).';


-- ------------------------------------------------------------------------------
-- app.sessions
-- Digunakan untuk mekanisme pencabutan JWT (JWT revocation list).
-- Setiap sesi aktif memiliki satu baris; sesi yang expired tidak dihapus
-- secara real-time melainkan dibersihkan oleh job berkala.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.sessions (
    jti         TEXT        NOT NULL,   -- JWT ID (jti claim), bersifat unik per token
    address     TEXT        NOT NULL,   -- Alamat wallet pemilik sesi
    expires_at  TIMESTAMP   NOT NULL,   -- Waktu kedaluwarsa token JWT
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),  -- Waktu sesi dibuat

    CONSTRAINT sessions_pkey PRIMARY KEY (jti)
);

COMMENT ON TABLE  app.sessions            IS 'Daftar sesi JWT aktif untuk keperluan revocation. Token yang ada di sini masih valid; yang sudah dihapus/expired dianggap tidak berlaku.';
COMMENT ON COLUMN app.sessions.jti        IS 'JWT ID (claim "jti") — pengidentifikasi unik per token.';
COMMENT ON COLUMN app.sessions.address    IS 'Alamat wallet yang memiliki sesi ini.';
COMMENT ON COLUMN app.sessions.expires_at IS 'Batas waktu keabsahan token; setelah waktu ini token harus ditolak.';
COMMENT ON COLUMN app.sessions.created_at IS 'Timestamp pembuatan sesi.';


-- ------------------------------------------------------------------------------
-- app.audit_logs
-- Menyimpan jejak audit untuk aksi-aksi kritikal yang dilakukan oleh HR
-- maupun karyawan. Digunakan untuk kepatuhan (compliance) dan forensik.
-- Kolom meta menyimpan JSON arbitrer untuk konteks tambahan per jenis aksi.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.audit_logs (
    id          BIGINT      GENERATED ALWAYS AS IDENTITY,  -- Surrogate key auto-increment
    action      TEXT        NOT NULL,   -- Jenis aksi: "BUNDLER_RELAY" | "COMPLIANCE_EXPORT" | "LOAN_LIQUIDATED"
    actor       TEXT        NOT NULL,   -- Alamat wallet pelaku aksi (HR atau karyawan)
    tx_hash     TEXT,                   -- Hash transaksi blockchain (nullable, hanya untuk aksi on-chain)
    meta        TEXT,                   -- Metadata JSON tambahan (nullable)
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),  -- Waktu aksi terjadi

    CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE  app.audit_logs            IS 'Jejak audit untuk aksi-aksi kritikal sistem (compliance & forensik).';
COMMENT ON COLUMN app.audit_logs.id         IS 'Primary key surrogate, di-generate otomatis oleh database.';
COMMENT ON COLUMN app.audit_logs.action     IS 'Kode aksi yang diaudit. Nilai yang valid: "BUNDLER_RELAY", "COMPLIANCE_EXPORT", "LOAN_LIQUIDATED".';
COMMENT ON COLUMN app.audit_logs.actor      IS 'Alamat wallet pelaku aksi (HR atau karyawan), format lowercase hex.';
COMMENT ON COLUMN app.audit_logs.tx_hash    IS 'Hash transaksi blockchain (66 karakter, 0x + 64 hex). Null jika aksi off-chain.';
COMMENT ON COLUMN app.audit_logs.meta       IS 'String JSON yang menyimpan konteks tambahan per jenis aksi. Nullable.';
COMMENT ON COLUMN app.audit_logs.created_at IS 'Timestamp server saat aksi dicatat.';

-- Index untuk mempercepat filter berdasarkan pelaku dan jenis aksi
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor  ON app.audit_logs (actor);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON app.audit_logs (action);


-- ------------------------------------------------------------------------------
-- app.rate_limits
-- Membatasi frekuensi klaim gaji oleh karyawan dalam satu jendela waktu
-- (time window) agar mencegah penyalahgunaan dan spam ke bundler.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.rate_limits (
    employee_address  TEXT       NOT NULL,   -- Alamat wallet karyawan yang dibatasi
    claim_count       INTEGER    NOT NULL DEFAULT 0,    -- Jumlah klaim dalam jendela waktu saat ini
    window_start      TIMESTAMP  NOT NULL DEFAULT NOW(), -- Waktu mulai jendela pembatasan saat ini

    CONSTRAINT rate_limits_pkey PRIMARY KEY (employee_address)
);

COMMENT ON TABLE  app.rate_limits                  IS 'Tabel rate limiting untuk mencegah spam klaim gaji. Satu baris per karyawan.';
COMMENT ON COLUMN app.rate_limits.employee_address IS 'Alamat wallet karyawan, primary key.';
COMMENT ON COLUMN app.rate_limits.claim_count      IS 'Jumlah klaim yang telah dilakukan dalam jendela waktu aktif.';
COMMENT ON COLUMN app.rate_limits.window_start     IS 'Waktu mulai jendela waktu pembatasan. Di-reset setiap kali jendela baru dimulai.';


-- ------------------------------------------------------------------------------
-- app.webhook_events
-- Menyimpan event webhook yang diterima dari Alchemy (notifikasi aktivitas
-- on-chain). Kolom "processed" digunakan untuk idempotency sehingga event
-- yang sama tidak diproses dua kali.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.webhook_events (
    id           TEXT       NOT NULL,   -- ID unik event dari Alchemy (idempotency key)
    type         TEXT       NOT NULL,   -- Tipe event webhook dari Alchemy
    processed    BOOLEAN    NOT NULL DEFAULT FALSE,   -- TRUE jika event sudah diproses oleh backend
    received_at  TIMESTAMP  NOT NULL DEFAULT NOW(),   -- Waktu event diterima oleh backend

    CONSTRAINT webhook_events_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE  app.webhook_events             IS 'Buffer event webhook dari Alchemy untuk pemrosesan asinkron dengan jaminan idempotency.';
COMMENT ON COLUMN app.webhook_events.id          IS 'ID event unik yang diberikan oleh Alchemy, digunakan sebagai idempotency key.';
COMMENT ON COLUMN app.webhook_events.type        IS 'Tipe event webhook, misal: "ADDRESS_ACTIVITY", "MINED_TRANSACTION".';
COMMENT ON COLUMN app.webhook_events.processed   IS 'Flag apakah event sudah diproses. Mencegah duplikasi pemrosesan.';
COMMENT ON COLUMN app.webhook_events.received_at IS 'Timestamp saat backend menerima event ini dari Alchemy.';

-- Index parsial untuk mempercepat polling event yang belum diproses
CREATE INDEX IF NOT EXISTS idx_webhook_events_unprocessed
    ON app.webhook_events (received_at)
    WHERE processed = FALSE;


-- ------------------------------------------------------------------------------
-- app.pending_registrations
-- Menyimpan permintaan pendaftaran karyawan baru yang menunggu persetujuan HR.
-- Workflow: karyawan mengisi form -> baris dibuat dengan status "pending" ->
-- HR menyetujui/menolak -> status diperbarui.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.pending_registrations (
    address      TEXT                     NOT NULL,   -- Alamat wallet calon karyawan (lowercase hex)
    email        TEXT,                                 -- Alamat email calon karyawan (opsional)
    name         TEXT,                                 -- Nama tampilan dari form onboarding (opsional)
    hr_address   TEXT,                                 -- Alamat wallet HR yang akan memproses pendaftaran ini
    status       TEXT                     NOT NULL DEFAULT 'pending',   -- "pending" | "approved" | "rejected"
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),       -- Waktu pengajuan pendaftaran
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),       -- Waktu terakhir status diperbarui

    CONSTRAINT pending_registrations_pkey PRIMARY KEY (address)
);

COMMENT ON TABLE  app.pending_registrations              IS 'Antrian permintaan pendaftaran karyawan baru yang menunggu persetujuan HR.';
COMMENT ON COLUMN app.pending_registrations.address      IS 'Alamat wallet calon karyawan sebagai primary key.';
COMMENT ON COLUMN app.pending_registrations.email        IS 'Email calon karyawan, bersifat opsional.';
COMMENT ON COLUMN app.pending_registrations.name         IS 'Nama tampilan yang diisi pada form onboarding.';
COMMENT ON COLUMN app.pending_registrations.hr_address   IS 'Alamat wallet HR yang ditugaskan menangani pendaftaran ini.';
COMMENT ON COLUMN app.pending_registrations.status       IS 'Status alur kerja: "pending" (menunggu), "approved" (disetujui), "rejected" (ditolak).';
COMMENT ON COLUMN app.pending_registrations.requested_at IS 'Timestamp (dengan timezone) saat karyawan mengajukan pendaftaran.';
COMMENT ON COLUMN app.pending_registrations.updated_at   IS 'Timestamp (dengan timezone) saat status terakhir kali diperbarui.';

-- Index untuk mempercepat kueri HR yang memfilter berdasarkan status
CREATE INDEX IF NOT EXISTS idx_pending_registrations_hr_status
    ON app.pending_registrations (hr_address, status);


-- ==============================================================================
-- BAGIAN 2 — SKEMA PONDER / ON-CHAIN (public.*)
-- Data di skema ini sepenuhnya di-index dari event smart contract di Base Sepolia
-- oleh indexer Ponder. Tidak ada penulisan langsung dari backend aplikasi.
--
-- Catatan penting:
--   - Semua kolom BIGINT yang menyimpan nilai token = satuan wei IDRX
--     (6 desimal), sehingga 1 IDRX = 1.000.000 unit.
--   - Semua kolom BIGINT yang menyimpan waktu = Unix timestamp (detik).
--   - Kolom bertipe TEXT/hex yang menyimpan alamat = lowercase hex 0x...
-- ==============================================================================


-- ------------------------------------------------------------------------------
-- public.company
-- Di-index dari event VaultDeployed. Setiap baris mewakili satu perusahaan
-- yang telah men-deploy vault payroll mereka di blockchain.
-- Primary key adalah alamat wallet HR Authority (deployer vault).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company (
    id            TEXT    NOT NULL,   -- Alamat HR Authority (deployer vault), format 0x...
    name          TEXT    NOT NULL,   -- Nama perusahaan
    status        TEXT    NOT NULL,   -- Status vault: "Active" | "Paused" | "Frozen"
    vault_balance BIGINT  NOT NULL,   -- Saldo kas vault, dalam wei IDRX (1 IDRX = 1.000.000)
    created_at    BIGINT  NOT NULL,   -- Unix timestamp saat vault di-deploy (detik)

    CONSTRAINT company_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE  public.company               IS 'Data vault perusahaan yang di-index dari event VaultDeployed di blockchain.';
COMMENT ON COLUMN public.company.id            IS 'Alamat wallet HR Authority sebagai primary key, merupakan deployer vault.';
COMMENT ON COLUMN public.company.name          IS 'Nama perusahaan yang terdaftar di smart contract.';
COMMENT ON COLUMN public.company.status        IS 'Status operasional vault: "Active" (aktif), "Paused" (dijeda), "Frozen" (dibekukan).';
COMMENT ON COLUMN public.company.vault_balance IS 'Saldo kas vault dalam satuan wei IDRX. Contoh: 1.000.000 = 1 IDRX.';
COMMENT ON COLUMN public.company.created_at    IS 'Unix timestamp (detik) saat vault di-deploy ke blockchain.';


-- ------------------------------------------------------------------------------
-- public.employee_stream
-- Di-index dari event StreamCreated dan StreamUpdated. Menyimpan konfigurasi
-- aliran gaji real-time setiap karyawan. Satu karyawan = satu baris (upsert).
-- Primary key adalah alamat wallet karyawan.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_stream (
    id              TEXT     NOT NULL,   -- Alamat wallet karyawan (Smart Account), format 0x...
    hr_authority    TEXT     NOT NULL,   -- Alamat wallet HR Authority pemilik stream ini
    flow_rate       BIGINT   NOT NULL,   -- Laju aliran gaji per detik, dalam wei IDRX
    start_ts        BIGINT   NOT NULL,   -- Unix timestamp mulainya stream (detik)
    status          TEXT     NOT NULL,   -- Status stream: "Active" | "Paused" | "Cancelled"
    employee_bps    INTEGER  NOT NULL,   -- Porsi bersih karyawan dalam basis poin (default 9300 = 93%)
    compliance_bps  INTEGER  NOT NULL,   -- Porsi potongan kepatuhan/pajak dalam basis poin (default 500 = 5%)
    severance_bps   INTEGER  NOT NULL,   -- Porsi tabungan pesangon dalam basis poin (default 200 = 2%)

    CONSTRAINT employee_stream_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE  public.employee_stream                 IS 'Konfigurasi aliran gaji real-time karyawan, di-index dari event StreamCreated/StreamUpdated.';
COMMENT ON COLUMN public.employee_stream.id              IS 'Alamat wallet karyawan sebagai primary key.';
COMMENT ON COLUMN public.employee_stream.hr_authority    IS 'Alamat wallet HR Authority yang membuat stream ini.';
COMMENT ON COLUMN public.employee_stream.flow_rate       IS 'Laju aliran gaji per detik dalam wei IDRX. Contoh: 385 wei/detik ~ 1 juta IDRX/bulan.';
COMMENT ON COLUMN public.employee_stream.start_ts        IS 'Unix timestamp (detik) saat stream mulai berjalan.';
COMMENT ON COLUMN public.employee_stream.status          IS 'Status stream: "Active" (berjalan), "Paused" (dijeda sementara), "Cancelled" (dibatalkan).';
COMMENT ON COLUMN public.employee_stream.employee_bps    IS 'Basis poin porsi take-home karyawan (10000 = 100%). Default 9300 = 93%.';
COMMENT ON COLUMN public.employee_stream.compliance_bps  IS 'Basis poin potongan pajak/BPJS/compliance. Default 500 = 5%.';
COMMENT ON COLUMN public.employee_stream.severance_bps   IS 'Basis poin iuran dana pesangon on-chain. Default 200 = 2%.';

-- Index untuk mempercepat kueri seluruh karyawan di bawah satu HR
CREATE INDEX IF NOT EXISTS idx_employee_stream_hr_authority
    ON public.employee_stream (hr_authority);


-- ------------------------------------------------------------------------------
-- public.salary_claim
-- Di-index dari event SalaryClaimed. Setiap baris adalah satu transaksi
-- klaim gaji oleh karyawan. Primary key adalah kombinasi tx_hash dan log_index.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.salary_claim (
    id               TEXT    NOT NULL,   -- Composite ID: "{txHash}-{logIndex}"
    employee         TEXT    NOT NULL,   -- Alamat wallet karyawan yang mengklaim
    hr_authority     TEXT    NOT NULL,   -- Alamat wallet HR Authority terkait
    accrued          BIGINT  NOT NULL,   -- Total gaji bruto terakru, dalam wei IDRX
    net_to_employee  BIGINT  NOT NULL,   -- Jumlah bersih diterima karyawan, dalam wei IDRX
    to_compliance    BIGINT  NOT NULL,   -- Jumlah ke compliance vault, dalam wei IDRX
    to_severance     BIGINT  NOT NULL,   -- Jumlah ke severance vault, dalam wei IDRX
    block_number     BIGINT  NOT NULL,   -- Nomor blok transaksi
    timestamp        BIGINT  NOT NULL,   -- Unix timestamp blok transaksi (detik)

    CONSTRAINT salary_claim_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE  public.salary_claim                  IS 'Riwayat transaksi klaim gaji karyawan, di-index dari event SalaryClaimed.';
COMMENT ON COLUMN public.salary_claim.id               IS 'ID composite "{txHash}-{logIndex}" untuk memastikan keunikan per log event.';
COMMENT ON COLUMN public.salary_claim.employee         IS 'Alamat wallet karyawan yang melakukan klaim.';
COMMENT ON COLUMN public.salary_claim.hr_authority     IS 'Alamat wallet HR Authority pemilik vault yang membayar klaim.';
COMMENT ON COLUMN public.salary_claim.accrued          IS 'Total gaji bruto yang terakru saat klaim, dalam wei IDRX (1 IDRX = 1.000.000).';
COMMENT ON COLUMN public.salary_claim.net_to_employee  IS 'Jumlah bersih (setelah potongan) yang ditransfer ke karyawan, dalam wei IDRX.';
COMMENT ON COLUMN public.salary_claim.to_compliance    IS 'Jumlah yang dialihkan ke compliance vault untuk pajak/BPJS, dalam wei IDRX.';
COMMENT ON COLUMN public.salary_claim.to_severance     IS 'Jumlah yang dialihkan ke severance vault sebagai tabungan pesangon, dalam wei IDRX.';
COMMENT ON COLUMN public.salary_claim.block_number     IS 'Nomor blok blockchain di mana transaksi klaim ini dikonfirmasi.';
COMMENT ON COLUMN public.salary_claim.timestamp        IS 'Unix timestamp (detik) blok tempat transaksi ini dikonfirmasi.';

-- Index untuk kueri riwayat klaim per karyawan dan per perusahaan
CREATE INDEX IF NOT EXISTS idx_salary_claim_employee
    ON public.salary_claim (employee);
CREATE INDEX IF NOT EXISTS idx_salary_claim_hr_authority
    ON public.salary_claim (hr_authority);


-- ------------------------------------------------------------------------------
-- public.severance_vault
-- Di-index dari event perubahan dana pesangon. Menyimpan akumulasi dana
-- pesangon setiap karyawan yang terkumpul dari potongan klaim gaji.
-- Satu karyawan = satu baris (upsert per event).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.severance_vault (
    id            TEXT    NOT NULL,   -- Alamat wallet karyawan, format 0x...
    hr_authority  TEXT    NOT NULL,   -- Alamat wallet HR Authority terkait
    amount        BIGINT  NOT NULL,   -- Saldo dana pesangon terkumpul, dalam wei IDRX
    state         TEXT    NOT NULL,   -- Status dana: "Locked" | "Returned" | "Released"
    last_updated  BIGINT  NOT NULL,   -- Unix timestamp pembaruan terakhir (detik)

    CONSTRAINT severance_vault_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE  public.severance_vault               IS 'Akumulasi dana pesangon on-chain per karyawan. Di-index dari event perubahan severance vault.';
COMMENT ON COLUMN public.severance_vault.id            IS 'Alamat wallet karyawan sebagai primary key.';
COMMENT ON COLUMN public.severance_vault.hr_authority  IS 'Alamat wallet HR Authority yang mengelola vault pesangon ini.';
COMMENT ON COLUMN public.severance_vault.amount        IS 'Total saldo dana pesangon yang terkumpul, dalam wei IDRX (1 IDRX = 1.000.000).';
COMMENT ON COLUMN public.severance_vault.state         IS 'Status dana pesangon: "Locked" (karyawan aktif), "Returned" (dikembalikan ke HR), "Released" (dicairkan ke karyawan).';
COMMENT ON COLUMN public.severance_vault.last_updated  IS 'Unix timestamp (detik) saat baris ini terakhir diperbarui oleh indexer.';


-- ------------------------------------------------------------------------------
-- public.termination_proposal
-- Di-index dari event proposal PHK. Menyimpan status persetujuan multi-pihak:
-- HR dan Legal Owner harus sama-sama menyetujui sebelum eksekusi dilakukan.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.termination_proposal (
    id             TEXT    NOT NULL,   -- Alamat wallet karyawan yang diusulkan PHK
    hr_authority   TEXT    NOT NULL,   -- Alamat wallet HR Authority pengusul
    hr_approved    BOOLEAN NOT NULL,   -- TRUE jika pihak HR sudah menyetujui
    legal_approved BOOLEAN NOT NULL,   -- TRUE jika Legal Owner sudah menyetujui
    expires_at     BIGINT  NOT NULL,   -- Unix timestamp batas waktu proposal (detik)
    proposed_at    BIGINT  NOT NULL,   -- Unix timestamp saat proposal dibuat (detik)
    executed_at    BIGINT,             -- Unix timestamp eksekusi PHK (detik); NULL = belum dieksekusi

    CONSTRAINT termination_proposal_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE  public.termination_proposal                IS 'Proposal Pemutusan Hubungan Kerja (PHK) dengan alur persetujuan multi-pihak.';
COMMENT ON COLUMN public.termination_proposal.id             IS 'Alamat wallet karyawan yang menjadi subjek PHK.';
COMMENT ON COLUMN public.termination_proposal.hr_authority   IS 'Alamat wallet HR Authority yang mengajukan proposal PHK.';
COMMENT ON COLUMN public.termination_proposal.hr_approved    IS 'Flag persetujuan HR: TRUE = sudah menyetujui.';
COMMENT ON COLUMN public.termination_proposal.legal_approved IS 'Flag persetujuan Legal Owner: TRUE = sudah menyetujui.';
COMMENT ON COLUMN public.termination_proposal.expires_at     IS 'Unix timestamp (detik) kedaluwarsa proposal. Setelah ini, proposal tidak bisa dieksekusi.';
COMMENT ON COLUMN public.termination_proposal.proposed_at    IS 'Unix timestamp (detik) saat proposal PHK dibuat di blockchain.';
COMMENT ON COLUMN public.termination_proposal.executed_at    IS 'Unix timestamp (detik) saat PHK dieksekusi. NULL berarti proposal belum dieksekusi.';


-- ------------------------------------------------------------------------------
-- public.cliff_vest
-- Di-index dari event vesting. Menyimpan paket cliff vesting yang diberikan
-- HR kepada karyawan. Satu karyawan bisa memiliki banyak paket vesting.
-- Primary key adalah kombinasi alamat karyawan dan vest_id.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cliff_vest (
    id            TEXT    NOT NULL,   -- Composite ID: "{employee}-{vestId}"
    employee      TEXT    NOT NULL,   -- Alamat wallet karyawan penerima vesting
    hr_authority  TEXT    NOT NULL,   -- Alamat wallet HR Authority pemberi vesting
    vest_id       BIGINT  NOT NULL,   -- ID numerik paket vesting per karyawan (dimulai dari 0)
    amount        BIGINT  NOT NULL,   -- Jumlah token yang di-vest, dalam wei IDRX
    cliff_ts      BIGINT  NOT NULL,   -- Unix timestamp cliff; token baru bisa diklaim setelah ini (detik)
    vest_type     TEXT    NOT NULL,   -- Jenis vesting: "Retention" | "Probation" | "ESOP"
    status        TEXT    NOT NULL,   -- Status vesting: "Locked" | "Claimed" | "Forfeited"
    created_at    BIGINT  NOT NULL,   -- Unix timestamp saat paket vesting dibuat (detik)

    CONSTRAINT cliff_vest_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE  public.cliff_vest               IS 'Paket cliff vesting karyawan, di-index dari event vesting di smart contract.';
COMMENT ON COLUMN public.cliff_vest.id            IS 'ID composite "{employee}-{vestId}" sebagai primary key.';
COMMENT ON COLUMN public.cliff_vest.employee      IS 'Alamat wallet karyawan penerima paket vesting.';
COMMENT ON COLUMN public.cliff_vest.hr_authority  IS 'Alamat wallet HR Authority yang membuat paket vesting.';
COMMENT ON COLUMN public.cliff_vest.vest_id       IS 'Nomor urut paket vesting untuk karyawan ini (0, 1, 2, ...).';
COMMENT ON COLUMN public.cliff_vest.amount        IS 'Jumlah token vesting dalam wei IDRX. Contoh: 12.000.000 = 12 IDRX.';
COMMENT ON COLUMN public.cliff_vest.cliff_ts      IS 'Unix timestamp (detik) cliff: token baru dapat diklaim setelah melewati waktu ini.';
COMMENT ON COLUMN public.cliff_vest.vest_type     IS 'Kategori vesting: "Retention" (retensi karyawan), "Probation" (masa percobaan), "ESOP" (saham karyawan).';
COMMENT ON COLUMN public.cliff_vest.status        IS 'Status paket: "Locked" (terkunci), "Claimed" (sudah diklaim), "Forfeited" (hangus/dibatalkan).';
COMMENT ON COLUMN public.cliff_vest.created_at    IS 'Unix timestamp (detik) saat paket vesting dibuat di blockchain.';

-- Index untuk mempercepat kueri semua paket vesting milik seorang karyawan
CREATE INDEX IF NOT EXISTS idx_cliff_vest_employee
    ON public.cliff_vest (employee);


-- ------------------------------------------------------------------------------
-- public.compliance_vault
-- Di-index dari event akumulasi dana kepatuhan. Menyimpan total akumulasi
-- dana pajak/BPJS yang terkumpul dari setiap klaim gaji. Satu vault per
-- perusahaan (HR Authority).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.compliance_vault (
    id            TEXT    NOT NULL,   -- Alamat wallet HR Authority pemilik compliance vault
    accumulated   BIGINT  NOT NULL,   -- Total dana compliance terkumpul, dalam wei IDRX
    last_updated  BIGINT  NOT NULL,   -- Unix timestamp pembaruan terakhir (detik)

    CONSTRAINT compliance_vault_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE  public.compliance_vault               IS 'Akumulasi dana kepatuhan (pajak/BPJS) per perusahaan, di-index dari event compliance vault.';
COMMENT ON COLUMN public.compliance_vault.id            IS 'Alamat wallet HR Authority sebagai primary key dan pemilik compliance vault.';
COMMENT ON COLUMN public.compliance_vault.accumulated   IS 'Total dana compliance yang telah terkumpul dari semua klaim gaji, dalam wei IDRX.';
COMMENT ON COLUMN public.compliance_vault.last_updated  IS 'Unix timestamp (detik) saat saldo vault terakhir diperbarui oleh indexer.';


-- ------------------------------------------------------------------------------
-- public.liquidity_pool
-- Di-index dari event pembuatan pool koperasi. Menyimpan parameter dan
-- statistik agregat pool pinjaman per perusahaan.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.liquidity_pool (
    id                      TEXT    NOT NULL,   -- Alamat wallet perusahaan pemilik pool
    interest_rate_bps       INTEGER NOT NULL,   -- Suku bunga pinjaman dalam basis poin (150 = 1,5%)
    total_deposited         BIGINT  NOT NULL,   -- Total dana disetor oleh pemberi pinjaman, dalam wei IDRX
    total_loans_outstanding BIGINT  NOT NULL,   -- Total pokok pinjaman beredar, dalam wei IDRX
    created_at              BIGINT  NOT NULL,   -- Unix timestamp saat pool dibuat (detik)

    CONSTRAINT liquidity_pool_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE  public.liquidity_pool                         IS 'Parameter dan statistik pool pinjaman koperasi per perusahaan.';
COMMENT ON COLUMN public.liquidity_pool.id                      IS 'Alamat wallet perusahaan sebagai primary key dan pemilik pool.';
COMMENT ON COLUMN public.liquidity_pool.interest_rate_bps       IS 'Suku bunga pinjaman dalam basis poin. Contoh: 150 = 1,5% per periode.';
COMMENT ON COLUMN public.liquidity_pool.total_deposited         IS 'Total dana yang telah disetor oleh semua pemberi pinjaman, dalam wei IDRX.';
COMMENT ON COLUMN public.liquidity_pool.total_loans_outstanding IS 'Total nilai pokok pinjaman yang sedang aktif/beredar, dalam wei IDRX.';
COMMENT ON COLUMN public.liquidity_pool.created_at              IS 'Unix timestamp (detik) saat pool pertama kali dibuat di blockchain.';


-- ------------------------------------------------------------------------------
-- public.lender_deposit
-- Di-index dari event setoran ke pool koperasi. Menyimpan posisi setiap
-- pemberi pinjaman (lender) beserta akumulasi imbal hasil (yield) mereka.
-- Satu lender = satu baris per perusahaan (upsert per event).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lender_deposit (
    id               TEXT    NOT NULL,   -- Alamat wallet pemberi pinjaman (lender)
    company_address  TEXT    NOT NULL,   -- Alamat wallet perusahaan pemilik pool
    principal        BIGINT  NOT NULL,   -- Jumlah pokok yang disetor oleh lender, dalam wei IDRX
    yield_earned     BIGINT  NOT NULL,   -- Akumulasi imbal hasil yang diperoleh, dalam wei IDRX
    last_updated     BIGINT  NOT NULL,   -- Unix timestamp pembaruan terakhir (detik)

    CONSTRAINT lender_deposit_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE  public.lender_deposit                  IS 'Posisi dan imbal hasil setiap pemberi pinjaman dalam pool koperasi.';
COMMENT ON COLUMN public.lender_deposit.id               IS 'Alamat wallet lender sebagai primary key.';
COMMENT ON COLUMN public.lender_deposit.company_address  IS 'Alamat wallet perusahaan pemilik pool tempat lender menyetor dana.';
COMMENT ON COLUMN public.lender_deposit.principal        IS 'Jumlah pokok yang disetorkan oleh lender ke pool, dalam wei IDRX.';
COMMENT ON COLUMN public.lender_deposit.yield_earned     IS 'Akumulasi bunga/imbal hasil yang telah diperoleh lender, dalam wei IDRX.';
COMMENT ON COLUMN public.lender_deposit.last_updated     IS 'Unix timestamp (detik) saat baris ini terakhir diperbarui.';

-- Index untuk kueri semua pemberi pinjaman dalam satu pool perusahaan
CREATE INDEX IF NOT EXISTS idx_lender_deposit_company_address
    ON public.lender_deposit (company_address);


-- ------------------------------------------------------------------------------
-- public.loan_record
-- Di-index dari event pinjaman. Setiap baris mewakili satu record pinjaman
-- seorang karyawan dari pool koperasi perusahaan.
-- Primary key adalah alamat wallet peminjam (borrower).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loan_record (
    id               TEXT    NOT NULL,   -- Alamat wallet peminjam (karyawan/borrower)
    company_address  TEXT    NOT NULL,   -- Alamat wallet perusahaan pemilik pool sumber pinjaman
    principal        BIGINT  NOT NULL,   -- Jumlah pokok pinjaman, dalam wei IDRX
    interest         BIGINT  NOT NULL,   -- Total bunga yang harus dibayar, dalam wei IDRX
    repaid_amount    BIGINT  NOT NULL,   -- Jumlah yang sudah dilunasi, dalam wei IDRX
    due_ts           BIGINT  NOT NULL,   -- Unix timestamp jatuh tempo pinjaman (detik)
    status           TEXT    NOT NULL,   -- Status pinjaman: "Active" | "Repaid" | "Defaulted"
    created_at       BIGINT  NOT NULL,   -- Unix timestamp saat pinjaman disetujui (detik)

    CONSTRAINT loan_record_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE  public.loan_record                  IS 'Catatan pinjaman karyawan dari pool koperasi, di-index dari event pinjaman.';
COMMENT ON COLUMN public.loan_record.id               IS 'Alamat wallet peminjam (karyawan) sebagai primary key.';
COMMENT ON COLUMN public.loan_record.company_address  IS 'Alamat perusahaan pemilik pool asal dana pinjaman.';
COMMENT ON COLUMN public.loan_record.principal        IS 'Jumlah pokok pinjaman dalam wei IDRX (1 IDRX = 1.000.000).';
COMMENT ON COLUMN public.loan_record.interest         IS 'Total bunga yang dibebankan atas pinjaman ini, dalam wei IDRX.';
COMMENT ON COLUMN public.loan_record.repaid_amount    IS 'Jumlah yang sudah dilunasi oleh peminjam, dalam wei IDRX. Awalnya 0.';
COMMENT ON COLUMN public.loan_record.due_ts           IS 'Unix timestamp (detik) jatuh tempo. Jika belum lunas setelah ini, status berubah menjadi "Defaulted".';
COMMENT ON COLUMN public.loan_record.status           IS 'Status pinjaman: "Active" (berjalan), "Repaid" (lunas), "Defaulted" (gagal bayar).';
COMMENT ON COLUMN public.loan_record.created_at       IS 'Unix timestamp (detik) saat pinjaman dicairkan di blockchain.';

-- Index untuk kueri semua pinjaman dalam satu pool perusahaan
CREATE INDEX IF NOT EXISTS idx_loan_record_company_address
    ON public.loan_record (company_address);


-- ------------------------------------------------------------------------------
-- public.employment_certificate
-- Di-index dari event penerbitan Soulbound Token (SBT) identitas kerja.
-- SBT adalah token ERC-721 non-transferable yang berfungsi sebagai
-- sertifikat ketenagakerjaan on-chain yang dapat diverifikasi siapapun.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employment_certificate (
    id            TEXT    NOT NULL,   -- Alamat wallet karyawan pemilik SBT
    token_id      BIGINT  NOT NULL,   -- ID token ERC-721 di smart contract
    hr_authority  TEXT    NOT NULL,   -- Alamat wallet HR Authority yang menerbitkan SBT
    company_name  TEXT    NOT NULL,   -- Nama perusahaan yang tertera di sertifikat
    issued_at     BIGINT  NOT NULL,   -- Unix timestamp penerbitan SBT (detik)
    revoked_at    BIGINT,             -- Unix timestamp pencabutan SBT (detik); NULL = masih aktif
    active        BOOLEAN NOT NULL,   -- TRUE jika SBT masih aktif/berlaku

    CONSTRAINT employment_certificate_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE  public.employment_certificate               IS 'Sertifikat ketenagakerjaan berbasis Soulbound Token (SBT) ERC-721 non-transferable.';
COMMENT ON COLUMN public.employment_certificate.id            IS 'Alamat wallet karyawan pemegang SBT sebagai primary key.';
COMMENT ON COLUMN public.employment_certificate.token_id      IS 'ID token ERC-721 di smart contract, unik per token.';
COMMENT ON COLUMN public.employment_certificate.hr_authority  IS 'Alamat wallet HR Authority yang menerbitkan (mint) SBT ini.';
COMMENT ON COLUMN public.employment_certificate.company_name  IS 'Nama perusahaan yang tertera di dalam sertifikat on-chain.';
COMMENT ON COLUMN public.employment_certificate.issued_at     IS 'Unix timestamp (detik) saat SBT diterbitkan/di-mint.';
COMMENT ON COLUMN public.employment_certificate.revoked_at    IS 'Unix timestamp (detik) saat SBT dicabut. NULL berarti sertifikat masih berlaku.';
COMMENT ON COLUMN public.employment_certificate.active        IS 'Flag keaktifan: TRUE = sertifikat berlaku, FALSE = sertifikat sudah dicabut.';

-- Index untuk kueri semua sertifikat yang diterbitkan oleh satu HR
CREATE INDEX IF NOT EXISTS idx_employment_certificate_hr_authority
    ON public.employment_certificate (hr_authority);


-- ------------------------------------------------------------------------------
-- public.low_balance_alert
-- Di-index dari event LowBalance yang diemit smart contract ketika saldo
-- vault perusahaan turun di bawah ambang batas aman. Setiap event menghasilkan
-- satu baris baru (bukan upsert) untuk menjaga riwayat peringatan lengkap.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.low_balance_alert (
    id            TEXT    NOT NULL,   -- Composite ID: "{txHash}-{logIndex}"
    hr_authority  TEXT    NOT NULL,   -- Alamat wallet HR Authority pemilik vault
    balance       BIGINT  NOT NULL,   -- Saldo vault saat peringatan dipicu, dalam wei IDRX
    monthly_need  BIGINT  NOT NULL,   -- Estimasi kebutuhan gaji bulanan saat itu, dalam wei IDRX
    timestamp     BIGINT  NOT NULL,   -- Unix timestamp blok peringatan (detik)

    CONSTRAINT low_balance_alert_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE  public.low_balance_alert               IS 'Riwayat peringatan saldo vault rendah, di-index dari event LowBalance smart contract.';
COMMENT ON COLUMN public.low_balance_alert.id            IS 'ID composite "{txHash}-{logIndex}" untuk keunikan per event log.';
COMMENT ON COLUMN public.low_balance_alert.hr_authority  IS 'Alamat wallet HR Authority pemilik vault yang memicu peringatan.';
COMMENT ON COLUMN public.low_balance_alert.balance       IS 'Saldo vault pada saat peringatan dipicu, dalam wei IDRX.';
COMMENT ON COLUMN public.low_balance_alert.monthly_need  IS 'Estimasi total kebutuhan gaji bulanan berdasarkan stream aktif saat itu, dalam wei IDRX.';
COMMENT ON COLUMN public.low_balance_alert.timestamp     IS 'Unix timestamp (detik) blok di mana event peringatan ini diemit.';

-- Index untuk kueri riwayat peringatan per perusahaan
CREATE INDEX IF NOT EXISTS idx_low_balance_alert_hr_authority
    ON public.low_balance_alert (hr_authority);


-- ==============================================================================
-- AKHIR DDL
-- ==============================================================================
