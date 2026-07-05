// KU-24 Payslip — covers backend/src/routes/payslip.ts (GET /payslip/:claimId)
// Tagged FR-PAYANA-PS01 in code but NOT registered in SKPL.md.
// claimId format is `${txHash}-${logIndex}` as indexed by Ponder's salary_claim table.
//
// Self-contained: calls claimSalary() for real, right now, and derives claimId from the actual
// receipt logs — no longer depends on a manually-set TEST_PAYSLIP_CLAIM_ID pointing at a claim
// that may no longer exist. Precondition: TEST_EMPLOYEE_PRIVATE_KEY must be an EOA directly
// registered in employeeStreams under TEST_HR's vault (same requirement as ku-28-suspension.mjs)
// with a small amount of Base Sepolia ETH for gas, and getAccrued() > 0 at run time.
import { clientsFromEnv, loginAs, api, assert, section, finish } from "./lib/common.mjs";
import { keccak256, toHex } from "viem";
import { PAYROLL_FACTORY_ABI, COMPANY_VAULT_ABI, CONTRACTS } from "./lib/contracts.mjs";

const empLogin = await loginAs("TEST_EMPLOYEE_PRIVATE_KEY");
const hrLogin = await loginAs("TEST_HR_PRIVATE_KEY");
const legalLogin = await loginAs("TEST_LEGAL_PRIVATE_KEY"); // stand-in for an unrelated third party
if (!assert(empLogin.ok && hrLogin.ok, "Login precondition")) finish();

const SALARY_CLAIMED_TOPIC = keccak256(toHex("SalaryClaimed(address,address,uint256,uint256,uint256,uint256,uint256,uint256)"));

section("Setup — claimSalary() nyata sekarang, derive claimId dari receipt");
let claimId;
{
  const { account, walletClient, publicClient } = clientsFromEnv("TEST_EMPLOYEE_PRIVATE_KEY");
  const vaultAddress = await publicClient.readContract({
    address: CONTRACTS.PAYROLL_FACTORY,
    abi: PAYROLL_FACTORY_ABI,
    functionName: "companyVaults",
    args: [hrLogin.account.address],
  });
  const accrued = await publicClient.readContract({
    address: vaultAddress,
    abi: COMPANY_VAULT_ABI,
    functionName: "getAccrued",
    args: [account.address],
  });
  console.log(`  ℹ️  accrued saat ini: ${accrued.toString()} wei`);
  if (accrued === 0n) {
    console.log("  ⚠️  SKIP — accrued=0 saat ini, tidak bisa claimSalary(). Tunggu beberapa saat lalu jalankan ulang.");
  } else {
    const txHash = await walletClient.writeContract({ address: vaultAddress, abi: COMPANY_VAULT_ABI, functionName: "claimSalary", args: [] });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    const claimLog = receipt.logs.find((l) => l.address.toLowerCase() === vaultAddress.toLowerCase() && l.topics[0] === SALARY_CLAIMED_TOPIC);
    assert(receipt.status === "success" && !!claimLog, "claimSalary() sukses dan SalaryClaimed log ditemukan", `txHash=${txHash} status=${receipt.status} foundLog=${!!claimLog}`);
    if (claimLog) claimId = `${txHash}-${claimLog.logIndex}`;
  }
}

section("Read — employee views own payslip");
if (claimId) {
  // /payslip reads from Ponder-indexed salary_claim — poll briefly for indexing lag rather than
  // asserting immediately on a claim minted milliseconds ago.
  let res, body;
  for (let attempt = 0; attempt < 10; attempt++) {
    ({ res, body } = await api(`/payslip/${claimId}`, { token: empLogin.accessToken }));
    if (res.status === 200) break;
    await new Promise((r) => setTimeout(r, 2000));
  }
  assert(res.status === 200 && body.breakdown, "GET /payslip/:claimId → 200 with breakdown", `status=${res.status} body=${JSON.stringify(body)}`);
} else {
  console.log("  ⚠️  SKIP — claimSalary() tidak dieksekusi di atas (accrued=0)");
}

section("Negative — nonexistent claimId");
{
  const { res, body } = await api("/payslip/0xdeadbeef-999", { token: empLogin.accessToken });
  assert(res.status === 404 && body.errorCode === "NOT_FOUND", "Nonexistent claimId → 404 NOT_FOUND", `status=${res.status} body=${JSON.stringify(body)}`);
}

section("Negative — unrelated third party tries to view someone else's payslip");
if (claimId && legalLogin.ok) {
  const { res, body } = await api(`/payslip/${claimId}`, { token: legalLogin.accessToken });
  assert(res.status === 403 && body.errorCode === "FORBIDDEN", "Unrelated party → 403 FORBIDDEN", `status=${res.status} body=${JSON.stringify(body)}`);
  console.log("  ℹ️  Assumes TEST_LEGAL_PRIVATE_KEY's address is neither the claim's employee nor its HR — verify this precondition manually if it unexpectedly passes as 200.");
} else {
  console.log("  ⚠️  SKIP — claimSalary() tidak dieksekusi di atas, atau TEST_LEGAL_PRIVATE_KEY login gagal");
}

finish();
