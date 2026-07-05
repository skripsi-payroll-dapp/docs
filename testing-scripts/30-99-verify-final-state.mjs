// Final verification: reads on-chain state for all 30 employees + the vault, to confirm the
// full lifecycle simulation landed correctly (used for filling in PDHUPL Bab 5, not fabricated).
import { COMPANY_VAULT_ABI } from "./lib/contracts.mjs";
import { loadEmployees, loadVaultAddress, publicClient, KASBON_RANGE, BOUNTY_RANGE, PHK_RANGE, inRange } from "./lib/employees.mjs";

const STREAM_ABI = [
  {
    name: "employeeStreams",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [
      { name: "flowRate", type: "uint256" },
      { name: "startTs", type: "uint256" },
      { name: "lastWithdrawnTs", type: "uint256" },
      { name: "settledBalance", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "severanceBps", type: "uint16" },
    ],
  },
  {
    name: "salaryAdvances",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [
      { name: "amount", type: "uint256" },
      { name: "repaid", type: "uint256" },
      { name: "requestedAt", type: "uint256" },
      { name: "status", type: "uint8" },
    ],
  },
  {
    name: "vaultBalance",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
];

const STREAM_STATUS = ["Inactive", "Active", "Paused", "Cancelled"];
const ADVANCE_STATUS = ["None", "Pending", "Active", "Repaid"];

const vaultAddress = loadVaultAddress();
const employees = loadEmployees();
const pc = publicClient();

const vaultBalance = await pc.readContract({ address: vaultAddress, abi: STREAM_ABI, functionName: "vaultBalance" });
console.log(`Vault: ${vaultAddress}`);
console.log(`vaultBalance remaining: ${vaultBalance} wei (${vaultBalance / 10n ** 18n} IDRX)\n`);

let ok = 0, total = 0;
for (const emp of employees) {
  total++;
  const stream = await pc.readContract({ address: vaultAddress, abi: STREAM_ABI, functionName: "employeeStreams", args: [emp.account.address] });
  const status = STREAM_STATUS[stream[4]];

  let expected = "Active";
  let tags = [];
  if (inRange(emp.index, KASBON_RANGE)) tags.push("kasbon");
  if (inRange(emp.index, BOUNTY_RANGE)) tags.push("bounty");
  if (inRange(emp.index, PHK_RANGE)) { tags.push("PHK"); expected = "Cancelled"; }

  let advanceInfo = "";
  if (inRange(emp.index, KASBON_RANGE)) {
    const adv = await pc.readContract({ address: vaultAddress, abi: STREAM_ABI, functionName: "salaryAdvances", args: [emp.account.address] });
    advanceInfo = ` | advance status=${ADVANCE_STATUS[adv[3]]}`;
  }

  const pass = status === expected;
  if (pass) ok++;
  console.log(`  ${pass ? "✅" : "❌"} ${emp.label} [${tags.join(",") || "normal"}] — stream status=${status} (expected ${expected})${advanceInfo}`);
}

console.log(`\n${ok}/${total} employees in expected on-chain state.`);
