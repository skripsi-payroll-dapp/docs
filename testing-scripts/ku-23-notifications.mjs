// KU-23 Notifications — covers backend/src/routes/notifications.ts
// Endpoints: GET /notifications, PATCH /notifications/read-all, PATCH /notifications/:id/read.
// Tagged FR-PAYANA-N01/N02/N03 in code comments but these are NOT registered in SKPL.md.
//
// Self-contained: this script generates its own >50 notifications and its own foreign-user
// notification via real POST /reimburse + PATCH /reject cycles (reject fires createNotification
// to the claim's employeeAddress — see reimburse.ts) instead of depending on manually-seeded DB
// rows or a TEST_NOTIFICATION_FOREIGN_ID env var pointing at data that may not exist on re-run.
import { loginAs, api, assert, section, finish } from "./lib/common.mjs";

const empLogin = await loginAs("TEST_EMPLOYEE_PRIVATE_KEY");
const hrLogin = await loginAs("TEST_HR_PRIVATE_KEY");
const legalLogin = await loginAs("TEST_LEGAL_PRIVATE_KEY");
if (!assert(empLogin.ok && hrLogin.ok && legalLogin.ok, "Login preconditions")) finish();
const token = empLogin.accessToken;

async function submitAndRejectClaim(claimantLogin) {
  const { body: created } = await api("/reimburse", {
    method: "POST",
    token: claimantLogin.accessToken,
    body: { hrAddress: hrLogin.account.address, category: "Transport", amount: "1000000000000000000", description: "Uji notifikasi otomatis", receiptUrl: "https://example.com/r.jpg" },
  });
  const { res } = await api(`/reimburse/${created.id}/reject`, { method: "PATCH", token: hrLogin.accessToken });
  return res.status === 200;
}

section("Setup — hasilkan >50 notifikasi genuine untuk TEST_EMPLOYEE (via reject cycle nyata)");
{
  const { body: before } = await api("/notifications", { token });
  const need = Math.max(0, 55 - (Array.isArray(before) ? before.length : 0));
  let ok = 0;
  for (let i = 0; i < need; i++) {
    if (await submitAndRejectClaim(empLogin)) ok++;
  }
  assert(ok === need, `Berhasil membuat ${need} notifikasi baru (REIMBURSE_REJECTED) untuk melewati ambang 50`, `created=${ok}/${need}`);
}

let firstId;
section("AU-23-01 — Read — list own notifications (maks 50, terbaru dulu)");
{
  const { res, body } = await api("/notifications", { token });
  assert(res.status === 200 && Array.isArray(body), "GET /notifications → array", `status=${res.status}`);
  firstId = body[0]?.id;

  assert(body.length === 50, "Jumlah hasil dipotong tepat 50 walau data lebih banyak (dibuktikan barusan >50 ada)", `length=${body.length}`);
  const timestamps = body.map((n) => new Date(n.createdAt ?? n.created_at).getTime());
  const sortedDesc = timestamps.every((t, i) => i === 0 || timestamps[i - 1] >= t);
  assert(sortedDesc, "Urutan terbaru dulu (createdAt desc)", `timestamps=${JSON.stringify(timestamps)}`);
}

section("AU-23-02 — Read notifikasi lintas user → 403");
{
  // Generate a fresh foreign notification right now (recipient = TEST_LEGAL, not TEST_EMPLOYEE)
  // instead of relying on a pre-seeded id that may have been deleted/rotated since.
  const { body: legalNotifsBefore } = await api("/notifications", { token: legalLogin.accessToken });
  const before = new Set((legalNotifsBefore || []).map((n) => n.id));
  const created = await submitAndRejectClaim(legalLogin);
  const { body: legalNotifsAfter } = await api("/notifications", { token: legalLogin.accessToken });
  const foreignId = (legalNotifsAfter || []).find((n) => !before.has(n.id))?.id;

  if (assert(created && !!foreignId, "Setup — notifikasi baru untuk TEST_LEGAL berhasil dibuat")) {
    const { res, body } = await api(`/notifications/${foreignId}/read`, { method: "PATCH", token });
    assert(res.status === 403 && body.errorCode === "FORBIDDEN", "PATCH notifikasi milik user lain → 403 FORBIDDEN", `status=${res.status} body=${JSON.stringify(body)}`);
  }
}

section("Mark one as read");
if (firstId) {
  const { res, body } = await api(`/notifications/${firstId}/read`, { method: "PATCH", token });
  assert(res.status === 200 && body.read === true, "PATCH /notifications/:id/read → read:true", `status=${res.status} body=${JSON.stringify(body)}`);
} else {
  console.log("  ⚠️  SKIP — no notification id available");
}

section("Mark all as read");
{
  const { res, body } = await api("/notifications/read-all", { method: "PATCH", token });
  assert(res.status === 200 && body.ok === true, "PATCH /notifications/read-all → ok:true", `status=${res.status}`);
}

section("Negative — invalid notification id");
{
  const { res, body } = await api("/notifications/999999999/read", { method: "PATCH", token });
  assert(res.status === 404 && body.errorCode === "NOT_FOUND", "Non-existent id → 404 NOT_FOUND", `status=${res.status} body=${JSON.stringify(body)}`);
}

finish();
