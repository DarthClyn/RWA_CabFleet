# RWA Admin CLI Setup & Usage Guide

## 🚀 Quick Start

1. **Ensure dependencies are installed:**
   ```bash
   npm install dotenv hardhat ethers
   ```

2. **Run the admin dashboard:**
   ```bash
   node admincli.js
   ```

3. **See all commands:**
   ```bash
   node admincli.js help
   ```

## 📋 Common Admin Tasks

### User Management
```bash
# Verify a user for KYC (required before they can receive CAB tokens)
node admincli.js verify 0x742d35Cc6A19BF267b73180e807160c9643742eA

# Check user status and pending deposits
node admincli.js check-user 0x742d35Cc6A19BF267b73180e807160c9643742eA
```

### Process Deposits (KEY TASK!)
```bash
# Check if user has pending deposit
node admincli.js check-deposit 0x742d35Cc6A19BF267b73180e807160c9643742eA

# Fulfill the deposit (mints CAB tokens to user)
node admincli.js fulfill-deposit 0x742d35Cc6A19BF267b73180e807160c9643742eA
```

### Update Share Price (NAV)
```bash
# Update CAB token price to $1.25 per share
node admincli.js update-price 1.25
```

### System Settings
```bash
# Set lock period to 5 minutes (300 seconds)
node admincli.js set-lock 300

# Set lock period to 1 hour (3600 seconds) 
node admincli.js set-lock 3600
```

## 🔄 Typical Workflow

When users deposit:

1. **User calls `requestDeposit()`** → USDC locked in vault, request created
2. **Admin verifies user** (if not already): `node admincli.js verify <address>`
3. **Admin fulfills deposit** (after lock period): `node admincli.js fulfill-deposit <address>`
4. **CAB tokens minted** to user automatically

## 📊 Monitoring

```bash
# View full dashboard
node admincli.js

# Check recent activity
node admincli.js events

# Check specific user
node admincli.js check-user 0x...
```

## 🔧 Environment Setup

Make sure `.env` file contains:
```
PRIVATE_KEY=0x... (admin wallet private key)
```

The script uses Hardhat's network configuration automatically.

## ⚠️ Important Notes

- **Deposits require 2 steps:** User request → Admin fulfill
- **Users must be verified** before receiving CAB tokens
- **Lock period** prevents immediate deposits (anti-MEV protection)
- **Share price updates** affect all future transactions
- **Always verify deposit details** before fulfilling

## 🚨 Emergency Functions

```bash
# Emergency withdraw USDC from vault
node admincli.js emergency-withdraw <to_address> <amount>

# Force transfer CAB tokens (compliance/recovery)
node admincli.js force-transfer <from> <to> <amount>
```

Use emergency functions only when absolutely necessary!