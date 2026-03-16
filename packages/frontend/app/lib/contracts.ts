import { Contract, JsonRpcProvider } from "ethers";
import type { Signer } from "ethers";

export const REGISTRY_ADDRESS = "0xd8a344B144E4C0E088004c700Bd7E64bB4bF51B3";
export const TOKEN_ADDRESS = "0x5bE346e6F0F5876288c9121d1C32F259a83E5157";

const REGISTRY_ABI = [
  "function registerAsset(string name, string fileType, bytes32 contentHash) external returns (uint256)",
  "function verifyLogoIntegrity(uint256 tokenId, bytes32 contentHash) external view returns (bool valid, string memory message)",
  "function getAsset(uint256 tokenId) external view returns (tuple(string name, string fileType, bytes32 contentHash, address registrant, uint256 timestamp))",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "event AssetRegistered(uint256 indexed tokenId, address indexed registrant, bytes32 contentHash, string name)",
];

const TOKEN_ABI = [
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function ownershipPercentage(address account) external view returns (uint256)",
  "function distributeShares(address recipient, uint256 amount) external",
  "function owner() external view returns (address)",
];

// Read-only — no wallet needed (used on verify page)
// batchMaxCount: 1 prevents ethers from batching calls, which hits free-tier limits
const readProvider = new JsonRpcProvider(
  import.meta.env.VITE_RPC_URL || "https://sepolia.drpc.org",
  undefined,
  { batchMaxCount: 1 }
);

export const getRegistryReadOnly = () => new Contract(REGISTRY_ADDRESS, REGISTRY_ABI, readProvider);
export const getTokenReadOnly    = () => new Contract(TOKEN_ADDRESS, TOKEN_ABI, readProvider);
export const getRegistryWithSigner = (signer: Signer) => new Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signer);
export const getTokenWithSigner    = (signer: Signer) => new Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
