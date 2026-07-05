// KU-13 Compliance — AU-13-01 s.d. AU-13-04
// Covers: backend/src/routes/compliance.ts
// Preconditions: TEST_HR_PRIVATE_KEY (must have a deployed CompanyVault with at least one
// claimSalary already indexed by Ponder for AU-13-01 to return non-empty data — the assertion
// only checks the endpoint responds correctly, not that totals are non-zero).
// TEST_HR2_ADDRESS — just an address string (no private key needed) of a DIFFERENT HR, used
// only as the target of the cross-HR forbidden check in AU-13-03.
import { loginAs, api, assert, section, finish } from "./lib/common.mjs";

const hrLogin = await loginAs("TEST_HR_PRIVATE_KEY");
if (!assert(hrLogin.ok, "Login precondition for all KU-13 checks")) finish();
const hr = hrLogin.account.address;
const token = hrLogin.accessToken;
const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

section("AU-13-01 — GET /compliance/summary/:hr (bulan berjalan)");
{
  const { res, body } = await api(`/compliance/summary/${hr}?month=${thisMonth}`, { token });
  assert(res.status === 200 && body.hrAddress?.toLowerCase() === hr.toLowerCase(), "Summary 200 + hrAddress cocok", `status=${res.status} body=${JSON.stringify(body)}`);

  // Cross-check the top-level aggregate against the SAME response's per-employee `rows`
  // breakdown (both computed from the identical salary_claim query in compliance.ts) — this
  // catches the aggregate SQL and the per-row SQL silently drifting apart, without needing raw
  // DB access from the test script itself.
  if (Array.isArray(body.rows)) {
    const sumAccrued = body.rows.reduce((acc, r) => acc + BigInt(r.total_accrued ?? 0), 0n);
    const sumCompliance = body.rows.reduce((acc, r) => acc + BigInt(r.total_compliance ?? 0), 0n);
    const sumSeverance = body.rows.reduce((acc, r) => acc + BigInt(r.total_severance ?? 0), 0n);
    assert(
      sumAccrued === BigInt(body.totalAccrued ?? 0) &&
      sumCompliance === BigInt(body.totalCompliance ?? 0) &&
      sumSeverance === BigInt(body.totalSeverance ?? 0) &&
      body.rows.length === Number(body.employeeCount ?? -1),
      "Agregat (totalAccrued/totalCompliance/totalSeverance/employeeCount) EXACT match dengan SUM per-employee rows",
      `agg={${body.totalAccrued},${body.totalCompliance},${body.totalSeverance},${body.employeeCount}} sumRows={${sumAccrued},${sumCompliance},${sumSeverance},${body.rows.length}}`
    );
  }
}

section("AU-13-02 — Export bulan tanpa transaksi → 404 informatif");
{
  const { res, body } = await api(`/compliance/export/${hr}?month=2099-01`, { token });
  assert(res.status === 404 && body.errorCode === "NOT_FOUND", "Export empty period → 404 NOT_FOUND", `status=${res.status} body=${JSON.stringify(body)}`);
}

section("AU-13-03 — Export lintas HR ditolak");
{
  const otherHr = process.env.TEST_HR2_ADDRESS;
  if (!otherHr) {
    console.log("  ⚠️  SKIP — set TEST_HR2_ADDRESS in .env to run this check");
  } else {
    const { res, body } = await api(`/compliance/export/${otherHr.toLowerCase()}?month=${thisMonth}`, { token });
    assert(res.status === 403 && body.errorCode === "FORBIDDEN", "Cross-HR export → 403 FORBIDDEN", `status=${res.status} body=${JSON.stringify(body)}`);
  }
}

section("AU-13-04 — Rekonsiliasi submit lalu baca kembali");
{
  const postRes = await api(`/compliance/reconciliation/${hr}`, {
    method: "POST",
    token,
    body: { month: thisMonth, bpjsPaid: "1000000000000000000", pph21Paid: "2000000000000000000", notes: "uji otomatis" },
  });
  assert(postRes.res.status === 200 && postRes.body.ok === true, "POST reconciliation → ok:true", `status=${postRes.res.status} body=${JSON.stringify(postRes.body)}`);

  const getRes = await api(`/compliance/reconciliation/${hr}?month=${thisMonth}`, { token });
  assert(
    getRes.res.status === 200 && getRes.body?.bpjsPaid === "1000000000000000000" && getRes.body?.pph21Paid === "2000000000000000000",
    "GET reconciliation → nilai yang baru disimpan cocok",
    `status=${getRes.res.status} body=${JSON.stringify(getRes.body)}`
  );
}

finish();
