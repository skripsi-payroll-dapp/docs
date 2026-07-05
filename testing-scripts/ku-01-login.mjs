// KU-01 Login & Session — AU-01-01 s.d. AU-01-05
// Covers: backend/src/routes/auth.ts (POST /auth/login, /auth/refresh, /auth/logout)
// Message format verified against auth.ts: must contain "Timestamp: <unix_seconds>",
// replay window ±5 minutes (300s), enforced server-side (backend/src/routes/auth.ts:56-68).
//
// Preconditions:
//   TEST_HR_PRIVATE_KEY, TEST_OWNER_PRIVATE_KEY, TEST_EMPLOYEE_PRIVATE_KEY, TEST_LEGAL_PRIVATE_KEY
//   set in testing-scripts/.env (any 4 distinct funded-or-unfunded Base Sepolia keys; login
//   itself needs no ETH/role — role detection happens client-side in the real UI via useRole.ts,
//   not returned by /auth/login, so this script only proves the login gate itself).
//   TEST_SUSPENDED_HR_PRIVATE_KEY — a wallet you have ALREADY suspended (run ku-28 AU-28-01 first,
//   or suspend TEST_HR manually) — required for AU-01-05.
import { clientsFromEnv, login, api, assert, section, finish, loginMessage } from "./lib/common.mjs";

section("AU-01-01 — Login sukses per role");
for (const role of ["TEST_OWNER_PRIVATE_KEY", "TEST_HR_PRIVATE_KEY", "TEST_LEGAL_PRIVATE_KEY", "TEST_EMPLOYEE_PRIVATE_KEY"]) {
  try {
    const { account, walletClient } = clientsFromEnv(role);
    const { res, body } = await login(account, walletClient);
    assert(res.status === 200 && !!body.accessToken, `${role} → 200 + accessToken`, `status=${res.status} body=${JSON.stringify(body)}`);
  } catch (e) {
    assert(false, `${role} → login threw`, String(e));
  }
}

section("AU-01-02 — Signature invalid ditolak");
{
  const { account, walletClient } = clientsFromEnv("TEST_HR_PRIVATE_KEY");
  const message = loginMessage();
  // Sign a DIFFERENT message than the one submitted — signature will not recover to `account.address`.
  const badSignature = await walletClient.signMessage({ account, message: message + " tampered" });
  const res = await fetch(`${process.env.BACKEND_URL || "http://localhost:3001"}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: account.address, message, signature: badSignature }),
  });
  const body = await res.json().catch(() => ({}));
  assert(res.status === 401 && body.errorCode === "UNAUTHORIZED", "Signature mismatch → 401 UNAUTHORIZED", `status=${res.status} body=${JSON.stringify(body)}`);
}

section("AU-01-03 — Timestamp kedaluwarsa (>300 detik) ditolak");
{
  const { account, walletClient } = clientsFromEnv("TEST_HR_PRIVATE_KEY");
  const oldTs = Math.floor(Date.now() / 1000) - 400; // 400s in the past, past the ±300s window
  const message = `Sign in to Payana\nTimestamp: ${oldTs}`;
  const { res, body } = await login(account, walletClient, message);
  assert(res.status === 401 && body.errorCode === "UNAUTHORIZED", "Expired timestamp → 401 UNAUTHORIZED", `status=${res.status} body=${JSON.stringify(body)}`);
}

section("AU-01-04 — Refresh token setelah logout ditolak");
{
  const { account, walletClient } = clientsFromEnv("TEST_EMPLOYEE_PRIVATE_KEY");
  const { res, body } = await login(account, walletClient);
  if (!assert(res.status === 200, "Login precondition for AU-01-04")) {
    // fall through, subsequent checks will just fail informatively
  }
  const { accessToken, refreshToken } = body;
  const logoutRes = await api("/auth/logout", { method: "POST", token: accessToken });
  assert(logoutRes.status === 200, "Logout succeeds", `status=${logoutRes.status}`);
  const refreshRes = await api("/auth/refresh", { method: "POST", body: { refreshToken } });
  assert(refreshRes.status === 401, "Refresh with revoked session → 401", `status=${refreshRes.status} body=${JSON.stringify(refreshRes.body)}`);
}

section("AU-01-05 — Login saat HR disuspend ditolak (precondition: sudah disuspend, lihat ku-28)");
{
  const { account, walletClient } = clientsFromEnv("TEST_SUSPENDED_HR_PRIVATE_KEY");
  const { res, body } = await login(account, walletClient);
  assert(res.status === 403 && body.errorCode === "ACCOUNT_SUSPENDED", "Suspended HR login → 403 ACCOUNT_SUSPENDED", `status=${res.status} body=${JSON.stringify(body)}`);
}

finish();
