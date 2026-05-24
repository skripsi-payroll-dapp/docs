# Non-Functional Requirements

---

## NFR-1: Performance

| Requirement | Target | Cara Ukur |
|---|---|---|
| Latency claim EWA (end-to-end) | **< 5 detik** (P95) | Base L2 tx confirmation + frontend round-trip |
| Waktu onboarding perusahaan | **< 30 menit** (first-time) | Funnel analytics dari dashboard |
| Waktu aktivasi Work ID | **< 3 menit** | Privy event time + on-chain confirmation |
| API response dashboard | **< 500ms** (P99) | Backend APM (Datadog) |
| Uptime platform | **≥ 99.5%** | Uptime monitoring (Datadog) |
| Base L2 tx finality | **~2 detik** (optimistic) | Base network SLA |

### Catatan Performance

- Base L2 memiliki ~2s block finality (optimistic) — jauh lebih cepat dari ETH mainnet (~12 detik) atau bank ACH (1–2 hari)
- Bottleneck utama kemungkinan ada di Bundler ERC-4337 (UserOperation submission path), bukan Base sendiri
- Gas price tip bisa ditambahkan di Bundler saat congestion untuk memastikan tx masuk cepat
- Full finality Base → Ethereum L1 membutuhkan ~7 hari (challenge period Optimistic Rollup) — tidak relevan untuk UX karyawan karena yang dipakai adalah optimistic finality

---

## NFR-2: Security

### Smart Contract Security

- **[MUST]** Semua fungsi on-chain HARUS memvalidasi `msg.sender` authority menggunakan **modifier-based validation** — tidak ada manual address checking tanpa modifier
- **[MUST]** HR wallet TIDAK boleh mengakses dana `severanceVaults` karyawan secara unilateral — harus melalui multi-sig Safe flow
- **[SHOULD]** Smart contract dianalisis dengan Slither + Mythril sebelum demo skripsi. Audit oleh firma eksternal berada di luar scope skripsi.
- **[MUST]** Gunakan **OpenZeppelin Contracts** sebagai base library (ReentrancyGuard, AccessControl, Pausable) untuk mencegah common vulnerabilities
- **[MUST]** Seluruh fungsi yang transfer token HARUS menggunakan **Checks-Effects-Interactions** pattern untuk mencegah reentrancy attack

### Wallet & Key Security

- **[MUST — Dev]** Private key EOA disimpan di localStorage — hanya untuk testnet/dev; tidak untuk production
- **[MUST — Prod]** Private key HARUS dienkripsi dengan **AES-256-GCM** menggunakan kunci turunan dari PIN/password user via PBKDF2 (minimum 100.000 iterasi) sebelum disimpan di localStorage
- **[MUST — Prod]** System HARUS menggunakan **ERC-4337 Smart Account** agar address stabil meski signing key dirotasi
- **[MUST — Prod]** Paymaster private key disimpan di **HSM atau secret manager** (AWS Secrets Manager / GCP Secret Manager) — bukan plaintext .env
- **[MUST]** ERC-4337 Bundler HARUS **rate-limited**: max 10 claim/jam per karyawan (enforced di backend sebelum submit UserOperation)
- **[MUST — Prod]** System HARUS menyediakan **mekanisme recovery Work ID** — email OTP + backup code saat pertama setup
- **[MUST — Prod]** Refresh token HARUS disimpan di **HttpOnly cookie** — bukan localStorage (XSS protection)
- **[MUST — Prod]** System HARUS menerapkan **nonce per challenge** untuk auth — setiap nonce hanya bisa dipakai sekali (tracked di Redis)

### API & Transport Security

- **[MUST]** Semua komunikasi frontend ↔ backend menggunakan **HTTPS + JWT authentication**
- **[MUST]** JWT memiliki expiry yang wajar (access token: 15 menit, refresh token: 7 hari)
- **[MUST]** Rate limiting pada semua public API endpoint

### Data Security

- **[MUST]** Data PII karyawan (nama, NIK, email, nomor telepon) HARUS disimpan **off-chain** — on-chain hanya menyimpan Ethereum address
- **[MUST]** Database off-chain dienkripsi at-rest
- **[MUST]** Backup database harian dengan retention 90 hari

### Security Checklist per Sprint

| Sprint | Security Action |
|---|---|
| Sprint 1 | Modifier-based access control audit — semua fungsi; Checks-Effects-Interactions pattern |
| Sprint 2 | Multi-sig logic review — tidak ada unilateral access; reentrancy guard test |
| Sprint 3 | ERC-4337 Bundler rate limiting test, key encryption verification, Paymaster abuse prevention |
| Sprint 4 | Cliff vest forfeit — pastikan tidak bisa diclaim sebelum cliff_ts |
| Sprint 5 | Koperasi — pastikan closed-loop, no external access; integer overflow check |
| Sprint 6 | Full security audit oleh firma eksternal (Slither + Mythril + manual review) |
| Production | Key encryption audit, KYC flow penetration test, session revocation test, CSP header audit |

---

## NFR-3: Compliance & Legal

| Requirement | Detail |
|---|---|
| Severance formula | HARUS mengikuti **UU Cipta Kerja Pasal 156** — kalibrasi via `tenure_months` |
| PPh21 rate | TIDAK boleh di-hardcode — wajib bisa diupdate HR sesuai kebijakan Kemenkeu |
| ComplianceVault transfer | HARUS manual transfer ke DJP/BPJS (tidak otomatis — safety buffer) |
| Koperasi scope | HARUS beroperasi sebagai **closed-loop** (karyawan 1 perusahaan) — menghindari regulasi OJK Pinjol |
| Data PII | HARUS disimpan **off-chain** — on-chain hanya pubkey |
| Audit trail | Semua transaksi payroll HARUS tersedia immutable di Basescan / Etherscan |

### Regulasi yang Relevan

| Regulasi | Relevansi |
|---|---|
| UU Cipta Kerja Pasal 156 | Formula pesangon — `tenure_months` kalibrasi |
| PP 36/2021 (Pengupahan) | Komponen gaji minimum, struktur BPJS |
| PMK PPh21 terbaru | Rate pajak penghasilan karyawan |
| UU Perkoperasian No. 25/1992 | Basis hukum koperasi karyawan |
| OJK POJK No. 77/2016 | Regulasi fintech pinjol — HARUS dihindari dengan closed-loop |

---

## NFR-4: Usability

| Requirement | Detail |
|---|---|
| Zero Web3 knowledge required | Karyawan HARUS bisa menggunakan platform **tanpa pengetahuan crypto** — zero Web3 jargon di UI |
| Flow utama ≤ 3 tap | Claim EWA, lihat saldo, transfer HARUS bisa diselesaikan dalam **< 3 tap** |
| Mobile-first | Dashboard karyawan HARUS **responsive mobile-first** |
| Error messages | HARUS dalam **Bahasa Indonesia** yang jelas — bukan raw blockchain error code |
| Bahasa | Platform bilingual: Bahasa Indonesia (primary) + English (secondary) |

### UX Principles

**Bahasa yang DILARANG di UI karyawan:**
- ~~wallet~~, ~~pubkey~~, ~~transaction~~, ~~gas fee~~, ~~blockchain~~, ~~private key~~, ~~seed phrase~~

**Bahasa pengganti:**
- wallet → **Akun Gaji**
- pubkey → **ID Karyawan** / **Work ID**
- transaction → **Transaksi** / **Transfer**
- gas fee → *(tidak ditampilkan — gratis untuk karyawan)*
- claim salary → **Tarik Gaji**

### Error Message Examples

| Raw Error | UI Message |
|---|---|
| `InsufficientVaultBalance` | "Saldo kas perusahaan tidak mencukupi. Hubungi HR Anda." |
| `StreamNotActive` | "Streaming gaji Anda sedang dijeda. Hubungi HR Anda." |
| `NotVestedYet` | "Bonus Anda belum bisa dicairkan. Tersedia pada [tanggal cliff]." |
| `LoanLimitExceeded` | "Jumlah pinjaman melebihi batas. Maksimal 80% dari gaji bulan depan." |
| `RateLimitExceeded` | "Terlalu banyak penarikan. Coba lagi dalam 1 jam." |

---

## NFR-5: Scalability & Reliability

| Requirement | Target | Keterangan |
|---|---|---|
| Concurrent users | 1.000 karyawan simultan | Base L2 ~2,000 TPS — tidak bottleneck di chain |
| Database throughput | 10.000 req/menit | Skala horizontal dengan read replicas |
| Alchemy webhook latency | < 500ms event push | Real-time dashboard update |
| Bundler throughput | 100 UserOp/menit | Rate limit per karyawan 10/jam, bukan per Bundler |
| Recovery Time Objective (RTO) | < 1 jam | Untuk incident database/backend |
| Recovery Point Objective (RPO) | < 24 jam | Maksimal data loss yang dapat diterima |

---

## NFR-6: Observability

| Komponen | Tool | Apa yang Dimonitor |
|---|---|---|
| Smart contract events | Alchemy Webhooks / The Graph | Semua event log: Claimed, StreamCreated, StreamCancelled, TerminationExecuted |
| Backend API | Datadog APM | Latency, error rate, throughput |
| Paymaster wallet | Custom alert | ETH balance, UserOp failure rate |
| Frontend | Datadog RUM | Core Web Vitals, user flow completion rate |
| On-chain anomaly | Tenderly alerts | Unusual claim pattern, large unexpected transfers |
