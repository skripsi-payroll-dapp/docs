// KU-21 Reimburse — covers backend/src/routes/reimburse.ts
// Endpoints: POST /reimburse, GET /reimburse/me, GET /reimburse/hr/:hrAddress,
//            PATCH /reimburse/:id/approve (requires a REAL verified IDRX transfer txHash —
//            see verifyIdrxTransfer in backend/src/services/verifyTransfer.ts), PATCH /reject.
// This module has no FR-PAYANA number in SKPL.md — code tags it FR-EMP-RMB/FR-HR-RMB informally.
//
// Preconditions: TEST_EMPLOYEE_PRIVATE_KEY, TEST_HR_PRIVATE_KEY.
// Optional: TEST_REIMBURSE_APPROVE_TXHASH — a real on-chain IDRX transfer() tx hash from
// TEST_HR to the employee for the exact claimed amount, to exercise the approve happy path.
// Without it, the approve step is expected to correctly fail with TRANSFER_NOT_VERIFIED — that
// is itself a valid negative-path confirmation, not a script bug.
import { loginAs, api, assert, section, finish } from "./lib/common.mjs";

const empLogin = await loginAs("TEST_EMPLOYEE_PRIVATE_KEY");
const hrLogin = await loginAs("TEST_HR_PRIVATE_KEY");
if (!assert(empLogin.ok && hrLogin.ok, "Login preconditions")) finish();

let claimId;
section("AU-21-01 — Create — employee submits reimbursement claim (status pending)");
{
  const { res, body } = await api("/reimburse", {
    method: "POST",
    token: empLogin.accessToken,
    body: { hrAddress: hrLogin.account.address, category: "Transport", amount: "50000000000000000000", description: "Uji otomatis PDHUPL", receiptUrl: "https://example.com/receipt.jpg" },
  });
  assert(res.status === 200 && body.id && body.status === "pending", "POST /reimburse → returns created claim with id, status:pending", `status=${res.status} body=${JSON.stringify(body)}`);
  claimId = body.id;
}

section("Read — employee lists own claims");
{
  const { res, body } = await api("/reimburse/me", { token: empLogin.accessToken });
  assert(res.status === 200 && Array.isArray(body) && body.some((c) => c.id === claimId), "GET /reimburse/me includes the new claim", `status=${res.status}`);
}

section("Read — HR lists company claims");
{
  const { res, body } = await api(`/reimburse/hr/${hrLogin.account.address}`, { token: hrLogin.accessToken });
  assert(res.status === 200 && Array.isArray(body) && body.some((c) => c.id === claimId), "GET /reimburse/hr/:hrAddress includes the new claim", `status=${res.status}`);
}

section("Negative — non-owning HR tries to view another company's claims");
{
  const { res } = await api(`/reimburse/hr/${empLogin.account.address}`, { token: hrLogin.accessToken });
  assert(res.status === 403, "HR viewing a non-matching hrAddress → 403", `status=${res.status}`);
}

section("AU-21-03 — HR B mencoba approve klaim milik karyawan HR A → ditolak (endpoint approve yang sebenarnya)");
{
  // TEST_LEGAL stands in as an unrelated party (neither Owner nor this claim's hrAddress) and
  // hits the exact PATCH /reimburse/:id/approve endpoint a real approving HR would use — this
  // is the actual code path Bab 4 documents, not just a list-viewing check.
  const otherPartyLogin = await loginAs("TEST_LEGAL_PRIVATE_KEY");
  if (assert(otherPartyLogin.ok, "Login precondition for AU-21-03")) {
    const { res, body } = await api(`/reimburse/${claimId}/approve`, { method: "PATCH", token: otherPartyLogin.accessToken, body: { txHash: "0x" + "0".repeat(64) } });
    assert(res.status === 403 && body.errorCode === "FORBIDDEN", "HR lain approve klaim bukan miliknya → 403 FORBIDDEN", `status=${res.status} body=${JSON.stringify(body)}`);
  }
}

section("Approve — requires a verified on-chain IDRX transfer (optional, needs env)");
{
  const txHash = process.env.TEST_REIMBURSE_APPROVE_TXHASH;
  if (!txHash) {
    const { res, body } = await api(`/reimburse/${claimId}/approve`, { method: "PATCH", token: hrLogin.accessToken, body: { txHash: "0x" + "0".repeat(64) } });
    assert(res.status === 400 && body.errorCode === "TRANSFER_NOT_VERIFIED", "Approve with fake txHash → correctly rejected (TRANSFER_NOT_VERIFIED)", `status=${res.status} body=${JSON.stringify(body)}`);
    console.log("  ℹ️  Set TEST_REIMBURSE_APPROVE_TXHASH to a real matching transfer to test the happy path instead.");
  } else {
    const { res, body } = await api(`/reimburse/${claimId}/approve`, { method: "PATCH", token: hrLogin.accessToken, body: { txHash } });
    assert(res.status === 200 && body.status === "approved", "Approve with real txHash → status:approved", `status=${res.status} body=${JSON.stringify(body)}`);
  }
}

section("AU-21-04 — Approve klaim yang sudah direview → 409 ALREADY_REVIEWED");
{
  const { res: createRes, body: createBody } = await api("/reimburse", {
    method: "POST",
    token: empLogin.accessToken,
    body: { hrAddress: hrLogin.account.address, category: "Transport", amount: "10000000000000000000", description: "Uji AU-21-04", receiptUrl: "https://example.com/receipt2.jpg" },
  });
  assert(createRes.status === 200 && createBody.id, "Create second claim for AU-21-04 setup");
  const secondClaimId = createBody.id;

  const { res: rejectRes } = await api(`/reimburse/${secondClaimId}/reject`, { method: "PATCH", token: hrLogin.accessToken });
  assert(rejectRes.status === 200, "Reject claim (puts it into non-pending state)", `status=${rejectRes.status}`);

  const { res: reReviewRes, body: reReviewBody } = await api(`/reimburse/${secondClaimId}/approve`, { method: "PATCH", token: hrLogin.accessToken, body: { txHash: "0x" + "0".repeat(64) } });
  assert(reReviewRes.status === 409 && reReviewBody.errorCode === "ALREADY_REVIEWED", "Re-reviewing an already-rejected claim → 409 ALREADY_REVIEWED", `status=${reReviewRes.status} body=${JSON.stringify(reReviewBody)}`);
}

finish();
