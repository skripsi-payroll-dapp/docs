# Goals & KPI

---

## Tujuan Bisnis

1. Akuisisi **10 perusahaan pilot** (50–200 karyawan) dalam 6 bulan pertama post-launch
2. **Total Value Locked (TVL)** treasury vault mencapai **Rp 5 miliar** dalam 12 bulan
3. **NPS karyawan ≥ 50** setelah 3 bulan penggunaan
4. **Zero kasus pesangon tidak terbayar** pada perusahaan yang menggunakan platform

---

## Key Performance Indicators (KPI)

| KPI | Target MVP | Target 6 Bulan | Cara Ukur |
|---|---|---|---|
| Perusahaan onboarded | 5 | 20 | Dashboard admin |
| Karyawan aktif streaming | 100 | 1.000 | On-chain employeeStreams mapping |
| Volume claim EWA (bulanan) | Rp 500 juta | Rp 5 miliar | On-chain tx volume |
| Waktu onboarding perusahaan | < 30 menit | < 15 menit | Funnel analytics |
| Waktu claim EWA end-to-end | < 5 detik | < 3 detik | Tx confirmation time (Base L2) |
| Error/failed claim rate | < 0.5% | < 0.1% | On-chain error logs |
| Retention perusahaan (3 bulan) | — | ≥ 85% | Churn tracking |

---

## Metrik Sukses per Persona

### HR / Finance Admin
- Waktu onboarding vault < 30 menit
- Zero kesalahan rekonsiliasi bulanan
- Dashboard compliance real-time tersedia

### Karyawan
- Claim EWA berhasil < 5 detik (Base L2)
- Zero gas fee dibebankan ke karyawan (ERC-4337 Paymaster)
- NPS ≥ 50 setelah 3 bulan

### Legal / Owner
- Zero sengketa pesangon
- Audit trail on-chain tersedia 100% transaksi
- PHK approval bisa dilakukan dari mobile

---

## Definition of Done — MVP

Platform dinyatakan MVP-ready jika:

- [ ] Vault deployment + employee stream berjalan di Base Sepolia testnet tanpa error
- [ ] Claim EWA atomic (93/5/2 split) berhasil dalam < 5 detik (Base L2)
- [ ] PHK flow multi-sig (HR + Legal via Safe) selesai end-to-end
- [ ] Karyawan bisa login dengan email dan claim gaji tanpa gas fee (ERC-4337 Paymaster)
- [ ] Dashboard HR dan Employee dapat diakses via browser mobile
- [ ] Minimal 5 perusahaan pilot onboarded
