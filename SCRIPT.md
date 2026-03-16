# Video Script — ALU Logo dApp (5 minutes)

## [0:00 – 0:30] Intro + terminal

Open a terminal in the project root.

> "This is the ALU Logo dApp — a decentralised app that lets anyone verify the authentic ALU logo using its SHA-256 hash stored on the Ethereum Sepolia testnet. Let me walk you through it."

Run the tests:

```bash
pnpm --filter @alu-dapp/contracts test
```

> "We have 13 tests — 8 from Formative 1 covering the registry and token contracts, plus 5 new integration tests that simulate what the frontend does: reading total supply, hashing a file, checking verification results, and confirming distributeShares updates balances. All 13 pass."

---

## [0:30 – 1:00] Start the dev server

```bash
pnpm --filter frontend dev
```

Open http://localhost:5173 in the browser.

> "The frontend is a React Router v7 SPA — no server-side rendering — with Tailwind CSS for styling and ethers.js v6 for all blockchain calls."

Point to the nav bar. MetaMask auto-connects because permission was already granted.

> "MetaMask connects automatically on load using eth_accounts — no popup needed if you've already approved the site."

---

## [1:00 – 2:30] Verify page

Navigate to `/verify`.

> "The verify page is the main feature. No wallet needed — anyone can use it."

**Tab 1 — Upload File:**

Upload the real `alu-logo.png`.

> "The file is hashed entirely in the browser using the Web Crypto API — crypto.subtle.digest. The SHA-256 is computed locally. Nothing is uploaded to any server."

Show the hash: `0x102109d75b09daff117165acb7a2c5d062f252bdab6e9fc83f460b475f957ea5`

Click **Verify Logo**.

> "The app sends a single read-only eth_call to verifyLogoIntegrity on the ALUAssetRegistry contract on Sepolia. The contract compares the hash against what was registered on-chain."

Green banner appears.

> "Green — this is the authentic ALU logo. The banner shows the asset name, registration date, and the wallet that registered it."

Now upload a different image (any other PNG).

> "Now let's try a different image."

Red warning banner.

> "Red — the hash doesn't match. This is exactly what the contract was built to detect."

**Tab 2 — Paste Hash:** briefly show pasting the hash directly.

> "You can also paste a hash directly — useful if you already know it."

---

## [2:30 – 3:30] Register page

Navigate to `/register`.

> "The register page lets the contract owner — or anyone — register a new asset as an NFT."

Show the wallet is connected.

Upload a file, enter a name.

> "Upload the file, enter a name — the hash is computed automatically. Clicking Register Asset sends a registerAsset transaction through MetaMask."

_(If you have already registered the logo, show the 'already registered' error — this is fine.)_

> "The contract enforces uniqueness — the same file hash can only be registered once. If you try again, it reverts."

---

## [3:30 – 4:30] Dashboard

Navigate to `/dashboard`.

> "The dashboard reads from the ALULogoToken contract — a fixed-supply ERC-20 with 1 million ALUT tokens."

Point to the three stat cards.

> "Total supply is 1,000,000 ALUT. My connected wallet is the deployer, so it holds 100% — shown here in the balance and ownership cards."

Point to the Ownership Breakdown table.

> "The ownership table shows all known holders and their percentages."

Point to the Distribute Shares form (visible because you're the owner).

> "This form is only visible to the contract owner — determined by comparing the connected address against token.owner(). Non-owners don't see it at all. The real protection is the onlyOwner modifier in Solidity — the UI is just a convenience."

Optionally demonstrate a distribution if you have a second address ready.

---

## [4:30 – 5:00] Wrap up

Back to terminal or IDE.

> "To summarise: the frontend adds a browser interface that makes the Formative 1 contracts accessible to anyone — not just developers. Hashing is trustless because it runs in the browser with no server involved. The verify page, register page, and dashboard each connect to the contracts in different ways — read-only via a JSON-RPC provider, and write transactions via MetaMask."

> "The contracts are deployed on Sepolia at these addresses — both are in the README. Thanks."

Show the README briefly or the contract addresses on screen.
