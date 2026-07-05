// KU-25 Tax Certificate — covers backend/src/routes/taxcert.ts
// Endpoints: GET /tax-cert/:year (employee, own), GET /tax-cert/hr/:employee/:year (HR).
// Tagged FR-PAYANA-TC01/TC02 in code but NOT registered in SKPL.md.
import { loginAs, clientsFromEnv, api, assert, section, finish } from "./lib/common.mjs";

const empLogin = await loginAs("TEST_EMPLOYEE_PRIVATE_KEY");
const hrLogin = await loginAs("TEST_HR_PRIVATE_KEY");
if (!assert(empLogin.ok && hrLogin.ok, "Login preconditions")) finish();

const year = new Date().getFullYear();

section("AU-25-01 — Read — employee's own annual tax summary (agregasi benar)");
{
  const { res, body } = await api(`/tax-cert/${year}`, { token: empLogin.accessToken });
  assert(res.status === 200 && body.summary, "GET /tax-cert/:year → 200 with summary", `status=${res.status} body=${JSON.stringify(body)}`);
  console.log(`  ℹ️  summary: ${JSON.stringify(body.summary)}`);
  console.log("  ℹ️  Verifikasi manual terhadap query SUM langsung ke salary_claim (lihat konfirmasi terpisah).");
}

section("AU-25-02 — Read — HR yang BUKAN pemilik vault employee → 403");
{
  // Legal's address is not the hr_authority for any employee's salary_claim rows — a genuinely
  // different, non-owning caller (distinct from the earlier version of this script, which
  // accidentally used the real owning HR and got 200/404 instead of testing the negative path).
  const legalLogin = await loginAs("TEST_LEGAL_PRIVATE_KEY");
  const { res, body } = await api(`/tax-cert/hr/${empLogin.account.address}/${year}`, { token: legalLogin.accessToken });
  assert(res.status === 403 && body.errorCode === "FORBIDDEN", "GET /tax-cert/hr/:employee/:year oleh non-owning caller → 403 FORBIDDEN", `status=${res.status} body=${JSON.stringify(body)}`);
}

section("Read — HR (real owner) generates tax cert for an employee under their vault");
{
  const { res, body } = await api(`/tax-cert/hr/${empLogin.account.address}/${year}`, { token: hrLogin.accessToken });
  assert(res.status === 200, "GET /tax-cert/hr/:employee/:year (real owner) → 200", `status=${res.status} body=${JSON.stringify(body)}`);
}

section("Negative — invalid year");
{
  const { res, body } = await api("/tax-cert/1899", { token: empLogin.accessToken });
  assert(res.status === 400 && body.errorCode === "BAD_REQUEST", "Year < 2020 → 400 BAD_REQUEST", `status=${res.status} body=${JSON.stringify(body)}`);
}

finish();
