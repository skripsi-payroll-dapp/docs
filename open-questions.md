# Open Questions

> Format ini dirancang sebagai **Notion Database**. Setiap entry memiliki properti terstruktur untuk tracking status, owner, dan deadline.

---

## Database Schema (Notion)

| Property | Type | Options |
|---|---|---|
| `ID` | Text | OQ-001, OQ-002, ... |
| `Pertanyaan` | Title | — |
| `Kategori` | Select | Tech, Legal, Product, Business |
| `Owner` | Person | Tech Lead, Legal, CEO/CTO, Product |
| `Deadline` | Date | Sprint number atau tanggal |
| `Status` | Select | Open, In Progress, Resolved, Blocked |
| `Dampak Jika Tidak Resolved` | Text | — |
| `Keputusan` | Text | Diisi saat resolved |

---

## Open Questions

---

### OQ-001 · Ketersediaan IDRX di Base / Ethereum

| Property | Value |
|---|---|
| **Kategori** | Tech |
| **Owner** | Tech Lead |
| **Deadline** | Sprint 1 (sebelum mulai implementasi token) |
| **Status** | ⬜ Open |

**Pertanyaan:**
> Apakah IDRX sudah tersedia sebagai ERC-20 di Base mainnet? Jika belum, apakah bridge dari Ethereum mainnet tersedia, atau USDC menjadi fallback untuk MVP?

**Konteks:**
IDRX diterbitkan oleh PT Xurya Daya Indonesia dan tersedia sebagai ERC-20 di Ethereum mainnet. Namun ketersediaan di Base L2 perlu dikonfirmasi. Jika hanya ada di Ethereum mainnet, biaya bridge perlu dipertimbangkan. Seluruh sistem dibangun di atas IDRX sebagai Rupiah stablecoin.

**Opsi yang Tersedia:**
| Opsi | Pro | Kon |
|---|---|---|
| IDRX native di Base | User familiar dengan Rupiah, biaya rendah | Perlu koordinasi dengan issuer |
| Bridge IDRX dari ETH mainnet | IDRX sudah ada di ETH mainnet | Bridge latency + biaya bridge |
| USDC sebagai fallback | Tersedia di Base, liquid | Bukan Rupiah — konversi diperlukan |
| Custom test token | Bisa test sekarang | Tidak production-ready |

**Dampak Jika Tidak Resolved Sebelum Sprint 1:**
Implementasi token logic akan menggunakan mock ERC-20 token — migrasi ke IDRX di Sprint 6 akan butuh re-test seluruh split logic.

**Keputusan:**
```
[ Diisi saat resolved ]
Tanggal: ___
Keputusan: ___
Alasan: ___
```

---

### OQ-002 · Formula Severance UU Cipta Kerja

| Property | Value |
|---|---|
| **Kategori** | Legal |
| **Owner** | Legal |
| **Deadline** | Sprint 2 (sebelum SeveranceVault diimplementasi) |
| **Status** | ⬜ Open |

**Pertanyaan:**
> Berapa persentase severance default per claim yang paling sesuai dengan UU Cipta Kerja Pasal 156? Bagaimana formula kalibrasi `tenure_months` on-chain?

**Konteks:**
Saat ini diasumsikan 2% per claim terakumulasi di SeveranceVault. Namun formula pesangon aktual bergantung pada masa kerja (`tenure_months`) dan gaji terakhir — bukan persentase flat per claim.

**Pertanyaan Turunan:**
1. Apakah akumulasi 2% per claim sudah cukup untuk memenuhi kewajiban pesangon sesuai UU?
2. Bagaimana jika dana di SeveranceVault kurang saat PHK? Siapa yang menanggung selisihnya?
3. Apakah ada komponen pesangon lain (UPMK, UPH) yang harus dipertimbangkan?

**Referensi:**
- UU Cipta Kerja No. 11/2020 Pasal 156
- PP 35/2021 tentang PKWT, Alih Daya, Waktu Kerja, Waktu Istirahat, dan PHK

**Dampak Jika Tidak Resolved Sebelum Sprint 2:**
`SeveranceVault` diimplementasi dengan formula salah — perlu refactor besar di Sprint 6.

**Keputusan:**
```
[ Diisi saat resolved ]
Tanggal: ___
Formula final: ___
Sumber hukum: ___
```

---

### OQ-003 · Firma Audit Smart Contract

| Property | Value |
|---|---|
| **Kategori** | Business |
| **Owner** | CEO / CTO |
| **Deadline** | Sprint 3 (engage firma audit sejak dini) |
| **Status** | ⬜ Open |

**Pertanyaan:**
> Firma audit Solidity/EVM mana yang akan digunakan? Berapa budget dan timeline audit?

**Konteks:**
Smart contract Solidity yang mengelola dana gaji karyawan HARUS diaudit sebelum mainnet. Audit biasanya butuh 4–8 minggu dan perlu di-engage sejak Sprint 3 agar bisa selesai di Sprint 6. Tools tambahan: Slither (static analysis) dan Mythril (symbolic execution) wajib dijalankan sebelum audit eksternal.

**Kandidat Firma Audit:**
| Firma | Spesialisasi | Estimasi Waktu | Estimasi Cost |
|---|---|---|---|
| Trail of Bits | EVM / multi-chain, sangat dalam | 6–10 minggu | $$$$ |
| OpenZeppelin | Solidity specialist | 4–8 minggu | $$$$ |
| ConsenSys Diligence | Ethereum native | 4–8 minggu | $$$ |
| Sherlock | Decentralized audit + contest | 2–4 minggu | $$$ |
| Code4rena | Audit contest (community) | 1–2 minggu | $$ |

**Dampak Jika Tidak Resolved Sebelum Sprint 3:**
Tidak bisa engage firma tepat waktu → audit tertunda → launch mainnet mundur.

**Keputusan:**
```
[ Diisi saat resolved ]
Tanggal: ___
Firma dipilih: ___
Budget disetujui: ___
Timeline audit: ___
```

---

### OQ-004 · Legalitas Koperasi Karyawan

| Property | Value |
|---|---|
| **Kategori** | Legal |
| **Owner** | Legal |
| **Deadline** | Sprint 5 (sebelum koperasi diimplementasi) |
| **Status** | ⬜ Open |

**Pertanyaan:**
> Apakah koperasi karyawan memerlukan izin Kemenkop UKM sebelum go-live, atau cukup dengan internal company policy?

**Konteks:**
Platform berencana membangun koperasi karyawan sebagai closed-loop (hanya karyawan 1 perusahaan) untuk menghindari regulasi OJK Pinjol. Namun koperasi formal di Indonesia memerlukan badan hukum dari Kemenkop UKM.

**Pertanyaan Turunan:**
1. Apakah closed-loop lending antar karyawan masuk dalam definisi "koperasi" per UU No. 25/1992?
2. Apakah ada threshold transaksi/peserta yang membuat wajib daftar ke OJK?
3. Bisakah distrukturkan sebagai "employee benefit program" tanpa izin koperasi formal?

**Referensi:**
- UU Perkoperasian No. 25/1992
- OJK POJK No. 77/2016 tentang Layanan Pinjam Meminjam Uang Berbasis Teknologi Informasi

**Dampak Jika Tidak Resolved Sebelum Sprint 5:**
Koperasi diimplementasi tanpa kepastian legal → risiko shutdown setelah launch.

**Keputusan:**
```
[ Diisi saat resolved ]
Tanggal: ___
Struktur legal yang dipilih: ___
Izin yang diperlukan: ___
```

---

### OQ-005 · Model Bisnis (Revenue)

| Property | Value |
|---|---|
| **Kategori** | Product |
| **Owner** | Product |
| **Deadline** | Pre-launch (sebelum Sprint 6 selesai) |
| **Status** | ⬜ Open |

**Pertanyaan:**
> Model bisnis mana yang dipilih: fee per klaim, SaaS bulanan per karyawan, atau revenue share dari bunga koperasi?

**Opsi yang Tersedia:**

| Model | Mekanisme | Pro | Kon |
|---|---|---|---|
| **Fee per claim** | 0.x% dari setiap EWA claim | Langsung dari transaksi | User merasa "dikenakan biaya" tiap tarik |
| **SaaS bulanan** | Rp X.000/karyawan/bulan ke perusahaan | Predictable revenue | Sales cycle lebih panjang |
| **Rev share koperasi** | % dari bunga pinjaman karyawan | Align insentif | Revenue hanya dari koperasi adopters |
| **Hybrid** | SaaS + rev share | Stable + upside | Pricing lebih kompleks |

**Dampak Terhadap Produk:**
- Fee per claim → perlu on-chain fee routing di `claim_salary`
- SaaS → cukup off-chain billing
- Rev share → perlu pembagian interest di `EmployeeLiquidityProgram`

**Keputusan:**
```
[ Diisi saat resolved ]
Tanggal: ___
Model dipilih: ___
Rate/pricing: ___
```

---

### OQ-006 · Konfigurasi PPh21

| Property | Value |
|---|---|
| **Kategori** | Legal / Product |
| **Owner** | Legal + HR Pilot Companies |
| **Deadline** | Sprint 2 (sebelum ComplianceVault diimplementasi) |
| **Status** | ⬜ Open |

**Pertanyaan:**
> Apakah PPh21 di-hardcode per bracket, atau HR input manual per karyawan per bulan?

**Konteks:**
PPh21 di Indonesia menggunakan sistem progresif (tarif berbeda per bracket penghasilan). Setiap karyawan bisa punya tarif efektif yang berbeda tergantung penghasilan tahunan dan PTKP (Penghasilan Tidak Kena Pajak).

**Opsi:**
| Opsi | Cara Kerja | Akurasi | Kompleksitas |
|---|---|---|---|
| Hardcode per bracket | Sistem hitung otomatis berdasarkan gaji | Sedang (estimasi) | Rendah |
| HR input manual | HR set pph21_bps per karyawan | Tinggi | Sedang |
| Integrasi kalkulator DJP | Sync dengan aturan terbaru | Sangat tinggi | Tinggi |

**Recommendation:**
HR input manual per karyawan (opsi 2) untuk MVP — fleksibel dan tidak bergantung pada hardcode yang bisa ketinggalan perubahan aturan.

**Dampak Jika Tidak Resolved Sebelum Sprint 2:**
`ComplianceVault` diimplementasi dengan asumsi salah → split PPh21 tidak akurat → rekonsiliasi gagal.

**Keputusan:**
```
[ Diisi saat resolved ]
Tanggal: ___
Mekanisme dipilih: ___
Update frequency: ___
```

---

## Dashboard View (Notion)

> Salin tabel ini ke Notion sebagai Database dengan filter dan grouping:

```
Group by: Status
Filter: Status = Open | In Progress

Sorted by: Deadline ASC

Views:
  1. All Questions (default)
  2. Open Only
  3. By Owner
  4. By Sprint Deadline
```

---

## Log Keputusan

*Diisi saat setiap open question resolved.*

| ID | Tanggal Resolved | Keputusan | Owner |
|---|---|---|---|
| OQ-001 | — | — | — |
| OQ-002 | — | — | — |
| OQ-003 | — | — | — |
| OQ-004 | — | — | — |
| OQ-005 | — | — | — |
| OQ-006 | — | — | — |
