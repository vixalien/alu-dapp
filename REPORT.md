# Project Report — ALU Logo dApp

**Course:** Crypto and Digital Assets — Formative 2
**Student:** A. Shema
**Date:** March 2026

---

## Abstract

The ALU Logo dApp is a decentralised web application that lets anyone verify the authenticity of the official African Leadership University logo using its SHA-256 hash stored on the Ethereum Sepolia testnet. It extends the smart contracts from Formative 1 with a React frontend that connects to two on-chain contracts, enabling logo verification without a server, NFT-based asset registration, and token-based ownership distribution.

---

## Introduction

The smart contracts from Formative 1 solved the problem of tamper-proof registration and verification on-chain, but they were only accessible to developers via the command line. A non-technical user had no way to upload a logo, hash it, and check it against the blockchain. The dApp fills this gap: it puts a browser-based interface in front of the contracts so anyone with an internet connection can verify whether a logo file is the authentic ALU logo — and so the contract owner can distribute ownership shares and register new assets — all without any server-side code.

---

## Architecture Overview

```
Browser
  │
  ├── Web Crypto API (SHA-256 hashing — no server)
  │
  ├── ethers.js v6
  │     ├── JsonRpcProvider → Alchemy (Sepolia) ──► Read-only calls
  │     │     ├── verifyLogoIntegrity(tokenId, hash)
  │     │     ├── getAsset(tokenId)
  │     │     ├── totalSupply(), balanceOf(), ownershipPercentage()
  │     │
  │     └── BrowserProvider → MetaMask ──────────► Write transactions
  │           ├── registerAsset(name, fileType, hash)
  │           └── distributeShares(recipient, amount)
  │
  └── React Router v7 (SPA, ssr: false)
        ├── /verify     → ALUAssetRegistry (read)
        ├── /register   → ALUAssetRegistry (write)
        └── /dashboard  → ALULogoToken (read + write)

Sepolia Testnet
  ├── ALUAssetRegistry  0xd8a344B144E4C0E088004c700Bd7E64bB4bF51B3
  └── ALULogoToken      0x5bE346e6F0F5876288c9121d1C32F259a83E5157
```

The frontend is a static SPA deployed to Vercel. It never sends file data to any server. All cryptographic work happens in the browser via the Web Crypto API, and all blockchain interaction goes through ethers.js directly to the Sepolia RPC endpoint.

---

## Feature Walkthrough

### Home Page (`/`)

Landing page with a brief description of the dApp and navigation links to the three main features.

### Verify Page (`/verify`)

The verify page is the primary public-facing feature and requires no wallet. A user uploads an image file or pastes a hex hash. If they upload a file, the browser computes its SHA-256 digest using `crypto.subtle.digest("SHA-256", buffer)` and displays the resulting `0x`-prefixed 64-character hex string. Clicking **Verify Logo** sends a read-only `eth_call` to `verifyLogoIntegrity(1, hash)` on the ALUAssetRegistry contract. If the hashes match, a green banner confirms authenticity and shows the asset name, registration date, and registrant address. If not, a red warning banner is displayed.

### Register Page (`/register`)

The register page requires a connected MetaMask wallet on Sepolia. After uploading a file (which auto-computes its hash) and entering an asset name, clicking **Register Asset** submits a `registerAsset(name, fileType, hash)` transaction. MetaMask prompts the user to confirm and pay gas. On success, the UI shows the minted token ID and transaction hash. The contract enforces uniqueness — attempting to register the same file twice reverts with "asset already registered".

### Dashboard Page (`/dashboard`)

The dashboard requires a connected wallet. It displays the ALUT token's total supply (1,000,000), the connected wallet's balance and ownership percentage, and a table of known holders with their balances. For the contract owner only, a **Distribute Shares** form is shown, allowing ALUT tokens to be transferred to any address via `distributeShares(recipient, amount)`. The table refreshes automatically after a successful distribution.

---

## Wallet and Web3 Integration

Wallet connection is handled by `app/lib/wallet.ts`. On page load, the app calls `eth_accounts` (no popup) to check if MetaMask has already granted permission; if accounts are available, it connects silently. When the user clicks **Connect Wallet**, `eth_requestAccounts` triggers the MetaMask permission prompt.

Once connected, a `BrowserProvider` wraps `window.ethereum` and a `JsonRpcSigner` is obtained for the active account. This signer is stored in a React context (`WalletContext`) and passed to contract instances for write transactions.

Read-only calls use a separate `JsonRpcProvider` pointing to the Alchemy Sepolia RPC, with `batchMaxCount: 1` to stay within the free-tier rate limit. This means the verify page works for any visitor regardless of whether they have MetaMask installed.

---

## Verification Page — How In-Browser Hashing Works

The verify page uses the browser's built-in `crypto.subtle.digest` API, which is available in all modern browsers without any library. The process:

1. The user selects a file; the browser reads it as an `ArrayBuffer` via `file.arrayBuffer()`
2. `crypto.subtle.digest("SHA-256", buffer)` returns a promise that resolves to a raw byte digest
3. The bytes are converted to a lowercase hex string and prefixed with `0x` to produce a `bytes32`-compatible value
4. That value is passed directly to the contract's `verifyLogoIntegrity` function

No file data ever leaves the browser. The only network request is the `eth_call` to check the hash against the on-chain record. This design means the verification feature works entirely offline once the page is loaded, with only the final contract call requiring a network connection.

---

## Token Dashboard — Ownership and Distribution

The ALUT token (ALULogoToken) is a standard ERC-20 with a fixed supply of 1,000,000 tokens minted entirely to the deployer at construction. An additional `ownershipPercentage(address)` function returns `(balance * 100) / totalSupply`, giving a whole-number percentage.

The `distributeShares(recipient, amount)` function is an alias for `transfer` restricted to the contract owner (via OpenZeppelin's `Ownable`). The dashboard detects ownership by comparing the connected wallet address to the value returned by `token.owner()`. The distribute form is rendered conditionally — non-owners see only the read-only stats. This is a UI-level guard; the real protection is in the Solidity `onlyOwner` modifier, which will revert any unauthorised call.

---

## Test Results

All 13 tests pass against a local Hardhat node:

```
ALUAssetRegistry
  ✔ registers the ALU logo and returns a token ID
  ✔ rejects a duplicate content hash
  ✔ verifyLogoIntegrity() returns true for the correct hash
  ✔ verifyLogoIntegrity() returns false for an incorrect hash
  ✔ getAsset() returns correct name and file type

ALULogoToken
  ✔ mints the full supply of 1,000,000 ALUT to the logo owner
  ✔ distributeShares() transfers tokens from owner to recipient
  ✔ ownershipPercentage() returns the correct percentage
  ✔ frontend reads totalSupply as 1,000,000 ALUT

Frontend Hashing Utility
  ✔ hashing function returns correct SHA-256 bytes32 for a known file

Frontend Verification Integration
  ✔ verifyLogoIntegrity with correct hash displays success result
  ✔ verifyLogoIntegrity with wrong hash displays failure result

Frontend Token Distribution Integration
  ✔ distributeShares correctly updates recipient balance after transfer

13 passing
```

> Screenshot: run `pnpm --filter @alu-dapp/contracts test` and capture the terminal output.

---

## Conclusion

Building the frontend surface on top of the Formative 1 contracts revealed a gap between what is technically possible on-chain and what is practically usable. The most interesting engineering decision was choosing to hash files entirely in the browser using the Web Crypto API rather than uploading them to a server — this keeps the verification flow trustless and consistent with the decentralised nature of the contracts.

With more time I would add:

- **Automatic token discovery** — query Transfer events from the deployment block to build the holder list dynamically, removing the need for `KNOWN_HOLDERS`
- **Network detection** — prompt MetaMask to switch to Sepolia automatically on page load
- **IPFS storage** — pin the logo file to IPFS and store the CID alongside the hash in the registry, making the file permanently retrievable alongside its on-chain certificate
- **Multi-token verify** — allow the user to specify a token ID rather than defaulting to token #1, supporting a registry of multiple assets

---

## GitHub Repository

> Add your public GitHub URL here before submitting.

---

## Video Demonstration

> Add your screen recording link here before submitting.
