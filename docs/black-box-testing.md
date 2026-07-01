# Black Box Testing — Payana Payroll Web3

> **Versi:** v1.0 — 2026-06-25 (sebelumnya direferensikan di `test-plan.md` v1.0 tapi tidak
> pernah dibuat; ini adalah pembuatan pertama, disusun langsung dari sistem aktual)
> **Metodologi:** lihat `test-plan.md` §3 untuk definisi pendekatan, prioritas, dan klasifikasi skenario.

Setiap test case mengikuti format: **Input** (data yang dimasukkan) → **Aksi** (langkah pengguna) → **Output yang Diharapkan** (respons sistem). Kolom **FR** merujuk ke FR-PAYANA di SKPL.md untuk traceability.

---

## Modul AUTH — Autentikasi & Onboarding

| TC-ID | Nama Test | FR | Tipe | Prioritas |
|---|---|---|---|---|
| TC-AUTH-01 | Login dengan signature EIP-191 valid | 101 | Happy | P0 |
| TC-AUTH-02 | Refresh access token dengan refresh token valid | 102 | Happy | P0 |
| TC-AUTH-03 | Logout mencabut sesi — token lama ditolak setelahnya | 103 | Happy | P0 |
| TC-AUTH-04 | Submit profil dengan NIK bukan 16 digit ditolak | 104 | Bad | P1 |
| TC-AUTH-05 | Resolusi role otomatis redirect ke dashboard sesuai peran | 106 | Happy | P0 |
| TC-AUTH-06 | Pengajuan registrasi HR baru → status "pending" | 107 | Happy | P0 |
| TC-AUTH-07 | Owner approve registrasi perusahaan → status "approved" | 108, 109 | Happy | P0 |
| TC-AUTH-08 | Owner reject registrasi → status "rejected" | 109 | Happy | P1 |
| TC-AUTH-09 | Akses halaman HR oleh akun role Employee diblokir | 106 | Bad | P0 |
| TC-AUTH-10 | Login dengan signature tidak valid/kedaluwarsa ditolak 401 | 101 | Bad | P1 |

**TC-AUTH-01** — Input: alamat wallet aktif, pesan `Sign in to Payana\nTimestamp: <unix>`, signature hasil `personal_sign`. Aksi: buka `/login`, pilih metode Privy, setujui tanda tangan. Output: `POST /auth/login` mengembalikan `{accessToken, refreshToken, address}` (200); pengguna diarahkan ke dashboard sesuai role.

**TC-AUTH-02** — Input: refresh token valid (umur < 7 hari). Aksi: tunggu access token mendekati expired (15 menit) atau panggil manual `POST /auth/refresh`. Output: access token baru diterbitkan tanpa perlu sign ulang; sesi (jti) tetap sama di tabel `app.sessions`.

**TC-AUTH-03** — Input: access token aktif. Aksi: klik "Keluar". Output: `POST /auth/logout` 200, baris `app.sessions` terhapus; request berikutnya dengan token lama ditolak 401 "Session has been revoked or logged out".

**TC-AUTH-04** — Input: NIK = "12345" (5 digit). Aksi: isi form profil di onboarding, submit. Output: `400 BAD_REQUEST` "NIK must be exactly 16 digits"; form tidak ter-submit.

**TC-AUTH-05** — Input: alamat HR/Employee/Legal/Owner yang sudah punya role on-chain. Aksi: login. Output: HR → `/hr/vault`, Employee → `/employee/ewa`, Legal → `/hr/phk`, Owner → `/owner`.

**TC-AUTH-06** — Input: alamat baru + nama perusahaan + NPWP + NIB. Aksi: isi form `/onboarding` tipe "company", submit. Output: baris baru di `pending_registrations` dengan `status="pending"`; `GET /registration/status/:address` mengembalikan `"pending"`.

**TC-AUTH-07** — Input: alamat dari TC-AUTH-06. Aksi: Owner buka `/owner/registrations`, klik "Setujui". Output: `PATCH /registration/:address/approve` 200; status berubah "approved"; HR bisa lanjut ke `/hr/onboarding` untuk deploy vault.

**TC-AUTH-08** — Input: alamat pendaftar lain. Aksi: Owner klik "Tolak". Output: status berubah "rejected"; pendaftar yang login menampilkan state rejected, tidak bisa lanjut ke onboarding vault.

**TC-AUTH-09** — Input: akun dengan role `employee`. Aksi: akses langsung URL `/hr/vault`. Output: `useRoleGuard` me-redirect ke `/employee/ewa` (home role employee), tidak menampilkan konten HR.

**TC-AUTH-10** — Input: signature acak/tidak cocok dengan alamat, atau pesan dengan timestamp > 5 menit lalu. Aksi: kirim `POST /auth/login`. Output: `401` "Signature verification failed" atau "Login message has expired. Request a new challenge."

---

## Modul OWN — Vault Perusahaan & Administrasi Platform

| TC-ID | Nama Test | FR | Tipe | Prioritas |
|---|---|---|---|---|
| TC-OWN-01 | Deploy vault baru untuk HR baru | 201 | Happy | P0 |
| TC-OWN-02 | Top up vault dengan IDRX — saldo terupdate | 202 | Happy | P0 |
| TC-OWN-03 | Withdraw saldo bebas vault ke alamat tujuan | 203 | Happy | P1 |
| TC-OWN-04 | Update konfigurasi split BPS — total harus 10.000 | 204 | Bad | P1 |
| TC-OWN-05 | Pause lalu resume operasi vault | 205 | Happy | P1 |
| TC-OWN-06 | HR withdraw dana compliance ke agen pajak | 208 | Happy | P1 |
| TC-OWN-07 | Owner lihat dashboard seluruh tenant | 1002 | Happy | P1 |
| TC-OWN-08 | Owner klaim protocol fee dari treasury | 1003 | Happy | P1 |
| TC-OWN-09 | Owner emergency freeze seluruh vault platform | 1004 | Happy | P0 |
| TC-OWN-10 | Owner set platform fee — di atas 1% ditolak | 1006 | Bad | P1 |
| TC-OWN-11 | **[Baru]** Owner suspend akses HR — HR ditolak login, karyawan tetap bisa klaim | 1005 | Happy | P0 |
| TC-OWN-12 | **[Baru]** Owner reaktivasi HR — HR bisa login lagi | 1005 | Happy | P0 |
| TC-OWN-13 | Akses `/owner` oleh non-owner diblokir | — | Bad | P0 |
| TC-OWN-14 | Saldo vault rendah memicu indikator peringatan | 207 | Happy | P2 |

**TC-OWN-01** — Input: alamat HR yang sudah approved, nama perusahaan. Aksi: HR isi wizard `/hr/onboarding`, klik "Aktifkan Sistem Penggajian". Output: `PayrollFactory.deployVault()` sukses, event `VaultDeployed`, Ponder mengindeks baris `company` baru; HR diarahkan ke `/hr/vault`.

**TC-OWN-02** — Input: jumlah IDRX (mis. 50.000.000). Aksi: di `/hr/vault`, approve lalu `fundVault(amount)`. Output: 2x tanda tangan diminta; `vaultBalance` on-chain bertambah; UI menampilkan saldo baru setelah Ponder mengindeks `VaultFunded`.

**TC-OWN-03** — Input: jumlah ≤ saldo bebas saat ini, alamat tujuan. Aksi: klik "Tarik dari Kas". Output: IDRX berpindah ke alamat tujuan; `vaultBalance` berkurang.

**TC-OWN-04** — Input: split 95/10/2 (total 10.700, bukan 10.000). Aksi: submit form konfigurasi split di onboarding/settings. Output: validasi frontend menolak sebelum transaksi dikirim ("Total harus 10.000 BPS"); jika dipaksa on-chain, revert.

**TC-OWN-05** — Input: vault Active. Aksi: HR klik "Jeda Vault", lalu "Lanjutkan Vault". Output: status badge berubah Aktif→Dijeda→Aktif; klaim EWA ditolak selama Dijeda, normal lagi setelah Lanjutkan.

**TC-OWN-06** — Input: jumlah ≤ `complianceBalance`, alamat agen pajak. Aksi: HR klik "Tarik Dana Kepatuhan" di `/hr/compliance`. Output: `withdrawCompliance()` sukses, event `ComplianceWithdrawn`; jika jumlah > saldo, revert `InsufficientComplianceBalance`.

**TC-OWN-07** — Input: minimal 1 vault aktif di platform. Aksi: Owner buka `/owner/tenants`. Output: daftar seluruh company dengan saldo vault, jumlah karyawan, status — bersumber dari Ponder.

**TC-OWN-08** — Input: `protocolTreasury` punya saldo terakumulasi dari fee klaim. Aksi: Owner klik "Klaim Protocol Fee" di `/owner/fees`. Output: `claimProtocolFee()` sukses, saldo IDRX berpindah ke treasury wallet.

**TC-OWN-09** — Input: minimal 1 vault aktif. Aksi: Owner klik "Emergency Freeze All" + konfirmasi. Output: `emergencyFreezeAll()` sukses; seluruh `CompanyVault` berstatus Frozen; klaim EWA di semua perusahaan ditolak hingga di-unfreeze.

**TC-OWN-10** — Input: `platformFeeBps = 150` (1,5%). Aksi: submit form fee Owner. Output: revert `FeeTooHigh`; UI menampilkan "Nilai fee melebihi batas maksimum yang diizinkan (1%)."

**TC-OWN-11** — Input: alamat HR aktif (mis. "pt test 1"). Aksi: Owner buka `/owner/companies/:hrAddress`, klik "Tangguhkan Akses", isi alasan opsional, konfirmasi. Output: `POST /suspension/:hrAddress` 200; baris `suspended_clients` dibuat; seluruh sesi aktif HR tersebut dihapus dari `app.sessions`; HR yang mencoba login berikutnya ditolak 403 `ACCOUNT_SUSPENDED`; karyawan perusahaan tersebut **tetap bisa** klaim EWA seperti biasa (vault tidak disentuh, tetap Active on-chain).

**TC-OWN-12** — Input: HR yang sedang suspended dari TC-OWN-11. Aksi: Owner klik "Aktifkan Kembali". Output: `DELETE /suspension/:hrAddress` 200; baris `suspended_clients` terhapus; HR berhasil login ulang (sesi baru, bukan resume sesi lama yang sudah dicabut).

**TC-OWN-13** — Input: akun bukan `OWNER_ADDRESS`. Aksi: akses `/owner` langsung. Output: redirect ke `/login`; `requireOwner` middleware menolak panggilan API Owner-only dengan 403.

**TC-OWN-14** — Input: `vaultBalance` di bawah `lowBalanceThresholdBps` dari estimasi kebutuhan stream. Aksi: buka `/hr/vault`. Output: badge/peringatan saldo rendah tampil dengan estimasi sisa hari operasional.

---

## Modul STREAM — Manajemen Stream Gaji Karyawan

| TC-ID | Nama Test | FR | Tipe | Prioritas |
|---|---|---|---|---|
| TC-STR-01 | HR tambah karyawan baru → startStream on-chain | 301 | Happy | P0 |
| TC-STR-02 | Pause stream karyawan | 302 | Happy | P1 |
| TC-STR-03 | Resume stream karyawan | 303 | Happy | P1 |
| TC-STR-04 | Update flow rate gaji karyawan | 304 | Happy | P1 |
| TC-STR-05 | Cancel stream tanpa proses PHK (override admin) | 306 | Bad | P2 |

**TC-STR-01** — Input: alamat karyawan, flow rate (IDRX/detik) atau gaji bulanan. Aksi: HR isi form "Tambah Karyawan" di `/hr/employees`. Output: `startStream()` sukses; event terindeks Ponder; karyawan langsung melihat saldo EWA mulai berakru di `/employee/ewa`.

**TC-STR-02** — Input: stream Active. Aksi: HR klik "Pause" pada baris karyawan. Output: status stream → Paused; akrual EWA berhenti bertambah.

**TC-STR-03** — Input: stream Paused. Aksi: HR klik "Resume". Output: status → Active; akrual lanjut dari titik sebelumnya (tidak hilang).

**TC-STR-04** — Input: flow rate baru. Aksi: HR edit gaji karyawan. Output: `updateFlowRate()` sukses; akrual berikutnya memakai rate baru, akrual sebelum perubahan tidak terpengaruh retroaktif.

**TC-STR-05** — Input: stream Active tanpa proposal PHK. Aksi: panggil `cancelStream()` langsung (bukan via alur PHK). Output: stream berhenti; sengaja diuji sebagai bad path karena alur normal seharusnya selalu lewat PHK/resign (FR-501/505), bukan cancel langsung — perilaku ini harus dikonfirmasi tidak menimbulkan kehilangan hak pesangon karyawan.

---

## Modul EWA — Earned Wage Access

| TC-ID | Nama Test | FR | Tipe | Prioritas |
|---|---|---|---|---|
| TC-EWA-01 | Saldo EWA terakru bertambah real-time | 402 | Happy | P0 |
| TC-EWA-02 | Klaim EWA berhasil gasless, saldo reset | 401, 403 | Happy | P0 |
| TC-EWA-03 | Klaim melebihi rate limit per jam ditolak | 404 | Bad | P1 |
| TC-EWA-04 | Klaim gagal jelas saat gas pool perusahaan kosong | 403 | Bad | P1 |
| TC-EWA-05 | Klaim melebihi saldo vault perusahaan ditolak | 401 | Bad | P0 |

**TC-EWA-01** — Input: stream Active. Aksi: buka `/employee/ewa`, amati saldo. Output: nominal Rupiah bertambah setiap detik sesuai flow rate, tanpa perlu refresh manual.

**TC-EWA-02** — Input: saldo akru > 0. Aksi: klik "Tarik Gaji". Output: UserOperation ERC-4337 direlay via backend bundler tanpa meminta ETH dari karyawan; saldo akru reset ke 0; IDRX masuk ke akun karyawan.

**TC-EWA-03** — Input: sudah klaim 10x dalam 1 jam (batas rate limit). Aksi: klaim ke-11. Output: `429` atau pesan "Batas klaim per jam tercapai, coba lagi nanti."

**TC-EWA-04** — Input: `getGasBalance()` perusahaan = 0. Aksi: karyawan klaim. Output: pesan "Penarikan gaji sedang nonaktif — saldo biaya transaksi perusahaan belum diisi, hubungi HR" (bukan error generik/teknis).

**TC-EWA-05** — Input: akru karyawan > `vaultBalance` perusahaan (vault HR kosong/kurang). Aksi: klaim. Output: revert dengan pesan ramah (lihat `friendlyError.ts`), bukan raw revert reason; saldo akru tidak ter-reset (tetap menunggu vault diisi ulang).

---

## Modul PHK — Pemutusan Hubungan Kerja & Resign

| TC-ID | Nama Test | FR | Tipe | Prioritas |
|---|---|---|---|---|
| TC-PHK-01 | HR propose PHK → status "Menunggu Legal" | 501 | Happy | P0 |
| TC-PHK-02 | Legal approve → status "Siap Dieksekusi" | 502 | Happy | P0 |
| TC-PHK-03 | Execute PHK → stream cancel, pesangon dirilis | 503, 506 | Happy | P0 |
| TC-PHK-04 | Proposal expire setelah masa berlaku terlewati | 503 | Bad | P1 |
| TC-PHK-05 | Karyawan resign mandiri → pesangon sesuai aturan | 505 | Happy | P1 |

**TC-PHK-01** — Input: alamat karyawan, alasan PHK. Aksi: HR isi form di `/hr/phk`, submit proposal. Output: `proposeTermination()` sukses; status proposal "Menunggu Legal"; alasan plaintext tersimpan di `phk_reasons` (hanya hash on-chain).

**TC-PHK-02** — Input: proposal dari TC-PHK-01. Aksi: Legal Officer login, buka `/hr/phk`, klik "Setujui". Output: `approveTermination()` sukses; status "Siap Dieksekusi".

**TC-PHK-03** — Input: proposal approved. Aksi: HR klik "Eksekusi PHK". Output: `executeTermination()` sukses; stream gaji berhenti; dana `SeveranceVault` karyawan terkait dicairkan otomatis sesuai UU Cipta Kerja; SBT karyawan dicabut (lihat TC-SBT-03).

**TC-PHK-04** — Input: proposal yang dibiarkan tanpa approval Legal melewati `TERMINATION_EXPIRY`. Aksi: coba `approveTermination()`/`executeTermination()` setelah expired. Output: revert; HR harus propose ulang dari awal.

**TC-PHK-05** — Input: karyawan aktif tanpa proposal PHK berjalan. Aksi: karyawan klik "Resign" di `/employee/phk`. Output: stream berhenti, pesangon (jika berlaku sesuai aturan resign vs PHK) tersedia untuk diklaim; tidak memerlukan approval Legal (beda dari alur PHK).

---

## Modul VEST — Cliff Vesting

| TC-ID | Nama Test | FR | Tipe | Prioritas |
|---|---|---|---|---|
| TC-VEST-01 | HR buat cliff vest untuk karyawan | 601 | Happy | P1 |
| TC-VEST-02 | Klaim sebelum cliff date ditolak | 602 | Bad | P1 |
| TC-VEST-03 | Klaim setelah cliff date berhasil | 602 | Happy | P1 |
| TC-VEST-04 | HR batalkan/sita vest yang belum diklaim | 603 | Happy | P2 |

**TC-VEST-01** — Input: alamat karyawan, jumlah IDRX, tanggal cliff (> hari ini). Aksi: HR isi form di `/hr/vesting`. Output: `CliffVest` baru tercatat; karyawan melihat bonus "terkunci" dengan tanggal cair di `/employee/vesting`.

**TC-VEST-02** — Input: vest dari TC-VEST-01, hari ini < cliff date. Aksi: karyawan klik "Tarik Bonus". Output: tombol disabled di UI; jika dipanggil langsung, revert `CliffNotReached`.

**TC-VEST-03** — Input: vest yang cliff date-nya sudah lewat. Aksi: karyawan klik "Tarik Bonus". Output: IDRX cair ke akun karyawan; status vest berubah claimed.

**TC-VEST-04** — Input: vest belum diklaim, karyawan masih dalam status aktif (belum lewat cliff). Aksi: HR klik "Batalkan Vest". Output: dana vest yang disita kembali ke kas perusahaan; karyawan tidak bisa klaim vest tersebut lagi.

---

## Modul KOP — Koperasi Karyawan

| TC-ID | Nama Test | FR | Tipe | Prioritas |
|---|---|---|---|---|
| TC-KOP-01 | Karyawan deposit dana ke pool koperasi | 701 | Happy | P1 |
| TC-KOP-02 | Karyawan ajukan pinjaman dalam limit | 703 | Happy | P1 |
| TC-KOP-03 | Pengajuan pinjaman melebihi limit ditolak | 703 | Bad | P1 |
| TC-KOP-04 | Auto-repay pinjaman saat klaim EWA berikutnya | 704 | Happy | P1 |
| TC-KOP-05 | **[Baru]** HR freeze pool darurat — deposit/pinjaman baru ditolak, withdraw/repay tetap berjalan | 706 | Happy + Bad | P1 |
| TC-KOP-06 | **[Baru]** HR unfreeze pool — deposit/pinjaman kembali normal | 706 | Happy | P2 |

**TC-KOP-01** — Input: jumlah IDRX. Aksi: karyawan klik "Titipkan Dana" di `/employee/koperasi`, approve + deposit. Output: `LenderDeposit` bertambah; mulai mendapat bagi hasil sesuai jasa koperasi berjalan.

**TC-KOP-02** — Input: jumlah ≤ 80% estimasi gaji bulanan. Aksi: karyawan klik "Ajukan Pinjaman". Output: `LoanRecord` baru, IDRX cair ke akun karyawan.

**TC-KOP-03** — Input: jumlah > 80% gaji atau > likuiditas pool tersedia. Aksi: ajukan pinjaman. Output: revert `LoanLimitExceeded` atau `InsufficientPoolLiquidity`; pesan ramah ditampilkan (bukan raw revert).

**TC-KOP-04** — Input: pinjaman aktif, karyawan klaim EWA berikutnya. Aksi: klik "Tarik Gaji" di `/employee/ewa`. Output: sebagian klaim otomatis dipotong untuk cicilan pinjaman koperasi sebelum sisanya masuk ke akun karyawan.

**TC-KOP-05** — Input: pool koperasi perusahaan dalam keadaan normal. Aksi: HR klik "Bekukan Pool" (via `setKoperasiPoolFrozen(true)`). Output: event `PoolFrozen`; karyawan yang mencoba deposit/ajukan pinjaman baru ditolak `PoolIsFrozen`; karyawan dengan pinjaman/deposit yang **sudah ada** tetap bisa withdraw/repay seperti biasa.

**TC-KOP-06** — Input: pool sedang frozen dari TC-KOP-05. Aksi: HR klik "Aktifkan Kembali Pool". Output: event `PoolUnfrozen`; deposit dan pengajuan pinjaman baru kembali berfungsi normal.

---

## Modul COMP — Kepatuhan & Pelaporan

| TC-ID | Nama Test | FR | Tipe | Prioritas |
|---|---|---|---|---|
| TC-COMP-01 | HR lihat ringkasan akumulasi compliance bulanan | 801 | Happy | P1 |
| TC-COMP-02 | HR export laporan CSV per bulan | 804 | Happy | P1 |
| TC-COMP-03 | HR withdraw dana kepatuhan ke agen pajak | 803 | Happy | P1 |
| TC-COMP-04 | **[Baru]** HR catat rekonsiliasi pembayaran BPJS/PPh21 aktual, lihat selisih vs estimasi on-chain | 805 | Happy | P2 |

**TC-COMP-01** — Input: bulan (YYYY-MM) yang ada klaim EWA di periode tersebut. Aksi: HR pilih bulan di `/hr/compliance`, klik "Tampilkan". Output: ringkasan total akumulasi, jumlah karyawan, rincian per karyawan ditampilkan (dari `GET /compliance/summary/:hr`).

**TC-COMP-02** — Input: bulan yang sudah ada datanya. Aksi: klik "Export CSV". Output: file CSV terunduh berisi rincian per karyawan (nama & NIK terdekripsi sementara, tidak disimpan plaintext).

**TC-COMP-03** — *(duplikat referensi TC-OWN-06 — withdraw compliance sudah dicakup di modul OWN; dipertahankan di sini untuk traceability FR-803 dari sisi alur kepatuhan.)*

**TC-COMP-04** — Input: jumlah BPJS dan PPh21 yang benar-benar disetorkan HR ke instansi terkait bulan ini. Aksi: HR isi form "Rekonsiliasi Pembayaran" di `/hr/compliance`, klik "Catat Pembayaran". Output: `POST /compliance/reconciliation/:hr` 200; tabel menampilkan estimasi on-chain vs jumlah dicatat, dengan selisih "Kurang"/"Lebih"/"Sesuai".

---

## Modul SBT — Sertifikasi Ketenagakerjaan

| TC-ID | Nama Test | FR | Tipe | Prioritas |
|---|---|---|---|---|
| TC-SBT-01 | SBT diterbitkan otomatis saat onboarding karyawan | 901 | Happy | P1 |
| TC-SBT-02 | SBT gagal ditransfer P2P (soulbound) | 901 | Bad | P1 |
| TC-SBT-03 | SBT dicabut otomatis saat offboarding/PHK | 903 | Happy | P1 |
| TC-SBT-04 | Pihak ketiga verifikasi keaslian SBT via block explorer | 905 | Happy | P2 |

**TC-SBT-01** — Input: karyawan baru di-startStream (TC-STR-01). Aksi: amati proses onboarding. Output: SBT (ERC-5192) ter-mint ke alamat karyawan, terlihat di wallet/explorer.

**TC-SBT-02** — Input: karyawan mencoba transfer SBT-nya ke alamat lain via wallet eksternal. Aksi: panggil `transferFrom` langsung. Output: revert `SoulboundTransferNotAllowed` — hanya mint (from=0) dan burn (to=0) yang diizinkan.

**TC-SBT-03** — Input: karyawan yang PHK dieksekusi (TC-PHK-03). Aksi: amati SBT karyawan tersebut setelah eksekusi. Output: SBT di-burn/dicabut; `locked()`/keberadaan token tidak lagi valid.

**TC-SBT-04** — Input: tokenId SBT karyawan aktif. Aksi: pihak ketiga (mis. calon pemberi kerja) cek alamat kontrak SBT di Basescan. Output: metadata ketenagakerjaan (tanpa PII sensitif) dapat diverifikasi publik tanpa perlu akses ke sistem Payana.

---

## Modul FHE — Kerahasiaan Data Gaji (Salary Privacy)

| TC-ID | Nama Test | FR | Tipe | Prioritas |
|---|---|---|---|---|
| TC-FHE-01 | HR set gaji karyawan dalam format terenkripsi | 1102 | Happy | P2 |
| TC-FHE-02 | Karyawan dekripsi gaji sendiri via viewing key pribadi | 1103 | Happy | P2 |
| TC-FHE-03 | HR lihat agregasi total payroll tanpa membuka gaji individual | 1104 | Happy | P2 |
| TC-FHE-04 | **[Baru]** HR grant viewing key ke auditor; setelah revoke, status jadi tidak aktif | 1105 | Happy | P2 |

> **Catatan cakupan:** `ConfidentialCompanyVault` adalah deployment standalone single-tenant
> (lihat SKPL Kelompok K) — keempat TC ini hanya bisa dijalankan terhadap satu perusahaan demo
> yang memang terhubung ke kontrak ini, bukan terhadap sembarang HR di platform.

**TC-FHE-01** — Input: gaji karyawan (plaintext, dienkripsi client-side sebelum dikirim). Aksi: HR set gaji terenkripsi di halaman terkait. Output: `setEncryptedSalary()` menyimpan ciphertext (`euint256`) on-chain; tidak ada gaji plaintext yang pernah dikirim ke backend/dicatat di log.

**TC-FHE-02** — Input: karyawan dengan gaji terenkripsi tersimpan. Aksi: karyawan minta dekripsi gaji sendiri. Output: hanya pemilik data (atau pemegang viewing key yang di-grant) yang bisa melihat nilai asli; pihak lain melihat ciphertext.

**TC-FHE-03** — Input: beberapa karyawan dengan gaji terenkripsi. Aksi: HR panggil `aggregateTotalPayroll()`. Output: total payroll terhitung secara homomorfik tanpa membuka nilai gaji individual manapun ke HR.

**TC-FHE-04** — Input: alamat auditor, tanggal kedaluwarsa akses. Aksi: HR buka `/hr/auditor`, klik "Beri Akses", lalu nanti klik "Cabut Akses". Output: `grantViewingKey()` sukses, auditor `isAuditorActive()=true`; setelah `revokeAuditorAccess()`, `isAuditorActive()=false` — **dicek via live on-chain read**, bukan dari data Ponder (event revoke tidak diemit, lihat catatan di `useAuditorGrants.ts`).

---

## Modul ATT — Attendance (belum ber-FR resmi di SKPL)

| TC-ID | Nama Test | Tipe | Prioritas |
|---|---|---|---|
| TC-ATT-01 | Karyawan clock-in dan clock-out | Happy | P2 |
| TC-ATT-02 | HR lihat rekap absensi karyawan | Happy | P2 |

**TC-ATT-01** — Input: waktu saat ini. Aksi: karyawan klik "Clock In" di `/employee/attendance`, lalu "Clock Out" di akhir hari. Output: baris `attendance_records` tercatat dengan `clock_in`/`clock_out`.

**TC-ATT-02** — Input: rentang tanggal. Aksi: HR buka `/hr/attendance`, pilih filter tanggal/karyawan. Output: tabel rekap kehadiran tampil sesuai data tercatat.

---

## Modul RMB — Reimbursement (belum ber-FR resmi di SKPL)

| TC-ID | Nama Test | Tipe | Prioritas |
|---|---|---|---|
| TC-RMB-01 | Karyawan submit klaim reimburse dengan bukti | Happy | P1 |
| TC-RMB-02 | HR approve klaim → transfer IDRX ke karyawan | Happy | P1 |
| TC-RMB-03 | HR reject klaim reimburse | Happy | P2 |

**TC-RMB-01** — Input: kategori, jumlah, tanggal, deskripsi, link bukti. Aksi: karyawan isi form di `/employee/reimburse`, submit. Output: baris `reimbursement_claims` status "pending".

**TC-RMB-02** — Input: klaim pending. Aksi: HR klik "Setujui" di `/hr/reimburse`. Output: HR melakukan transfer IDRX manual ke karyawan; status berubah "approved" dengan `tx_hash` tercatat setelah konfirmasi.

**TC-RMB-03** — Input: klaim pending yang tidak valid (mis. bukti tidak sesuai kategori). Aksi: HR klik "Tolak". Output: status "rejected"; karyawan melihat alasan penolakan (jika diisi).

---

## Modul BTY — Bounty (belum ber-FR resmi di SKPL)

| TC-ID | Nama Test | Tipe | Prioritas |
|---|---|---|---|
| TC-BTY-01 | HR buat bounty baru dengan kuota | Happy | P2 |
| TC-BTY-02 | Karyawan submit proof, HR approve, payout otomatis | Happy | P2 |

**TC-BTY-01** — Input: judul, deskripsi, reward IDRX, kuota klaim. Aksi: HR isi form di `/hr/bounty`, submit. Output: baris `bounties` status "open" dengan `claimed_count=0`.

**TC-BTY-02** — Input: link bukti pengerjaan. Aksi: karyawan submit proof di `/employee/bounty`; HR review dan approve. Output: status klaim "approved"→"paid" setelah HR transfer IDRX; `claimed_count` bertambah; bounty otomatis "closed" jika kuota tercapai.

---

## Lampiran — Gap yang Ditemukan Selama Penyusunan Dokumen Ini

- **Duplikasi nomor subbab di SKPL.md:** dokumen punya dua section "## 3.2 Kebutuhan Fungsional" terpisah (Kelompok A–E dimulai dari §3.2.1, lalu Kelompok F–K mengulang dari §3.2.1 lagi) — nomor subbab seperti "§3.2.26" merujuk ke dua FR yang sama sekali berbeda (Relay Gasless ERC-4337 di Kelompok D vs Penangguhan Akses Klien di Kelompok J). Tidak diperbaiki di dokumen ini karena di luar scope diskusi blackbox testing — perlu di-renumber di revisi SKPL berikutnya supaya referensi "§3.2.X" tidak ambigu.
