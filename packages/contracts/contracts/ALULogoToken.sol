// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ALULogoToken
 * @notice ERC-20 token representing fractional ownership of the ALU logo.
 *         1,000,000 ALUT tokens are minted to the logo owner at deployment.
 *         The owner distributes shares via distributeShares().
 */
contract ALULogoToken is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = 1_000_000 * 10 ** 18;

    /**
     * @param logoOwner The address that receives the full token supply.
     *                  Typically the deployer — the original logo owner.
     */
    constructor(address logoOwner)
        ERC20("ALU Logo Token", "ALUT")
        Ownable(logoOwner)
    {
        require(logoOwner != address(0), "ALULogoToken: zero address");
        _mint(logoOwner, TOTAL_SUPPLY);
    }

    /**
     * @notice Transfer ownership shares to a recipient.
     * @dev    Restricted to the contract owner (the logo owner).
     *         Transfers from the owner's own balance, not from a separate
     *         reserve — the owner must hold sufficient tokens.
     * @param recipient The address receiving the shares.
     * @param amount    Number of tokens to transfer (in wei units, 18 decimals).
     */
    function distributeShares(address recipient, uint256 amount)
        external
        onlyOwner
    {
        require(amount > 0, "ALULogoToken: amount must be greater than zero");
        _transfer(owner(), recipient, amount);
    }

    /**
     * @notice Returns the ownership percentage of an address as a whole number.
     * @param account The wallet address to query.
     * @return        Percentage of total supply held, rounded down (0–100).
     */
    function ownershipPercentage(address account)
        external
        view
        returns (uint256)
    {
        return (balanceOf(account) * 100) / TOTAL_SUPPLY;
    }
}
