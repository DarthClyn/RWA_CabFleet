// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// ======================================================================
// RWAAsyncVault.sol
// ======================================================================
interface ICabShareToken {
    function mint(address to, uint256 usdcAmount) external;
    function burnFromVault(address from, uint256 tokenAmount) external;
    function sharePrice() external view returns (uint256);
    function updateSharePrice(uint256 newPrice) external;
    // Standard ERC-20 functions that the vault needs ──
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract RWAAsyncVault is Ownable {
    IERC20 public immutable usdc;
    ICabShareToken public immutable token;

    uint256 public lockSeconds = 300; // 5 minutes — for demo / anti-front-run

    enum RequestStatus { None, Pending, Fulfilled, Cancelled }

    struct DepositRequest {
        uint256 usdcAmount;
        uint256 timestamp;
        RequestStatus status;
    }

    struct RedeemRequest {
        uint256 tokenAmount;
        uint256 timestamp;
        RequestStatus status;
    }

    mapping(address => DepositRequest) public deposits;
    mapping(address => RedeemRequest) public redeems;

    event DepositRequested(address indexed user, uint256 usdcAmount);
    event DepositFulfilled(address indexed user, uint256 usdcAmount);
    event DepositCancelled(address indexed user);
    event RedeemRequested(address indexed user, uint256 tokenAmount);
    event RedeemFulfilled(address indexed user, uint256 usdcPayout);
    event RedeemCancelled(address indexed user);

    constructor(address _usdc, address _token) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        token = ICabShareToken(_token);
    }

    // ── DEPOSIT FLOW ────────────────────────────────────────────────

    function requestDeposit(uint256 usdcAmount) external {
        require(usdcAmount > 0, "Amount > 0");
        require(deposits[msg.sender].status == RequestStatus.None, "Pending deposit exists");

        require(usdc.transferFrom(msg.sender, address(this), usdcAmount), "Transfer failed");

        deposits[msg.sender] = DepositRequest({
            usdcAmount: usdcAmount,
            timestamp: block.timestamp,
            status: RequestStatus.Pending
        });

        emit DepositRequested(msg.sender, usdcAmount);
    }

function fulfillDeposit(address user) external onlyOwner {
    DepositRequest storage req = deposits[user];
    require(req.status == RequestStatus.Pending, "Not pending");
    require(block.timestamp >= req.timestamp + lockSeconds, "Lock not expired");

    uint256 amount = req.usdcAmount; // cache before delete
    token.mint(user, amount);
    emit DepositFulfilled(user, amount);

    delete deposits[user];  // ← resets status to 0, usdcAmount=0, timestamp=0
}

    function cancelDeposit() external {
        DepositRequest storage req = deposits[msg.sender];
        require(req.status == RequestStatus.Pending, "Not pending");
        require(block.timestamp >= req.timestamp + lockSeconds * 2, "Too early to cancel");

        uint256 amount = req.usdcAmount;
        req.status = RequestStatus.Cancelled;
        req.usdcAmount = 0;
        req.timestamp = 0;

        usdc.transfer(msg.sender, amount);
        emit DepositCancelled(msg.sender);
    }

    // ── REDEEM FLOW ─────────────────────────────────────────────────

    function requestRedeem(uint256 tokenAmount) external {
        require(tokenAmount > 0, "Amount > 0");
        require(redeems[msg.sender].status == RequestStatus.None, "Pending redeem exists");
        require(token.allowance(msg.sender, address(this)) >= tokenAmount, "Insufficient CAB token allowance- please approve first");
        require(token.transferFrom(msg.sender, address(this), tokenAmount), "Transfer failed");

        redeems[msg.sender] = RedeemRequest({
            tokenAmount: tokenAmount,
            timestamp: block.timestamp,
            status: RequestStatus.Pending
        });

        emit RedeemRequested(msg.sender, tokenAmount);
    }

   function fulfillRedeem(address user) external onlyOwner {
    RedeemRequest storage req = redeems[user];
    require(req.status == RequestStatus.Pending, "Not pending");
    require(block.timestamp >= req.timestamp + lockSeconds, "Lock not expired");

    uint256 tokenAmount = req.tokenAmount;           // cache
    uint256 usdcPayout = (tokenAmount * token.sharePrice()) / 1e18;

    token.burnFromVault(user, tokenAmount);
    usdc.transfer(user, usdcPayout);
    emit RedeemFulfilled(user, usdcPayout);

    delete redeems[user];   // ← ADD THIS LINE (critical!)
}

    function cancelRedeem() external {
        RedeemRequest storage req = redeems[msg.sender];
        require(req.status == RequestStatus.Pending, "Not pending");

        uint256 amount = req.tokenAmount;
        req.status = RequestStatus.Cancelled;
        req.tokenAmount = 0;
        req.timestamp = 0;

        token.transfer(msg.sender, amount);
        emit RedeemCancelled(msg.sender);
    }

    // Admin settings
    function setLockSeconds(uint256 newLock) external onlyOwner {
        lockSeconds = newLock;
    }

    // Emergency — recover stuck funds (very last resort)
    function emergencyWithdrawUSDC(address to, uint256 amount) external onlyOwner {
        usdc.transfer(to, amount);
    }
    function updateTokenSharePrice(uint256 newPrice) external onlyOwner {
    token.updateSharePrice(newPrice);
}
}
