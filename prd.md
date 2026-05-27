# Product Requirements Document (PRD)
# Payana — Platform Payroll Berbasis Web3

**Versi:** 1.1  
**Tanggal:** 27 Mei 2026  
**Status:** Draft — Prototipe Skripsi  
**Platform:** Next.js 16 + Base Blockchain (Sepolia Testnet)

---

## 1. Latar Belakang & Tujuan

Payana adalah platform *Earned Wage Access* (EWA) dan penggajian berbasis blockchain yang memungkinkan karyawan mengakses gaji yang telah mereka peroleh secara real-time, tanpa menunggu siklus payroll bulanan. Sistem dibangun di atas jaringan Base (Ethereum L2) menggunakan stablecoin IDRX (1 IDRX = 1 Rupiah) sebagai medium pembayaran.

**Tujuan Produk:**
- Memberikan akses gaji harian (EWA) kepada karyawan secara transparan dan terverifikasi di blockchain
- Mengotomasi alur kepatuhan (compliance) BPJS dan PPh21 melalui *smart contract*
- Menjamin pesangon karyawan melalui mekanisme *escrow* on-chain
- Menyediakan fasilitas pinjaman koperasi P2P antar karyawan

**Pengguna Target:**
| Role | Deskripsi |
|---|---|
| **HR Manager** | Admin perusahaan yang mengelola vault, karyawan, dan compliance |
| **Karyawan** | Penerima gaji yang mengakses EWA, koperasi, dan informasi payroll |
| **Legal Officer** | Pihak yang memberikan persetujuan dalam proses PHK multi-signature |
| **Owner SaaS** | Admin platform Payana yang memantau keseluruhan tenant, metrik platform, dan mengelola pendaftaran karyawan lintas tenant |

---

## 2. Cakupan (Scope)

Dokumen ini mencakup fungsionalitas frontend prototipe Payana yang terdiri dari:
- Portal HR (`/hr/*`)
- Portal Karyawan (`/employee/*`)
- Halaman Autentikasi (`/login`)
- Halaman Onboarding Karyawan Baru (`/onboarding`)
- Dashboard Owner SaaS (`/owner/*`)

**Di luar cakupan prototipe ini:** Integrasi fiat on/off ramp, notifikasi push mobile native, dan audit smart contract eksternal.

---

## 3. Modul & Fungsionalitas

Setiap fungsionalitas diberi ID unik dengan format `FR-[MODUL]-[NOMOR]`.

---

### 3.1 Autentikasi (FR-AUTH)

**Deskripsi:** Halaman login tunggal untuk semua role. Setelah autentikasi berhasil via Privy, sistem mendeteksi role pengguna (hr, employee, legal, owner, atau null) dan mengarahkan ke dashboard yang sesuai: HR diarahkan ke `/hr/vault`, Karyawan terdaftar ke `/employee/ewa`, Legal Officer ke `/hr/phk`, Owner SaaS ke `/owner`, dan pengguna dengan role null (belum terdaftar) diarahkan ke `/onboarding`.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-AUTH-01 | Menampilkan form input alamat email | P0 |
| FR-AUTH-02 | Tombol "Lanjutkan dengan Email" untuk login via OTP | P0 |
| FR-AUTH-03 | Tombol "Lanjutkan dengan Google" untuk SSO Google | P0 |
| FR-AUTH-04 | Tombol "Lanjutkan dengan WhatsApp" untuk OTP WhatsApp | P0 |
| FR-AUTH-05 | Tombol "Connect MetaMask" untuk login via wallet eksternal | P1 |
| FR-AUTH-06 | Menampilkan divider pemisah antara metode login | P0 |
| FR-AUTH-07 | Shortcut akses demo HR Portal langsung ke `/hr/vault` | P0 |
| FR-AUTH-08 | Shortcut akses demo EWA App langsung ke `/employee/ewa` | P0 |
| FR-AUTH-09 | Legal Officer diarahkan otomatis ke `/hr/phk` setelah login terdeteksi sebagai role legal | P0 |

**Subtotal: 9 fungsionalitas**

---

### 3.2 HR — Onboarding Vault (FR-HR-OB)

**Deskripsi:** Wizard setup multi-langkah untuk HR yang pertama kali mendaftarkan perusahaan ke platform. Mencakup registrasi perusahaan, konfigurasi smart contract, dan deposit awal IDRX.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-HR-OB-01 | Menampilkan progress stepper 4 langkah (Registrasi → Deploy → Deposit → Selesai) | P1 |
| FR-HR-OB-02 | Form input nama perusahaan pada langkah 1 | P0 |
| FR-HR-OB-03 | Form input NPWP perusahaan (format 15 digit) pada langkah 1 | P0 |
| FR-HR-OB-04 | Form input email PIC pada langkah 1 | P0 |
| FR-HR-OB-05 | Form konfigurasi persentase alokasi BPJS (basis poin) pada langkah 2 | P0 |
| FR-HR-OB-06 | Form konfigurasi persentase alokasi pesangon (basis poin) pada langkah 2 | P0 |
| FR-HR-OB-07 | Tombol "Deploy Vault" untuk inisialisasi smart contract perusahaan | P0 |
| FR-HR-OB-08 | Form deposit jumlah IDRX awal setelah vault berhasil di-deploy | P0 |
| FR-HR-OB-09 | Tombol "Deposit IDRX" untuk mendanai vault | P0 |
| FR-HR-OB-10 | Layar konfirmasi sukses setelah proses onboarding selesai | P0 |
| FR-HR-OB-11 | Navigasi antar langkah (Lanjut / Kembali) | P1 |

**Subtotal: 11 fungsionalitas**

---

### 3.3 HR — Manajemen Vault (FR-HR-VT)

**Deskripsi:** Dashboard utama HR untuk memantau saldo vault perusahaan, proyeksi kas, dan riwayat transaksi vault.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-HR-VT-01 | Menampilkan saldo vault aktual dalam format Rupiah | P0 |
| FR-HR-VT-02 | Menampilkan burn rate bulanan berdasarkan total gaji aktif | P0 |
| FR-HR-VT-03 | Menampilkan estimasi waktu vault habis (runway dalam bulan) | P1 |
| FR-HR-VT-04 | Menampilkan grafik area tren penurunan saldo vault (7 hari) | P1 |
| FR-HR-VT-05 | Menampilkan status vault (Active / Paused / Frozen) dengan badge | P0 |
| FR-HR-VT-06 | Menampilkan alokasi split 93/5/2 dengan progress bar per kategori | P0 |
| FR-HR-VT-07 | Tombol "Top Up Vault" membuka modal deposit | P0 |
| FR-HR-VT-08 | Form input nominal top-up dengan format Rupiah otomatis | P0 |
| FR-HR-VT-09 | Menampilkan saldo dompet HR saat ini di dalam modal top-up | P1 |
| FR-HR-VT-10 | Tombol konfirmasi top-up dengan loading state | P0 |
| FR-HR-VT-11 | Tombol "Konfigurasi" membuka modal edit split percentage | P1 |
| FR-HR-VT-12 | Form edit persentase alokasi BPJS & Pajak di modal konfigurasi | P1 |
| FR-HR-VT-13 | Form edit persentase alokasi pesangon di modal konfigurasi | P1 |
| FR-HR-VT-14 | Menampilkan tabel riwayat transaksi vault (tanggal, tipe, jumlah, aktor) | P1 |
| FR-HR-VT-15 | Badge warna berbeda untuk transaksi Top Up vs Withdraw di tabel | P1 |

**Subtotal: 15 fungsionalitas**

---

### 3.4 HR — Manajemen Karyawan (FR-HR-EMP)

**Deskripsi:** Tabel manajemen seluruh karyawan aktif beserta status stream gaji dan aksi yang tersedia per karyawan.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-HR-EMP-01 | Menampilkan tabel karyawan aktif (nama, email, Work ID, gaji, EWA terakru, status) | P0 |
| FR-HR-EMP-02 | Input pencarian karyawan berdasarkan nama atau email (real-time filter) | P1 |
| FR-HR-EMP-03 | Dropdown filter status stream (Semua / Active / Paused) | P1 |
| FR-HR-EMP-04 | Menampilkan avatar inisial nama karyawan di kolom pertama | P2 |
| FR-HR-EMP-05 | Menampilkan Work ID (alamat wallet) karyawan dalam format monospace | P0 |
| FR-HR-EMP-06 | Menampilkan jumlah EWA terakru per karyawan saat ini | P0 |
| FR-HR-EMP-07 | Badge status stream (Active dengan indikator hijau / Paused) | P0 |
| FR-HR-EMP-08 | Tombol Pause Stream per karyawan (mengubah status ke Paused) | P0 |
| FR-HR-EMP-09 | Tombol Resume Stream per karyawan (mengubah status ke Active) | P0 |
| FR-HR-EMP-10 | Tombol Edit Gaji per karyawan | P1 |
| FR-HR-EMP-11 | Tombol lihat detail karyawan (link ke `/hr/employees/[id]`) | P0 |
| FR-HR-EMP-12 | Tombol Propose PHK per karyawan (aksi destruktif) | P0 |
| FR-HR-EMP-13 | Tampilan empty state saat tidak ada karyawan yang sesuai filter | P1 |
| FR-HR-EMP-14 | Tombol "Tambah Karyawan" membuka modal pendaftaran | P0 |
| FR-HR-EMP-15 | Form tambah karyawan: input nama lengkap | P0 |
| FR-HR-EMP-16 | Form tambah karyawan: input alamat email | P0 |
| FR-HR-EMP-17 | Form tambah karyawan: input gaji bulanan dengan format Rupiah | P0 |
| FR-HR-EMP-18 | Kalkulasi flow rate otomatis (gaji / 2.592.000 detik) ditampilkan di form | P1 |
| FR-HR-EMP-19 | Tombol konfirmasi tambah karyawan dengan loading state | P0 |

**Subtotal: 19 fungsionalitas**

---

### 3.5 HR — Detail Karyawan (FR-HR-EMP-DET)

**Deskripsi:** Halaman profil lengkap per karyawan dengan informasi gaji, riwayat klaim, dan manajemen status.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-HR-EMP-DET-01 | Menampilkan nama, email, dan Work ID karyawan | P0 |
| FR-HR-EMP-DET-02 | Menampilkan tanggal mulai bekerja dan tenure (bulan) | P0 |
| FR-HR-EMP-DET-03 | Menampilkan simulator EWA terakru real-time (counter bergerak) | P0 |
| FR-HR-EMP-DET-04 | Menampilkan breakdown gaji (gaji pokok, tunjangan, potongan) | P1 |
| FR-HR-EMP-DET-05 | Menampilkan heatmap kehadiran 80 hari terakhir | P2 |
| FR-HR-EMP-DET-06 | Menampilkan riwayat klaim EWA karyawan | P1 |
| FR-HR-EMP-DET-07 | Menampilkan daftar cliff vest aktif milik karyawan | P1 |
| FR-HR-EMP-DET-08 | Menampilkan log aktivitas/audit karyawan | P1 |
| FR-HR-EMP-DET-09 | Tombol "Resign Karyawan" dengan konfirmasi | P0 |

**Subtotal: 9 fungsionalitas**

---

### 3.6 HR — Proses PHK (FR-HR-PHK)

**Deskripsi:** Alur multi-signature untuk proses Pemutusan Hubungan Kerja. Memerlukan persetujuan dari HR dan Legal Officer sebelum eksekusi.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-HR-PHK-01 | Menampilkan daftar proposal PHK aktif dalam kartu terstruktur | P0 |
| FR-HR-PHK-02 | Badge status proposal (Menunggu Legal / Siap Dieksekusi / Expired) | P0 |
| FR-HR-PHK-03 | Menampilkan nama karyawan dan alasan PHK per proposal | P0 |
| FR-HR-PHK-04 | Menampilkan jumlah pesangon yang akan dicairkan | P0 |
| FR-HR-PHK-05 | Menampilkan tanggal proposal dibuat | P0 |
| FR-HR-PHK-06 | Indikator visual status tanda tangan HR (✓ / pending) | P0 |
| FR-HR-PHK-07 | Indikator visual status tanda tangan Legal Officer (✓ / pending) | P0 |
| FR-HR-PHK-08 | Countdown hari sebelum proposal expire | P1 |
| FR-HR-PHK-09 | Tombol "Eksekusi PHK" (aktif hanya jika kedua pihak sudah approve) | P0 |
| FR-HR-PHK-10 | Tombol "Buat Proposal PHK" membuka modal | P0 |
| FR-HR-PHK-11 | Form dropdown pilih karyawan untuk di-PHK | P0 |
| FR-HR-PHK-12 | Form textarea alasan PHK | P0 |
| FR-HR-PHK-13 | Tombol submit proposal dengan loading state | P0 |

**Subtotal: 13 fungsionalitas**

---

### 3.7 HR — Laporan Compliance (FR-HR-COMP)

**Deskripsi:** Laporan bulanan distribusi ComplianceVault untuk kebutuhan rekonsiliasi BPJS dan PPh21.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-HR-COMP-01 | Dropdown pilih bulan laporan | P1 |
| FR-HR-COMP-02 | Menampilkan total akumulasi ComplianceVault bulan terpilih | P0 |
| FR-HR-COMP-03 | Kartu breakdown estimasi BPJS Kesehatan | P0 |
| FR-HR-COMP-04 | Kartu breakdown estimasi BPJS Ketenagakerjaan | P0 |
| FR-HR-COMP-05 | Kartu breakdown estimasi PPh21 | P0 |
| FR-HR-COMP-06 | Grafik tren compliance bulanan | P1 |
| FR-HR-COMP-07 | Tabel per karyawan: nama, total klaim, estimasi BPJS, estimasi PPh21 | P0 |
| FR-HR-COMP-08 | Tombol "Export CSV" untuk unduh laporan | P0 |
| FR-HR-COMP-09 | Catatan informasi: transfer ke DJP/BPJS dilakukan manual | P0 |

**Subtotal: 9 fungsionalitas**

---

### 3.8 HR — Cliff Vesting (FR-HR-VEST)

**Deskripsi:** Manajemen bonus retensi, masa percobaan, dan ESOP yang terkunci hingga tanggal cliff tertentu.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-HR-VEST-01 | Menampilkan ringkasan statistik (total terkunci, total vested, jumlah karyawan) | P1 |
| FR-HR-VEST-02 | Pie chart distribusi locked vs vested | P1 |
| FR-HR-VEST-03 | Tabel daftar vest aktif (karyawan, tipe, jumlah, cliff date, status) | P1 |
| FR-HR-VEST-04 | Badge tipe vest (Retensi / Masa Percobaan / ESOP) | P1 |
| FR-HR-VEST-05 | Tombol "Buat Cliff Vest" membuka modal | P1 |
| FR-HR-VEST-06 | Form: pilih karyawan, tipe vest, jumlah IDRX, tanggal cliff | P1 |
| FR-HR-VEST-07 | Tombol submit vest dengan loading state | P1 |

**Subtotal: 7 fungsionalitas**

---

### 3.9 HR — Koperasi (FR-HR-KOP)

**Deskripsi:** Dashboard HR untuk memantau status pool koperasi karyawan dan mengelola pinjaman yang aktif.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-HR-KOP-01 | Menampilkan total likuiditas tersedia di pool | P1 |
| FR-HR-KOP-02 | Menampilkan total pinjaman aktif dan outstanding | P1 |
| FR-HR-KOP-03 | Menampilkan suku bunga pool (APY) | P1 |
| FR-HR-KOP-04 | Grafik pertumbuhan likuiditas pool | P2 |
| FR-HR-KOP-05 | Tabel daftar pinjaman aktif karyawan (nama, jumlah, jatuh tempo, status) | P1 |
| FR-HR-KOP-06 | Badge status pinjaman (Active / Overdue / Lunas) | P1 |
| FR-HR-KOP-07 | Tombol "Liquidasi" untuk pinjaman yang melewati grace period | P1 |
| FR-HR-KOP-08 | Modal konfirmasi likuidasi pinjaman | P1 |

**Subtotal: 8 fungsionalitas**

---

### 3.10 HR — Absensi & Cuti (FR-HR-ATT)

**Deskripsi:** Manajemen data kehadiran karyawan dan persetujuan pengajuan cuti.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-HR-ATT-01 | Menampilkan ringkasan kehadiran perusahaan hari ini | P1 |
| FR-HR-ATT-02 | Tabel daftar karyawan dengan status hadir/absen hari ini | P1 |
| FR-HR-ATT-03 | Menampilkan daftar pengajuan cuti yang perlu disetujui | P1 |
| FR-HR-ATT-04 | Tombol Approve pengajuan cuti | P1 |
| FR-HR-ATT-05 | Tombol Reject pengajuan cuti | P1 |
| FR-HR-ATT-06 | Badge status pengajuan (Pending / Approved / Rejected) | P1 |

**Subtotal: 6 fungsionalitas**

---

### 3.11 HR — Reimburse (FR-HR-RMB)

**Deskripsi:** Persetujuan pengajuan reimburse operasional karyawan dengan pembayaran instan via IDRX.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-HR-RMB-01 | Menampilkan daftar pengajuan reimburse pending | P1 |
| FR-HR-RMB-02 | Detail pengajuan: nama karyawan, kategori, jumlah, deskripsi | P1 |
| FR-HR-RMB-03 | Tombol Approve dengan konfirmasi modal | P1 |
| FR-HR-RMB-04 | Tombol Reject pengajuan reimburse | P1 |
| FR-HR-RMB-05 | Riwayat reimburse yang sudah diproses | P1 |

**Subtotal: 5 fungsionalitas**

---

### 3.12 HR — Audit Log (FR-HR-AUD)

**Deskripsi:** Log aktivitas on-chain yang terindeks dari blockchain untuk keperluan audit perusahaan.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-HR-AUD-01 | Input pencarian transaksi berdasarkan kata kunci | P1 |
| FR-HR-AUD-02 | Menampilkan status sinkronisasi indexer (Ponder) | P1 |
| FR-HR-AUD-03 | Tabel log: tx hash, tipe event, block number, timestamp, detail | P0 |
| FR-HR-AUD-04 | Link ke block explorer (BaseScan) per transaksi | P1 |
| FR-HR-AUD-05 | Filter berdasarkan tipe transaksi | P1 |

**Subtotal: 5 fungsionalitas**

---

### 3.13 HR — Bounty & Insentif (FR-HR-BOUNTY)

**Deskripsi:** Pembuatan dan manajemen tugas/misi berhadiah yang dapat diklaim oleh karyawan.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-HR-BOUNTY-01 | Menampilkan daftar bounty aktif yang dibuat HR | P2 |
| FR-HR-BOUNTY-02 | Tombol buat bounty baru (judul, deskripsi, hadiah IDRX, kuota) | P2 |
| FR-HR-BOUNTY-03 | Menampilkan progress klaim per bounty | P2 |
| FR-HR-BOUNTY-04 | Tombol close/deactivate bounty | P2 |

**Subtotal: 4 fungsionalitas**

---

### 3.14 Employee — EWA Dashboard (FR-EMP-EWA)

**Deskripsi:** Halaman utama karyawan untuk memantau gaji terakru secara real-time dan melakukan penarikan EWA.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-EMP-EWA-01 | Menampilkan saldo EWA terakru yang bergerak setiap 100ms | P0 |
| FR-EMP-EWA-02 | Indikator "Streaming Aktif" dengan animasi pulse | P0 |
| FR-EMP-EWA-03 | Menampilkan flow rate dalam IDR/detik | P1 |
| FR-EMP-EWA-04 | Progress bar visualisasi 0–limit 80% gaji bulanan | P0 |
| FR-EMP-EWA-05 | Persentase progres terhadap limit EWA | P1 |
| FR-EMP-EWA-06 | Tombol "Tarik Gaji" (CTA utama) | P0 |
| FR-EMP-EWA-07 | Loading state saat proses klaim berlangsung | P0 |
| FR-EMP-EWA-08 | Notifikasi sukses setelah klaim berhasil | P0 |
| FR-EMP-EWA-09 | Reset balance ke 0 setelah klaim | P0 |
| FR-EMP-EWA-10 | Label "Gasless via ERC-4337 Paymaster" di bawah tombol klaim | P1 |
| FR-EMP-EWA-11 | Kartu Smart Account dengan saldo IDRX | P0 |
| FR-EMP-EWA-12 | Menampilkan alamat Work ID dalam format singkat | P1 |
| FR-EMP-EWA-13 | Tombol shortcut Transfer IDRX | P1 |
| FR-EMP-EWA-14 | Tombol shortcut Kirim Tip | P2 |
| FR-EMP-EWA-15 | Kartu Bonus Vesting dengan jumlah, tanggal cair, dan progress bar | P1 |
| FR-EMP-EWA-16 | Daftar 3 transaksi terakhir (tipe, tanggal, jumlah, tx hash) | P1 |
| FR-EMP-EWA-17 | Link "Lihat Semua Transaksi" ke halaman audit | P1 |
| FR-EMP-EWA-18 | Mini grafik area akumulasi gaji bulan ini | P2 |

**Subtotal: 18 fungsionalitas**

---

### 3.15 Employee — Pesangon (FR-EMP-SEV)

**Deskripsi:** Informasi saldo pesangon yang terkunci dalam smart contract escrow beserta status hukumnya.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-EMP-SEV-01 | Menampilkan total saldo pesangon terakumulasi (IDR) | P0 |
| FR-EMP-SEV-02 | Badge status pesangon (LOCKED / RETURNED / RELEASED) | P0 |
| FR-EMP-SEV-03 | Grafik batang akumulasi pesangon per bulan | P2 |
| FR-EMP-SEV-04 | Informasi tenure karyawan dan hak pesangon (UU Cipta Kerja) | P1 |
| FR-EMP-SEV-05 | Teks penjelasan kondisi pencairan pesangon | P0 |
| FR-EMP-SEV-06 | Link ke referensi UU Cipta Kerja Pasal 156 | P2 |

**Subtotal: 6 fungsionalitas**

---

### 3.16 Employee — Cliff Vesting (FR-EMP-VEST)

**Deskripsi:** Tampilan bonus karyawan yang terkunci hingga tanggal cliff tertentu.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-EMP-VEST-01 | Kartu bonus terkunci: tipe vest, jumlah, tanggal cliff | P1 |
| FR-EMP-VEST-02 | Countdown timer visual hari:jam:menit hingga cliff | P1 |
| FR-EMP-VEST-03 | Tombol "Claim Bonus" disabled dengan tooltip sebelum cliff date | P1 |
| FR-EMP-VEST-04 | Tombol "Claim Bonus" aktif setelah cliff date tercapai | P1 |
| FR-EMP-VEST-05 | Tampilan bonus yang sudah di-claim (tipe, jumlah, tanggal) | P1 |
| FR-EMP-VEST-06 | Empty state jika tidak ada vest aktif | P1 |

**Subtotal: 6 fungsionalitas**

---

### 3.17 Employee — Transfer IDRX (FR-EMP-TRF)

**Deskripsi:** Fitur transfer IDRX ke wallet EVM eksternal (MetaMask, exchange, dll).

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-EMP-TRF-01 | Input alamat tujuan (EVM address, format 0x...) | P1 |
| FR-EMP-TRF-02 | Input jumlah IDRX yang akan dikirim | P1 |
| FR-EMP-TRF-03 | Tombol "Maks" untuk mengisi saldo penuh otomatis | P1 |
| FR-EMP-TRF-04 | Slider untuk memilih jumlah transfer | P2 |
| FR-EMP-TRF-05 | Menampilkan estimasi gas fee (Gratis via Paymaster) | P1 |
| FR-EMP-TRF-06 | Menampilkan estimasi waktu konfirmasi transaksi | P2 |
| FR-EMP-TRF-07 | Menampilkan total yang akan dikirim dalam preview | P1 |
| FR-EMP-TRF-08 | Tombol "Kirim" dengan loading state | P1 |
| FR-EMP-TRF-09 | Kartu saldo IDRX tersedia saat ini | P0 |
| FR-EMP-TRF-10 | Tabel riwayat transfer (tanggal, tujuan, jumlah, status) | P1 |
| FR-EMP-TRF-11 | Badge status transaksi (Success / Pending / Failed) | P1 |
| FR-EMP-TRF-12 | Salin tx hash per riwayat transaksi | P2 |

**Subtotal: 12 fungsionalitas**

---

### 3.18 Employee — Koperasi (FR-EMP-KOP)

**Deskripsi:** Fasilitas pinjaman dan simpanan P2P koperasi karyawan berbasis liquidity pool.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-EMP-KOP-01 | Tab navigasi: Ajukan Pinjaman (Borrow) | P1 |
| FR-EMP-KOP-02 | Tab navigasi: Sediakan Likuiditas (Lend) | P1 |
| **Tab Pinjam** | | |
| FR-EMP-KOP-03 | Input nominal pinjaman dengan format Rupiah | P1 |
| FR-EMP-KOP-04 | Slider untuk memilih nominal pinjaman | P1 |
| FR-EMP-KOP-05 | Menampilkan batas maksimal pinjaman (80% gaji bulanan) | P1 |
| FR-EMP-KOP-06 | Kalkulasi otomatis jasa koperasi (1.5% APY) | P1 |
| FR-EMP-KOP-07 | Menampilkan total pengembalian pinjaman | P1 |
| FR-EMP-KOP-08 | Tombol "Cairkan Dana ke Saldo EWA" | P1 |
| FR-EMP-KOP-09 | Informasi cicilan akan dipotong otomatis dari aliran gaji | P1 |
| FR-EMP-KOP-10 | Kartu status pinjaman aktif (sisa, progress pelunasan) | P1 |
| FR-EMP-KOP-11 | Progress bar pelunasan pinjaman | P1 |
| FR-EMP-KOP-12 | Tombol "Pelunasan Manual via IDRX" | P1 |
| FR-EMP-KOP-13 | Alert informasi pemotongan otomatis dari gaji | P1 |
| **Tab Simpan** | | |
| FR-EMP-KOP-14 | Menampilkan estimasi yield berjalan (18.5% APY) | P1 |
| FR-EMP-KOP-15 | Input jumlah deposit dari saldo IDRX | P1 |
| FR-EMP-KOP-16 | Tombol "Deposit via Saldo EWA Instan" | P1 |
| FR-EMP-KOP-17 | Tombol "Top-Up via Bank Transfer" | P1 |
| FR-EMP-KOP-18 | Kartu portofolio: total deposit aktif, bunga terkumpul | P1 |
| FR-EMP-KOP-19 | Status kontrak simpanan (Active / Inactive) | P1 |
| FR-EMP-KOP-20 | Tombol "Tarik Pokok & Bunga" | P1 |

**Subtotal: 20 fungsionalitas**

---

### 3.19 Employee — Absensi & Cuti (FR-EMP-ATT)

**Deskripsi:** Pencatatan kehadiran harian dan pengajuan cuti karyawan.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-EMP-ATT-01 | Tombol Clock In dengan tampilan jam saat ini | P1 |
| FR-EMP-ATT-02 | Tombol Clock Out (aktif setelah Clock In) | P1 |
| FR-EMP-ATT-03 | Heatmap kehadiran 120 hari terakhir | P2 |
| FR-EMP-ATT-04 | Kartu kuota cuti tersisa (Tahunan / Sakit / Khusus) | P1 |
| FR-EMP-ATT-05 | Tombol "Ajukan Cuti" membuka modal form pengajuan | P1 |
| FR-EMP-ATT-06 | Form pengajuan cuti: tipe, tanggal mulai, tanggal selesai, keterangan | P1 |
| FR-EMP-ATT-07 | Riwayat pengajuan cuti dengan status | P1 |

**Subtotal: 7 fungsionalitas**

---

### 3.20 Employee — Audit Log (FR-EMP-AUD)

**Deskripsi:** Log transaksi on-chain personal karyawan untuk transparansi riwayat payroll.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-EMP-AUD-01 | Tabel log transaksi pribadi (tx hash, tipe, jumlah, tanggal) | P0 |
| FR-EMP-AUD-02 | Input pencarian transaksi | P1 |
| FR-EMP-AUD-03 | Link ke BaseScan per tx hash | P1 |
| FR-EMP-AUD-04 | Menampilkan block number transaksi | P1 |
| FR-EMP-AUD-05 | Filter berdasarkan tipe transaksi | P1 |

**Subtotal: 5 fungsionalitas**

---

### 3.21 Employee — Reimburse (FR-EMP-RMB)

**Deskripsi:** Pengajuan klaim reimburse operasional oleh karyawan.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-EMP-RMB-01 | Tombol "Ajukan Reimburse" membuka form | P1 |
| FR-EMP-RMB-02 | Form: kategori pengeluaran, jumlah, tanggal, deskripsi | P1 |
| FR-EMP-RMB-03 | Upload bukti bon/struk | P1 |
| FR-EMP-RMB-04 | Riwayat pengajuan reimburse dengan status (Pending / Approved / Rejected) | P1 |
| FR-EMP-RMB-05 | Notifikasi saat reimburse disetujui HR | P1 |

**Subtotal: 5 fungsionalitas**

---

### 3.22 Employee — Bounty (FR-EMP-BOUNTY)

**Deskripsi:** Board misi berhadiah dan fitur tipping antar sesama karyawan.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-EMP-BOUNTY-01 | Tab: Board Misi (daftar bounty aktif yang bisa diklaim) | P2 |
| FR-EMP-BOUNTY-02 | Kartu bounty: judul, deskripsi, reward, kuota tersisa, badge rarity | P2 |
| FR-EMP-BOUNTY-03 | Tombol "Klaim Misi" membuka modal submit bukti | P2 |
| FR-EMP-BOUNTY-04 | Form submit klaim: URL bukti pekerjaan | P2 |
| FR-EMP-BOUNTY-05 | Tab: Kirim Tip (transfer IDRX antar karyawan) | P2 |
| FR-EMP-BOUNTY-06 | Form kirim tip: pilih penerima, nominal, pesan opsional | P2 |

**Subtotal: 6 fungsionalitas**

---

### 3.23 Employee — Pengaturan Akun (FR-EMP-SET)

**Deskripsi:** Manajemen profil, keamanan, dan konfigurasi akun Web3 karyawan.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-EMP-SET-01 | Menampilkan nama lengkap (read-only) | P0 |
| FR-EMP-SET-02 | Menampilkan email akun (read-only) | P0 |
| FR-EMP-SET-03 | Form edit nomor telepon dengan tombol simpan | P1 |
| FR-EMP-SET-04 | Tombol "Ganti Password" | P1 |
| FR-EMP-SET-05 | Menampilkan status 2FA (Aktif / Tidak Aktif) | P1 |
| FR-EMP-SET-06 | Menampilkan alamat Smart Account (ERC-4337) lengkap | P0 |
| FR-EMP-SET-07 | Tombol ganti alamat wallet tujuan penerimaan gaji | P1 |
| FR-EMP-SET-08 | Form input alamat wallet baru dengan konfirmasi | P1 |
| FR-EMP-SET-09 | Menampilkan status SBT / Work ID (Terverifikasi / Belum) | P1 |
| FR-EMP-SET-10 | Tombol request verifikasi identitas (SBT) | P2 |

**Subtotal: 10 fungsionalitas**

---

### 3.24 Registrasi & Onboarding Karyawan (FR-REG)

**Deskripsi:** Halaman onboarding mandiri yang ditampilkan kepada pengguna yang telah berhasil login via Privy namun belum memiliki role terdaftar di sistem (role === null). Halaman ini berdiri sendiri tanpa sidebar navigasi dan memandu karyawan baru melalui proses pendaftaran hingga mendapat persetujuan dari Owner SaaS. Data Informasi Pribadi (PII) yang dikumpulkan dienkripsi sebelum disimpan ke backend.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-REG-01 | Menampilkan halaman onboarding sebagai halaman mandiri (*standalone*) tanpa sidebar menu navigasi | P0 |
| FR-REG-02 | Form pendaftaran dengan field: nama lengkap, NIK (16 digit), nomor HP, dan email (di-*prefill* otomatis dari data Privy) | P0 |
| FR-REG-03 | Tombol submit pendaftaran mengirimkan data via POST ke backend; data PII dienkripsi dengan algoritma AES-256-GCM sebelum disimpan | P0 |
| FR-REG-04 | Menampilkan state "Menunggu Persetujuan" setelah submit berhasil, disertai tampilan alamat wallet karyawan | P0 |
| FR-REG-05 | Menampilkan state "Disetujui" beserta informasi bahwa karyawan perlu menunggu HR mengaktifkan stream gaji | P0 |
| FR-REG-06 | Menampilkan state "Ditolak" beserta instruksi agar karyawan menghubungi admin platform | P0 |
| FR-REG-07 | Redirect otomatis ke `/onboarding` apabila pengguna telah login namun role terdeteksi sebagai null | P0 |

**Subtotal: 7 fungsionalitas**

---

### 3.25 Owner SaaS Dashboard (FR-OWN)

**Deskripsi:** Dashboard khusus untuk admin platform Payana (Owner SaaS) yang dapat diakses melalui rute `/owner`. Dashboard ini menyediakan visibilitas penuh terhadap seluruh aktivitas platform lintas tenant, mencakup manajemen pendaftaran karyawan, pemantauan vault on-chain dari indexer Ponder, metrik platform secara agregat, dan kontrol suspend/aktivasi tenant.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-OWN-01 | Menampilkan daftar pendaftaran karyawan dengan tab filter: Pending, Approved, dan Rejected | P0 |
| FR-OWN-02 | Tombol Approve per pendaftaran karyawan untuk menyetujui akun dan menetapkan role employee | P0 |
| FR-OWN-03 | Tombol Tolak per pendaftaran karyawan beserta modal konfirmasi penolakan | P0 |
| FR-OWN-04 | Menampilkan daftar company vault on-chain yang diambil dari data indexer Ponder | P0 |
| FR-OWN-05 | Menampilkan metrik platform secara agregat: Total Value Locked (TVL), pendapatan platform, jumlah tenant aktif, dan konsumsi gas paymaster | P0 |
| FR-OWN-06 | Tombol suspend/activate per tenant untuk menonaktifkan atau mengaktifkan kembali akses perusahaan ke platform | P1 |

**Subtotal: 6 fungsionalitas**

---

### 3.26 Navigasi & Shell (FR-NAV)

**Deskripsi:** Komponen navigasi global yang digunakan di seluruh platform.

| ID | Fungsionalitas | Prioritas |
|---|---|---|
| FR-NAV-01 | Sidebar desktop HR Portal dengan 12 menu item | P0 |
| FR-NAV-02 | Sidebar desktop Employee Portal dengan 10 menu item | P0 |
| FR-NAV-03 | Active state visual pada menu yang sedang aktif | P0 |
| FR-NAV-04 | Kartu identitas user (nama, Work ID singkat) di footer sidebar | P1 |
| FR-NAV-05 | Tombol Logout di sidebar | P0 |
| FR-NAV-06 | Mobile header dengan logo dan tombol logout | P0 |
| FR-NAV-07 | Bottom navigation bar mobile untuk Employee Portal (10 item) | P0 |
| FR-NAV-08 | Redirect otomatis dari `/` ke `/login` | P0 |

**Subtotal: 8 fungsionalitas**

---

## 4. Rekap Total Fungsionalitas

| No | Modul | Kode | Jumlah |
|---|---|---|---|
| 1 | Autentikasi | FR-AUTH | 9 |
| 2 | HR — Onboarding Vault | FR-HR-OB | 11 |
| 3 | HR — Manajemen Vault | FR-HR-VT | 15 |
| 4 | HR — Manajemen Karyawan | FR-HR-EMP | 19 |
| 5 | HR — Detail Karyawan | FR-HR-EMP-DET | 9 |
| 6 | HR — Proses PHK | FR-HR-PHK | 13 |
| 7 | HR — Laporan Compliance | FR-HR-COMP | 9 |
| 8 | HR — Cliff Vesting | FR-HR-VEST | 7 |
| 9 | HR — Koperasi | FR-HR-KOP | 8 |
| 10 | HR — Absensi & Cuti | FR-HR-ATT | 6 |
| 11 | HR — Reimburse | FR-HR-RMB | 5 |
| 12 | HR — Audit Log | FR-HR-AUD | 5 |
| 13 | HR — Bounty | FR-HR-BOUNTY | 4 |
| 14 | Employee — EWA Dashboard | FR-EMP-EWA | 18 |
| 15 | Employee — Pesangon | FR-EMP-SEV | 6 |
| 16 | Employee — Cliff Vesting | FR-EMP-VEST | 6 |
| 17 | Employee — Transfer IDRX | FR-EMP-TRF | 12 |
| 18 | Employee — Koperasi | FR-EMP-KOP | 20 |
| 19 | Employee — Absensi & Cuti | FR-EMP-ATT | 7 |
| 20 | Employee — Audit Log | FR-EMP-AUD | 5 |
| 21 | Employee — Reimburse | FR-EMP-RMB | 5 |
| 22 | Employee — Bounty | FR-EMP-BOUNTY | 6 |
| 23 | Employee — Pengaturan | FR-EMP-SET | 10 |
| 24 | Registrasi & Onboarding Karyawan | FR-REG | 7 |
| 25 | Owner SaaS Dashboard | FR-OWN | 6 |
| 26 | Navigasi & Shell | FR-NAV | 8 |
| | **TOTAL** | | **251** |

> **Total fungsionalitas: 251** — memenuhi kebutuhan minimum 150 fungsionalitas untuk dokumentasi skripsi.

---

## 5. Kebutuhan Non-Fungsional (NFR)

| ID | Kebutuhan | Target |
|---|---|---|
| NFR-01 | Halaman utama EWA load < 2 detik (LCP) | Performance |
| NFR-02 | Layout responsif — diuji di lebar 375px (mobile) dan 1280px (desktop) | Responsivitas |
| NFR-03 | Kompatibel dengan Chrome 120+, Safari 16+, Firefox 120+ | Kompatibilitas |
| NFR-04 | Semua tombol aksi memiliki `aria-label` yang deskriptif | Aksesibilitas |
| NFR-05 | Setiap halaman dibungkus error boundary | Ketahanan |
| NFR-06 | Skeleton loading untuk semua data yang di-fetch | UX Loading |
| NFR-07 | Format angka IDRX selalu dalam Rupiah (`Rp X.XXX.XXX`) | Konsistensi Format |
| NFR-08 | Timeout transaksi on-chain 30 detik dengan pesan informatif | Feedback Transaksi |

---

## 6. User Flow Utama

### Flow 1: Karyawan Menarik Gaji EWA
```
Login → /employee/ewa → Lihat saldo terakru (real-time)
→ Klik "Tarik Gaji" → Loading state (2.5 detik simulasi)
→ Notifikasi sukses → Saldo reset ke 0
```

### Flow 2: HR Mendaftarkan Karyawan Baru
```
Login → /hr/employees → Klik "Tambah Karyawan"
→ Isi form (nama, email, gaji) → Lihat flow rate kalkulasi otomatis
→ Submit → Karyawan muncul di tabel dengan status Active
```

### Flow 3: Proses PHK Multi-Sig
```
Login HR → /hr/phk → Klik "Buat Proposal PHK"
→ Pilih karyawan + isi alasan → Submit → Proposal status: Menunggu Legal
→ Login Legal Officer → Lihat proposal → Setujui
→ Status berubah: Siap Dieksekusi → HR klik Eksekusi
```

### Flow 4: Karyawan Mengajukan Pinjaman Koperasi
```
Login → /employee/koperasi → Tab "Ajukan Pinjaman"
→ Atur slider nominal → Lihat kalkulasi bunga + total kembalikan
→ Klik "Cairkan Dana" → Dana masuk ke saldo EWA
→ Status pinjaman aktif muncul dengan progress repayment
```

### Flow 5: Karyawan Baru Mendaftar ke Platform
```
Login via Privy → Sistem deteksi role === null
→ Redirect otomatis ke /onboarding
→ Isi form (nama lengkap, NIK, nomor HP, email prefill)
→ Submit → Data PII dienkripsi AES-256-GCM → POST ke backend
→ State: "Menunggu Persetujuan" (tampil wallet address)
→ Owner SaaS login → /owner → Tab Pending
→ Owner klik Approve → Role karyawan ditetapkan sebagai employee
→ State karyawan berubah: "Disetujui" → Informasi menunggu HR start stream
→ HR login → /hr/employees → Tambah karyawan / aktifkan stream
→ Karyawan dapat akses /employee/ewa
```

### Flow 6: Owner SaaS Mengelola Pendaftaran & Tenant
```
Login Owner → /owner → Tab Pendaftaran (default: Pending)
→ Lihat daftar pendaftaran baru → Review data karyawan
→ Klik Approve → Role karyawan diperbarui → Karyawan mendapat notifikasi
→ (Opsional) Klik Tolak → Modal konfirmasi → Karyawan mendapat info penolakan
→ Navigasi ke Tab Vault → Lihat daftar company vault on-chain dari indexer
→ Lihat metrik platform (TVL, revenue, jumlah tenant, gas paymaster)
→ (Opsional) Suspend tenant yang bermasalah via tombol suspend/activate
```

---

## 7. Arsitektur Antarmuka

### Hierarki Halaman
```
/login
├── /onboarding                    ← Standalone, tanpa sidebar (role === null)
├── /hr/
│   ├── onboarding
│   ├── vault
│   ├── employees
│   │   └── [id]
│   ├── phk                        ← Akses langsung Legal Officer
│   ├── compliance
│   ├── vesting
│   ├── koperasi
│   ├── attendance
│   ├── reimburse
│   ├── bounty
│   ├── audit
│   └── settings
├── /employee/
│   ├── ewa (default)
│   ├── severance
│   ├── vesting
│   ├── koperasi
│   ├── transfer
│   ├── attendance
│   ├── reimburse
│   ├── bounty
│   ├── audit
│   └── settings
└── /owner/                        ← Dashboard Owner SaaS
    ├── (index — metrik platform)
    ├── registrations              ← Daftar pendaftaran karyawan (Pending/Approved/Rejected)
    └── vaults                     ← Daftar company vault on-chain
```

### Design System
| Token | Nilai |
|---|---|
| Background | `#FAF9F6` |
| Foreground | `#1C1917` |
| Accent (tan) | `#A39171` |
| Border | `#E8E2D2` |
| Muted text | `#686358` |
| Font Heading | Lora (serif) |
| Font Body | DM Sans |
| Font Mono | JetBrains Mono |

---

*Dokumen ini merepresentasikan fungsionalitas yang telah diimplementasikan maupun direncanakan dalam prototipe frontend Payana v1.1 (Base Sepolia Testnet). Versi 1.1 menambahkan modul Registrasi & Onboarding Karyawan (FR-REG) dan Owner SaaS Dashboard (FR-OWN), serta memperbarui alur autentikasi multi-role. Integrasi on-chain dan backend merupakan tahap pengembangan selanjutnya.*
