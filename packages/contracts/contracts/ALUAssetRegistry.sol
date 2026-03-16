// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title ALUAssetRegistry
 * @notice Registers digital assets as NFTs on the Ethereum blockchain.
 *         Each asset is identified by its SHA-256 content hash, ensuring
 *         no duplicate registrations. The NFT acts as an immutable
 *         certificate of registration tied to the original file.
 */
contract ALUAssetRegistry is ERC721 {
    // -------------------------------------------------------------------------
    // Data
    // -------------------------------------------------------------------------

    struct AssetMetadata {
        string  name;         // human-readable asset name
        string  fileType;     // e.g. "image/png"
        bytes32 contentHash;  // SHA-256 hash of the file (bytes32)
        address registrant;   // wallet address that registered the asset
        uint256 timestamp;    // Unix timestamp of registration
    }

    /// @notice Counter used to assign sequential token IDs (starts at 0, first token is 1).
    uint256 private _tokenIdCounter;

    /// @notice Maps token ID → asset metadata.
    mapping(uint256 => AssetMetadata) private _assets;

    /// @notice Maps content hash → already registered flag (duplicate guard).
    mapping(bytes32 => bool) private _hashRegistered;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event AssetRegistered(
        uint256 indexed tokenId,
        address indexed registrant,
        bytes32 contentHash,
        string  name
    );

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor() ERC721("ALU Asset Registry", "ALUAR") {}

    // -------------------------------------------------------------------------
    // Functions
    // -------------------------------------------------------------------------

    /**
     * @notice Register a new asset as an NFT.
     * @param name        Human-readable name for the asset.
     * @param fileType    MIME type or file extension, e.g. "image/png".
     * @param contentHash SHA-256 hash of the file, encoded as bytes32.
     * @return tokenId    The newly minted token ID.
     */
    function registerAsset(
        string  calldata name,
        string  calldata fileType,
        bytes32          contentHash
    ) external returns (uint256 tokenId) {
        require(!_hashRegistered[contentHash], "ALUAssetRegistry: asset already registered");

        _tokenIdCounter += 1;
        tokenId = _tokenIdCounter;

        _safeMint(msg.sender, tokenId);

        _assets[tokenId] = AssetMetadata({
            name:        name,
            fileType:    fileType,
            contentHash: contentHash,
            registrant:  msg.sender,
            timestamp:   block.timestamp
        });

        _hashRegistered[contentHash] = true;

        emit AssetRegistered(tokenId, msg.sender, contentHash, name);
    }

    /**
     * @notice Verify that a token's stored hash matches a supplied hash.
     * @param tokenId     The token to check.
     * @param contentHash The hash to compare against the stored record.
     * @return valid      True if the hashes match, false otherwise.
     * @return message    A human-readable authenticity message.
     */
    function verifyLogoIntegrity(
        uint256 tokenId,
        bytes32 contentHash
    ) external view returns (bool valid, string memory message) {
        if (_assets[tokenId].contentHash == contentHash) {
            return (true, "Logo is authentic.");
        }
        return (false, "Warning: logo does not match.");
    }

    /**
     * @notice Retrieve the full metadata record for a registered asset.
     * @param tokenId The token whose metadata to return.
     * @return        The AssetMetadata struct for that token.
     */
    function getAsset(uint256 tokenId) external view returns (AssetMetadata memory) {
        return _assets[tokenId];
    }
}
