// One-off: submit a reimburse claim as employee-22 (PK22) — in the "22-30 stay normal" band
// per lib/employees.mjs, i.e. NOT one of the PHK'd employees (19-21). Uses TEST_HR_PRIVATE_KEY
// as the owning HR, same as the rest of the 30-employee simulation.
import { loginAs, api } from "./lib/common.mjs";

const emp = await loginAs("PK22");
const hr = await loginAs("TEST_HR_PRIVATE_KEY");

if (!emp.ok) { console.error("Employee login failed:", emp.status, emp.body); process.exit(1); }
if (!hr.ok) { console.error("HR login failed:", hr.status, hr.body); process.exit(1); }

console.log(`Employee: ${emp.account.address}`);
console.log(`HR:       ${hr.account.address}`);

const { res, body } = await api("/reimburse", {
  method: "POST",
  token: emp.accessToken,
  body: {
    hrAddress: hr.account.address,
    category: "Transportasi",
    amount: "75000000000000000000", // 75 IDRX
    description: "Taksi ke kantor klien — demo reimburse employee-22",
    receiptUrl: "https://example.com/receipt-employee22.jpg",
  },
});

console.log(`Status: ${res.status}`);
console.log(JSON.stringify(body, null, 2));
