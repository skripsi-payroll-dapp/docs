// Minimal ABI fragments + addresses mirrored from frontend/src/infrastructure/chain/{abi,contracts}.ts.
// Duplicated here (not imported directly) because that source is TypeScript and these scripts
// run as plain Node ESM. Keep in sync manually if the real ABI changes.
import { keccak256, toHex } from "viem";

export const CONTRACTS = {
  PAYROLL_FACTORY: (process.env.PAYROLL_FACTORY_ADDRESS || "0x73926c8abdbd2ebcc09f5e6af7def1bb3af156de"),
};

export const IDRX_TOKEN_ADDRESS = process.env.IDRX_TOKEN_ADDRESS || "0x0996e627cE22C4FE2D5c4788b159a83C065D6d09";
export const SBT_CONTRACT_ADDRESS = process.env.SBT_CONTRACT_ADDRESS || "0x8dA9B60814536364daF77a82cb56B31226De4B62";

export const IDRX_ABI = [
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
];

export const PAYROLL_FACTORY_ABI = [
  {
    name: "companyVaults",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "hrAddress", type: "address" }],
    outputs: [{ name: "vault", type: "address" }],
  },
  {
    name: "deployVault",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "hrAuthority", type: "address" },
      { name: "companyName", type: "string" },
      { name: "sbtContract", type: "address" },
    ],
    outputs: [{ name: "", type: "address" }],
  },
];

export const COMPANY_VAULT_ABI = [
  {
    name: "getAccrued",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "employee", type: "address" }],
    outputs: [{ name: "accrued", type: "uint256" }],
  },
  {
    name: "claimSalary",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "fundVault",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "startStream",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "employee", type: "address" },
      { name: "flowRate", type: "uint256" },
      { name: "severanceSplitBps", type: "uint16" },
    ],
    outputs: [],
  },
  {
    name: "requestAdvance",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "approveAdvance",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "employee", type: "address" }],
    outputs: [],
  },
  {
    name: "rejectAdvance",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "employee", type: "address" }],
    outputs: [],
  },
  {
    name: "createCliffVest",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "employee", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "cliffTs", type: "uint256" },
      { name: "vestType", type: "uint8" },
    ],
    outputs: [],
  },
  {
    name: "cancelCliffVest",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "employee", type: "address" }, { name: "vestId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "proposeTermination",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "employee", type: "address" }, { name: "reasonHash", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "approveTermination",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "employee", type: "address" }],
    outputs: [],
  },
  {
    name: "executeTermination",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "employee", type: "address" }],
    outputs: [],
  },
  {
    name: "freezeVault",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "grantRole",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "role", type: "bytes32" }, { name: "account", type: "address" }],
    outputs: [],
  },
  {
    name: "withdrawVault",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }, { name: "recipient", type: "address" }],
    outputs: [],
  },
  {
    name: "vaultBalance",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
];

export const LEGAL_ROLE = keccak256(toHex("LEGAL_ROLE"));
export const HR_ROLE = keccak256(toHex("HR_ROLE"));

