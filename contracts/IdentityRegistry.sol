// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ======================================================================
// IdentityRegistry.sol
// ======================================================================
contract IdentityRegistry {
    address public owner;
    mapping(address => bool) public isVerified;

    event IdentityUpdated(address indexed account, bool status);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function updateIdentity(address account, bool status) external onlyOwner {
        isVerified[account] = status;
        emit IdentityUpdated(account, status);
    }

    function verifyMultiple(address[] calldata accounts, bool status) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            isVerified[accounts[i]] = status;
            emit IdentityUpdated(accounts[i], status);
        }
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }
}
