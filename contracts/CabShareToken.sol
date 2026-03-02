// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// ======================================================================
// CabShareToken.sol
// ======================================================================
interface IIdentityRegistry {
    function isVerified(address account) external view returns (bool);
}

contract CabShareToken is ERC20, Ownable {
    IIdentityRegistry public immutable identityRegistry;
    uint256 public sharePrice;          // in 1e6 (USDC decimals)
    address public vault;

    event SharePriceUpdated(uint256 newPrice);
    event ForcedTransfer(address indexed from, address indexed to, uint256 amount);

    constructor(
        address _identityRegistry,
        address _vault
    ) ERC20("Fractional Cab Fleet Share", "CAB") Ownable(msg.sender) {
        identityRegistry = IIdentityRegistry(_identityRegistry);
        vault = _vault;
        sharePrice = 1_000_000; // 1 USDC per share at start (6 decimals)
    }

    // Allow owner to set vault address ONCE after deployment
    function setVault(address _vault) external onlyOwner {
        require(vault == address(0), "Vault already set");
        require(_vault != address(0), "Invalid vault");
        vault = _vault;
    }

    // Only vault can mint (after fulfilling deposit)
    function mint(address to, uint256 usdcAmount) external {
        require(msg.sender == vault, "Only vault can mint");
        require(identityRegistry.isVerified(to), "Not KYC verified");
        uint256 tokens = (usdcAmount * 1e18) / sharePrice;
        _mint(to, tokens);
    }

    // Burn when redeeming (called by vault)
    function burnFromVault(address from, uint256 tokenAmount) external {
        require(msg.sender == vault, "Only vault");
        _burn(from, tokenAmount);
    }

    // Admin updates NAV (share price) — called after revenue/valuation update
    function updateSharePrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Price cannot be zero");
        sharePrice = newPrice;
        emit SharePriceUpdated(newPrice);
    }

    // ERC-3643 style: only verified users can transfer
    function _update(address from, address to, uint256 value) internal virtual override {
        if (from != address(0) && to != address(0)) {
            require(identityRegistry.isVerified(from),  "Sender not verified");
            require(identityRegistry.isVerified(to),    "Receiver not verified");
        }
        super._update(from, to, value);
    }

    // ERC-7943 style legal recovery
    function forceTransfer(address from, address to, uint256 amount) external onlyOwner {
        require(identityRegistry.isVerified(to), "Recovery target not verified");
        _transfer(from, to, amount);
        emit ForcedTransfer(from, to, amount);
    }
}
