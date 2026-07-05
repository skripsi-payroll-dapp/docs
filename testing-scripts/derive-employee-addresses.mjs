// Derives the 30 employee addresses from testing-scripts/.env (PK1..PK30, never printed: values).
// Run this FIRST after filling in .env, so you know which addresses need ETH funding
// before running the onboarding/lifecycle scripts.
//
// Usage:
//   # .env already has PK1= PK2= ... PK30= filled with 30 testnet private keys
//   node derive-employee-addresses.mjs

import "dotenv/config";
import { privateKeyToAccount } from "viem/accounts";

function normalizePk(pk) {
  return pk.startsWith("0x") ? pk : `0x${pk}`;
}

function findPk(n) {
  // Accept either PK1 or pk1 casing.
  return process.env[`PK${n}`] ?? process.env[`pk${n}`];
}

const entries = [];
for (let i = 1; i <= 30; i++) {
  const pk = findPk(i);
  if (!pk) {
    console.error(`Missing PK${i} in .env — expected PK1..PK30, 30 testnet private keys.`);
    process.exit(1);
  }
  entries.push({ label: `employee-${String(i).padStart(2, "0")}`, privateKey: pk });
}

// Default lifecycle role assignment (matches the agreed distribution):
//   employee-01..30 — onboarding + at least 1 salary claim (all 30)
//   employee-01..10 — additionally request kasbon
//   employee-11..18 — additionally receive a bounty reward
//   employee-19..21 — additionally undergo PHK (termination)
//   employee-22..30 — normal, no extra action
function roleFor(index) {
  const n = index + 1;
  const roles = ["onboard+claim"];
  if (n >= 1 && n <= 10) roles.push("kasbon");
  if (n >= 11 && n <= 18) roles.push("bounty");
  if (n >= 19 && n <= 21) roles.push("PHK");
  return roles.join(" + ");
}

const rows = entries.map((entry, i) => {
  if (!entry.privateKey) {
    console.error(`${entry.label ?? `entry ${i}`}: privateKey is empty — fill in employees.json first.`);
    process.exit(1);
  }
  const account = privateKeyToAccount(normalizePk(entry.privateKey));
  return { label: entry.label ?? `employee-${String(i + 1).padStart(2, "0")}`, address: account.address, role: roleFor(i) };
});

console.log("\nDerived employee addresses (fund these with Base Sepolia ETH before running lifecycle scripts):\n");
for (const row of rows) {
  console.log(`  ${row.label.padEnd(14)} ${row.address}   [${row.role}]`);
}

console.log(`\nTotal: ${rows.length} addresses.`);
console.log("Copy this list to fund each address with a small amount of Base Sepolia ETH (gas for direct on-chain calls).");
