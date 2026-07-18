// Anomaly detector validation — simulates a compromised HR wallet on real Base Sepolia testnet
// (TEST_HR_PRIVATE_KEY, an already-registered HR with real HR_ROLE on the demo vault), not a
// mock/unit test. Two real on-chain actions an attacker who stole the HR key would plausibly
// take:
//   1. Drain a chunk of vaultBalance to a fresh, never-before-seen address (fund theft).
//   2. Grant HR_ROLE to a second fresh address (persistence — a backdoor that survives the
//      original key being rotated/revoked).
// Run, then check backend/src/services/anomalyDetector.ts's next cron tick (every 2 min) picks
// both up as SUSPICIOUS_WITHDRAWAL and UNEXPECTED_ROLE_GRANT in app.anomaly_alerts.
import { clientsFromEnv, freshAccount } from "./lib/common.mjs";
import { COMPANY_VAULT_ABI, HR_ROLE } from "./lib/contracts.mjs";
import { loadVaultAddress, publicClient } from "./lib/employees.mjs";

const { walletClient: hrWallet, account: hrAccount } = clientsFromEnv("TEST_HR_PRIVATE_KEY");
const vaultAddress = loadVaultAddress();
const pc = publicClient();

const drainRecipient = freshAccount();
const persistenceAccount = freshAccount();

console.log("=== Attacker Simulation (compromised HR key) ===");
console.log(`Vault:                ${vaultAddress}`);
console.log(`"Compromised" HR:     ${hrAccount.address}`);
console.log(`Drain recipient:      ${drainRecipient.address}  (fresh, never seen before)`);
console.log(`Persistence account:  ${persistenceAccount.address}  (fresh, never seen before)`);
console.log("");

const balanceBefore = await pc.readContract({
  address: vaultAddress,
  abi: COMPANY_VAULT_ABI,
  functionName: "vaultBalance",
});
console.log(`vaultBalance before: ${(Number(balanceBefore) / 1e18).toLocaleString("id-ID")} IDRX\n`);

// ── Action 1: drain funds to a never-before-seen recipient ──────────────────────
const drainAmount = 5_000_000n * 10n ** 18n; // 5,000,000 IDRX
console.log(`-- Action 1: withdrawVault(${(Number(drainAmount) / 1e18).toLocaleString("id-ID")} IDRX, ${drainRecipient.address}) --`);
try {
  const hash1 = await hrWallet.writeContract({
    address: vaultAddress,
    abi: COMPANY_VAULT_ABI,
    functionName: "withdrawVault",
    args: [drainAmount, drainRecipient.address],
  });
  console.log(`  tx sent: ${hash1}`);
  const receipt1 = await pc.waitForTransactionReceipt({ hash: hash1 });
  console.log(`  ✅ confirmed in block ${receipt1.blockNumber} (status: ${receipt1.status})`);
} catch (err) {
  console.error("  ❌ withdrawVault failed:", err.shortMessage ?? err.message);
}

console.log("");

// ── Action 2: grant HR_ROLE to a second fresh address (persistence/backdoor) ────
console.log(`-- Action 2: grantRole(HR_ROLE, ${persistenceAccount.address}) --`);
try {
  const hash2 = await hrWallet.writeContract({
    address: vaultAddress,
    abi: COMPANY_VAULT_ABI,
    functionName: "grantRole",
    args: [HR_ROLE, persistenceAccount.address],
  });
  console.log(`  tx sent: ${hash2}`);
  const receipt2 = await pc.waitForTransactionReceipt({ hash: hash2 });
  console.log(`  ✅ confirmed in block ${receipt2.blockNumber} (status: ${receipt2.status})`);
} catch (err) {
  console.error("  ❌ grantRole failed:", err.shortMessage ?? err.message);
}

console.log("\n=== Done ===");
console.log("Wait for Ponder to index (few seconds) + anomalyDetector's next cron tick (up to 2");
console.log("minutes), then check GET /security/alerts (Owner token) or query app.anomaly_alerts");
console.log("directly for SUSPICIOUS_WITHDRAWAL and UNEXPECTED_ROLE_GRANT rows referencing:");
console.log(`  recipient/account = ${drainRecipient.address} / ${persistenceAccount.address}`);
