import { network } from "hardhat";
import { expect } from "chai";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Real SHA-256 of the ALU logo file
const logoPath = path.join(__dirname, "../assets/logo.png");
const logoHash = "0x" + crypto.createHash("sha256")
  .update(fs.readFileSync(logoPath))
  .digest("hex");

const WRONG_HASH = "0x" + "ab".repeat(32);
const TOTAL_SUPPLY = 1_000_000n * 10n ** 18n;

describe("ALUAssetRegistry", function () {
  let ethers;
  let registry;
  let owner, alice;

  before(async function () {
    ({ ethers } = await network.connect());
    [owner, alice] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const Factory = await ethers.getContractFactory("ALUAssetRegistry");
    registry = await Factory.deploy();
    await registry.waitForDeployment();
  });

  // Test 1
  it("registers the ALU logo and returns a token ID", async function () {
    const tokenId = await registry.registerAsset.staticCall(
      "ALU Official Logo", "image/png", logoHash
    );
    await registry.registerAsset("ALU Official Logo", "image/png", logoHash);
    expect(tokenId).to.equal(1n);
    expect(await registry.ownerOf(tokenId)).to.equal(owner.address);
  });

  // Test 2
  it("rejects a duplicate content hash", async function () {
    await registry.registerAsset("ALU Official Logo", "image/png", logoHash);
    await expect(
      registry.registerAsset("ALU Official Logo copy", "image/png", logoHash)
    ).to.be.revertedWith("ALUAssetRegistry: asset already registered");
  });

  // Test 3
  it("verifyLogoIntegrity() returns true for the correct hash", async function () {
    await registry.registerAsset("ALU Official Logo", "image/png", logoHash);
    const [valid, message] = await registry.verifyLogoIntegrity(1, logoHash);
    expect(valid).to.be.true;
    expect(message).to.equal("Logo is authentic.");
  });

  // Test 4
  it("verifyLogoIntegrity() returns false for an incorrect hash", async function () {
    await registry.registerAsset("ALU Official Logo", "image/png", logoHash);
    const [valid, message] = await registry.verifyLogoIntegrity(1, WRONG_HASH);
    expect(valid).to.be.false;
    expect(message).to.equal("Warning: logo does not match.");
  });

  // Test 5
  it("getAsset() returns correct name and file type", async function () {
    await registry.registerAsset("ALU Official Logo", "image/png", logoHash);
    const asset = await registry.getAsset(1);
    expect(asset.name).to.equal("ALU Official Logo");
    expect(asset.fileType).to.equal("image/png");
    expect(asset.contentHash).to.equal(logoHash);
    expect(asset.registrant).to.equal(owner.address);
  });
});

describe("ALULogoToken", function () {
  let ethers;
  let token;
  let owner, alice;

  before(async function () {
    ({ ethers } = await network.connect());
    [owner, alice] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const Factory = await ethers.getContractFactory("ALULogoToken");
    token = await Factory.deploy(owner.address);
    await token.waitForDeployment();
  });

  // Test 6
  it("mints the full supply of 1,000,000 ALUT to the logo owner", async function () {
    expect(await token.totalSupply()).to.equal(TOTAL_SUPPLY);
    expect(await token.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY);
  });

  // Test 7
  it("distributeShares() transfers tokens from owner to recipient", async function () {
    const amount = ethers.parseEther("100000");
    await token.distributeShares(alice.address, amount);
    expect(await token.balanceOf(alice.address)).to.equal(amount);
    expect(await token.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY - amount);
  });

  // Test 8
  it("ownershipPercentage() returns the correct percentage", async function () {
    const amount = ethers.parseEther("500000"); // 50 %
    await token.distributeShares(alice.address, amount);
    expect(await token.ownershipPercentage(alice.address)).to.equal(50n);
    expect(await token.ownershipPercentage(owner.address)).to.equal(50n);
  });
});
