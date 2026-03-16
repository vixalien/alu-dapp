import { Contract, JsonRpcProvider } from "ethers";
import type { Signer } from "ethers";

// Update after deploying to Sepolia
export const REGISTRY_ADDRESS = "0xYOUR_REGISTRY_ADDRESS";
export const TOKEN_ADDRESS = "0xYOUR_TOKEN_ADDRESS";

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
const readProvider = new JsonRpcProvider(
  import.meta.env.VITE_RPC_URL || "https://sepolia.drpc.org"
);

export const getRegistryReadOnly = () => new Contract(REGISTRY_ADDRESS, REGISTRY_ABI, readProvider);
export const getTokenReadOnly    = () => new Contract(TOKEN_ADDRESS, TOKEN_ABI, readProvider);
export const getRegistryWithSigner = (signer: Signer) => new Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signer);
export const getTokenWithSigner    = (signer: Signer) => new Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
