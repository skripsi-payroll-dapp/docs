# User Stories — Employee (Karyawan)

> **Persona:** Karyawan tetap dan kontrak yang menerima gaji via platform
>
> **Pain Point:** Menunggu tanggal gajian, tidak ada jaring pengaman darurat, butuh akses dana cepat tanpa pinjol

---

## US-EMP-01 · Aktivasi Work ID

> *"Sebagai karyawan baru, saya ingin mengaktifkan akun saya dengan mudah tanpa harus install MetaMask atau menyimpan seed phrase."*

**Acceptance Criteria:**
- [ ] Work ID (Ethereum address) terbuat otomatis saat pertama login — karyawan tidak perlu memahami konsep wallet
- [ ] Dashboard menampilkan saldo EWA yang sudah terakru sejak stream diaktifkan HR
- [ ] Karyawan tidak perlu memahami konsep wallet, private key, atau blockchain
- [ ] **(Dev)** Klik tombol → key dibuat di browser → login dengan signature
- [ ] **(Prod)** Login email OTP / Google SSO → key dibuat otomatis → Work ID aktif

**Flow Aktivasi — Dev Build (Current):**
```
Karyawan buka /login
→ Klik "Buat Akun & Masuk"
→ Browser generate EOA key → simpan di localStorage
→ Sign EIP-191 challenge → POST /auth/login
→ Role terdeteksi on-chain
→ Dashboard tampil: saldo EWA terakru sejak stream aktif
→ ✓ Work ID aktif
```

**Flow Aktivasi — Production Target:**
```
HR kirim link aktivasi ke email karyawan
→ Karyawan buka link → klik "Masuk dengan Email"
→ Masuk OTP 6 digit via email
→ Sistem buat encrypted key di browser (PIN-protected)
→ ERC-4337 Smart Account di-deploy (lazy, saat tx pertama)
→ eKYC: input nama + NIK + foto KTP → verifikasi via Verihubs
→ Dashboard tampil: saldo EWA terakru sejak stream aktif
→ ✓ Work ID aktif, NIK bound ke Work ID address
```

**Prinsip UX:**
- Zero Web3 jargon di tampilan UI ("Work ID", bukan "wallet")
- Tidak ada prompt "approve transaction" — semua silent
- **(Prod)** Recovery Work ID via email jika device hilang

---

## US-EMP-02 · Tarik Gaji (EWA — Earned Wage Access)

> *"Sebagai karyawan, saya ingin menarik sebagian gaji yang sudah saya kerjakan kapan saja, sehingga saya tidak perlu menunggu tanggal gajian."*

**Acceptance Criteria:**
- [ ] Claim berhasil dalam **< 5 detik** end-to-end (Base L2)
- [ ] IDRX masuk ke Work ID address — tidak ada gas fee untuk karyawan (ERC-4337 Paymaster)
- [ ] Saldo dashboard terupdate real-time setelah claim
- [ ] Karyawan bisa pilih nominal claim (parsial atau penuh)

**Cara Kerja:**
```
Accrued = flow_rate × (sekarang − last_withdrawn_ts)

Contoh:
  Gaji bulanan: Rp 5.000.000
  Flow rate: Rp 5.000.000 / (30 × 24 × 3600) = ~1,929 IDRX/detik

  Jika sudah bekerja 10 hari:
  Accrued = 1,929 × 864.000 detik = ~1.666.667 IDRX

Split saat claim:
  93% → 1.550.000 IDRX ke Work ID address karyawan
   5% →    83.333 IDRX ke ComplianceVault (contract balance)
   2% →    33.333 IDRX ke SeveranceVault (contract balance)
```

---

## US-EMP-03 · Lihat Saldo Pesangon

> *"Sebagai karyawan, saya ingin melihat berapa pesangon yang sudah terakumulasi atas nama saya, sehingga saya tahu hak saya terjamin on-chain."*

**Acceptance Criteria:**
- [ ] Dashboard menampilkan `SeveranceVault` balance dengan state `LOCKED`
- [ ] Riwayat akumulasi per bulan tersedia
- [ ] Karyawan **tidak bisa tarik** selama state `LOCKED`
- [ ] Informasi ditampilkan dalam Rupiah (IDRX), bukan satuan teknis

**State yang Mungkin Dilihat Karyawan:**
| State | Arti | Aksi Tersedia |
|---|---|---|
| `LOCKED` | Dana dikunci, masih aktif bekerja | Hanya lihat saldo |
| `RETURNED` | Karyawan resign — dana kembali ke perusahaan | — |
| `RELEASED` | PHK diproses — dana sudah cair ke Work ID | Lihat riwayat |

---

## US-EMP-04 · Transfer ke Wallet Eksternal

> *"Sebagai karyawan, saya ingin mentransfer IDRX dari Work ID ke wallet MetaMask atau exchange Indodax/Tokocrypto."*

**Acceptance Criteria:**
- [ ] Transfer berhasil ke alamat wallet EVM eksternal (MetaMask, Coinbase Wallet, dll.)
- [ ] Konfirmasi tx ditampilkan dengan link Basescan
- [ ] Tidak ada biaya tersembunyi — hanya gas minimal (~$0.01 Base L2)
- [ ] Riwayat transfer tersimpan di dashboard

**Catatan:**
- MetaMask mendukung Base L2 dan EVM chains — user hanya perlu tambahkan Base network
- Exchange yang support IDRX/Base: perlu dikonfirmasi per open question

---

## US-EMP-05 · Pinjam dari Koperasi

> *"Sebagai karyawan yang butuh dana darurat, saya ingin meminjam dari koperasi karyawan dengan jaminan gaji bulan depan, tanpa perlu persetujuan bank."*

**Acceptance Criteria:**
- [ ] Pinjaman tersedia dalam **< 1 menit** setelah submit
- [ ] Cicilan terpotong **otomatis** saat claim EWA berikutnya (sebelum split 93/5/2)
- [ ] Bunga tidak melebihi yang tertera di kontrak pinjaman (flat 1.5%/30 hari untuk MVP)
- [ ] Karyawan tidak bisa meminjam lebih dari **80%** dari expected gaji bulan depan

**Flow Pinjaman:**
```
Karyawan ajukan pinjaman
→ Sistem validasi: pinjaman ≤ 80% expected gaji
→ LoanRecord struct dibuat (principal, due_ts = now + 30 hari)
→ IDRX dari contract balance cair ke Work ID karyawan

Saat claim EWA berikutnya:
→ external call auto-repayment dipotong SEBELUM split 93/5/2
→ Jika lunas, LoanRecord ditutup
→ Cicilan terus berlanjut hingga lunas
```

---

## US-EMP-06 · Deposit ke Koperasi (Menjadi Lender)

> *"Sebagai karyawan dengan EWA idle, saya ingin mendepositkan IDRX ke koperasi untuk mendapat yield, daripada membiarkannya tidak produktif."*

**Acceptance Criteria:**
- [ ] Deposit berhasil — `LenderDeposit struct` terbuat
- [ ] Yield rate ditampilkan dengan jelas sebelum deposit
- [ ] Withdraw deposit bisa dilakukan kapan saja (jika pool memiliki likuiditas cukup)
- [ ] Riwayat yield earned tersedia di dashboard

---

## US-EMP-07 · Lihat Cliff Vesting (Bonus / ESOP)

> *"Sebagai karyawan, saya ingin melihat kapan bonus retensi atau ESOP saya bisa diclaim, dan berapa nominalnya."*

**Acceptance Criteria:**
- [ ] Dashboard menampilkan semua `cliffVests` mapping entry aktif milik karyawan
- [ ] Countdown hingga cliff date ditampilkan secara visual
- [ ] Karyawan tidak bisa claim sebelum `cliff_ts` tercapai
- [ ] Setelah cliff tercapai, tombol "Claim Bonus" muncul otomatis
