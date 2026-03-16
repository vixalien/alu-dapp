# ALU Logo dApp

A pnpm monorepo dApp that registers and verifies the official ALU logo on the Sepolia Ethereum testnet.

## Overview

The dApp connects two smart contracts deployed on Sepolia:

- **ALUAssetRegistry** (`packages/contracts/contracts/ALUAssetRegistry.sol`) — An ERC-721 contract that registers logo assets as NFTs. Each asset stores its name, file type, SHA-256 content hash, registrant address, and timestamp. The `verifyLogoIntegrity(tokenId, hash)` function checks whether a given hash matches the on-chain record.

- **ALULogoToken** (`packages/contracts/contracts/ALULogoToken.sol`) — An ERC-20 token (ALUT) with a fixed supply of 1,000,000 tokens minted to the deployer. The owner can call `distributeShares(recipient, amount)` to transfer tokens. `ownershipPercentage(address)` returns the holder's percentage of total supply.

The frontend uses **ethers.js v6** with a read-only `JsonRpcProvider` for public reads (verify page), and a `BrowserProvider` backed by MetaMask for write transactions (register, distribute).

## SHA-256 Hash of the ALU Logo

```
0x102109d75b09daff117165acb7a2c5d062f252bdab6e9fc83f460b475f957ea5
```

## Contract Addresses (Sepolia)

- ALUAssetRegistry: `0xd8a344B144E4C0E088004c700Bd7E64bB4bF51B3`
- ALULogoToken: `0x5bE346e6F0F5876288c9121d1C32F259a83E5157`

## Setup

**Prerequisites:** Node.js ≥ 22 LTS, pnpm ≥ 10.

```bash
git clone <repo-url>
cd alu-dapp
pnpm install
```

## Running Tests

```bash
pnpm --filter @alu-dapp/contracts test
```

Expected: **13 passing**

## Local Development

```bash
pnpm --filter frontend dev
```

Open http://localhost:5173.

## Using the dApp

### Verify (no wallet needed)
1. Go to `/verify`
2. **Upload File tab:** drag or click to upload any PNG → the app hashes it client-side with the Web Crypto API and calls `verifyLogoIntegrity(1, hash)` on-chain
3. **Paste Hash tab:** paste any `0x`-prefixed 64-char hex to verify directly
4. Green = authentic ALU logo; Red = not authentic or modified

### Register (wallet required)
1. Go to `/register`
2. Connect MetaMask (Sepolia network)
3. Upload a file → hash is computed in-browser
4. Enter a name and click "Register Asset" → MetaMask prompts to confirm the transaction
5. On success, the token ID and transaction hash are displayed

### Dashboard (wallet required)
1. Go to `/dashboard`
2. Connect MetaMask
3. Displays total supply (1,000,000 ALUT), your balance, and your ownership percentage
4. Owner-only: "Distribute Shares" form to transfer ALUT to any address

## Deploying to Sepolia

1. Get Sepolia ETH from a faucet
2. Create `packages/contracts/.env`:
   ```
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
   DEPLOYER_PRIVATE_KEY=0xYOUR_METAMASK_PRIVATE_KEY
   ```
3. Deploy: `pnpm --filter @alu-dapp/contracts deploy:sepolia`
4. Copy the printed addresses into `packages/frontend/app/lib/contracts.ts`
5. Register the ALU logo via `/register` on the live site

## Deploying to Vercel

- Root Directory: `packages/frontend`
- Framework: Vite
- Build command: `pnpm build`
- Output directory: `build/client`
- Environment variable: `VITE_RPC_URL` = your Sepolia RPC URL

## Versions

- Node.js: v25.8.1 (recommend v22 LTS for Hardhat compatibility)
- pnpm: 10.32.1
- Hardhat: 3.1.10
- React Router: 7.12.0
- ethers.js: 6.x
- Tailwind CSS: 4.x

## Known Issues / Limitations

- Hardhat 3.x shows a warning on Node.js v25 (unsupported); tests still pass. Use Node.js v22 LTS for production builds.
- Contract addresses in `contracts.ts` are placeholders until Sepolia deployment is done.
- The dashboard ownership table shows 3 sample Hardhat addresses; replace with real holders post-deployment.
- MetaMask must be set to the Sepolia testnet; the app does not auto-prompt network switching.
