# PDHUPL v2 — Integration Test Scripts

Ready-to-run Node.js scripts that execute the 🔗 (integration/API) rows of the PDHUPL v2
execution checklist against a **real running backend + Base Sepolia testnet** — without a
browser or Privy OTP login. The backend only verifies an EIP-191 signature; it does not care
whether that signature came from a Privy embedded wallet or a raw private key, so these scripts
sign in with plain private keys held only in your local `.env` (never sent anywhere except your
own backend, never pasted into chat).

Out of scope for these scripts (see PDHUPL_v2.md checklist markers):
- 🔧 Foundry unit tests — handled separately in `finley-payroll/test/`.
- 🖥️ Manual-only items — Privy OTP login flow itself, BaseScan visual inspection, the FHE
  viewing-key decrypt UI — these genuinely need a browser and are not scripted here.

## Setup

```bash
cd payroll-web3-saas/testing-scripts
npm install
cp .env.example .env
# edit .env with your real Base Sepolia testnet private keys — see comments in .env.example
# for exactly what role/on-chain state each key needs
```

Make sure the backend (and, for on-chain checks, an RPC connection to Base Sepolia) is
reachable at the `BACKEND_URL`/`RPC_URL` you set in `.env`.

## Running

Each script is self-contained and prints ✅/❌ per assertion, then a final pass/fail summary.
Exit code is non-zero if anything failed — useful for `&&`-chaining or CI-style runs.

```bash
node ku-01-login.mjs
node ku-02-registration.mjs
node ku-13-compliance.mjs
node ku-28-suspension.mjs
node ku-21-reimburse.mjs
node ku-22-bounty.mjs
node ku-23-notifications.mjs
node ku-24-payslip.mjs
node ku-25-taxcert.mjs
node ku-26-employment-letter.mjs
node ku-27-directory.mjs
node ku-29-company-settings.mjs
```

Suggested order: `ku-01` → `ku-02` → `ku-26` (creates a notification) → `ku-21`/`ku-22` (also
create notifications) → `ku-23` (reads those notifications) → `ku-13` → `ku-28` (this one
temporarily suspends `TEST_HR`; re-run or manually `DELETE /suspension/:hrAddress` as Owner if
it fails partway) → `ku-24`/`ku-25` (best run after `ku-28`'s on-chain claim gives you a real
`claimId`/txHash) → `ku-27` → `ku-29`.

## Script → AU-xxx mapping

| Script | KU | AU-xxx covered | Notes |
|---|---|---|---|
| `ku-01-login.mjs` | KU-01 Login & Session | AU-01-01 … AU-01-05 | AU-01-05 needs a wallet already suspended (run `ku-28` first, or reuse it as `TEST_SUSPENDED_HR_PRIVATE_KEY`) |
| `ku-02-registration.mjs` | KU-02 Registration | AU-02-01 … AU-02-05 | AU-02-03's real NIK validation lives in `POST /auth/profile`, not `/registration/*` — script calls the correct endpoint even though the checklist groups it under KU-02 |
| `ku-13-compliance.mjs` | KU-13 Compliance | AU-13-01 … AU-13-04 | AU-13-03 needs `TEST_HR2_ADDRESS` set, else skipped |
| `ku-28-suspension.mjs` | KU-28 Suspension | AU-28-01 … AU-28-04 | AU-28-03 is a **real on-chain `claimSalary()` write**, paid directly by `TEST_EMPLOYEE_PRIVATE_KEY` (bypasses the app's ERC-4337 gasless Paymaster flow for simplicity) — needs a small amount of Base Sepolia ETH on that address, and `accrued > 0` or it's skipped, not failed |
| `ku-21-reimburse.mjs` | KU-21 Reimburse `[TIDAK ADA DI SKPL]` | create/read/list/negative + optional approve | Approve happy-path needs `TEST_REIMBURSE_APPROVE_TXHASH` (a real verified IDRX transfer); without it, the script confirms the negative path (`TRANSFER_NOT_VERIFIED`) instead |
| `ku-22-bounty.mjs` | KU-22 Bounty `[TIDAK ADA DI SKPL]` | create/read/claim/approve/negative | Needs `TEST_EMPLOYEE_PRIVATE_KEY` to be a real employee of `TEST_HR` (Ponder `employee_stream` lookup) |
| `ku-23-notifications.mjs` | KU-23 Notifications `[TIDAK ADA DI SKPL]` | list/mark-one/mark-all/negative | Best run after a script that triggers a notification (reimburse/bounty/employment-letter) |
| `ku-24-payslip.mjs` | KU-24 Payslip `[TIDAK ADA DI SKPL]` | negative (always) + happy path (needs `TEST_PAYSLIP_CLAIM_ID`) | claimId format is `${txHash}-${logIndex}` from Ponder's `salary_claim` table |
| `ku-25-taxcert.mjs` | KU-25 Tax Certificate `[TIDAK ADA DI SKPL]` | employee view / HR view / negative (invalid year) | |
| `ku-26-employment-letter.mjs` | KU-26 Employment Letter `[TIDAK ADA DI SKPL]` | request/approve/document/negative | Needs `TEST_EMPLOYEE_PRIVATE_KEY` to have an **Active** `employee_stream` under `TEST_HR` |
| `ku-27-directory.mjs` | KU-27 Employee Directory `[TIDAK ADA DI SKPL]` | update/read (employee+HR)/negative | |
| `ku-29-company-settings.mjs` | KU-29 Company Settings `[TIDAK ADA DI SKPL]` | upsert + read-back only | See gap note below — route has no input validation to exercise a negative case |

`[TIDAK ADA DI SKPL]` = flagged in `PDHUPL_v2_GAP_SUMMARY.md`: this module has a real, working
implementation but no FR-PAYANA number registered in `SKPL.md`.

## Gaps found while writing these scripts (route code doesn't support what a naive checklist reading might assume)

- **`companySettings.ts`** (`KU-29`) performs **zero input validation** — no required fields,
  no bounds-checking on `ewaLimitBps`/`yieldRateBps`. There is no genuine negative-path test to
  write for this route as it stands; `ku-29-company-settings.mjs` only covers the happy-path
  upsert + read-back. (Unrelated stale-comment note left in that script: the route's own code
  comments still say "koperasi" post-Gen8 — cosmetic, not a functional bug, worth a docs pass.)
- **`bounty.ts` claim approval and `reimburse.ts`/`bounty.ts` "paid" endpoints** require a
  **real, already-confirmed on-chain IDRX transfer `txHash`** verified via
  `verifyIdrxTransfer()` — there's no way to script the full happy path without first executing
  a real transfer manually (or via another script) and feeding its hash in through the optional
  env vars. Scripts here default to proving the *negative* path (rejected fake txHash) so they
  still produce a real, meaningful pass/fail without that manual step.
- Every route requiring "not your company's X" authorization checks `caller === hrAddress`
  (strict string equality on the JWT-derived address) rather than any on-chain role check —
  confirmed by reading the code directly in each `routes/*.ts` file, not assumed.

## Do NOT

- Do not commit `.env` (already gitignored).
- Do not put a mainnet private key in here — Base Sepolia testnet only.
- Do not fill in `PDHUPL_v2.md`'s Bab 5 "Hasil yang Didapat"/"Kesimpulan" columns until you have
  actually run the corresponding script and read its real output.
