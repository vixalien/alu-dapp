# ALU Logo dApp

A decentralised application that registers the official ALU logo on the Ethereum Sepolia testnet as an NFT and lets anyone verify its authenticity — no server required.

## Contracts (Sepolia)

| Contract                   | Address                                      |
| -------------------------- | -------------------------------------------- |
| ALUAssetRegistry (ERC-721) | `0xd8a344B144E4C0E088004c700Bd7E64bB4bF51B3` |
| ALULogoToken (ERC-20)      | `0x5bE346e6F0F5876288c9121d1C32F259a83E5157` |

## SHA-256 Hash of the Official ALU Logo

```
0x102109d75b09daff117165acb7a2c5d062f252bdab6e9fc83f460b475f957ea5
```

## How the Frontend Connects to Each Contract

**ALUAssetRegistry** — used on the Verify and Register pages. The Verify page calls `verifyLogoIntegrity(1, hash)` read-only via a `JsonRpcProvider` (no wallet needed). The Register page calls `registerAsset(name, fileType, hash)` as a write transaction through MetaMask.

**ALULogoToken** — used on the Dashboard. Total supply, balances, and ownership percentages are read via `JsonRpcProvider`. The owner-only `distributeShares(recipient, amount)` is called as a write transaction through MetaMask.

The frontend never sends file data anywhere. Hashing runs entirely in the browser using the Web Crypto API (`crypto.subtle.digest`).

## Prerequisites

- Node.js v22 LTS or later
- pnpm v10 or later (`npm install -g pnpm`)
- MetaMask browser extension set to the **Sepolia** testnet

## Install and Run

```bash
pnpm install
pnpm --filter frontend dev
```

Open http://localhost:5173.

## Run Tests

```bash
pnpm --filter @alu-dapp/contracts test
```

Expected output: **13 passing**

## Using the dApp

### Verify — no wallet required

1. Go to `/verify`
2. **Upload File:** drag or click to upload an image — the SHA-256 hash is computed in-browser and checked against the on-chain record
3. **Paste Hash:** paste a `0x`-prefixed 64-character hex string to verify directly
4. Green banner = authentic ALU logo; red banner = hash does not match

### Register — wallet required

1. Go to `/register` and connect MetaMask (Sepolia)
2. Upload an image file — the hash is computed automatically
3. Enter an asset name and click **Register Asset**
4. Approve the transaction in MetaMask — the token ID and transaction hash are shown on success

### Dashboard — wallet required

1. Go to `/dashboard` and connect MetaMask (Sepolia)
2. View total supply (1,000,000 ALUT), your balance, and ownership percentage
3. The **Distribute Shares** form appears only for the contract owner — enter a recipient address and amount, then approve in MetaMask

## Project Structure

```
alu-dapp/
├── packages/
│   ├── contracts/
│   │   ├── contracts/        # Solidity source files
│   │   ├── scripts/deploy.js # Sepolia deployment script
│   │   ├── test/             # 13 Mocha/Chai tests
│   │   └── hardhat.config.js
│   └── frontend/
│       └── app/
│           ├── lib/          # hash.ts, wallet.ts, contracts.ts
│           ├── context/      # WalletContext.tsx
│           ├── components/   # WalletButton.tsx
│           └── routes/       # home, verify, register, dashboard
└── package.json              # pnpm workspace root
```

## Versions

| Tool         | Version                       |
| ------------ | ----------------------------- |
| Node.js      | v25.8.1 (v22 LTS recommended) |
| pnpm         | 10.32.1                       |
| Hardhat      | 3.1.10                        |
| React Router | 7.12.0                        |
| ethers.js    | 6.16.0                        |
| Tailwind CSS | 4.x                           |
| Solidity     | 0.8.24                        |

## Known Issues and Limitations

- **Node.js v25:** Hardhat 3 warns that Node.js v25 is unsupported; tests pass regardless. Use Node.js v22 LTS for a clean run.
- **RPC free tier:** The Alchemy free tier limits `eth_getLogs` to a 10-block range, so the dashboard reads holder addresses from a hardcoded list rather than querying Transfer events dynamically. Upgrading to a paid RPC plan removes this constraint.
- **Token ID hardcoded:** The verify page checks token ID 1. If a different asset was registered first, the hash comparison will fail.
- **No network switching:** The app does not prompt MetaMask to switch to Sepolia automatically. Switch manually before connecting.
- **Sepolia only:** Contracts are deployed on Sepolia testnet. The app is not configured for mainnet.
