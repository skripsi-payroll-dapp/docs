# Catatan untuk Revisi SKPL/DPPL

Dokumen ini BUKAN revisi resmi SKPL.md/DPPL.md — ini catatan kerja dari audit kesesuaian
kode vs spesifikasi yang dilakukan 2026-06-24/25, untuk dipakai sebagai bahan revisi SKPL/DPPL
yang sesungguhnya nanti (sidang/BAB lanjutan skripsi). Setiap poin di bawah menyebutkan FR
terkait dan apa yang perlu diubah di teks spesifikasi.

---

## 1. Kelompok L (FR-PAYANA-1201–1203) — IDRXPriceOracle dihapus [SUDAH DITERAPKAN DI SKPL.md Revisi C dan DPPL.md Revisi G]

**Status di SKPL sebelumnya:** "berstatus rancangan, belum di-deploy" — spec sendiri sudah
mengakui ini belum final.

**Keputusan:** `IDRXPriceOracle.sol` dihapus total dari kodebase (bukan dinonaktifkan/disimpan
sebagai dead code). Alasan: IDRX dirancang sebagai stablecoin 1:1 terhadap Rupiah, sehingga
fungsi konversi harga (`convertIDRXtoUSD`/`convertUSDtoIDRX`) tidak punya kasus penggunaan nyata
di MVP ini — bukan kebutuhan yang "belum sempat diimplementasikan", tapi kebutuhan yang gugur
begitu asumsi 1 IDRX = 1 IDR ditetapkan sebagai desain final produk.

**Yang perlu diubah di SKPL/DPPL:** Hapus seluruh Kelompok L (FR-1201–1203) dari SKPL, atau
ubah statusnya menjadi "Ditolak/Dibatalkan" dengan justifikasi di atas — bukan "akan
diimplementasikan kemudian". Hapus juga referensi `IDRXPriceOracle` di DPPL (class diagram,
deployment diagram bila ada).

---

## 2. FR-PAYANA-706 — Pembekuan darurat pool koperasi (baru didefinisikan)

**Status di SKPL sebelumnya:** "[Perlu dikonfirmasi] ... belum terdefinisi pada kode yang ada
saat ini dan memerlukan spesifikasi lebih lanjut sebelum implementasi."

**Spesifikasi yang diimplementasikan (untuk dimasukkan ke revisi SKPL):**
- `EmployeeLiquidityContract.freezePool(address companyAddress)` /
  `unfreezePool(address companyAddress)` — dapat dipanggil oleh `DEFAULT_ADMIN_ROLE` (Owner
  platform) ATAU oleh `CompanyVault` perusahaan yang bersangkutan (`msg.sender == companyAddress`)
  — jadi baik platform maupun HR sendiri bisa membekukan pool koperasinya dalam kondisi darurat.
- `CompanyVault.setKoperasiPoolFrozen(bool frozen)` (`onlyHR`) adalah satu fungsi gabungan (bukan
  dua fungsi freeze/unfreeze terpisah) — digabung khusus untuk menghemat bytecode karena
  `PayrollFactory` sudah mendekati batas EIP-170 (24.576 byte).
  
  > Catatan teknis untuk pembimbing/penguji: ini adalah trade-off arsitektur nyata, bukan
  > simplifikasi sembarangan — `PayrollFactory.deployVault()` meng-embed bytecode penuh
  > `CompanyVault` lewat `new CompanyVault(...)`, sehingga setiap penambahan fungsi di
  > `CompanyVault` ikut membesarkan `PayrollFactory`.
- **Cakupan pembekuan:** HANYA memblokir deposit dan pinjaman BARU (`_doDeposit`/`_doBorrow`
  revert dengan `PoolIsFrozen()`). Penarikan, pelunasan, dan likuidasi pinjaman yang SUDAH ADA
  tetap berjalan normal — keputusan desain ini memastikan dana yang sudah dititipkan/dipinjam
  tidak pernah terkunci akibat freeze, sehingga freeze aman dipakai tanpa merugikan pihak yang
  sudah punya posisi terbuka di pool.
- Event `PoolFrozen(address companyAddress)` / `PoolUnfrozen(address companyAddress)` diterbitkan
  dan diindeks Ponder (kolom `liquidityPool.frozen`).

**Yang perlu diubah di SKPL/DPPL:** Ganti tag "[Perlu dikonfirmasi]" pada FR-706 dengan teks di
atas. Tambahkan ke DPPL: deskripsi fungsi `freezePool`/`unfreezePool`/`setKoperasiPoolFrozen`,
event baru, dan kolom `frozen` di skema Ponder `liquidityPool`. Tambahkan ke sequence diagram
koperasi: alur HR membekukan pool dari `/hr/koperasi` (jika UI ditambahkan di iterasi
berikutnya — saat ini baru di level kontrak, belum ada tombol freeze di frontend HR).

---

## 3. FR-PAYANA-1105 — UI Auditor untuk Confidential Salary (FHE)

**Status sebelumnya:** Kontrak (`ConfidentialCompanyVault.grantViewingKey`/`revokeAuditorAccess`/
`isAuditorActive`) sudah lengkap dan benar sesuai spec Kelompok K, tapi TIDAK ADA antarmuka
frontend sama sekali — gap implementasi murni, bukan gap desain.

**Yang sudah dibangun:** Halaman `/hr/auditor` — form pemberian akses (alamat auditor + tanggal
kedaluwarsa) dan tabel riwayat akses dengan status real-time (Aktif/Tidak Aktif) serta tombol
cabut akses.

**Catatan penting untuk DPPL (bukan kesalahan, tapi perilaku kontrak yang harus didokumentasikan
secara eksplisit):** `revokeAuditorAccess()` **tidak menerbitkan event apa pun**. Akibatnya,
data terindeks Ponder (`auditorGrant.active`) bisa basi begitu auditor dicabut — field tersebut
hanya valid sebagai riwayat historis, BUKAN status saat ini. Status sebenarnya hanya bisa
diperoleh lewat pembacaan langsung on-chain `isAuditorActive(auditor)`. UI yang dibangun sudah
menerapkan ini (`useIsAuditorActive` membaca on-chain langsung, terpisah dari daftar historis
Ponder) — tapi SKPL/DPPL versi revisi harus menyebutkan keterbatasan ini secara eksplisit supaya
tidak dianggap bug oleh penguji yang membaca behavior Ponder.

**Keterbatasan lain yang perlu disebutkan di SKPL:** `grantViewingKey` di-batch
(`startIdx`/`batchSize`) dan dipanggil dengan batchSize=200 di UI — cukup untuk skala MVP/demo,
tapi paginasi untuk perusahaan dengan >200 karyawan belum diimplementasikan (satu transaksi tidak
bisa mencakup seluruh karyawan kalau lebih dari itu).

**Catatan arsitektur untuk SKPL/DPPL:** `ConfidentialCompanyVault` adalah deployment standalone
single-tenant (lihat `DeployConfidential.s.sol`), BUKAN diprovisikan otomatis per-perusahaan
lewat `PayrollFactory` seperti `CompanyVault` biasa. Saat ini hanya satu perusahaan demo yang
punya akses ke fitur ini. SKPL Kelompok K perlu menyebutkan keterbatasan single-tenant ini
sebagai batasan MVP, bukan menyiratkan setiap perusahaan otomatis mendapat fitur ini.

---

## 4. FR-PAYANA-1005 — Penangguhan & Pemulihan Akses Klien

**Status sebelumnya:** SKPL hanya mendeskripsikan mekanisme penangguhan (blocklist JWT
berbasis backend) secara naratif — TIDAK ADA implementasi sama sekali di kode (`grep -r
"suspend"` di backend mengembalikan nol hasil sebelum sesi ini). Tag "[Perlu dikonfirmasi]" di
spec hanya menempel pada bagian REAKTIVASI, tapi ternyata mekanisme SUSPENSI itu sendiri pun
belum pernah dibangun — jadi cakupan pekerjaan lebih besar dari yang diasumsikan tag tersebut.

**Yang dibangun (kedua arah, suspensi DAN reaktivasi):**
- Tabel `suspended_clients` (kolom: `hr_address` PK, `reason`, `suspended_by`, `suspended_at`) —
  keberadaan baris = HR tersebut sedang ditangguhkan. Penghapusan baris = reaktivasi.
- `POST /suspension/:hrAddress` (Owner-only) — menulis baris blocklist DAN langsung menghapus
  semua sesi aktif (`sessions`) milik HR tersebut, sesuai spec ("mencabut sesi JWT aktif").
- `DELETE /suspension/:hrAddress` (Owner-only) — reaktivasi: hapus baris blocklist. **Keputusan
  desain untuk bagian yang di-flag "[Perlu dikonfirmasi]" oleh spec:** HR yang direaktivasi harus
  login ulang dari awal (sesi lama sudah tercabut saat suspensi) — bukan dipulihkan otomatis ke
  sesi sebelumnya. Ini keputusan MVP yang dibuat sepihak tanpa "spesifikasi alur persetujuan
  lebih lanjut antara tim operasional Payana dan sistem backend" yang disebut spec asli — perlu
  dikonfirmasi ulang ke pembimbing/stakeholder apakah alur ini cukup atau perlu approval
  berjenjang (mis. perlu dua pihak menyetujui reaktivasi).
- `requireAuth` middleware mengecek `suspended_clients` pada SETIAP request (bukan hanya saat
  login) — sehingga token yang terbit di antara waktu suspensi tetap langsung ditolak.
- `/auth/login` menolak percobaan login baru dari alamat yang sedang ditangguhkan (403
  `ACCOUNT_SUSPENDED`).
- UI Owner: panel suspend/reaktivasi di `/owner/companies/[hrAddress]`.
- UI HR: jika `/auth/login` ditolak karena suspensi, layout HR menampilkan pesan "Akses
  Ditangguhkan" alih-alih diam membiarkan proses sign-in menggantung tanpa keterangan.

**Konfirmasi yang tetap berlaku dari spec asli (tidak berubah):** Penangguhan murni di level
antarmuka backend — TIDAK menyentuh status vault on-chain. Karyawan tetap bisa klaim gaji normal
lewat antarmuka karyawan yang terpisah, persis seperti yang dijamin SKPL §3.2.26.

**Yang perlu diubah di SKPL:** Hapus tag "[Perlu dikonfirmasi]" pada bagian reaktivasi, ganti
dengan keputusan desain di atas (reaktivasi = HR login ulang dari nol, tanpa approval berjenjang
di versi MVP ini).

---

## 5. FR-PAYANA-805 — Rekonsiliasi Kepatuhan

**Status sebelumnya:** "[Perlu dikonfirmasi] Mekanisme rekonsiliasi otomatis ... belum
diimplementasikan pada versi MVP dan memerlukan spesifikasi lebih lanjut untuk integrasi dengan
sistem pemerintah."

**Keputusan cakupan MVP:** Integrasi otomatis ke sistem DJP/BPJS sungguhan TIDAK realistis untuk
skripsi ini (tidak ada akses API resmi pemerintah) — maka tag "[Perlu dikonfirmasi]" yang
menyebut "integrasi dengan sistem pemerintah" SECARA SENGAJA tidak diselesaikan ke arah itu.
Sebagai gantinya, dibangun rekonsiliasi MANUAL: HR memasukkan sendiri jumlah yang benar-benar
disetorkan ke BPJS/DJP per bulan, dan sistem menghitung selisihnya terhadap estimasi akumulasi
on-chain (`complianceBalance`, dipecah proporsional menurut `bpjsBps`/`pph21Bps` yang HR
konfigurasi sendiri lewat `setCompanyConfig`).

**Yang dibangun:**
- Tabel `compliance_reconciliations` (PK gabungan `hr_address`+`month`) menyimpan jumlah BPJS
  dan PPh21 yang HR konfirmasi telah dibayar untuk bulan tersebut.
- `GET/POST /compliance/reconciliation/:hr` — baca/tulis catatan tersebut (HR hanya bisa
  mengakses datanya sendiri).
- Frontend membaca `bpjsBps`/`pph21Bps`/`complianceBalance` langsung dari `CompanyVault`
  on-chain (variabel publik, getter otomatis — sebelumnya tidak diekspos lewat ABI frontend sama
  sekali) untuk menghitung estimasi split BPJS vs PPh21 dari total akumulasi compliance bulan
  berjalan (`useCompanyComplianceConfig`), lalu menampilkan selisih (kurang/lebih/sesuai)
  terhadap apa yang HR catat sudah dibayar.

**Yang perlu diubah di SKPL/DPPL:** Ganti tag "[Perlu dikonfirmasi]" dengan: "Rekonsiliasi
dilakukan secara semi-manual — estimasi kewajiban dihitung otomatis dari data on-chain, namun
konfirmasi jumlah yang benar-benar dibayarkan ke DJP/BPJS dimasukkan manual oleh HR (tidak ada
integrasi API langsung ke sistem pemerintah pada versi MVP)." Tambahkan skema tabel
`compliance_reconciliations` ke DPPL/DDL.

---

## 6. Temuan audit lain (bukan bagian dari 4 implementasi sesi ini, untuk dicatat saja)

- **Koperasi (Kelompok G, FR-701–706) menyimpang signifikan dari spec di level implementasi**:
  akuntansi berbasis share (bukan cumulative-index seperti di spec), suku bunga dinamis
  berdasarkan utilisasi (bukan tarif statis), `getHealthFactor()` tanpa basis spec, HR sebagai
  pemberi pinjaman lewat `seedKoperasiPool()` tanpa basis spec, dan seluruh dashboard HR
  (grafik + ekspor PDF) tanpa basis spec. Modul koperasi itu sendiri ADA di spec — yang perlu
  direvisi adalah deskripsi detail mekanismenya supaya cocok dengan implementasi nyata, bukan
  menambah FR baru.
- **Reimburse, Bounty, Attendance**: fully implemented di kode, TAPI nol nomor FR di SKPL — ini
  gap dokumentasi spec, bukan gap implementasi. Perlu ditambahkan sebagai Kelompok FR baru di
  revisi SKPL supaya cakupan dokumentasi sesuai cakupan kode.
- **`/legacy-recovery`**: dikonfirmasi sebagai tool admin internal (bukan fitur produk), tidak
  perlu masuk SKPL/DPPL sebagai requirement — cukup dicatat di dokumentasi developer/runbook
  bila ada.
- **Duplikasi nomor subbab "§3.2.X" di SKPL.md** [BARU, ditemukan saat menyusun
  `black-box-testing.md`]: dokumen punya dua section terpisah yang sama-sama berjudul
  "## 3.2 Kebutuhan Fungsional" — satu untuk Kelompok A–E (mulai §3.2.1), satu lagi untuk
  Kelompok F–K (mengulang dari §3.2.1 lagi). Akibatnya nomor seperti "§3.2.26" merujuk ke DUA
  requirement yang sama sekali berbeda (Relay Gasless ERC-4337 FR-403 di Kelompok D, vs
  Penangguhan Akses Klien FR-1005 di Kelompok J). Perlu di-renumber jadi satu urutan menyambung
  (atau pakai sub-numbering per Kelompok, mis. "§3.2.D.5") di revisi SKPL berikutnya supaya
  referensi tidak ambigu — terutama penting karena dokumen ini (dan `black-box-testing.md`) makin
  sering merujuk ke FR-PAYANA-XXX langsung untuk traceability, bukan ke nomor subbab.

## 7. Stress Test & Black Box Testing (2026-06-25) [SUDAH DITERAPKAN]

- **Stress test**: dibuat stack terpisah `stress-test/` (k6 + InfluxDB + Grafana, lihat
  `stress-test/README.md`). Diuji 50→100 concurrent users terhadap `/auth/login`,
  `/compliance/summary/:hr`, dan Ponder `/companies` — bukan 1.000 concurrent seperti klaim awal
  SKPL (testnet publik + Alchemy free-tier tidak realistis dipukul sebesar itu untuk skripsi).
  Hasil: Ponder P99=10,7ms (lulus), tapi `/auth/login` P99=729ms dan `/compliance/summary` P99=799ms
  KEDUANYA melebihi threshold 500ms awal (error rate tetap 0%, jadi bukan soal sistem gagal, hanya
  lebih lambat dari klaim yang sebelumnya tidak pernah diukur). NFR-PAYANA-01 di SKPL.md sudah
  direvisi (Revisi D) memuat angka terukur ini, dan klaim "diukur via Datadog APM" diperbaiki
  jadi jujur (Datadog tidak pernah diintegrasikan ke sistem — di-grep, nol hasil).
  `/bundler/relay` sengaja TIDAK diikutkan dalam stress test (mengirim transaksi nyata via
  Pimlico Paymaster — bulk-firing berisiko menghabiskan gas dan kena rate-limit).
  **Susulan (2026-06-25, run kedua):** dibuat `load-test-full.js` yang mencakup 19 endpoint
  (hampir seluruh permukaan API backend yang aman diuji — semua endpoint yang butuh
  `verifyIdrxTransfer()` atau yang berkonsekuensi admin nyata seperti suspend/registrasi sengaja
  dikeluarkan, lihat header file). Hasil: 0 error 5xx di endpoint manapun; satu temuan penting —
  `compliance_summary` P99 naik dari 799ms (diuji sendirian) ke 1.571ms saat dibebani bersamaan
  dengan 18 endpoint lain, menunjukkan kontensi nyata pada connection pool/event loop saat banyak
  fitur dipakai bersamaan. Data sintetis di 6 tabel off-chain (sessions, attendance, leave,
  bounty, bounty_claims, reimbursement_claims, company_settings) sudah dibersihkan setelah run.
- **Black box testing**: `test-plan.md` (v1.0, basi — merujuk modul lama dan file yang tidak
  pernah dibuat) ditulis ulang total jadi v2.0, dan `black-box-testing.md` yang sebelumnya
  CUMA DIRUJUK tapi tidak pernah ada isinya, sekarang benar-benar dibuat: 68 test case di 13
  modul (11 dari Kelompok FR-PAYANA A–K + Attendance/Reimburse/Bounty yang belum ber-FR resmi),
  termasuk TC baru untuk FR-706 (freeze koperasi), FR-1005 (suspend/reaktivasi), FR-805
  (rekonsiliasi), dan FR-1105 (UI auditor FHE) yang semuanya luput dari dokumen test-plan lama.

- **Susulan (2026-06-25, gap NFR-PAYANA-07 + soak + spike test):**
  - **Retry/backoff RPC — gap implementasi ditemukan dan diperbaiki.** NFR-PAYANA-07 sudah lama
    didokumentasikan di SKPL ("retry otomatis dengan exponential backoff, maks 3x, fallback RPC
    jika Alchemy tidak respons dalam 10 detik") tapi TIDAK PERNAH diimplementasikan — `authz.ts`'s
    `isHr()`/`canViewEmployeeData()` menelan SEMUA error RPC (termasuk 429 rate-limit yang
    transien) langsung jadi `catch { return false }` tanpa retry sama sekali, mengubah gangguan
    infra sesaat jadi keputusan otorisasi yang salah. Dibuat `backend/src/services/rpcRetry.ts`
    (`readContractWithRetry()`: 3x retry dengan backoff 200ms/400ms/800ms, lalu fallback ke
    `https://sepolia.base.org` kalau RPC utama tetap gagal) dan kedua fungsi di `authz.ts` diubah
    untuk memakainya. Diverifikasi: `tsc --noEmit` bersih, rebuild+redeploy container backend,
    sanity check manual `POST /termination/reason` dengan wallet sintetis tetap mengembalikan 403
    yang benar (jalur RPC lewat wrapper baru berfungsi). SKPL.md NFR-PAYANA-07 sudah diupdate
    dengan status implementasi ini.
  - **RPC capacity probe**: `stress-test/k6/rpc-capacity.js` mengukur ceiling RPC key Alchemy
    free-tier proyek ini secara langsung (memukul `PayrollFactory.companyVaults()`, call yang
    sama persis dengan `isHr()`). Hasil: **429 mulai muncul begitu concurrency melewati ~15-20
    `eth_call` bersamaan** (test aborts otomatis di 18 VU, error rate 16,69%). Hanya
    `/termination/reason`, `/auth/profile/by-address/:address`, dan `/bounty/hr/:hrAddress` yang
    terdampak ceiling ini (satu-satunya pemanggil `isHr()`/`canViewEmployeeData()`) — semua
    endpoint lain baca dari Ponder/Postgres, bukan RPC langsung. Lihat `stress-test/README.md`
    bagian "RPC capacity probe" untuk detail lengkap.
  - **Soak test** (`soak-test.js`, 40 concurrent selama 14 menit, read-only, 10 endpoint): 127.930
    request, 0 respons 5xx, tidak ada tanda degradasi bertahap (latency stabil dari menit ke-1
    sampai ke-13). `http_req_failed` mentah 9,99% tapi 100%-nya adalah `auth_profile` → 404 yang
    benar secara bisnis (wallet sintetis belum pernah submit profil) — bukan kegagalan sistem.
  - **Spike test** (`spike-test.js`, lonjakan instan 0→100 VU dalam 5 detik, tahan 60 detik): 0
    respons 5xx, `auth_login` 100% sukses meski 100 VU login bersamaan dalam 5 detik (tidak ada
    thundering-herd failure), sistem pulih bersih begitu beban di-drop. `http_req_failed` mentah
    13,24% seluruhnya `attendance_clock_in` → 409 (business logic benar — wallet sintetis dipakai
    berulang clock-in di hari yang sama).
  - Lihat `stress-test/README.md` Run 3 dan Run 4 untuk tabel metrik lengkap.
