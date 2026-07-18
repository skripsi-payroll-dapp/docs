// One-off: grant employee-22 (PK22) a cliff vest bonus, on-chain, via TEST_HR_PRIVATE_KEY —
// same HR/vault as the earlier adhoc-reimburse-employee22.mjs demo claim. Contract rejects a
// past cliffTs (CliffInPast), so this sets it 90s in the future — enough to see the countdown
// UI briefly, then claim it.
import { clientsFromEnv } from "./lib/common.mjs";
import { loadVaultAddress, publicClient } from "./lib/employees.mjs";
import { COMPANY_VAULT_ABI } from "./lib/contracts.mjs";
import { privateKeyToAccount } from "viem/accounts";

const pk22 = process.env.PK22;
if (!pk22) { console.error("Missing PK22 in .env"); process.exit(1); }
const employeeAccount = privateKeyToAccount(pk22.startsWith("0x") ? pk22 : `0x${pk22}`);

const { walletClient: hrWallet } = clientsFromEnv("TEST_HR_PRIVATE_KEY");
const vaultAddress = loadVaultAddress();
const pc = publicClient();

const amountWei = 2_000_000n * 10n ** 18n; // 2,000,000 IDRX
const cliffTs = BigInt(Math.floor(Date.now() / 1000) + 90); // 90s in the future
const VEST_TYPE_RETENTION = 0;

console.log(`Vault: ${vaultAddress}`);
console.log(`Employee: ${employeeAccount.address}`);

const hash = await hrWallet.writeContract({
  address: vaultAddress,
  abi: COMPANY_VAULT_ABI,
  functionName: "createCliffVest",
  args: [employeeAccount.address, amountWei, cliffTs, VEST_TYPE_RETENTION],
});
await pc.waitForTransactionReceipt({ hash });
console.log(`createCliffVest tx: ${hash}`);
console.log("Done — will be claimable on employee/vesting in ~90 seconds.");
