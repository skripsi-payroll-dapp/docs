// Step 1 of the 30-employee full-lifecycle simulation.
// HR: mints its own testnet IDRX, deploys a fresh CompanyVault, grants LEGAL_ROLE to the
// Legal wallet, and funds the vault to the agreed target (Rp 1.000.000.000).
//
// Run once. Safe to re-run only if deployVault() has not succeeded yet (HRAlreadyHasVault
// reverts on a second deploy for the same HR address).
import { keccak256, toHex } from "viem";
import { clientsFromEnv, RPC_URL } from "./lib/common.mjs";
import {
  CONTRACTS,
  PAYROLL_FACTORY_ABI,
  IDRX_ABI,
  IDRX_TOKEN_ADDRESS,
  SBT_CONTRACT_ADDRESS,
  COMPANY_VAULT_ABI,
  LEGAL_ROLE,
} from "./lib/contracts.mjs";
import { saveVaultAddress, publicClient } from "./lib/employees.mjs";
import { accountFromEnv } from "./lib/common.mjs";

const MINTER_ROLE = keccak256(toHex("MINTER_ROLE"));
const SBT_GRANT_ROLE_ABI = [
  { name: "grantRole", type: "function", stateMutability: "nonpayable", inputs: [{ name: "role", type: "bytes32" }, { name: "account", type: "address" }], outputs: [] },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VAULT_BALANCE = 1_000_000_000n * 10n ** 18n; // Rp 1.000.000.000
const BOUNTY_BUDGET = 8n * 1_000_000n * 10n ** 18n; // 8 payouts x Rp 1.000.000 (HR's personal balance, not vaultBalance)
const MINT_TOTAL = VAULT_BALANCE + BOUNTY_BUDGET;

const { account: hr, walletClient: hrWallet } = clientsFromEnv("TEST_HR_PRIVATE_KEY");
const { walletClient: ownerWallet } = clientsFromEnv("TEST_OWNER_PRIVATE_KEY");
const legal = accountFromEnv("TEST_LEGAL_PRIVATE_KEY");
const pc = publicClient();

console.log(`HR address: ${hr.address}`);
console.log(`Legal address: ${legal.address}`);

console.log(`\n1) Minting ${MINT_TOTAL / 10n ** 18n} IDRX to HR (vaultBalance target + bounty budget)...`);
let hash = await hrWallet.writeContract({
  address: IDRX_TOKEN_ADDRESS,
  abi: IDRX_ABI,
  functionName: "mint",
  args: [hr.address, MINT_TOTAL],
});
await pc.waitForTransactionReceipt({ hash });
console.log(`   tx: ${hash}`);

console.log(`\n2) Deploying CompanyVault via PayrollFactory.deployVault()...`);
hash = await hrWallet.writeContract({
  address: CONTRACTS.PAYROLL_FACTORY,
  abi: PAYROLL_FACTORY_ABI,
  functionName: "deployVault",
  args: [hr.address, "Payana Dummy Co (30-Employee Sim)", SBT_CONTRACT_ADDRESS],
});
await pc.waitForTransactionReceipt({ hash });
console.log(`   tx: ${hash}`);

// Public RPC read-replicas can lag briefly behind a just-confirmed tx; retry instead of
// trusting a single (possibly stale) read.
let vaultAddress = "0x0000000000000000000000000000000000000000";
for (let attempt = 0; attempt < 5 && vaultAddress === "0x0000000000000000000000000000000000000000"; attempt++) {
  if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
  vaultAddress = await pc.readContract({
    address: CONTRACTS.PAYROLL_FACTORY,
    abi: PAYROLL_FACTORY_ABI,
    functionName: "companyVaults",
    args: [hr.address],
  });
}
if (vaultAddress === "0x0000000000000000000000000000000000000000") {
  console.error("   companyVaults(HR) still 0x0 after retries — deployVault may genuinely have failed.");
  process.exit(1);
}
console.log(`   CompanyVault deployed at: ${vaultAddress}`);
saveVaultAddress(vaultAddress);

console.log(`\n3) Granting LEGAL_ROLE to Legal wallet on the new vault...`);
hash = await hrWallet.writeContract({
  address: vaultAddress,
  abi: COMPANY_VAULT_ABI,
  functionName: "grantRole",
  args: [LEGAL_ROLE, legal.address],
});
await pc.waitForTransactionReceipt({ hash });
console.log(`   tx: ${hash}`);

console.log(`\n4) Approving vault to pull ${VAULT_BALANCE / 10n ** 18n} IDRX...`);
hash = await hrWallet.writeContract({
  address: IDRX_TOKEN_ADDRESS,
  abi: IDRX_ABI,
  functionName: "approve",
  args: [vaultAddress, VAULT_BALANCE],
});
await pc.waitForTransactionReceipt({ hash });
console.log(`   tx: ${hash}`);

// Public RPC read-replica lag can make the very next call's gas estimation see a stale
// (pre-approve) allowance — a short pause avoids a spurious ERC20InsufficientAllowance revert.
await sleep(3000);

console.log(`\n5) Funding vault (fundVault)...`);
hash = await hrWallet.writeContract({
  address: vaultAddress,
  abi: COMPANY_VAULT_ABI,
  functionName: "fundVault",
  args: [VAULT_BALANCE],
});
await pc.waitForTransactionReceipt({ hash });
console.log(`   tx: ${hash}`);

console.log(`\n6) Owner grants MINTER_ROLE on EmploymentSBT to the new vault (so startStream's SBT mint succeeds)...`);
hash = await ownerWallet.writeContract({
  address: SBT_CONTRACT_ADDRESS,
  abi: SBT_GRANT_ROLE_ABI,
  functionName: "grantRole",
  args: [MINTER_ROLE, vaultAddress],
});
await pc.waitForTransactionReceipt({ hash });
console.log(`   tx: ${hash}`);

console.log(`\nDone. Vault: ${vaultAddress}`);
console.log(`RPC used: ${RPC_URL}`);
