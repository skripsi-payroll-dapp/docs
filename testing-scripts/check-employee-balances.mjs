// Checks Base Sepolia ETH balance for all 30 employee addresses derived from .env (PK1..PK30).
// Usage: node check-employee-balances.mjs

import "dotenv/config";
import { createPublicClient, http, formatEther, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const RPC_URL = process.env.RPC_URL || "https://sepolia.base.org";
const BASE_SEPOLIA = defineChain({
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  testnet: true,
});

function normalizePk(pk) {
  return pk.startsWith("0x") ? pk : `0x${pk}`;
}

function findPk(n) {
  return process.env[`PK${n}`] ?? process.env[`pk${n}`];
}

const publicClient = createPublicClient({ chain: BASE_SEPOLIA, transport: http(RPC_URL) });

const entries = [];
for (let i = 1; i <= 30; i++) {
  const pk = findPk(i);
  if (!pk) {
    console.error(`Missing PK${i} in .env — expected PK1..PK30.`);
    process.exit(1);
  }
  const account = privateKeyToAccount(normalizePk(pk));
  entries.push({ label: `employee-${String(i).padStart(2, "0")}`, address: account.address });
}

console.log(`\nChecking Base Sepolia ETH balance for 30 addresses (RPC: ${RPC_URL})...\n`);

let funded = 0;
let empty = 0;
for (const entry of entries) {
  const balance = await publicClient.getBalance({ address: entry.address });
  const eth = formatEther(balance);
  const ok = balance > 0n;
  if (ok) funded++; else empty++;
  console.log(`  ${entry.label.padEnd(14)} ${entry.address}   ${eth} ETH   ${ok ? "✅" : "❌ EMPTY"}`);
}

console.log(`\n${"=".repeat(50)}`);
console.log(`RESULT: ${funded}/30 funded, ${empty}/30 empty`);
console.log("=".repeat(50));
