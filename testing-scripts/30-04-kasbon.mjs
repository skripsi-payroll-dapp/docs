// Step 4: employee-01..10 request a kasbon (salary advance), HR approves each.
// Amount = Rp 1.000.000 — well under the 80% (MAX_ADVANCE_BPS) monthly-gross cap for a
// Rp 5.800.000/month stream (cap ≈ Rp 4.640.000).
import { clientsFromEnv } from "./lib/common.mjs";
import { COMPANY_VAULT_ABI } from "./lib/contracts.mjs";
import { loadEmployees, loadVaultAddress, publicClient, KASBON_RANGE, inRange } from "./lib/employees.mjs";

const ADVANCE_AMOUNT = 1_000_000n * 10n ** 18n;

const { walletClient: hrWallet } = clientsFromEnv("TEST_HR_PRIVATE_KEY");
const vaultAddress = loadVaultAddress();
const employees = loadEmployees().filter((e) => inRange(e.index, KASBON_RANGE));
const pc = publicClient();

console.log(`Vault: ${vaultAddress}\nKasbon for ${employees.length} employees (${KASBON_RANGE[0]}-${KASBON_RANGE[1]}), amount=Rp 1.000.000 each\n`);

for (const emp of employees) {
  try {
    console.log(`-- ${emp.label} --`);
    let hash = await emp.walletClient.writeContract({
      address: vaultAddress,
      abi: COMPANY_VAULT_ABI,
      functionName: "requestAdvance",
      args: [ADVANCE_AMOUNT],
    });
    await pc.waitForTransactionReceipt({ hash });
    console.log(`  ✅ requestAdvance — tx ${hash}`);

    // Public RPC read-replica lag: the very next call's gas estimation can briefly still see
    // pre-requestAdvance state and revert with NoAdvancePending() otherwise.
    await new Promise((r) => setTimeout(r, 3000));

    hash = await hrWallet.writeContract({
      address: vaultAddress,
      abi: COMPANY_VAULT_ABI,
      functionName: "approveAdvance",
      args: [emp.account.address],
    });
    await pc.waitForTransactionReceipt({ hash });
    console.log(`  ✅ approveAdvance (HR) — tx ${hash}`);
  } catch (err) {
    console.log(`  ❌ ${emp.label} — ${err.shortMessage ?? err.message}`);
  }
}

console.log("\nDone.");
