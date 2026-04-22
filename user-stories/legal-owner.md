# User Stories — Legal / Owner

> **Persona:** Pemilik perusahaan atau legal officer yang bertanggung jawab atas compliance ketenagakerjaan
>
> **Pain Point:** Risiko hukum pesangon, compliance Kemnaker, tidak ada audit trail untuk pembuktian

---

## US-LGL-01 · Approve PHK

> *"Sebagai legal officer, saya ingin menerima notifikasi dan menyetujui PHK dari device saya sendiri, tanpa perlu hadir fisik di kantor HR."*

**Acceptance Criteria:**
- [ ] Notifikasi diterima via email/app saat HR membuat proposal PHK
- [ ] Approval bisa dilakukan dari mobile browser
- [ ] Setelah approve, sistem konfirmasi status dan catat timestamp on-chain
- [ ] Legal **tidak bisa** mengeksekusi PHK sendirian — selalu butuh approval HR juga

**Keamanan Multi-Sig:**
```
HR membuat TerminationProposal
         │
    ─────┴─────
    │          │
  HR sign   Legal sign
  (bebas urutan)
    │          │
    └────┬─────┘
         │
  Kedua approval terpenuhi?
         │
     YES │ NO (> 7 hari)
         │          │
    execute_    Proposal
  termination   expired
                (tidak ada efek)
```

**Catatan Penting:**
- Proposal PHK tidak bisa dieksekusi unilateral oleh HR atau Legal saja
- Setelah 7 hari tanpa 2 approval, proposal expired secara otomatis
- State `RELEASED` adalah final — tidak bisa di-revert

---

## US-LGL-02 · Audit Trail Payroll

> *"Sebagai owner perusahaan, saya ingin melihat seluruh riwayat transaksi payroll yang tersimpan on-chain, sebagai bukti compliance untuk audit eksternal."*

**Acceptance Criteria:**
- [ ] Semua transaksi tersedia di Basescan via Work ID address perusahaan
- [ ] Export laporan payroll tersedia (format CSV/PDF)
- [ ] Data **immutable** — tidak bisa dimodifikasi siapapun termasuk platform
- [ ] Filter berdasarkan periode, karyawan, atau jenis transaksi tersedia

**Jenis Transaksi yang Bisa Diaudit:**
| Jenis | On-Chain | Off-Chain |
|---|---|---|
| Claim EWA per karyawan | ✓ | ✓ |
| Split ComplianceVault | ✓ | ✓ |
| Akumulasi SeveranceVault | ✓ | ✓ |
| Proposal & Approval PHK | ✓ | ✓ |
| Cliff vest claim/forfeit | ✓ | ✓ |
| Data PII karyawan (nama, NIK) | ✗ | ✓ |

---

## US-LGL-03 · Verifikasi Pesangon On-Chain

> *"Sebagai legal officer, saya ingin memastikan dana pesangon seluruh karyawan terjamin on-chain, sehingga perusahaan terlindungi dari sengketa ketenagakerjaan."*

**Acceptance Criteria:**
- [ ] Dashboard legal menampilkan total SeveranceVault semua karyawan
- [ ] Formula pesangon mengikuti **UU Cipta Kerja Pasal 156** (dikalibrasi via `tenure_months`)
- [ ] Perusahaan **tidak bisa** menarik dana dari SeveranceVault secara unilateral
- [ ] Laporan akumulasi pesangon per karyawan tersedia untuk keperluan audit Disnaker

**Formula Pesangon (UU Cipta Kerja Pasal 156):**
```
Uang Pesangon berdasarkan masa kerja:
< 1 tahun    = 1 bulan gaji
1–2 tahun   = 2 bulan gaji
2–3 tahun   = 3 bulan gaji
3–4 tahun   = 4 bulan gaji
4–5 tahun   = 5 bulan gaji
5–6 tahun   = 6 bulan gaji
6–7 tahun   = 7 bulan gaji
7–8 tahun   = 8 bulan gaji
≥ 8 tahun   = 9 bulan gaji

(kalibrasi via tenure_months on-chain)
```

---

## US-LGL-04 · Review Compliance BPJS & PPh21

> *"Sebagai owner, saya ingin memastikan BPJS dan PPh21 seluruh karyawan sudah diakumulasikan dengan benar, sehingga perusahaan tidak terkena denda kepatuhan."*

**Acceptance Criteria:**
- [ ] ComplianceVault menampilkan breakdown BPJS Kesehatan, BPJS Ketenagakerjaan, dan PPh21 terpisah
- [ ] Rate PPh21 **tidak di-hardcode** — bisa diupdate HR sesuai kebijakan Kemenkeu
- [ ] Transfer ke DJP/BPJS dilakukan manual (tidak otomatis ke pihak ketiga sebagai safety buffer)
- [ ] Riwayat transfer compliance tersedia untuk verifikasi
