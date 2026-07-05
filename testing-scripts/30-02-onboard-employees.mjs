// Step 2: HR calls startStream() for all 30 dummy employees.
// flowRate = Rp 5.800.000/bulan (UMR Jakarta) -> 2237654320987654320 IDRX-wei/sec.
// severanceSplitBps = 200 (2%), matching the default used in frontend/src/app/hr/employees/page.tsx.
import { clientsFromEnv } from "./lib/common.mjs";
import { COMPANY_VAULT_ABI } from "./lib/contracts.mjs";
import { loadEmployees, loadVaultAddress, publicClient } from "./lib/employees.mjs";

const FLOW_RATE = 2237654320987654320n;
const SEVERANCE_BPS = 200;

const { walletClient: hrWallet } = clientsFromEnv("TEST_HR_PRIVATE_KEY");
const vaultAddress = loadVaultAddress();
const employees = loadEmployees();
const pc = publicClient();

console.log(`Vault: ${vaultAddress}`);
console.log(`Onboarding ${employees.length} employees, flowRate=${FLOW_RATE} wei/sec, severanceBps=${SEVERANCE_BPS}\n`);

for (const emp of employees) {
  try {
    const hash = await hrWallet.writeContract({
      address: vaultAddress,
      abi: COMPANY_VAULT_ABI,
      functionName: "startStream",
      args: [emp.account.address, FLOW_RATE, SEVERANCE_BPS],
    });
    await pc.waitForTransactionReceipt({ hash });
    console.log(`  ✅ ${emp.label} (${emp.account.address}) — tx ${hash}`);
  } catch (err) {
    console.log(`  ❌ ${emp.label} (${emp.account.address}) — ${err.shortMessage ?? err.message}`);
  }
}

console.log("\nDone.");
