# Deskripsi Use Case — Payana
> Platform Payroll & Earned Wage Access Berbasis Blockchain (Base Sepolia)

**Proyek:** Payana — Earned Wage Access & Payroll Berbasis Blockchain  
**Versi:** 1.0  
**Tanggal:** 27 Mei 2026  

Dokumen ini menjabarkan deskripsi use case secara formal untuk sistem Payana. Setiap use case disusun menggunakan format terstruktur yang mencakup aktor, kondisi awal, kondisi akhir, alur normal, alur alternatif, dan alur pengecualian.

---

## Daftar Use Case

| ID | Nama Use Case | Aktor Utama | Kompleksitas |
|---|---|---|---|
| UC-01 | Login & Deteksi Role | Semua Pengguna | Rendah |
| UC-02 | Registrasi Karyawan Baru | Karyawan | Sedang |
| UC-03 | Persetujuan Registrasi | Owner SaaS | Sedang |
| UC-04 | Deploy Vault Perusahaan | HR Manager | Tinggi |
| UC-05 | Klaim EWA | Karyawan | Tinggi |
| UC-06 | Proses PHK Multi-Signature | HR Manager, Legal Officer | Tinggi |
| UC-07 | Pinjaman Koperasi | Karyawan | Sedang |
| UC-08 | Cliff Vesting Claim | HR Manager, Karyawan | Sedang |

---

## UC-01: Login & Deteksi Role

| Field | Detail |
|---|---|
| **ID** | UC-01 |
| **Nama** | Login dan Deteksi Role Pengguna |
| **Aktor** | Semua Pengguna (Karyawan, HR Manager, Legal Officer, Owner SaaS) |
| **Deskripsi** | Pengguna melakukan autentikasi menggunakan dompet digital melalui Privy. Sistem kemudian mendeteksi role yang terdaftar pada alamat wallet pengguna dan mengarahkan pengguna ke halaman yang sesuai dengan rolenya. |
| **Pre-kondisi** | Pengguna memiliki akses internet dan dompet Ethereum (EOA atau Smart Account via ERC-4337). |
| **Post-kondisi** | Pengguna berhasil terautentikasi dan diarahkan ke dashboard yang sesuai dengan rolenya. |
| **Trigger** | Pengguna membuka aplikasi Payana dan mengklik tombol "Login dengan Privy". |

### Alur Normal

1. Pengguna membuka halaman utama aplikasi Payana.
2. Pengguna mengklik tombol "Login" dan memilih metode autentikasi melalui Privy (email, Google, atau koneksi langsung wallet).
3. Privy memproses autentikasi dan mengembalikan JWT serta alamat wallet pengguna ke frontend.
4. Frontend mengirimkan JWT ke backend melalui endpoint `GET /auth/me`.
5. Backend memvalidasi JWT dan mengambil data profil pengguna berdasarkan alamat wallet dari database.
6. Backend mengembalikan data pengguna beserta field `role` (nilai: `owner`, `hr`, `legal`, `employee`, atau `null`).
7. Frontend membaca nilai `role`:
   - Jika `role = owner` → redirect ke `/owner/dashboard`
   - Jika `role = hr` → redirect ke `/hr/vault`
   - Jika `role = legal` → redirect ke `/hr/phk`
   - Jika `role = employee` → redirect ke `/employee/ewa`
   - Jika `role = null` → redirect ke `/onboarding`
8. Pengguna berhasil masuk ke halaman dashboard yang sesuai.

### Alur Alternatif

- **A1 — Pengguna Belum Terdaftar (Role Null):** Apabila backend tidak menemukan profil berdasarkan alamat wallet, sistem memperlakukan pengguna sebagai pendaftar baru dan mengarahkan ke halaman `/onboarding` untuk melengkapi data diri.
- **A2 — Session Masih Aktif:** Apabila pengguna membuka aplikasi dengan token JWT yang masih valid di browser, frontend langsung memanggil `GET /auth/me` tanpa menampilkan halaman login, sehingga pengguna langsung diarahkan ke dashboard.

### Alur Pengecualian

- **E1 — JWT Tidak Valid atau Kedaluwarsa:** Backend mengembalikan status `401 Unauthorized`. Frontend menghapus token dari penyimpanan lokal dan menampilkan halaman login kembali.
- **E2 — Layanan Privy Tidak Tersedia:** Frontend menampilkan pesan kesalahan "Layanan autentikasi sedang tidak tersedia. Silakan coba beberapa saat lagi." dan tidak melanjutkan proses login.
- **E3 — Koneksi Jaringan Terputus:** Frontend menampilkan notifikasi koneksi gagal dan meminta pengguna memeriksa koneksi internet.

---

## UC-02: Registrasi Karyawan Baru

| Field | Detail |
|---|---|
| **ID** | UC-02 |
| **Nama** | Registrasi Karyawan Baru |
| **Aktor** | Karyawan (calon) |
| **Deskripsi** | Karyawan baru yang belum memiliki role dalam sistem mengisi formulir pendaftaran dengan data identitas diri. Data PII (Personally Identifiable Information) dienkripsi sebelum disimpan, dan permohonan pendaftaran dikirim untuk menunggu persetujuan Owner SaaS. |
| **Pre-kondisi** | Pengguna telah berhasil login melalui Privy dan memiliki `role = null` (belum terdaftar sebagai karyawan di perusahaan manapun). |
| **Post-kondisi** | Data profil karyawan tersimpan dalam database dengan status `pending`. Notifikasi permohonan baru tersedia di dashboard Owner SaaS. |
| **Trigger** | Sistem mendeteksi `role = null` setelah login dan mengarahkan pengguna ke halaman `/onboarding`. |

### Alur Normal

1. Sistem menampilkan halaman onboarding kepada pengguna dengan `role = null`.
2. Pengguna mengisi formulir pendaftaran yang memuat:
   - Nama lengkap
   - Nomor Induk Kependudukan (NIK)
   - Nomor telepon
   - Alamat email
   - Nama perusahaan yang dituju (pilih dari daftar perusahaan terdaftar)
3. Pengguna mengklik tombol "Daftar".
4. Frontend mengirimkan data ke dua endpoint secara berurutan:
   - `POST /auth/profile` — menyimpan data PII terenkripsi (AES-256) ke database.
   - `POST /registration/request` — membuat entri permohonan pendaftaran dengan status `pending`.
5. Backend memvalidasi kelengkapan dan format data, kemudian menyimpan permohonan.
6. Frontend menampilkan halaman konfirmasi dengan pesan "Permohonan Anda sedang menunggu persetujuan. Silakan tunggu notifikasi dari tim Payana."
7. Status pendaftaran karyawan tersimpan sebagai `pending` di database.

### Alur Alternatif

- **A1 — Perusahaan Belum Terdaftar:** Apabila perusahaan yang dituju belum terdaftar dalam sistem, pengguna dapat memilih opsi "Perusahaan Belum Terdaftar" dan mengisi nama perusahaan secara manual. Owner SaaS akan memverifikasi secara terpisah.
- **A2 — Email Sudah Terdaftar:** Apabila email yang dimasukkan sudah terdaftar di sistem dengan alamat wallet berbeda, sistem menampilkan peringatan dan meminta pengguna menggunakan email yang berbeda atau menghubungi admin.

### Alur Pengecualian

- **E1 — Format NIK Tidak Valid:** Backend mengembalikan status `400 Bad Request` dengan pesan validasi "NIK harus terdiri dari 16 digit angka." Frontend menampilkan pesan error di bawah field NIK.
- **E2 — Data Tidak Lengkap:** Apabila ada field wajib yang kosong, backend mengembalikan daftar field yang belum terisi. Frontend menyorot field tersebut dengan warna merah.
- **E3 — Kegagalan Enkripsi PII:** Apabila proses enkripsi di backend gagal, sistem mengembalikan error `500 Internal Server Error` dan tidak menyimpan data apapun. Frontend menampilkan pesan "Terjadi kesalahan sistem. Silakan coba lagi."

---

## UC-03: Persetujuan Registrasi (Owner SaaS)

| Field | Detail |
|---|---|
| **ID** | UC-03 |
| **Nama** | Persetujuan atau Penolakan Registrasi Karyawan oleh Owner SaaS |
| **Aktor** | Owner SaaS |
| **Deskripsi** | Owner SaaS meninjau daftar permohonan pendaftaran karyawan yang masuk, melihat detail data calon karyawan, lalu memutuskan untuk menyetujui atau menolak permohonan tersebut. Setelah disetujui, role karyawan diaktifkan dan HR dapat memulai stream gaji. |
| **Pre-kondisi** | Terdapat minimal satu permohonan pendaftaran dengan status `pending` di database. Owner SaaS telah login dan memiliki `role = owner`. |
| **Post-kondisi** | Status permohonan berubah menjadi `approved` atau `rejected`. Karyawan yang disetujui memperoleh `role = employee`. HR Manager dari perusahaan terkait menerima notifikasi untuk memulai stream gaji. |
| **Trigger** | Owner SaaS mengakses halaman `/owner/dashboard` dan melihat daftar permohonan masuk. |

### Alur Normal

1. Owner SaaS mengakses halaman `/owner/dashboard`.
2. Sistem menampilkan daftar permohonan pendaftaran dengan status `pending`, mencantumkan nama, email, perusahaan tujuan, dan tanggal pengajuan.
3. Owner SaaS mengklik nama karyawan untuk melihat detail permohonan, termasuk data terenkripsi yang didekripsi khusus untuk tampilan Owner.
4. Owner SaaS mengklik tombol "Setujui".
5. Frontend mengirimkan permintaan `PATCH /registration/:address/approve` ke backend.
6. Backend memperbarui status permohonan menjadi `approved` dan mengubah `role` pengguna menjadi `employee` di tabel `users`.
7. Backend mengirimkan notifikasi ke HR Manager perusahaan terkait bahwa karyawan baru telah disetujui dan siap untuk di-onboarding secara on-chain.
8. Frontend memperbarui daftar permohonan dan menampilkan pesan konfirmasi "Karyawan berhasil disetujui."

### Alur Alternatif

- **A1 — Owner Menolak Permohonan:** Pada langkah 4, Owner mengklik "Tolak" dan mengisi alasan penolakan. Frontend mengirimkan `PATCH /registration/:address/reject` beserta alasan. Backend memperbarui status menjadi `rejected` dan menyimpan alasan. Karyawan dapat melihat alasan penolakan saat login kembali.
- **A2 — Permohonan Duplikat Terdeteksi:** Backend mendeteksi bahwa NIK yang sama sudah terdaftar dengan alamat wallet berbeda. Sistem menampilkan peringatan kepada Owner untuk dilakukan verifikasi manual sebelum menyetujui.

### Alur Pengecualian

- **E1 — Permohonan Sudah Diproses:** Apabila permohonan sudah disetujui atau ditolak oleh Owner lain (kondisi race condition), backend mengembalikan error `409 Conflict`. Frontend menampilkan pesan "Permohonan ini sudah diproses." dan memperbarui tampilan daftar.
- **E2 — Karyawan Tidak Ditemukan di Database:** Backend mengembalikan `404 Not Found`. Frontend menampilkan pesan kesalahan dan menyarankan Owner untuk menyegarkan halaman.

---

## UC-04: Deploy Vault Perusahaan (HR)

| Field | Detail |
|---|---|
| **ID** | UC-04 |
| **Nama** | Deploy Vault Perusahaan oleh HR Manager |
| **Aktor** | HR Manager |
| **Deskripsi** | HR Manager yang baru bergabung atau mendaftarkan perusahaannya menjalani proses onboarding multi-langkah: mengisi profil perusahaan, mengonfigurasi parameter split alokasi dana, dan men-deploy smart contract vault (CompanyVault) ke blockchain Base Sepolia melalui PayrollFactory. |
| **Pre-kondisi** | HR Manager telah login dengan `role = hr` dan belum memiliki vault perusahaan aktif, atau akses diberikan oleh Owner SaaS untuk mendaftarkan perusahaan baru. |
| **Post-kondisi** | Smart contract CompanyVault berhasil di-deploy ke Base Sepolia. Alamat vault tersimpan di database. HR Manager diarahkan ke dashboard `/hr/vault` untuk mulai mengelola karyawan. |
| **Trigger** | HR Manager mengakses halaman `/hr/onboarding` setelah login pertama kali atau ketika belum memiliki vault aktif. |

### Alur Normal

1. Sistem menampilkan wizard onboarding tiga langkah kepada HR Manager.
2. **Langkah 1 — Profil Perusahaan:** HR Manager mengisi:
   - Nama perusahaan
   - Nomor Pokok Wajib Pajak (NPWP)
   - Email Penanggung Jawab (PIC)
3. HR Manager mengklik "Lanjut" untuk ke langkah berikutnya.
4. **Langkah 2 — Konfigurasi Split Alokasi Dana:** HR Manager meninjau dan mengonfirmasi parameter split default:
   - 93% → langsung ke wallet karyawan
   - 5% → Compliance Vault (pajak/BPJS)
   - 2% → Severance Vault (pesangon)
   - HR dapat menyesuaikan nilai BPS (Basis Points) selama total tetap 10.000 BPS (100%).
5. HR Manager mengklik "Deploy Vault".
6. Frontend memanggil fungsi `PayrollFactory.deployVault(hrAddress, companyName, IDRX_address, liquidityPool_address)` melalui Privy (transaksi on-chain ditandatangani oleh HR).
7. Transaksi dikirim ke Base Sepolia. Frontend menampilkan indikator loading dengan pesan "Sedang men-deploy vault ke blockchain...".
8. Setelah transaksi dikonfirmasi (estimasi ~2 detik), backend menerima webhook dari Alchemy dan menyimpan alamat vault baru ke database.
9. **Langkah 3 — Deposit Awal:** HR Manager melakukan deposit IDRX awal ke vault yang baru di-deploy untuk memastikan vault memiliki likuiditas cukup untuk stream gaji pertama.
10. HR Manager mengklik "Selesai" dan diarahkan ke `/hr/vault`.

### Alur Alternatif

- **A1 — Konfigurasi Split Kustom:** Apabila HR Manager mengubah nilai split pada langkah 2, frontend memvalidasi bahwa total BPS = 10.000. Jika valid, nilai kustom digunakan dalam parameter deploy.
- **A2 — Lewati Deposit Awal:** HR Manager dapat melewati langkah 3 dan melakukan deposit di lain waktu melalui `/hr/vault`. Namun stream gaji tidak dapat dimulai sebelum vault memiliki saldo yang cukup.

### Alur Pengecualian

- **E1 — Transaksi Deploy Gagal (Reverted):** Smart contract mengembalikan revert (misalnya karena parameter tidak valid). Frontend menampilkan pesan "Deploy vault gagal: [pesan revert dari kontrak]" dan memungkinkan HR untuk mencoba ulang.
- **E2 — Gas Tidak Cukup:** Wallet HR tidak memiliki ETH yang cukup untuk gas. Frontend menampilkan pesan "Saldo ETH tidak mencukupi untuk membayar gas. Silakan isi saldo ETH terlebih dahulu."
- **E3 — NPWP Sudah Terdaftar:** Backend mendeteksi NPWP sudah digunakan oleh perusahaan lain. Sistem mengembalikan error `409 Conflict` dengan pesan "NPWP ini sudah terdaftar dalam sistem."

---

## UC-05: Klaim EWA (Karyawan)

| Field | Detail |
|---|---|
| **ID** | UC-05 |
| **Nama** | Klaim Earned Wage Access (EWA) oleh Karyawan |
| **Aktor** | Karyawan |
| **Deskripsi** | Karyawan mengakses fitur EWA untuk menarik gaji yang telah diakruasi secara real-time dari streaming contract. Transaksi dikemas sebagai UserOperation (ERC-4337), ditandatangani secara diam-diam oleh Privy, dikirim melalui bundler backend, dan dieksekusi on-chain di CompanyVault. Apabila karyawan memiliki pinjaman aktif di koperasi, cicilan dipotong otomatis sebelum dana dikirim. |
| **Pre-kondisi** | Karyawan telah login dengan `role = employee`. HR Manager telah memulai stream gaji untuk karyawan tersebut. Terdapat saldo terakruasi yang belum diklaim (> 0 IDRX). |
| **Post-kondisi** | Saldo IDRX terakruasi direset ke 0. Karyawan menerima dana (93% dari akrual, setelah dipotong cicilan koperasi jika ada). Compliance Vault dan Severance Vault menerima alokasi masing-masing. Audit log diperbarui di database. |
| **Trigger** | Karyawan mengakses `/employee/ewa` dan mengklik tombol "Tarik Gaji". |

### Alur Normal

1. Karyawan membuka halaman `/employee/ewa`.
2. Frontend memanggil smart contract untuk membaca saldo terakruasi secara real-time dan menampilkan nilai dalam IDRX beserta estimasi dalam Rupiah.
3. Karyawan mengklik tombol "Tarik Gaji".
4. Frontend mengonstruksi UserOperation (ERC-4337) yang memanggil fungsi `CompanyVault.claimSalary()`.
5. Privy menandatangani UserOperation secara diam-diam (tanpa popup konfirmasi tambahan) menggunakan kunci privat embedded wallet karyawan.
6. Frontend mengirimkan UserOperation yang telah ditandatangani ke backend melalui `POST /bundler/relay` beserta JWT autentikasi.
7. Backend melakukan validasi:
   - Verifikasi JWT karyawan.
   - Pemeriksaan rate limit: maksimal 10 klaim per jam per karyawan.
   - Validasi bahwa alamat karyawan memiliki stream aktif.
8. Backend melampirkan Paymaster sehingga gas dibayarkan oleh platform (karyawan tidak perlu memiliki ETH).
9. Backend mengirimkan UserOperation ke bundler on-chain di jaringan Base Sepolia.
10. Smart contract `CompanyVault.claimSalary()` dieksekusi:
    - Apabila karyawan memiliki pinjaman aktif di koperasi: `EmployeeLiquidityContract.autoRepay()` dipanggil terlebih dahulu untuk memotong cicilan.
    - Sisa dana didistribusikan: 93% ke wallet karyawan, 5% ke Compliance Vault, 2% ke Severance Vault.
11. Alchemy mendeteksi event on-chain dan mengirimkan webhook ke backend.
12. Backend memperbarui audit log transaksi di database.
13. Backend mengirimkan notifikasi melalui WebSocket ke frontend.
14. Frontend memperbarui tampilan saldo (direset ke 0) dan menampilkan notifikasi "Penarikan berhasil! Dana sebesar [jumlah] IDRX telah dikirim ke wallet Anda."

### Alur Alternatif

- **A1 — Terdapat Pinjaman Koperasi Aktif:** Sebelum distribusi 93/5/2, `autoRepay()` memotong cicilan pinjaman dari total klaim. Frontend menampilkan rincian potongan sehingga karyawan mengetahui jumlah bersih yang diterima.
- **A2 — Karyawan Membatalkan Sebelum Pengiriman:** Apabila karyawan mengklik "Batal" setelah langkah 3 namun sebelum langkah 6, proses dibatalkan tanpa efek on-chain apapun.

### Alur Pengecualian

- **E1 — Rate Limit Terlampaui:** Backend menolak permintaan dengan status `429 Too Many Requests` dan pesan "Batas klaim telah tercapai. Anda dapat melakukan klaim kembali dalam [X] menit."
- **E2 — Saldo Akruasi Nol:** Backend menolak permintaan dengan status `400 Bad Request` dan pesan "Tidak ada saldo yang dapat ditarik saat ini."
- **E3 — Transaksi On-Chain Gagal (Reverted):** Smart contract mengembalikan revert. Backend mencatat kegagalan di audit log. Frontend menampilkan pesan "Transaksi gagal diproses di blockchain. Silakan coba beberapa saat lagi."
- **E4 — Vault Tidak Memiliki Likuiditas Cukup:** `CompanyVault` tidak memiliki IDRX yang cukup untuk membayar klaim. Transaksi revert dengan pesan spesifik. Frontend menampilkan "Dana vault tidak mencukupi. Hubungi HR Anda."

---

## UC-06: Proses PHK Multi-Signature

| Field | Detail |
|---|---|
| **ID** | UC-06 |
| **Nama** | Proses Pemutusan Hubungan Kerja (PHK) Multi-Signature |
| **Aktor** | HR Manager (inisiator), Legal Officer (approver) |
| **Deskripsi** | Proses PHK karyawan memerlukan dua tanda tangan (multi-sig): HR Manager mengajukan proposal, Legal Officer menyetujui, kemudian HR Manager mengeksekusi. Mekanisme ini memastikan kepatuhan hukum dan mencegah PHK sepihak tanpa persetujuan Legal. Setelah dieksekusi, SBT karyawan dicabut, stream dibatalkan, dan Severance Vault dicairkan. |
| **Pre-kondisi** | Karyawan yang akan di-PHK memiliki status aktif (stream berjalan, SBT valid). HR Manager dan Legal Officer keduanya telah login dengan role yang sesuai. |
| **Post-kondisi** | Stream gaji karyawan dibatalkan. SBT (Soulbound Token) EmploymentSBT karyawan dicabut (revoked). Dana Severance Vault dicairkan ke wallet karyawan. Status karyawan diperbarui menjadi `terminated` di database. |
| **Trigger** | HR Manager mengakses halaman `/hr/phk` dan memilih karyawan untuk diajukan PHK. |

### Alur Normal

1. HR Manager mengakses halaman `/hr/phk` dan mengklik "Buat Proposal PHK".
2. HR Manager mengisi formulir proposal:
   - Nama karyawan
   - Alasan PHK (dropdown: restrukturisasi, pelanggaran, berakhirnya kontrak, dll.)
   - Catatan tambahan
3. HR Manager mengklik "Ajukan Proposal".
4. Frontend memanggil `CompanyVault.proposeTermination(employeeAddress, reason)` melalui Privy (transaksi on-chain ditandatangani oleh HR).
5. Transaksi dikonfirmasi di Base Sepolia. Status proposal tersimpan sebagai `menunggu_legal` di smart contract dan database.
6. Legal Officer menerima notifikasi (melalui email atau notifikasi in-app) bahwa ada proposal PHK yang memerlukan persetujuan.
7. Legal Officer login dan mengakses `/hr/phk`, melihat daftar proposal dengan status "Menunggu Persetujuan Legal".
8. Legal Officer mengklik proposal untuk melihat detail, meninjau alasan, dan memverifikasi kelengkapan dokumen.
9. Legal Officer mengklik "Setujui".
10. Frontend memanggil `CompanyVault.approveTermination(employeeAddress)` menggunakan `LEGAL_ROLE` Legal Officer (transaksi on-chain).
11. Status proposal berubah menjadi `siap_dieksekusi` di smart contract.
12. HR Manager menerima notifikasi bahwa PHK telah disetujui Legal dan siap dieksekusi.
13. HR Manager mengakses kembali halaman `/hr/phk` dan mengklik "Eksekusi PHK".
14. Frontend memanggil `CompanyVault.executeTermination(employeeAddress)`.
15. Smart contract mengeksekusi serangkaian aksi atomik:
    - `EmploymentSBT.revoke(employeeAddress)` — mencabut SBT karyawan.
    - Stream gaji dibatalkan (`cancelStream()`).
    - Dana Severance Vault dicairkan ke wallet karyawan.
16. Backend menerima webhook dari Alchemy dan memperbarui status karyawan di database menjadi `terminated`.
17. Frontend menampilkan konfirmasi "PHK berhasil dieksekusi. Pesangon telah dikirim ke wallet karyawan."

### Alur Alternatif

- **A1 — Legal Menolak Proposal:** Pada langkah 9, Legal Officer mengklik "Tolak" dan mengisi alasan penolakan. Status proposal berubah menjadi `ditolak_legal`. HR Manager menerima notifikasi penolakan beserta alasannya. HR dapat mengajukan proposal baru dengan perbaikan.
- **A2 — HR Membatalkan Proposal Sebelum Disetujui Legal:** Selama status masih `menunggu_legal`, HR dapat membatalkan proposal melalui `CompanyVault.cancelProposal()`. Status berubah menjadi `dibatalkan`.

### Alur Pengecualian

- **E1 — Eksekusi oleh Pihak yang Tidak Berwenang:** Smart contract memeriksa role pemanggil. Apabila `executeTermination` dipanggil oleh bukan HR Manager dari perusahaan tersebut, transaksi akan revert dengan error `AccessControl: account does not have HR_ROLE`.
- **E2 — Proposal Sudah Kedaluwarsa:** Apabila proposal tidak dieksekusi dalam batas waktu yang ditentukan (misalnya 30 hari), status otomatis berubah menjadi `kedaluwarsa` dan tidak dapat dieksekusi.
- **E3 — Severance Vault Kosong:** Apabila Severance Vault tidak memiliki dana saat eksekusi, transaksi revert. Sistem menampilkan peringatan kepada HR untuk memastikan Severance Vault memiliki saldo yang cukup.

---

## UC-07: Pinjaman Koperasi

| Field | Detail |
|---|---|
| **ID** | UC-07 |
| **Nama** | Pengajuan Pinjaman Koperasi oleh Karyawan |
| **Aktor** | Karyawan |
| **Deskripsi** | Karyawan mengajukan pinjaman melalui fitur Koperasi Payana, dengan limit maksimal 80% dari gaji bulanan. Dana pinjaman bersumber dari liquidity pool koperasi yang dikelola oleh EmployeeLiquidityContract. Pelunasan dilakukan secara otomatis (auto-repay) setiap kali karyawan melakukan klaim EWA. |
| **Pre-kondisi** | Karyawan telah login dengan `role = employee`. Karyawan memiliki stream gaji aktif. Karyawan tidak memiliki pinjaman aktif yang sudah melewati batas cicilan (tidak dalam kondisi gagal bayar). |
| **Post-kondisi** | Dana pinjaman (IDRX) masuk ke wallet karyawan. Entri pinjaman aktif tercatat di smart contract `EmployeeLiquidityContract`. Pada klaim EWA berikutnya, cicilan akan dipotong otomatis. |
| **Trigger** | Karyawan mengakses `/employee/koperasi` dan mengklik tab "Pinjam". |

### Alur Normal

1. Karyawan membuka halaman `/employee/koperasi` dan memilih tab "Pinjam".
2. Frontend membaca data dari smart contract:
   - Gaji bulanan karyawan (untuk menghitung limit maksimal pinjaman = 80% gaji).
   - Saldo liquidity pool saat ini.
   - Status pinjaman aktif (jika ada).
3. Frontend menampilkan:
   - Limit maksimal pinjaman yang dapat diajukan.
   - Estimasi cicilan per klaim EWA.
   - Suku bunga (jika berlaku).
4. Karyawan memasukkan jumlah pinjaman yang diinginkan (tidak boleh melebihi 80% gaji).
5. Karyawan mengklik "Ajukan Pinjaman".
6. Frontend memanggil `EmployeeLiquidityContract.borrowFromPool(amount)` melalui UserOperation (ERC-4337, ditandatangani Privy secara diam-diam).
7. Smart contract memvalidasi:
   - Jumlah tidak melebihi 80% gaji.
   - Pool memiliki likuiditas mencukupi.
   - Karyawan tidak memiliki pinjaman aktif yang belum lunas (atau dalam batas yang diizinkan).
8. Dana pinjaman ditransfer dari liquidity pool ke wallet karyawan.
9. Backend menerima webhook dari Alchemy dan mencatat transaksi pinjaman di database.
10. Frontend menampilkan konfirmasi "Pinjaman berhasil. Dana [jumlah] IDRX telah masuk ke wallet Anda."
11. Frontend memperbarui tampilan tab "Pinjaman Aktif" dengan detail cicilan auto-repay.

### Alur Alternatif

- **A1 — Karyawan Sudah Memiliki Pinjaman Aktif:** Sistem menampilkan informasi pinjaman aktif saat ini dan sisa saldo yang belum lunas. Karyawan tidak dapat mengajukan pinjaman baru hingga pinjaman sebelumnya lunas sepenuhnya.
- **A2 — Likuiditas Pool Tidak Mencukupi:** Apabila pool tidak memiliki IDRX yang cukup, smart contract revert. Frontend menampilkan pesan "Dana koperasi saat ini tidak mencukupi. Silakan coba lagi nanti."

### Alur Pengecualian

- **E1 — Jumlah Melebihi 80% Gaji:** Smart contract mengembalikan revert dengan pesan spesifik. Frontend menampilkan "Jumlah pinjaman tidak boleh melebihi 80% dari gaji bulanan Anda ([limit] IDRX)."
- **E2 — Stream Gaji Tidak Aktif:** Apabila stream karyawan sudah dibatalkan (misalnya pasca-PHK), smart contract menolak permintaan pinjaman. Frontend menampilkan "Fitur pinjaman hanya tersedia untuk karyawan dengan stream gaji aktif."

---

## UC-08: Cliff Vesting Claim

| Field | Detail |
|---|---|
| **ID** | UC-08 |
| **Nama** | Pembuatan dan Klaim Cliff Vesting |
| **Aktor** | HR Manager (pembuat vesting), Karyawan (penerima/klaim) |
| **Deskripsi** | HR Manager mengunci sejumlah IDRX dalam mekanisme cliff vesting untuk karyawan tertentu (misalnya sebagai bonus tenure atau insentif kinerja). Dana terkunci hingga tanggal cliff terlewati, setelah itu karyawan dapat mengklaim secara mandiri melalui smart contract. |
| **Pre-kondisi** | HR Manager telah login dengan `role = hr` dan vault perusahaan memiliki saldo IDRX yang cukup untuk dikunci. Karyawan target memiliki status aktif. |
| **Post-kondisi** | Dana IDRX terkunci di CompanyVault untuk karyawan tertentu. Setelah cliff terlewati, karyawan dapat mengklaim dana tersebut kapan saja. |
| **Trigger** | HR Manager mengakses `/hr/vesting` dan mengklik "Buat Cliff Vest". |

### Alur Normal

**Bagian A — Pembuatan Cliff Vest oleh HR Manager:**

1. HR Manager mengakses halaman `/hr/vesting`.
2. Frontend menampilkan daftar vesting aktif dan formulir pembuatan baru.
3. HR Manager mengisi formulir:
   - Pilih karyawan penerima (dari daftar karyawan aktif)
   - Jumlah IDRX yang akan dikunci
   - Tanggal cliff (timestamp Unix kapan dana dapat diklaim)
   - Tipe vesting (dropdown: bonus_tahunan, insentif_kinerja, retensi, dll.)
4. HR Manager mengklik "Buat Vesting".
5. Frontend memanggil `CompanyVault.createCliffVest(employeeAddress, amount, cliffTimestamp, vestType)`.
6. Smart contract memvalidasi bahwa vault memiliki saldo IDRX mencukupi, lalu mengunci sejumlah `amount` IDRX khusus untuk karyawan tersebut.
7. Backend menerima webhook dari Alchemy dan mencatat entri vesting baru di database dengan status `locked`.
8. Frontend menampilkan konfirmasi "Cliff vesting berhasil dibuat. Dana [jumlah] IDRX akan dapat diklaim oleh [nama karyawan] pada [tanggal cliff]."

**Bagian B — Klaim Cliff Vest oleh Karyawan:**

9. Karyawan membuka halaman `/employee/vesting`.
10. Frontend menampilkan daftar vesting milik karyawan, termasuk countdown menuju tanggal cliff.
11. Apabila tanggal saat ini < tanggal cliff: tombol "Klaim" berwarna abu-abu dan tidak aktif (disabled), menampilkan sisa waktu.
12. Apabila tanggal saat ini >= tanggal cliff: tombol "Klaim" aktif (berwarna hijau).
13. Karyawan mengklik "Klaim" pada entri vesting yang sudah jatuh tempo.
14. Frontend memanggil `CompanyVault.claimCliffVest(vestId)` melalui UserOperation (ERC-4337).
15. Smart contract memvalidasi bahwa cliff timestamp sudah terlewati dan vesting belum pernah diklaim.
16. IDRX dicairkan dari vault ke wallet karyawan.
17. Backend memperbarui status vesting menjadi `claimed` di database.
18. Frontend menampilkan notifikasi "Dana vesting [jumlah] IDRX berhasil diklaim dan telah masuk ke wallet Anda."

### Alur Alternatif

- **A1 — Klaim Sebelum Cliff:** Smart contract memeriksa timestamp. Apabila `block.timestamp < cliffTimestamp`, transaksi revert. Frontend menampilkan pesan "Dana vesting belum dapat diklaim. Tersisa [X hari Y jam] lagi."
- **A2 — HR Membatalkan Vesting Sebelum Cliff:** Selama dana belum diklaim, HR dapat membatalkan vesting melalui `CompanyVault.cancelVesting(vestId)`. Dana dikembalikan ke saldo vault. Karyawan menerima notifikasi bahwa vesting dibatalkan.

### Alur Pengecualian

- **E1 — VestId Tidak Valid:** Smart contract mengembalikan revert karena `vestId` tidak ditemukan atau bukan milik pemanggil. Frontend menampilkan "Vesting tidak ditemukan atau Anda tidak memiliki akses untuk mengklaim vesting ini."
- **E2 — Vesting Sudah Diklaim Sebelumnya:** Smart contract memeriksa flag `claimed`. Apabila sudah `true`, transaksi revert. Frontend menampilkan "Vesting ini sudah pernah diklaim sebelumnya."
- **E3 — Saldo Vault Tidak Mencukupi Saat Klaim:** Meskipun jarang terjadi (karena dana sudah dikunci), apabila terjadi inkonsistensi, transaksi revert dan frontend menampilkan "Terjadi kesalahan sistem. Silakan hubungi HR Anda."
