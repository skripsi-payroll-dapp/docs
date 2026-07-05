// KU-06 (backend half of AU-06-03) — covers backend/src/routes/termination.ts
// (POST /termination/reason, GET /termination/reason/:employeeAddress).
// The on-chain half (reasonHash stored alongside proposeTermination()) is already Handal via
// Foundry — this script closes the previously-untested backend half: HR stores the plaintext
// PHK reason off-chain (on-chain only stores keccak256(reason)), Legal/HR/the employee
// themselves can read it back.
//
// Precondition: TEST_EMPLOYEE_PRIVATE_KEY must have an ACTIVE employee_stream under TEST_HR's
// vault (same requirement as ku-26-employment-letter.mjs) — getHrAuthorityForEmployee() reads
// this from Ponder.
import { createWalletClient, http } from "viem";
import { loginAs, freshAccount, login, api, assert, section, finish, BASE_SEPOLIA, RPC_URL } from "./lib/common.mjs";

const hrLogin = await loginAs("TEST_HR_PRIVATE_KEY");
const empLogin = await loginAs("TEST_EMPLOYEE_PRIVATE_KEY");
const legalLogin = await loginAs("TEST_LEGAL_PRIVATE_KEY");
if (!assert(hrLogin.ok && empLogin.ok && legalLogin.ok, "Login preconditions")) finish();

const reasonText = "Restrukturisasi departemen — uji otomatis AU-06-03 (backend half)";

section("AU-06-03 — HR menyimpan alasan PHK (plaintext, off-chain)");
{
  const { res, body } = await api("/termination/reason", {
    method: "POST",
    token: hrLogin.accessToken,
    body: { employeeAddress: empLogin.account.address, reason: reasonText },
  });
  assert(res.status === 200 && body.success === true, "POST /termination/reason → success:true", `status=${res.status} body=${JSON.stringify(body)}`);
}

section("AU-06-03 — HR membaca kembali alasan yang tersimpan");
{
  const { res, body } = await api(`/termination/reason/${empLogin.account.address}`, { token: hrLogin.accessToken });
  assert(res.status === 200 && body.reason === reasonText, "GET /termination/reason/:employeeAddress (sebagai HR) → reason cocok", `status=${res.status} body=${JSON.stringify(body)}`);
}

section("AU-06-03 — Karyawan yang bersangkutan membaca alasan PHK-nya sendiri");
{
  const { res, body } = await api(`/termination/reason/${empLogin.account.address}`, { token: empLogin.accessToken });
  assert(res.status === 200 && body.reason === reasonText, "GET /termination/reason/:employeeAddress (sebagai employee sendiri) → reason cocok", `status=${res.status} body=${JSON.stringify(body)}`);
}

section("AU-06-03 — Legal (LEGAL_ROLE on-chain) membaca alasan PHK yang sama");
{
  // [TEMUAN & DIPERBAIKI] canViewEmployeeData() sebelumnya HANYA mengecek caller === hrAuthority
  // — Legal (yang seharusnya diberi konteks sebelum approveTermination() independennya, sesuai
  // desain persetujuan dua pihak) selalu dapat 403. Diperbaiki di backend/src/services/authz.ts
  // dengan menambah pengecekan on-chain hasRole(LEGAL_ROLE, caller) pada CompanyVault terkait.
  const { res, body } = await api(`/termination/reason/${empLogin.account.address}`, { token: legalLogin.accessToken });
  assert(res.status === 200 && body.reason === reasonText, "GET /termination/reason/:employeeAddress (sebagai Legal) → reason cocok", `status=${res.status} body=${JSON.stringify(body)}`);
}

section("Negative — pihak tidak berwenang mencoba membaca alasan PHK → 403");
{
  const strangerAccount = freshAccount();
  const strangerWallet = createWalletClient({ account: strangerAccount, chain: BASE_SEPOLIA, transport: http(RPC_URL) });
  const { res: loginRes, body: loginBody } = await login(strangerAccount, strangerWallet);
  if (assert(loginRes.status === 200, "Login precondition — fresh unrelated wallet")) {
    const { res, body } = await api(`/termination/reason/${empLogin.account.address}`, { token: loginBody.accessToken });
    assert(res.status === 403 && body.errorCode === "FORBIDDEN", "Pihak tidak terkait → 403 FORBIDDEN", `status=${res.status} body=${JSON.stringify(body)}`);
  }
}

section("Negative — non-HR (employee) mencoba menyimpan alasan PHK → 403");
{
  const { res, body } = await api("/termination/reason", {
    method: "POST",
    token: empLogin.accessToken,
    body: { employeeAddress: empLogin.account.address, reason: "Percobaan tidak sah" },
  });
  assert(res.status === 403 && body.errorCode === "FORBIDDEN", "Non-HR mencoba POST reason → 403 FORBIDDEN", `status=${res.status} body=${JSON.stringify(body)}`);
}

finish();
