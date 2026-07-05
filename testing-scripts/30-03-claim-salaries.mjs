// Step 3: each of the 30 employees calls claimSalary() directly (paying their own gas —
// no Paymaster/Privy involved, per the agreed testing approach). Waits for accrued > 0
// (elapsed seconds since startStream) before claiming; skips (not fails) if still 0.
import { COMPANY_VAULT_ABI } from "./lib/contracts.mjs";
import { loadEmployees, loadVaultAddress, publicClient } from "./lib/employees.mjs";

const vaultAddress = loadVaultAddress();
const employees = loadEmployees();
const pc = publicClient();

console.log(`Vault: ${vaultAddress}\nClaiming salary for ${employees.length} employees...\n`);

for (const emp of employees) {
  const accrued = await pc.readContract({
    address: vaultAddress,
    abi: COMPANY_VAULT_ABI,
    functionName: "getAccrued",
    args: [emp.account.address],
  });

  if (accrued === 0n) {
    console.log(`  ⏭️  ${emp.label} — accrued still 0, skipped (re-run later)`);
    continue;
  }

  try {
    const hash = await emp.walletClient.writeContract({
      address: vaultAddress,
      abi: COMPANY_VAULT_ABI,
      functionName: "claimSalary",
      args: [],
    });
    await pc.waitForTransactionReceipt({ hash });
    console.log(`  ✅ ${emp.label} — accrued ${accrued} wei claimed — tx ${hash}`);
  } catch (err) {
    console.log(`  ❌ ${emp.label} — ${err.shortMessage ?? err.message}`);
  }
}

console.log("\nDone.");
