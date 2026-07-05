// KU-26 Employment Letter (Surat Keterangan Kerja) — covers backend/src/routes/employmentLetter.ts
// Tagged FR-PAYANA-EL01/EL02/EL03 in code but NOT registered in SKPL.md.
//
// Precondition: TEST_EMPLOYEE_PRIVATE_KEY must have an ACTIVE employee_stream (Ponder-indexed)
// under TEST_HR's vault — the request endpoint checks this explicitly and 400s otherwise
// (code: "No active employment stream found under this HR").
import { createWalletClient, http } from "viem";
import { loginAs, freshAccount, login, api, assert, section, finish, BASE_SEPOLIA, RPC_URL } from "./lib/common.mjs";

const empLogin = await loginAs("TEST_EMPLOYEE_PRIVATE_KEY");
const hrLogin = await loginAs("TEST_HR_PRIVATE_KEY");
if (!assert(empLogin.ok && hrLogin.ok, "Login preconditions")) finish();

section("Negative — invalid purpose value");
{
  const { res, body } = await api("/employment-letter/request", {
    method: "POST",
    token: empLogin.accessToken,
    body: { hrAddress: hrLogin.account.address, purpose: "Alasan Tidak Valid" },
  });
  assert(res.status === 400 && body.errorCode === "BAD_REQUEST", "Invalid purpose enum → 400 BAD_REQUEST", `status=${res.status} body=${JSON.stringify(body)}`);
}

let letterId;
section("Create — employee requests a letter (requires active stream under this HR)");
{
  const { res, body } = await api("/employment-letter/request", {
    method: "POST",
    token: empLogin.accessToken,
    body: { hrAddress: hrLogin.account.address, purpose: "KPR" },
  });
  assert(res.status === 201 && body.id, "POST /employment-letter/request → 201 with id", `status=${res.status} body=${JSON.stringify(body)}`);
  letterId = body.id;
  if (!letterId) console.log("  ⚠️  If this returned 400 NOT_EMPLOYEE, TEST_EMPLOYEE_PRIVATE_KEY's address has no Active employee_stream under TEST_HR in Ponder — set that up first.");
}

section("AU-26-03 — Employee tanpa stream aktif di HR ini → 400 NOT_EMPLOYEE");
{
  const strangerAccount = freshAccount();
  const strangerWallet = createWalletClient({ account: strangerAccount, chain: BASE_SEPOLIA, transport: http(RPC_URL) });
  const { res: loginRes, body: loginBody } = await login(strangerAccount, strangerWallet);
  if (assert(loginRes.status === 200, "Login precondition — fresh wallet (never onboarded)")) {
    const { res, body } = await api("/employment-letter/request", {
      method: "POST",
      token: loginBody.accessToken,
      body: { hrAddress: hrLogin.account.address, purpose: "KPR" },
    });
    assert(res.status === 400 && body.errorCode === "NOT_EMPLOYEE", "Wallet tanpa stream aktif → 400 NOT_EMPLOYEE", `status=${res.status} body=${JSON.stringify(body)}`);
  }
}

section("AU-26-04 — Dokumen diakses sebelum di-approve → 400 NOT_APPROVED");
{
  const { res: createRes, body: createBody } = await api("/employment-letter/request", {
    method: "POST",
    token: empLogin.accessToken,
    body: { hrAddress: hrLogin.account.address, purpose: "Umum" },
  });
  if (assert(createRes.status === 201 && createBody.id, "Create second (still-pending) letter for AU-26-04 setup")) {
    const { res, body } = await api(`/employment-letter/${createBody.id}/document`, { token: empLogin.accessToken });
    assert(res.status === 400 && body.errorCode === "NOT_APPROVED", "GET document sebelum approved → 400 NOT_APPROVED", `status=${res.status} body=${JSON.stringify(body)}`);
  }
}

section("Read — employee sees own requests");
{
  const { res, body } = await api("/employment-letter/me", { token: empLogin.accessToken });
  assert(res.status === 200 && Array.isArray(body), "GET /employment-letter/me → array", `status=${res.status}`);
}

section("Read — HR sees company requests");
{
  const { res, body } = await api("/employment-letter/hr", { token: hrLogin.accessToken });
  assert(res.status === 200 && Array.isArray(body) && (!letterId || body.some((l) => l.id === letterId)), "GET /employment-letter/hr includes the new request", `status=${res.status}`);
}

section("Approve — HR approves the request");
if (letterId) {
  const { res, body } = await api(`/employment-letter/${letterId}/approve`, { method: "PATCH", token: hrLogin.accessToken, body: { notes: "disetujui via uji otomatis" } });
  assert(res.status === 200 && body.status === "approved", "PATCH /employment-letter/:id/approve → status:approved", `status=${res.status} body=${JSON.stringify(body)}`);
} else {
  console.log("  ⚠️  SKIP — no letterId from the create step");
}

section("Document — generate letter document once approved");
if (letterId) {
  const { res, body } = await api(`/employment-letter/${letterId}/document`, { token: empLogin.accessToken });
  assert(res.status === 200 && body.companyName, "GET /employment-letter/:id/document → 200 with companyName", `status=${res.status} body=${JSON.stringify(body)}`);
} else {
  console.log("  ⚠️  SKIP — no letterId from the create step");
}

finish();
