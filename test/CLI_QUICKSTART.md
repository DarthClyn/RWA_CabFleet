# 🚀 Admin CLI - Quick Start

## Test the CLI

```bash
# 1. Test dashboard (should show contract info)
node admincli.js

# 2. Check help
node admincli.js help

# 3. Check a user's status (use any address)
node admincli.js check-user 0x742d35Cc6A19BF267b73180e807160c9643742eA
```

## 🔄 Main Admin Workflow

### When User Deposits:

1. **User submits deposit request** (via frontend)
   - User calls `requestDeposit(100 USDC)` 
   - USDC transferred to vault
   - Request created with 5-minute lock

2. **Admin verifies user** (if needed):
   ```bash
   node admincli.js verify 0x742d35Cc6A19BF267b73180e807160c9643742eA
   ```

3. **Admin checks pending deposits**:
   ```bash
   node admincli.js check-deposit 0x742d35Cc6A19BF267b73180e807160c9643742eA
   ```

4. **Admin fulfills deposit** (after 5-min lock):
   ```bash
   node admincli.js fulfill-deposit 0x742d35Cc6A19BF267b73180e807160c9643742eA
   ```
   ✅ **CAB tokens minted to user!**

## 💡 Key Commands

```bash
# Dashboard - shows everything
node admincli.js

# Process deposits (most important!)
node admincli.js fulfill-deposit <user_address>
node admincli.js fulfill-redeem <user_address>

# User management
node admincli.js verify <user_address>
node admincli.js check-user <user_address>

# Update CAB share price
node admincli.js update-price 1.25

# Monitor activity
node admincli.js events
```

## 📋 Troubleshooting

### "No pending deposit found"
- Check with: `node admincli.js check-deposit <address>`
- User may not have requested deposit yet
- Request may be already fulfilled or cancelled

### "Lock not expired"  
- Wait 5 minutes after deposit request
- Or change lock time: `node admincli.js set-lock 60`

### "Not owner" errors
- Make sure you're using the admin wallet
- Check that hardhat is configured correctly

### Can't connect to network
- Check hardhat.config.js network settings
- Ensure RPC URL is working

## 🎯 Most Common Tasks

**Process user deposits:**
```bash
node admincli.js fulfill-deposit 0x...
```

**Verify new users:**
```bash
node admincli.js verify 0x...
```

**Update token pricing:**
```bash
node admincli.js update-price 1.20
```

**Monitor system:**
```bash
node admincli.js
```