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

  // Test 9
  it("frontend reads totalSupply as 1,000,000 ALUT", async function () {
    const supply = await token.totalSupply();
    expect(supply).to.equal(TOTAL_SUPPLY);
    const humanReadable = ethers.formatEther(supply);
    expect(humanReadable).to.equal("1000000.0");
  });
});

describe("Frontend Hashing Utility", function () {
  // Test 10
  it("hashing function returns correct SHA-256 bytes32 for a known file", async function () {
    const fileBuffer = fs.readFileSync(logoPath);
    const hash = "0x" + crypto.createHash("sha256")
      .update(fileBuffer)
      .digest("hex");
    // Must be 0x-prefixed 64-char hex (bytes32 format)
    expect(hash).to.match(/^0x[0-9a-f]{64}$/);
    expect(hash).to.equal(logoHash);
  });
});

describe("Frontend Verification Integration", function () {
  let ethers;
  let registry;
  let owner;

  before(async function () {
    ({ ethers } = await network.connect());
    [owner] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const Factory = await ethers.getContractFactory("ALUAssetRegistry");
    registry = await Factory.deploy();
    await registry.waitForDeployment();
    await registry.registerAsset("ALU Official Logo", "image/png", logoHash);
  });

  // Test 11
  it("verifyLogoIntegrity with correct hash displays success result", async function () {
    const [valid] = await registry.verifyLogoIntegrity(1, logoHash);
    const displayResult = valid
      ? "Logo Verified — This is the authentic ALU logo"
      : "Warning: This logo has been modified or is not the official ALU logo";
    expect(valid).to.be.true;
    expect(displayResult).to.equal("Logo Verified — This is the authentic ALU logo");
  });

  // Test 12
  it("verifyLogoIntegrity with wrong hash displays failure result", async function () {
    const [valid] = await registry.verifyLogoIntegrity(1, WRONG_HASH);
    const displayResult = valid
      ? "Logo Verified — This is the authentic ALU logo"
      : "Warning: This logo has been modified or is not the official ALU logo";
    expect(valid).to.be.false;
    expect(displayResult).to.equal("Warning: This logo has been modified or is not the official ALU logo");
  });
});

describe("Frontend Token Distribution Integration", function () {
  let ethers;
  let token;
  let owner, recipient;

  before(async function () {
    ({ ethers } = await network.connect());
    [owner, recipient] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const Factory = await ethers.getContractFactory("ALULogoToken");
    token = await Factory.deploy(owner.address);
    await token.waitForDeployment();
  });

  // Test 13
  it("distributeShares correctly updates recipient balance after transfer", async function () {
    const amount = ethers.parseEther("250000");
    expect(await token.balanceOf(recipient.address)).to.equal(0n);
    await token.distributeShares(recipient.address, amount);
    expect(await token.balanceOf(recipient.address)).to.equal(amount);
    expect(await token.ownershipPercentage(recipient.address)).to.equal(25n);
  });
});
