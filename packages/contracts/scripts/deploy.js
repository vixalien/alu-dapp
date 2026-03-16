import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Registry = await ethers.getContractFactory("ALUAssetRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("ALUAssetRegistry deployed to:", registryAddress);

  const Token = await ethers.getContractFactory("ALULogoToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("ALULogoToken deployed to:", tokenAddress);

  console.log("\nCopy these into packages/frontend/app/lib/contracts.ts:");
  console.log(`REGISTRY_ADDRESS = "${registryAddress}"`);
  console.log(`TOKEN_ADDRESS    = "${tokenAddress}"`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
