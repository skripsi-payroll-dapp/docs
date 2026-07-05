// Shared helpers for PDHUPL v2 integration test scripts.
// All scripts read config from environment variables only — never hardcode keys.
import "dotenv/config";
import { createWalletClient, createPublicClient, http, defineChain } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

export const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
export const RPC_URL = process.env.RPC_URL || "https://sepolia.base.org";

export const BASE_SEPOLIA = defineChain({
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  testnet: true,
});

function normalizePk(pk) {
  return pk.startsWith("0x") ? pk : `0x${pk}`;
}

export function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`❌ Missing required env var: ${name} (see testing-scripts/.env.example)`);
    process.exit(1);
  }
  return v;
}

export function accountFromEnv(pkEnvVar) {
  const pk = requireEnv(pkEnvVar);
  return privateKeyToAccount(normalizePk(pk));
}

export function clientsFromEnv(pkEnvVar) {
  const account = accountFromEnv(pkEnvVar);
  const walletClient = createWalletClient({ account, chain: BASE_SEPOLIA, transport: http(RPC_URL) });
  const publicClient = createPublicClient({ chain: BASE_SEPOLIA, transport: http(RPC_URL) });
  return { account, walletClient, publicClient };
}

export function freshAccount() {
  // A brand-new never-before-seen address — safe for genuinely fresh-registration
  // scenarios (no on-chain role needed). Not funded with ETH; do not use for on-chain writes.
  return privateKeyToAccount(generatePrivateKey());
}

export function loginMessage() {
  const timestamp = Math.floor(Date.now() / 1000);
  return `Sign in to Payana\nTimestamp: ${timestamp}`;
}

/** Performs POST /auth/login using the given account + walletClient. Returns {res, body}. */
export async function login(account, walletClient, messageOverride) {
  const message = messageOverride ?? loginMessage();
  const signature = await walletClient.signMessage({ account, message });
  const res = await fetch(`${BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: account.address, message, signature }),
  });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

/** Convenience: full login-as-role via env private key var, returns accessToken (or null on failure). */
export async function loginAs(pkEnvVar) {
  const { account, walletClient } = clientsFromEnv(pkEnvVar);
  const { res, body } = await login(account, walletClient);
  return { account, ok: res.status === 200, status: res.status, body, accessToken: body.accessToken, refreshToken: body.refreshToken };
}

export async function api(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { res, status: res.status, body: json };
}

let passCount = 0;
let failCount = 0;

export function assert(condition, label, detail) {
  if (condition) {
    passCount++;
    console.log(`  ✅ PASS — ${label}`);
  } else {
    failCount++;
    console.log(`  ❌ FAIL — ${label}${detail ? `\n     ${detail}` : ""}`);
  }
  return condition;
}

export function section(title) {
  console.log(`\n── ${title} ──`);
}

export function finish() {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`RESULT: ${passCount} passed, ${failCount} failed`);
  console.log("=".repeat(50));
  process.exitCode = failCount > 0 ? 1 : 0;
}
