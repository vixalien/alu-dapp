import { network } from "hardhat";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const { ethers } = await network.connect();
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Compute SHA-256 of the logo file
  const logoPath = path.join(__dirname, "../assets/logo.png");
  const fileBuffer = fs.readFileSync(logoPath);
  const hashHex = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  const logoHash = "0x" + hashHex;
  console.log("Logo SHA-256:", logoHash);

  // ── Part A: ALULogoRegistry (simple registry) ────────────────────────────
  const Registry = await ethers.getContractFactory("ALULogoRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  console.log("ALULogoRegistry deployed to:", await registry.getAddress());
  await (await registry.register(logoHash, "ALU Official Logo v1")).wait();
  console.log("Logo registered in ALULogoRegistry.");

  // ── Part A: ALULogoShares (simple ERC-20) ───────────────────────────────
  const Shares = await ethers.getContractFactory("ALULogoShares");
  const shares = await Shares.deploy(await registry.getAddress());
  await shares.waitForDeployment();
  console.log("ALULogoShares deployed to:", await shares.getAddress());

  // ── Part B: ALUAssetRegistry (ERC-721) ──────────────────────────────────
  const AssetRegistry = await ethers.getContractFactory("ALUAssetRegistry");
  const assetRegistry = await AssetRegistry.deploy();
  await assetRegistry.waitForDeployment();
  const assetRegistryAddress = await assetRegistry.getAddress();
  console.log("ALUAssetRegistry deployed to:", assetRegistryAddress);

  const tx = await assetRegistry.registerAsset(
    "ALU Official Logo",
    "image/png",
    logoHash
  );
  const receipt = await tx.wait();
  const event = receipt.logs
    .map((log) => { try { return assetRegistry.interface.parseLog(log); } catch { return null; } })
    .find((e) => e && e.name === "AssetRegistered");
  console.log("Logo registered as NFT, token ID:", event ? event.args.tokenId.toString() : "?");

  // ── Part C: ALULogoToken (ERC-20 with Ownable) ──────────────────────────
  const Token = await ethers.getContractFactory("ALULogoToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();
  console.log("ALULogoToken deployed to:", await token.getAddress());
  console.log(
    "Total supply minted to deployer:",
    ethers.formatEther(await token.balanceOf(deployer.address)),
    "ALUT"
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
