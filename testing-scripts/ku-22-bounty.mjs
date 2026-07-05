// KU-22 Bounty — covers backend/src/routes/bounty.ts
// Endpoints: POST /bounty, GET /bounty/hr/:hrAddress, PATCH /bounty/:id/close,
//            POST /bounty/:id/claim, GET /bounty/:id/claims, GET /bounty/claims/me,
//            PATCH /bounty/claim/:id/approve|reject, PATCH /bounty/claim/:id/paid, POST /bounty/tip.
// No FR-PAYANA number in SKPL.md — code tags it FR-HR-BOUNTY/FR-EMP-BOUNTY informally.
//
// Precondition: TEST_EMPLOYEE_PRIVATE_KEY must be a real registered employee of TEST_HR's
// vault (isEmployeeOfHr check in backend/src/services/ponderDb.ts reads Ponder's
// employee_stream table) — otherwise the "employee views bounty board" check will 403 even
// though that's not a bug.
import { loginAs, api, assert, section, finish } from "./lib/common.mjs";

const hrLogin = await loginAs("TEST_HR_PRIVATE_KEY");
const empLogin = await loginAs("TEST_EMPLOYEE_PRIVATE_KEY");
if (!assert(hrLogin.ok && empLogin.ok, "Login preconditions")) finish();

let bountyId;
section("Create — HR creates a bounty");
{
  const { res, body } = await api("/bounty", {
    method: "POST",
    token: hrLogin.accessToken,
    body: { title: "Uji Otomatis PDHUPL", description: "Bounty untuk pengujian", rewardIdrx: "10000000000000000000", quota: 1 },
  });
  assert(res.status === 200 && body.id, "POST /bounty → returns created bounty", `status=${res.status} body=${JSON.stringify(body)}`);
  bountyId = body.id;
}

section("Read — employee views company bounty board");
{
  const { res, body } = await api(`/bounty/hr/${hrLogin.account.address}`, { token: empLogin.accessToken });
  assert(res.status === 200 && Array.isArray(body) && body.some((b) => b.id === bountyId), "GET /bounty/hr/:hrAddress (as employee member) includes the new bounty", `status=${res.status} body=${JSON.stringify(body)}`);
}

let claimId;
section("Claim — employee submits proof");
{
  const { res, body } = await api(`/bounty/${bountyId}/claim`, {
    method: "POST",
    token: empLogin.accessToken,
    body: { proofUrl: "https://example.com/proof.png" },
  });
  assert(res.status === 200 && body.id, "POST /bounty/:id/claim → returns created claim", `status=${res.status} body=${JSON.stringify(body)}`);
  claimId = body.id;
}

section("Read — HR reviews claims for this bounty");
{
  const { res, body } = await api(`/bounty/${bountyId}/claims`, { token: hrLogin.accessToken });
  assert(res.status === 200 && Array.isArray(body) && body.some((c) => c.id === claimId), "GET /bounty/:id/claims includes the submitted claim", `status=${res.status}`);
}

section("Approve — HR approves the bounty claim");
{
  const { res, body } = await api(`/bounty/claim/${claimId}/approve`, { method: "PATCH", token: hrLogin.accessToken });
  assert(res.status === 200 && body.status === "approved", "PATCH /bounty/claim/:id/approve → status:approved", `status=${res.status} body=${JSON.stringify(body)}`);
}

section("Negative — double-review the same claim");
{
  const { res, body } = await api(`/bounty/claim/${claimId}/reject`, { method: "PATCH", token: hrLogin.accessToken });
  assert(res.status === 409 && body.errorCode === "ALREADY_REVIEWED", "Re-reviewing an already-approved claim → 409 ALREADY_REVIEWED", `status=${res.status} body=${JSON.stringify(body)}`);
}

section("Negative — non-owner (employee) attempts to close the bounty");
{
  const { res } = await api(`/bounty/${bountyId}/close`, { method: "PATCH", token: empLogin.accessToken });
  assert(res.status === 403, "Non-owner close attempt → 403", `status=${res.status}`);
}

section("AU-22-02 — Claim setelah quota penuh");
{
  // NOTE: quota is enforced by auto-closing the bounty (status -> "closed") the moment
  // claimedCount reaches quota during approval — so a subsequent claim always hits the
  // BOUNTY_CLOSED check, never a distinct QUOTA_REACHED one. The dead QUOTA_REACHED branch
  // that used to exist in routes/bounty.ts was removed after this was confirmed unreachable.
  const { body: quotaBounty } = await api("/bounty", {
    method: "POST",
    token: hrLogin.accessToken,
    body: { title: "Uji AU-22-02", description: "Quota test", rewardIdrx: "10000000000000000000", quota: 1 },
  });
  const { body: quotaClaim } = await api(`/bounty/${quotaBounty.id}/claim`, { method: "POST", token: empLogin.accessToken, body: { proofUrl: "https://example.com/quota-proof.png" } });
  await api(`/bounty/claim/${quotaClaim.id}/approve`, { method: "PATCH", token: hrLogin.accessToken });

  const { res, body } = await api(`/bounty/${quotaBounty.id}/claim`, { method: "POST", token: empLogin.accessToken, body: { proofUrl: "https://example.com/quota-proof-2.png" } });
  assert(
    res.status === 409 && body.errorCode === "BOUNTY_CLOSED",
    "Claim after quota exhausted → 409 BOUNTY_CLOSED",
    `status=${res.status} body=${JSON.stringify(body)}`
  );
}

section("AU-22-04 — Kirim tip peer-to-peer");
{
  const { res, body } = await api("/bounty/tip", {
    method: "POST",
    token: hrLogin.accessToken,
    body: { toAddress: empLogin.account.address, amount: "5000000000000000000", message: "Uji AU-22-04", txHash: "0x" + "1".repeat(64) },
  });
  assert(res.status === 200 && body.id, "POST /bounty/tip → tercatat", `status=${res.status} body=${JSON.stringify(body)}`);

  const { res: senderRes, body: senderBody } = await api(`/bounty/tips/${hrLogin.account.address}`, { token: hrLogin.accessToken });
  assert(senderRes.status === 200 && Array.isArray(senderBody) && senderBody.some((t) => t.id === body.id), "Tip muncul di riwayat pengirim", `status=${senderRes.status}`);

  const { res: recvRes, body: recvBody } = await api(`/bounty/tips/${empLogin.account.address}`, { token: empLogin.accessToken });
  assert(recvRes.status === 200 && Array.isArray(recvBody) && recvBody.some((t) => t.id === body.id), "Tip muncul di riwayat penerima", `status=${recvRes.status}`);
}

finish();
