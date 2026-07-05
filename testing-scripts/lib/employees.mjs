// Loads the 30 dummy employee accounts (PK1..PK30 from .env) and the deployed vault
// address (persisted by 30-01-setup-company.mjs into vault-address.local.json).
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, createPublicClient, http } from "viem";
import { BASE_SEPOLIA, RPC_URL } from "./common.mjs";

function normalizePk(pk) {
  return pk.startsWith("0x") ? pk : `0x${pk}`;
}

export function loadEmployees() {
  const employees = [];
  for (let i = 1; i <= 30; i++) {
    const pk = process.env[`PK${i}`] ?? process.env[`pk${i}`];
    if (!pk) {
      console.error(`Missing PK${i} in .env — expected PK1..PK30.`);
      process.exit(1);
    }
    const account = privateKeyToAccount(normalizePk(pk));
    const walletClient = createWalletClient({ account, chain: BASE_SEPOLIA, transport: http(RPC_URL) });
    employees.push({ index: i, label: `employee-${String(i).padStart(2, "0")}`, account, walletClient });
  }
  return employees;
}

export function publicClient() {
  return createPublicClient({ chain: BASE_SEPOLIA, transport: http(RPC_URL) });
}

const VAULT_FILE = new URL("../vault-address.local.json", import.meta.url);

export function saveVaultAddress(address) {
  writeFileSync(VAULT_FILE, JSON.stringify({ vaultAddress: address }, null, 2));
}

export function loadVaultAddress() {
  if (!existsSync(VAULT_FILE)) {
    console.error("Missing vault-address.local.json — run 30-01-setup-company.mjs first.");
    process.exit(1);
  }
  return JSON.parse(readFileSync(VAULT_FILE, "utf8")).vaultAddress;
}

// Distribution agreed with the user: all 30 onboard + claim once; 01-10 also kasbon;
// 11-18 also bounty; 19-21 also PHK; 22-30 stay normal.
export const KASBON_RANGE = [1, 10];
export const BOUNTY_RANGE = [11, 18];
export const PHK_RANGE = [19, 21];

export function inRange(index, [lo, hi]) {
  return index >= lo && index <= hi;
}
