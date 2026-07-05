// KU-28 Suspension (FR-PAYANA-1005) — AU-28-01 s.d. AU-28-04
// Covers: backend/src/routes/suspension.ts (backend-only blocklist) AND a real on-chain
// claimSalary() call to prove suspension never touches vault state (per suspension.ts's own
// comment: "vault stays Active on-chain, only the HR interface login is gated").
//
// Preconditions:
//   TEST_OWNER_PRIVATE_KEY — must match backend's OWNER_ADDRESS env var.
//   TEST_HR_PRIVATE_KEY — the HR being suspended/reactivated by this script. Running this
//     script leaves TEST_HR SUSPENDED at the end of AU-28-01/02 and only reactivates in
//     AU-28-04 — if the script fails partway, TEST_HR may be left suspended; re-run or
//     manually DELETE /suspension/:hrAddress as Owner to clean up.
//   TEST_EMPLOYEE_PRIVATE_KEY — an EOA that is directly registered in employeeStreams under
//     TEST_HR's vault (i.e. the raw wallet address itself must be the on-chain employee key,
//     NOT a Privy smart account — this script calls claimSalary() directly as an EOA paying its
//     own gas, bypassing the app's ERC-4337 gasless Paymaster flow entirely for simplicity. If
//     your test employee was onboarded via a smart account, resolve/fund that address instead
//     and adjust ACCOUNT below).
//   This EOA needs a small amount of Base Sepolia ETH for gas (the real gasless Paymaster path
//   is not replicated here).
import { clientsFromEnv, loginAs, api, assert, section, finish, login } from "./lib/common.mjs";
import { PAYROLL_FACTORY_ABI, COMPANY_VAULT_ABI, CONTRACTS } from "./lib/contracts.mjs";

const ownerLogin = await loginAs("TEST_OWNER_PRIVATE_KEY");
if (!assert(ownerLogin.ok, "Login precondition: Owner")) finish();
const hrLoginBefore = await loginAs("TEST_HR_PRIVATE_KEY");
const hrAddress = hrLoginBefore.account.address;

section("AU-28-01 — Owner menangguhkan HR");
{
  const { res, body } = await api(`/suspension/${hrAddress}`, {
    method: "POST",
    token: ownerLogin.accessToken,
    body: { reason: "uji otomatis PDHUPL" },
  });
  assert(res.status === 200 && body.ok === true, "POST /suspension/:hrAddress → ok:true", `status=${res.status} body=${JSON.stringify(body)}`);
}

section("AU-28-02 — HR yang disuspend gagal login");
{
  const { account, walletClient } = clientsFromEnv("TEST_HR_PRIVATE_KEY");
  const { res, body } = await login(account, walletClient);
  assert(res.status === 403 && body.errorCode === "ACCOUNT_SUSPENDED", "Suspended HR login → 403 ACCOUNT_SUSPENDED", `status=${res.status} body=${JSON.stringify(body)}`);
}

section("AU-28-03 — Karyawan tetap bisa claimSalary saat HR-nya disuspend");
{
  const { account, walletClient, publicClient } = clientsFromEnv("TEST_EMPLOYEE_PRIVATE_KEY");
  try {
    const vaultAddress = await publicClient.readContract({
      address: CONTRACTS.PAYROLL_FACTORY,
      abi: PAYROLL_FACTORY_ABI,
      functionName: "companyVaults",
      args: [hrAddress],
    });
    assert(vaultAddress && vaultAddress !== "0x0000000000000000000000000000000000000000", "Vault ditemukan untuk HR ini", `vaultAddress=${vaultAddress}`);

    const accrued = await publicClient.readContract({
      address: vaultAddress,
      abi: COMPANY_VAULT_ABI,
      functionName: "getAccrued",
      args: [account.address],
    });
    console.log(`  ℹ️  accrued saat ini: ${accrued.toString()} wei`);

    if (accrued === 0n) {
      console.log("  ⚠️  SKIP eksekusi claimSalary — accrued=0 (tunggu beberapa saat setelah stream aktif, atau perbesar flowRate untuk uji ini)");
    } else {
      const txHash = await walletClient.writeContract({
        address: vaultAddress,
        abi: COMPANY_VAULT_ABI,
        functionName: "claimSalary",
        args: [],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      assert(receipt.status === "success", "claimSalary() berhasil walau HR disuspend", `txHash=${txHash} status=${receipt.status}`);
      console.log(`  ℹ️  tx: https://sepolia.basescan.org/tx/${txHash}`);
    }
  } catch (e) {
    assert(false, "claimSalary flow gagal dieksekusi", String(e));
  }
}

section("AU-28-04 — Owner mengaktifkan kembali HR");
{
  const { res, body } = await api(`/suspension/${hrAddress}`, { method: "DELETE", token: ownerLogin.accessToken });
  assert(res.status === 200 && body.ok === true, "DELETE /suspension/:hrAddress → ok:true", `status=${res.status} body=${JSON.stringify(body)}`);

  const { account, walletClient } = clientsFromEnv("TEST_HR_PRIVATE_KEY");
  const { login } = await import("./lib/common.mjs");
  const { res: loginRes } = await login(account, walletClient);
  assert(loginRes.status === 200, "HR bisa login lagi setelah reaktivasi", `status=${loginRes.status}`);
}

finish();
