// KU-27 Employee Directory — covers backend/src/routes/directory.ts
// Tagged FR-PAYANA-D01/D02/D03 in code but NOT registered in SKPL.md.
import { loginAs, api, assert, section, finish } from "./lib/common.mjs";

const empLogin = await loginAs("TEST_EMPLOYEE_PRIVATE_KEY");
const hrLogin = await loginAs("TEST_HR_PRIVATE_KEY");
if (!assert(empLogin.ok && hrLogin.ok, "Login preconditions")) finish();

section("Update — HR assigns department/position to an employee");
{
  const { res, body } = await api(`/directory/${empLogin.account.address}`, {
    method: "PATCH",
    token: hrLogin.accessToken,
    body: { department: "Engineering", position: "QA Tester" },
  });
  assert(res.status === 200 && body.department === "Engineering" && body.position === "QA Tester", "PATCH /directory/:address → persists department/position", `status=${res.status} body=${JSON.stringify(body)}`);
}

section("Read — employee views own directory entry");
{
  const { res, body } = await api("/directory/me", { token: empLogin.accessToken });
  assert(res.status === 200 && body.department === "Engineering", "GET /directory/me → reflects the update", `status=${res.status} body=${JSON.stringify(body)}`);
}

section("Read — HR lists full directory");
{
  const { res, body } = await api(`/directory/${hrLogin.account.address}`, { token: hrLogin.accessToken });
  assert(res.status === 200 && Array.isArray(body), "GET /directory/:hrAddress → array", `status=${res.status} body=${JSON.stringify(body)}`);
  if (Array.isArray(body) && body.length === 0) {
    console.log("  ⚠️  Empty directory — likely no Active employee_stream rows indexed under this HR yet; not necessarily a failure.");
  }
}

section("Negative — non-owner attempts to view another company's directory");
{
  const otherHr = process.env.TEST_HR2_ADDRESS;
  if (!otherHr) {
    console.log("  ⚠️  SKIP — set TEST_HR2_ADDRESS in .env to run this check");
  } else {
    const { res } = await api(`/directory/${otherHr}`, { token: hrLogin.accessToken });
    assert(res.status === 403, "Caller (HR) requesting a different hrAddress's directory → 403", `status=${res.status}`);
  }
}

finish();
