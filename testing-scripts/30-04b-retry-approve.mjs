// Retries approveAdvance() for specific employee indices whose first attempt hit a lagging
// public RPC read-replica right after their requestAdvance() had just confirmed.
// Usage: node 30-04b-retry-approve.mjs 1 6 7
import { clientsFromEnv } from "./lib/common.mjs";
import { COMPANY_VAULT_ABI } from "./lib/contracts.mjs";
import { loadEmployees, loadVaultAddress, publicClient } from "./lib/employees.mjs";

const indices = process.argv.slice(2).map(Number);
const { walletClient: hrWallet } = clientsFromEnv("TEST_HR_PRIVATE_KEY");
const vaultAddress = loadVaultAddress();
const employees = loadEmployees().filter((e) => indices.includes(e.index));
const pc = publicClient();

for (const emp of employees) {
  try {
    const hash = await hrWallet.writeContract({
      address: vaultAddress,
      abi: COMPANY_VAULT_ABI,
      functionName: "approveAdvance",
      args: [emp.account.address],
    });
    await pc.waitForTransactionReceipt({ hash });
    console.log(`  ✅ ${emp.label} approveAdvance (HR) — tx ${hash}`);
  } catch (err) {
    console.log(`  ❌ ${emp.label} — ${err.shortMessage ?? err.message}`);
  }
}
