// Step 6: HR proposes termination for employee-19..21, Legal approves each, HR executes.
// proposeTermination() auto-sets hrApproved=true — only Legal's approveTermination() is
// needed before executeTermination() can succeed (see CompanyVault.sol validTermination).
import { clientsFromEnv } from "./lib/common.mjs";
import { COMPANY_VAULT_ABI } from "./lib/contracts.mjs";
import { loadEmployees, loadVaultAddress, publicClient, PHK_RANGE, inRange } from "./lib/employees.mjs";
import { keccak256, toHex } from "viem";

const { walletClient: hrWallet } = clientsFromEnv("TEST_HR_PRIVATE_KEY");
const { walletClient: legalWallet } = clientsFromEnv("TEST_LEGAL_PRIVATE_KEY");
const vaultAddress = loadVaultAddress();
const employees = loadEmployees().filter((e) => inRange(e.index, PHK_RANGE));
const pc = publicClient();

console.log(`Vault: ${vaultAddress}\nTerminating ${employees.length} employees (${PHK_RANGE[0]}-${PHK_RANGE[1]})\n`);

for (const emp of employees) {
  try {
    console.log(`-- ${emp.label} --`);
    const reasonHash = keccak256(toHex(`Restrukturisasi departemen — simulasi PDHUPL ${emp.label}`));

    let hash = await hrWallet.writeContract({
      address: vaultAddress,
      abi: COMPANY_VAULT_ABI,
      functionName: "proposeTermination",
      args: [emp.account.address, reasonHash],
    });
    await pc.waitForTransactionReceipt({ hash });
    console.log(`  ✅ proposeTermination (HR) — tx ${hash}`);

    hash = await legalWallet.writeContract({
      address: vaultAddress,
      abi: COMPANY_VAULT_ABI,
      functionName: "approveTermination",
      args: [emp.account.address],
    });
    await pc.waitForTransactionReceipt({ hash });
    console.log(`  ✅ approveTermination (Legal) — tx ${hash}`);

    // Public RPC read-replica lag: executeTermination's gas estimation can briefly still see
    // legalApproved=false right after approveTermination confirms, reverting with TerminationNotFound().
    await new Promise((r) => setTimeout(r, 3000));

    hash = await hrWallet.writeContract({
      address: vaultAddress,
      abi: COMPANY_VAULT_ABI,
      functionName: "executeTermination",
      args: [emp.account.address],
    });
    await pc.waitForTransactionReceipt({ hash });
    console.log(`  ✅ executeTermination (HR) — tx ${hash}`);
  } catch (err) {
    console.log(`  ❌ ${emp.label} — ${err.shortMessage ?? err.message}`);
  }
}

console.log("\nDone.");
