# User Stories — HR / Finance Admin

> **Persona:** Admin penggajian perusahaan 50–500 karyawan
>
> **Pain Point:** Proses manual, rawan error, rekonsiliasi memakan waktu, risiko compliance ketenagakerjaan

---

## US-HR-01 · Company Onboarding

> *"Sebagai HR admin, saya ingin mendaftarkan perusahaan dan men-deploy vault dalam satu sesi tanpa perlu memahami blockchain, sehingga saya dapat mulai membayar gaji hari itu juga."*

**Acceptance Criteria:**
- [ ] Vault terdeploy dalam < 30 menit sejak registrasi
- [ ] HR tidak perlu beli ETH sendiri (platform sponsor gas via ERC-4337 Paymaster)
- [ ] Dashboard menampilkan treasury balance real-time setelah deposit IDRX
- [ ] Email konfirmasi onboarding terkirim ke PIC HR

**Flow:**
```
HR buka dashboard
→ Isi nama perusahaan, NPWP, email PIC
→ Login via Privy EVM (HR Smart Account dibuat otomatis = authority address)
→ initializeVault() (atomic: companies + vaultBalances + complianceVaults setup)
→ Deposit IDRX ERC-20 ke contract vault (min = total gaji 1 bulan)
→ setCompanyConfig() (bpjsBps, pph21Bps, severanceBps, lowBalanceAlert)
→ ✓ Vault aktif
```

---

## US-HR-02 · Daftarkan Karyawan

> *"Sebagai HR admin, saya ingin mendaftarkan karyawan cukup dengan memasukkan email dan nominal gaji, sehingga sistem otomatis membuat Work ID dan memulai streaming gaji."*

**Acceptance Criteria:**
- [ ] Karyawan menerima email onboarding dengan link aktivasi
- [ ] Stream aktif dalam < 5 menit setelah submit
- [ ] HR bisa lihat daftar karyawan aktif dan saldo streaming real-time
- [ ] `employeeStreams` dan `severanceVaults` mapping entries terbuat otomatis

**Data yang Diperlukan HR:**
| Field | Keterangan |
|---|---|
| Email karyawan | Untuk Privy Work ID creation |
| Gaji bulanan (IDRX) | Dikonversi ke flow_rate per detik |
| Tanggal mulai kerja | Untuk tenure_months (severance) |
| Persentase split custom | Opsional — override default 93/5/2 |

---

## US-HR-03 · Pause & Resume Stream

> *"Sebagai HR admin, saya ingin bisa pause streaming gaji karyawan tertentu tanpa harus menghapus Work ID mereka."*

**Acceptance Criteria:**
- [ ] Pause/resume berhasil dalam 1 transaksi
- [ ] Saldo yang sudah terakru sebelum pause **tetap bisa diclaim** karyawan
- [ ] Stream resume dari titik pause, bukan reset dari awal
- [ ] Log pause/resume tersimpan on-chain dengan timestamp

**Kapan Digunakan:**
- Karyawan cuti panjang tanpa bayar (unpaid leave)
- Investigasi internal / suspend sementara
- Persiapan perubahan kontrak atau renegosiasi gaji

---

## US-HR-04 · Proses PHK

> *"Sebagai HR admin, saya ingin memproses PHK dengan aman melalui approval Legal, sehingga pesangon otomatis cair ke karyawan tanpa risiko sengketa."*

**Acceptance Criteria:**
- [ ] Proposal PHK terbuat dan Legal menerima notifikasi
- [ ] Setelah 2 approval (HR + Legal via Safe), pesangon cair otomatis ke address karyawan
- [ ] Seluruh riwayat tersimpan on-chain sebagai **audit trail immutable** di Basescan
- [ ] Proposal otomatis expire setelah 7 hari jika tidak ada 2 approval
- [ ] Event `TerminationExecuted` ter-emit setelah proposal selesai

**State Machine PHK:**
```
propose_termination (HR)
        │
        ▼
TerminationProposal struct dibuat
expires_at = now + 7 hari
        │
   ┌────┴────┐
   ▼         ▼
HR sign   Legal sign   (urutan bebas)
   └────┬────┘
        ▼
  hr_approved AND legal_approved?
        │
   ┌────┴────┐
  YES        NO (expired)
   │          │
   ▼          ▼
execute_    Proposal
termination  ditutup
   │
   ▼
SeveranceVault → RELEASED
IDRX → Work ID karyawan
```

---

## US-HR-05 · Rekonsiliasi BPJS & PPh21

> *"Sebagai HR admin, saya ingin melihat akumulasi BPJS dan PPh21 bulan ini dalam satu dashboard, sehingga saya bisa transfer ke DJP dan BPJS tanpa perhitungan manual."*

**Acceptance Criteria:**
- [ ] ComplianceVault menampilkan breakdown per karyawan
- [ ] Total akumulasi BPJS Kesehatan, BPJS Ketenagakerjaan, dan PPh21 terpisah
- [ ] Export CSV tersedia untuk keperluan pelaporan
- [ ] Transfer ke rekening pemerintah dilakukan **manual** (safety buffer — tidak otomatis)

---

## US-HR-06 · Update Flow Rate (Kenaikan Gaji)

> *"Sebagai HR admin, saya ingin mengupdate nominal gaji karyawan saat kenaikan gaji tahunan, tanpa menghentikan stream yang berjalan."*

**Acceptance Criteria:**
- [ ] `update_flow_rate` berhasil dalam 1 transaksi
- [ ] Saldo yang terakru sebelum update dihitung dengan flow_rate lama
- [ ] Flow rate baru berlaku mulai dari timestamp update
- [ ] Riwayat perubahan flow_rate tersedia untuk audit

---

## US-HR-07 · Monitor Saldo Vault

> *"Sebagai HR admin, saya ingin menerima peringatan otomatis saat saldo vault hampir habis, sehingga saya punya waktu untuk top-up sebelum streaming terganggu."*

**Acceptance Criteria:**
- [ ] Alert terkirim via email/webhook saat `treasury_balance < 20%` dari kebutuhan bulanan
- [ ] Dashboard menampilkan estimasi waktu vault habis (burn rate)
- [ ] Top-up vault bisa dilakukan kapan saja tanpa menghentikan stream
