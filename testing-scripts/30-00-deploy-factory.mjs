// Step 0 (one-time): the PayrollFactory already live on Base Sepolia
// (0xF62dF08b38c6Fbde33E24208BA044907475ca815) is STALE — its deployed bytecode (24535 bytes)
// does not match the current src/PayrollFactory.sol (compiles to 24142 bytes), confirmed via a
// forked Foundry trace: deployVault() on the live factory reverts instantly (~500 gas, no
// reason data — a selector/ABI mismatch signature), while the same call against a freshly
// deployed factory from current source succeeds end-to-end.
//
// This deploys a fresh PayrollFactory from the CURRENT source (out/PayrollFactory.sol/PayrollFactory.json,
// copied from finley-payroll/out/ — rebuild with `forge build` in finley-payroll/ if source changes),
// reusing the existing IDRX/EntryPoint addresses. The Owner wallet also holds DEFAULT_ADMIN_ROLE on
// the existing EmploymentSBT contract, so it can grant MINTER_ROLE to the new vault later
// (done in 30-01-setup-company.mjs) — no need to redeploy SBT.
import { readFileSync, writeFileSync } from "node:fs";
import { clientsFromEnv } from "./lib/common.mjs";
import { IDRX_TOKEN_ADDRESS } from "./lib/contracts.mjs";
import { publicClient } from "./lib/employees.mjs";

const ENTRY_POINT = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

const artifact = JSON.parse(readFileSync(new URL("./artifacts/PayrollFactory.json", import.meta.url), "utf8"));

const { account: owner, walletClient: ownerWallet } = clientsFromEnv("TEST_OWNER_PRIVATE_KEY");
const pc = publicClient();

console.log(`Owner (SUPERADMIN + protocolTreasury): ${owner.address}`);
console.log(`IDRX: ${IDRX_TOKEN_ADDRESS}`);
console.log(`EntryPoint: ${ENTRY_POINT}`);

console.log("\nDeploying fresh PayrollFactory...");
const hash = await ownerWallet.deployContract({
  abi: artifact.abi,
  bytecode: artifact.bytecode.object,
  args: [IDRX_TOKEN_ADDRESS, owner.address, owner.address, ENTRY_POINT],
});
const receipt = await pc.waitForTransactionReceipt({ hash });
console.log(`  tx: ${hash}`);
console.log(`  Factory deployed at: ${receipt.contractAddress}`);

writeFileSync(
  new URL("./factory-address.local.json", import.meta.url),
  JSON.stringify({ factoryAddress: receipt.contractAddress }, null, 2),
);
console.log("\nSaved to factory-address.local.json. Set PAYROLL_FACTORY_ADDRESS in .env to this value before running 30-01.");
