// KU-29 Company Settings — covers backend/src/routes/companySettings.ts (GET/PUT /company-settings)
// No FR-PAYANA number in SKPL.md at all (no code comment tag either).
// GAP: the route performs no input validation whatsoever (no required fields, no type/range
// checks on ewaLimitBps/yieldRateBps) — there is no genuine negative-path test to write here;
// this script only covers the happy-path upsert + read-back.
// Also note (unrelated to this script, flagged for the parent): the route file's own comments
// ("HR fetches its own branding/EWA/koperasi settings") still say "koperasi" — stale post-Gen8
// wording, harmless but worth a doc cleanup pass.
import { createWalletClient, http } from "viem";
import { loginAs, freshAccount, login, api, assert, section, finish, BASE_SEPOLIA, RPC_URL } from "./lib/common.mjs";

const hrLogin = await loginAs("TEST_HR_PRIVATE_KEY");
if (!assert(hrLogin.ok, "Login precondition")) finish();
const token = hrLogin.accessToken;

section("AU-29-01 — Settings kosong untuk HR yang belum pernah menyimpan (200 null)");
{
  const freshHr = freshAccount();
  const freshWallet = createWalletClient({ account: freshHr, chain: BASE_SEPOLIA, transport: http(RPC_URL) });
  const { res: loginRes, body: loginBody } = await login(freshHr, freshWallet);
  if (assert(loginRes.status === 200, "Login precondition — fresh wallet (never upserted settings)")) {
    const { res, body } = await api("/company-settings", { token: loginBody.accessToken });
    assert(res.status === 200 && body === null, "GET /company-settings (HR baru) → 200 null", `status=${res.status} body=${JSON.stringify(body)}`);
  }
}

section("Upsert — HR sets company settings");
{
  const { res, body } = await api("/company-settings", {
    method: "PUT",
    token,
    body: { name: "PT Uji Otomatis", country: "ID", logoUrl: "https://example.com/logo.png", ewaLimitBps: 8000, yieldRateBps: 150, legalAddress: hrLogin.account.address },
  });
  assert(res.status === 200 && body.name === "PT Uji Otomatis", "PUT /company-settings → persists submitted values", `status=${res.status} body=${JSON.stringify(body)}`);
}

section("Read — HR fetches its own settings");
{
  const { res, body } = await api("/company-settings", { token });
  assert(res.status === 200 && body?.name === "PT Uji Otomatis" && body?.ewaLimitBps === 8000, "GET /company-settings → matches what was upserted", `status=${res.status} body=${JSON.stringify(body)}`);
}

finish();
