// Step 5: HR creates one bounty (quota=8, reward=Rp 1.000.000 each), employee-11..18 claim
// it, HR approves each claim, then HR sends a REAL on-chain IDRX transfer() to each employee
// (bounty payout is NOT funded from vaultBalance — see backend/src/routes/bounty.ts) and
// finally records the txHash via PATCH /claim/:id/paid.
import { clientsFromEnv, loginAs, api } from "./lib/common.mjs";
import { IDRX_ABI, IDRX_TOKEN_ADDRESS } from "./lib/contracts.mjs";
import { loadEmployees, publicClient, BOUNTY_RANGE, inRange } from "./lib/employees.mjs";

const REWARD = 1_000_000n * 10n ** 18n;

const { walletClient: hrWallet } = clientsFromEnv("TEST_HR_PRIVATE_KEY");
const employees = loadEmployees().filter((e) => inRange(e.index, BOUNTY_RANGE));
const pc = publicClient();

console.log("Logging in as HR...");
const hrLogin = await loginAs("TEST_HR_PRIVATE_KEY");
if (!hrLogin.ok) {
  console.error("HR login failed:", hrLogin.status, hrLogin.body);
  process.exit(1);
}

console.log("Creating bounty (quota=8, reward=Rp 1.000.000)...");
const { status: createStatus, body: bounty } = await api("/bounty", {
  method: "POST",
  token: hrLogin.accessToken,
  body: {
    title: "Simulasi 30 Karyawan — Bounty Test",
    description: "Bounty dibuat oleh script uji lifecycle 30 karyawan (PDHUPL).",
    rewardIdrx: REWARD.toString(),
    quota: 8,
  },
});
if (createStatus !== 200 || !bounty?.id) {
  console.error("Bounty creation failed:", createStatus, bounty);
  process.exit(1);
}
console.log(`  Bounty id: ${bounty.id}`);

for (const emp of employees) {
  console.log(`\n-- ${emp.label} --`);
  const empLogin = await loginAs(`PK${emp.index}`);
  if (!empLogin.ok) {
    console.log(`  ❌ login failed — ${empLogin.status}`, empLogin.body);
    continue;
  }
  const token = empLogin.accessToken;

  const { status: claimStatus, body: claimBody } = await api(`/bounty/${bounty.id}/claim`, {
    method: "POST",
    token,
    body: { proofUrl: `https://example.com/proof/${emp.label}.png` },
  });
  if (claimStatus !== 200 || !claimBody?.id) {
    console.log(`  ❌ claim submit failed — ${claimStatus}`, claimBody);
    continue;
  }
  console.log(`  ✅ claim submitted (claim id ${claimBody.id})`);

  const { status: approveStatus, body: approveBody } = await api(`/bounty/claim/${claimBody.id}/approve`, {
    method: "PATCH",
    token: hrLogin.accessToken,
  });
  if (approveStatus !== 200) {
    console.log(`  ❌ HR approve failed — ${approveStatus}`, approveBody);
    continue;
  }
  console.log(`  ✅ HR approved claim`);

  const hash = await hrWallet.writeContract({
    address: IDRX_TOKEN_ADDRESS,
    abi: IDRX_ABI,
    functionName: "transfer",
    args: [emp.account.address, REWARD],
  });
  await pc.waitForTransactionReceipt({ hash });
  console.log(`  ✅ on-chain IDRX transfer — tx ${hash}`);

  const { status: paidStatus, body: paidBody } = await api(`/bounty/claim/${claimBody.id}/paid`, {
    method: "PATCH",
    token: hrLogin.accessToken,
    body: { txHash: hash },
  });
  if (paidStatus !== 200) {
    console.log(`  ❌ record payout failed — ${paidStatus}`, paidBody);
    continue;
  }
  console.log(`  ✅ payout recorded as paid`);
}

console.log("\nDone.");
