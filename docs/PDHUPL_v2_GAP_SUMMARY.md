# PDHUPL v2 — Ringkasan Gap dan Perubahan dari Draft Lama

Dokumen pendukung untuk `PDHUPL_v2.md`. Berisi hasil audit kode nyata (backend
`backend/src/routes/`, frontend `frontend/src/app/` + `frontend/src/application/mutations/`,
smart contract `finley-payroll/src/`) yang di-cross-check terhadap `SKPL.md` (FR-PAYANA-101
s.d. FR-PAYANA-1105, UC-01 s.d. UC-20).

---

## A. Gap: FR di SKPL tanpa implementasi nyata

**Tidak ditemukan.** Semua FR-PAYANA-1xx s.d. FR-PAYANA-1105 yang diperiksa punya fungsi/route
yang benar-benar dipanggil dari UI (baik langsung on-chain via `application/mutations/*.ts`,
maupun REST endpoint backend). Termasuk FR-1105 (UI Auditor FHE) yang tadinya diduga tidak
punya halaman terpisah — ternyata memang sengaja ditanam di `/hr/employees/[id]` dan
`/hr/vault` (hook `useAuditorActions.ts`), bukan gap.

## B. Gap: Implementasi nyata tanpa FR di SKPL

Tujuh modul berikut punya route backend aktif dan halaman frontend nyata, tapi **nol** nomor
FR-PAYANA-xxx di `SKPL.md`. Komentar di kode memakai penanda FR informal sendiri
(`FR-HR-BOUNTY`, `FR-EMP-RMB`, dll.) yang tidak pernah didaftarkan resmi ke SKPL:

| Modul | Route backend | Halaman frontend | Penanda FR informal di kode |
|---|---|---|---|
| Reimburse | `backend/src/routes/reimburse.ts` | `/employee/reimburse`, `/hr/reimburse` | `FR-EMP-RMB`, `FR-HR-RMB` |
| Bounty & Tip | `backend/src/routes/bounty.ts` | `/employee/bounty`, `/hr/bounty` | `FR-HR-BOUNTY`, `FR-EMP-BOUNTY` |
| Notifikasi | `backend/src/routes/notifications.ts` | `/employee/notifications` | `FR-PAYANA-N01/N02/N03` (belum resmi) |
| Slip Gaji (Payslip) | `backend/src/routes/payslip.ts` | `/employee/payslip` | `FR-PAYANA-PS01` (belum resmi) |
| Bukti Potong Pajak (Tax Cert) | `backend/src/routes/taxcert.ts` | `/employee/tax-cert` | `FR-PAYANA-TC01/TC02` (belum resmi) |
| Surat Keterangan Kerja | `backend/src/routes/employmentLetter.ts` | `/employee/employment-letter`, `/hr/employment-letters` | `FR-PAYANA-EL01/EL02/EL03` (belum resmi) |
| Direktori Karyawan | `backend/src/routes/directory.ts` | `/hr/directory` | `FR-PAYANA-D01/D02/D03` (belum resmi) |

Tambahan gap minor:
- **Pengaturan Perusahaan** (`backend/src/routes/companySettings.ts`, halaman `/hr/settings`
  bagian branding) — tidak punya FR maupun penanda informal sama sekali di kode.
- **Transfer Karyawan** (`/employee/transfer`, kirim IDRX ke alamat EVM lain) — punya halaman
  nyata tapi tidak ada FR spesifik; FR-PAYANA-403 hanya mendeskripsikan gasless relay untuk
  klaim gaji, bukan transfer arbitrary ke luar sistem.
- **Penangguhan Akses Klien** (`suspension.ts`) SUDAH punya FR-PAYANA-1005, tapi **tidak ada
  UC-xxx** yang memetakannya di tabel Daftar Use Case SKPL — gap parsial (FR ada, UC tidak).

**Rekomendasi:** ketujuh modul di atas + Pengaturan Perusahaan + Transfer Karyawan perlu
ditambahkan sebagai Kelompok FR baru di revisi SKPL berikutnya (di luar cakupan sesi ini —
sesi ini hanya menyusun butir uji black-box berdasarkan kode nyata, bukan merevisi SKPL).
Di `PDHUPL_v2.md`, kelas uji untuk modul-modul ini memakai identifikasi UC/FR
`[TIDAK ADA DI SKPL]` alih-alih memaksakan nomor UC/FR yang tidak resmi.

## C. Temuan bug/inkonsistensi kode (bukan gap dokumentasi, tapi defect nyata)

Dua temuan ini muncul saat audit cross-check kode vs kode (bukan kode vs SKPL), dan
**layak jadi butir uji negatif prioritas tinggi** karena berpotensi defect fungsional nyata:

1. **`useRequestAdvance` (`frontend/src/application/mutations/useKasbonActions.ts:15-19`)
   memanggil `requestAdvance()` on-chain dengan `args: []`**, padahal signature kontrak adalah
   `requestAdvance(uint256 amount)` (`ICompanyVault.sol:223`, `CompanyVault.sol:706`). Halaman
   `/employee/kasbon` (`frontend/src/app/employee/kasbon/page.tsx`) menghitung `maxAdvanceWei`
   (80% gaji bulanan) untuk **ditampilkan**, tapi tidak pernah menyediakan input untuk memilih
   jumlah kasbon dan tidak meneruskan nilai apa pun ke `requestAdvance()`. Hasil yang mungkin:
   error ABI-encoding di viem sebelum transaksi terkirim, atau — jika viem mengisi default 0 —
   transaksi terkirim dengan `amount = 0`, yang kemungkinan lolos validasi `amount > maxAdvance`
   (karena 0 selalu ≤ maxAdvance) tapi menghasilkan kasbon senilai 0. **Perlu diverifikasi
   langsung di sistem berjalan** — jadi butir uji AU-11-01 di `PDHUPL_v2.md` dengan status
   `[PERLU DIKONFIRMASI]`, bukan diasumsikan sebagai bug pasti tanpa eksekusi nyata.

2. **`backend/src/routes/webhook.ts:2636-2640`** menghitung topic hash `SALARY_CLAIMED` dari
   signature `SalaryClaimed(address,address,uint256,uint256,uint256,uint256,uint256)` (7
   parameter: 2 address + 5 uint256). Signature event aktual di
   `ICompanyVault.sol:79-88` pasca-Gen8 adalah
   `SalaryClaimed(address,address,uint256,uint256,uint256,uint256,uint256,uint256)` (2 address +
   6 uint256 — field `kasbonRepaid` ditambahkan Gen8 sebelum `timestamp`). Topic hash (keccak256
   dari signature) yang dihitung backend **tidak akan pernah cocok** dengan topic0 log on-chain
   yang sebenarnya, sehingga `handleLog()` di webhook Alchemy tidak akan pernah mengenali event
   `SalaryClaimed` yang masuk — WebSocket broadcast `SALARY_CLAIMED` ke dashboard karyawan/HR
   berpotensi tidak pernah terpicu pasca-Gen8. Juga tidak ada entri `TAX_WITHHELD` di map
   `TOPICS` sama sekali, padahal event `TaxWithheld` baru (Gen8) juga relevan untuk dashboard
   kepatuhan real-time. Jadi butir uji AU-05-05 (prioritas tinggi) di `PDHUPL_v2.md`.

Kedua temuan ini murni dari pembacaan kode (signature vs pemanggilan), bukan hasil eksekusi
sungguhan — status eksekusi tetap `[BELUM DIEKSEKUSI]` di Bab 5 sampai diverifikasi manual.

## D. Temuan dokumentasi SKPL yang masih stale (dicatat, di luar cakupan revisi PDHUPL ini)

- **FR-PAYANA-1007** (`SKPL.md` baris ~895) masih menyebutkan split tetap "93% karyawan, 5%
  kepatuhan, 2% severance" sebagai formula distribusi setelah potongan platform fee. Ini
  peninggalan pra-Gen8 yang terlewat saat revisi Kelompok G — kepatuhan (PPh21+BPJS) sekarang
  dihitung dinamis (FR-701/702), bukan porsi tetap 5%. Perlu direvisi di sesi SKPL berikutnya,
  bukan bagian dari tugas penyusunan PDHUPL ini.

## E. Ringkasan Perubahan: PDHUPL v1 (draft lama) → v2

| | v1 (`PDHUPL_draft.md`) | v2 (`PDHUPL_v2.md`) |
|---|---|---|
| Jumlah Kelas Uji | 22 (KU-01 s.d. KU-22) | 29 (KU-01 s.d. KU-29) |
| Jumlah Use Case dirujuk | 20 (UC-01 s.d. UC-20) | 20 (UC-01 s.d. UC-20) — sama, tidak ada UC baru dibuat |
| Jumlah butir uji (AU-xxx) | 53 (AU-001–AU-053; nomor 054–055 tidak pernah dipakai di tabel) | ~96 (AU-01-01 s.d. AU-29-04, skema baru `AU-<KU>-<skenario>`) |
| Modul Koperasi (KU-11/KU-12 lama) | Ada — 5 butir uji (join/deposit/withdraw/borrow/auto-repay) | **Dihapus total** — kontrak `EmployeeLiquidityContract` sudah tidak ada sejak Gen8 |
| Modul Kasbon | Tidak ada | **Baru** — KU-11 (karyawan) + KU-12 (HR), termasuk temuan bug AU-11-01 |
| Modul Tax Engine (PPh21 TER dinamis) | Tidak ada, masih asumsi split tetap 93/5/2 | Terintegrasi ke KU-05 (klaim gaji) sesuai formula deduction Gen8 |
| 7 modul baru (Reimburse, Bounty, Notifikasi, Payslip, Tax Cert, Employment Letter, Direktori) | Tidak ada sama sekali | **Baru** — KU-21 s.d. KU-27, ditandai `[TIDAK ADA DI SKPL]` karena memang belum ber-FR resmi |
| Suspension/Company Settings | Tidak ada | **Baru** — KU-28, KU-29 |
| Numbering AU-xxx | Sekuensial global (AU-001, AU-002, ...) | Per-Kelas-Uji dengan sub-skenario (`AU-05-01` sukses, `AU-05-02` alternatif kasbon aktif, dst) — mengikuti percabangan error/validasi nyata di kode |
| Bab 5 (Hasil Pengujian) | Sebagian sudah diisi dari `forge test` nyata (19 Jun 2026) untuk beberapa AU Foundry-level | Seluruh baris `[BELUM DIEKSEKUSI]` — v2 disusun murni dari audit kode statis sesi ini, belum ada re-run `forge test` atau pengujian manual baru |

**Catatan penting:** Bab 5 di `PDHUPL_v2.md` **sengaja dikosongkan semua** (`[BELUM
DIEKSEKUSI]`), termasuk untuk butir uji Foundry yang secara teknis bisa langsung dijalankan
ulang (`forge test`) — karena instruksi tugas ini eksplisit melarang mengisi kolom
"Hasil yang Didapat"/"Kesimpulan" tanpa eksekusi nyata dalam sesi penyusunan dokumen ini.
Penulis perlu menjalankan `forge test` dan prosedur manual sendiri untuk mengisi Bab 5.
