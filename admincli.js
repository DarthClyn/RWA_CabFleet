#!/usr/bin/env node

/**
 * RWA Admin CLI - Comprehensive Admin Dashboard & Functions
 * 
 * Usage: 
 *   node admincli.js                    # Show dashboard
 *   node admincli.js help              # Show all commands
 *   node admincli.js fulfill-deposit <user>
 *   node admincli.js fulfill-redeem <user>
 *   node admincli.js verify-user <user>
 *   node admincli.js update-price <price>
 */


require('dotenv').config();
const { ethers } = require('ethers');
const readline = require('readline');

// Load contract addresses from deployed.json
const deployed = require('./deployed.json');
const addresses = {
  usdc: deployed.USDC,
  vault: deployed.RWAAsyncVault,
  token: deployed.CabShareToken,
  identity: deployed.IdentityRegistry,
};

// Comprehensive ABIs
const vaultAbi = [
  "function deposits(address) external view returns (uint256 usdcAmount, uint256 timestamp, uint8 status)",
  "function redeems(address) external view returns (uint256 tokenAmount, uint256 timestamp, uint8 status)",
  "function fulfillDeposit(address user) external",
  "function fulfillRedeem(address user) external",
  "function setLockSeconds(uint256 newLock) external",
  "function emergencyWithdrawUSDC(address to, uint256 amount) external",
  "function updateTokenSharePrice(uint256 newPrice) external",
  "function lockSeconds() external view returns (uint256)",
  "event DepositRequested(address indexed user, uint256 usdcAmount)",
  "event DepositFulfilled(address indexed user, uint256 usdcAmount)",
  "event RedeemRequested(address indexed user, uint256 tokenAmount)",
  "event RedeemFulfilled(address indexed user, uint256 usdcPayout)"
];

const tokenAbi = [
  "function balanceOf(address) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function sharePrice() external view returns (uint256)",
  "function updateSharePrice(uint256 newPrice) external",
  "function forceTransfer(address from, address to, uint256 amount) external",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)"
];

const identityAbi = [
  "function isVerified(address) external view returns (bool)",
  "function updateIdentity(address account, bool status) external",
  "function verifyMultiple(address[] accounts, bool status) external",
  "function owner() external view returns (address)"
];

const usdcAbi = [
  "function balanceOf(address) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)"
];

class AdminCLI {
  constructor() {
    this.signer = null;
    this.vault = null;
    this.token = null;
    this.identity = null;
    this.usdc = null;
  }

  async init() {
    try {
      // Use Base Sepolia network from .env
      const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL;
      const privateKey = process.env.PRIVATE_KEY;
      if (!rpcUrl || !privateKey) {
        throw new Error('BASE_SEPOLIA_RPC_URL and PRIVATE_KEY must be set in .env');
      }
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      this.signer = new ethers.Wallet(privateKey, provider);
      console.log(`🔑 Admin wallet: ${this.signer.address}\n`);

      // Initialize contracts
      this.vault = new ethers.Contract(addresses.vault, vaultAbi, this.signer);
      this.token = new ethers.Contract(addresses.token, tokenAbi, this.signer);
      this.identity = new ethers.Contract(addresses.identity, identityAbi, this.signer);
      this.usdc = new ethers.Contract(addresses.usdc, usdcAbi, this.signer);

    } catch (error) {
      console.log('❌ Failed to initialize:', error.message);
      process.exit(1);
    }
  }

  async showDashboard() {
    console.log('🏗️  RWA CAB FLEET ADMIN DASHBOARD');
    console.log('='.repeat(60));
    
    try {
      // Token Info
      const tokenName = await this.token.name();
      const tokenSymbol = await this.token.symbol();
      const totalSupply = await this.token.totalSupply();
      const sharePrice = await this.token.sharePrice();
      
      console.log(`\n📊 TOKEN INFO`);
      console.log(`   Name: ${tokenName} (${tokenSymbol})`);
      console.log(`   Total Supply: ${ethers.utils.formatEther(totalSupply)} CAB`);
      console.log(`   Share Price: $${ethers.utils.formatUnits(sharePrice, 6)} USDC`);
      console.log(`   Market Cap: $${((Number(ethers.utils.formatEther(totalSupply)) * Number(ethers.utils.formatUnits(sharePrice, 6)))).toFixed(2)}`);

      // Vault Info
      const lockSeconds = await this.vault.lockSeconds();
      const vaultUsdcBalance = await this.usdc.balanceOf(addresses.vault);
      const vaultTokenBalance = await this.token.balanceOf(addresses.vault);
      
      console.log(`\n🏦 VAULT INFO`);
      console.log(`   Lock Period: ${lockSeconds} seconds (${Math.floor(lockSeconds/60)} minutes)`);
      console.log(`   USDC Balance: ${ethers.utils.formatUnits(vaultUsdcBalance, 6)} USDC`);
      console.log(`   CAB Balance: ${ethers.utils.formatEther(vaultTokenBalance)} CAB`);

      // Admin Info
      const adminUsdcBalance = await this.usdc.balanceOf(this.signer.address);
      const adminTokenBalance = await this.token.balanceOf(this.signer.address);
      
      console.log(`\n👤 ADMIN WALLET`);
      console.log(`   Address: ${this.signer.address}`);
      console.log(`   USDC Balance: ${ethers.utils.formatUnits(adminUsdcBalance, 6)} USDC`);
      console.log(`   CAB Balance: ${ethers.utils.formatEther(adminTokenBalance)} CAB`);

      // Recent Events (last 100 blocks)
      console.log(`\n📈 RECENT ACTIVITY`);
      await this.showRecentEvents();

    } catch (error) {
      console.log('❌ Dashboard error:', error.message);
    }
  }

  async showRecentEvents() {
    try {
      const currentBlock = await ethers.provider.getBlockNumber();
      const fromBlock = currentBlock - 100;
      
      // Get deposit events
      const depositFilter = this.vault.filters.DepositRequested();
      const depositEvents = await this.vault.queryFilter(depositFilter, fromBlock);
      
      const fulfillFilter = this.vault.filters.DepositFulfilled();
      const fulfillEvents = await this.vault.queryFilter(fulfillFilter, fromBlock);
      
      const redeemFilter = this.vault.filters.RedeemRequested();
      const redeemEvents = await this.vault.queryFilter(redeemFilter, fromBlock);

      console.log(`   📥 Deposits Requested: ${depositEvents.length}`);
      console.log(`   ✅ Deposits Fulfilled: ${fulfillEvents.length}`);
      console.log(`   📤 Redeems Requested: ${redeemEvents.length}`);
      
      if (depositEvents.length > 0) {
        console.log(`\n   Latest Deposits:`);
        depositEvents.slice(-5).forEach(event => {
          console.log(`     • ${event.args.user.slice(0,8)}... - $${ethers.utils.formatUnits(event.args.usdcAmount, 6)} USDC`);
        });
      }

    } catch (error) {
      console.log('   ⚠️ Could not fetch events:', error.message.split('\n')[0]);
    }
  }

  async checkUserDeposit(userAddress) {
    try {
      const deposit = await this.vault.deposits(userAddress);
      const status = ['None', 'Pending', 'Fulfilled', 'Cancelled'][deposit.status];
      
      console.log(`\n👤 USER DEPOSIT STATUS: ${userAddress}`);
      console.log(`   Amount: ${ethers.utils.formatUnits(deposit.usdcAmount, 6)} USDC`);
      console.log(`   Status: ${status}`);
      // Ensure correct timestamp parsing
      const ts = (deposit.timestamp.toNumber ? deposit.timestamp.toNumber() : Number(deposit.timestamp));
      console.log(`   Timestamp: ${new Date(ts * 1000).toLocaleString()}`);
      
      if (deposit.status === 1) { // Pending
        const lockSeconds = await this.vault.lockSeconds();
        const unlockTs = ts + (lockSeconds.toNumber ? lockSeconds.toNumber() : Number(lockSeconds));
        const unlockTime = new Date(unlockTs * 1000);
        console.log(`   🔓 Unlock Time: ${unlockTime.toLocaleString()}`);
        console.log(`   ⏰ Can Fulfill: ${unlockTime < new Date() ? 'YES' : 'NO'}`);
      }
      
      return deposit;
    } catch (error) {
      console.log('❌ Error checking deposit:', error.message);
      return null;
    }
  }

  async fulfillDeposit(userAddress) {
    try {
      console.log(`\n🔄 Fulfilling deposit for ${userAddress}...`);
      
      // Check deposit first
      const deposit = await this.checkUserDeposit(userAddress);
      if (!deposit || deposit.status !== 1) {
        console.log('❌ No pending deposit found');
        return;
      }

      const tx = await this.vault.fulfillDeposit(userAddress);
      console.log(`📤 Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Deposit fulfilled! Gas used: ${receipt.gasUsed.toString()}`);
      
      // Show updated balances
      const userTokenBalance = await this.token.balanceOf(userAddress);
      console.log(`💰 User CAB balance: ${ethers.utils.formatEther(userTokenBalance)} CAB`);
      
    } catch (error) {
      console.log('❌ Error fulfilling deposit:', error.message);
    }
  }

  async fulfillRedeem(userAddress) {
    try {
      console.log(`\n🔄 Fulfilling redeem for ${userAddress}...`);
      
      const redeem = await this.vault.redeems(userAddress);
      const status = ['None', 'Pending', 'Fulfilled', 'Cancelled'][redeem.status];
      
      console.log(`   Token Amount: ${ethers.utils.formatEther(redeem.tokenAmount)} CAB`);
      console.log(`   Status: ${status}`);
      
      if (redeem.status !== 1) {
        console.log('❌ No pending redeem found');
        return;
      }

      const tx = await this.vault.fulfillRedeem(userAddress);
      console.log(`📤 Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Redeem fulfilled! Gas used: ${receipt.gasUsed.toString()}`);
      
    } catch (error) {
      console.log('❌ Error fulfilling redeem:', error.message);
    }
  }

  async verifyUser(userAddress) {
    try {
      console.log(`\n🔄 Verifying user ${userAddress}...`);
      
      const tx = await this.identity.updateIdentity(userAddress, true);
      console.log(`📤 Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ User verified! Gas used: ${receipt.gasUsed.toString()}`);
      
    } catch (error) {
      console.log('❌ Error verifying user:', error.message);
    }
  }

  async unverifyUser(userAddress) {
    try {
      console.log(`\n🔄 Unverifying user ${userAddress}...`);
      
      const tx = await this.identity.updateIdentity(userAddress, false);
      console.log(`📤 Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ User unverified! Gas used: ${receipt.gasUsed.toString()}`);
      
    } catch (error) {
      console.log('❌ Error unverifying user:', error.message);
    }
  }

  async updateSharePrice(newPriceUSD) {
    try {
      console.log(`\n🔄 Updating share price to $${newPriceUSD} USDC...`);
      
      const newPrice = ethers.utils.parseUnits(newPriceUSD.toString(), 6);
      const tx = await this.token.updateSharePrice(newPrice);
      console.log(`📤 Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Share price updated! Gas used: ${receipt.gasUsed.toString()}`);
      
    } catch (error) {
      console.log('❌ Error updating share price:', error.message);
    }
  }

  async setLockTime(seconds) {
    try {
      console.log(`\n🔄 Setting lock time to ${seconds} seconds (${Math.floor(seconds/60)} minutes)...`);
      
      const tx = await this.vault.setLockSeconds(seconds);
      console.log(`📤 Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Lock time updated! Gas used: ${receipt.gasUsed.toString()}`);
      
    } catch (error) {
      console.log('❌ Error setting lock time:', error.message);
    }
  }

  async emergencyWithdraw(toAddress, amountUSD) {
    try {
      console.log(`\n🚨 EMERGENCY: Withdrawing ${amountUSD} USDC to ${toAddress}...`);
      
      const amount = ethers.utils.parseUnits(amountUSD.toString(), 6);
      const tx = await this.vault.emergencyWithdrawUSDC(toAddress, amount);
      console.log(`📤 Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Emergency withdrawal completed! Gas used: ${receipt.gasUsed.toString()}`);
      
    } catch (error) {
      console.log('❌ Error in emergency withdrawal:', error.message);
    }
  }

  async forceTransfer(fromAddress, toAddress, amountCAB) {
    try {
      console.log(`\n🚨 FORCE TRANSFER: ${amountCAB} CAB from ${fromAddress} to ${toAddress}...`);
      
      const amount = ethers.utils.parseEther(amountCAB.toString());
      const tx = await this.token.forceTransfer(fromAddress, toAddress, amount);
      console.log(`📤 Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Force transfer completed! Gas used: ${receipt.gasUsed.toString()}`);
      
    } catch (error) {
      console.log('❌ Error in force transfer:', error.message);
    }
  }

  async batchVerifyUsers(addresses, status = true) {
    try {
      const statusText = status ? 'verify' : 'unverify';
      console.log(`\n🔄 Batch ${statusText} ${addresses.length} users...`);
      
      const tx = await this.identity.verifyMultiple(addresses, status);
      console.log(`📤 Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Batch ${statusText} completed! Gas used: ${receipt.gasUsed.toString()}`);
      
    } catch (error) {
      console.log('❌ Error in batch verify:', error.message);
    }
  }
  
  showHelp() {
    console.log(`
🏗️  RWA CAB FLEET ADMIN CLI

USAGE:
  node admincli.js [command] [arguments]

COMMANDS:
  (no command)                    Show admin dashboard
  help                           Show this help
  
  📊 USER MANAGEMENT:
  verify <address>               Verify a user for KYC
  unverify <address>            Unverify a user
  check-user <address>          Check user verification and deposit status
  
  💰 DEPOSIT/REDEEM MANAGEMENT:
  fulfill-deposit <address>      Fulfill pending deposit request
  fulfill-redeem <address>       Fulfill pending redeem request
  check-deposit <address>        Check user's deposit status
  
  ⚙️  SYSTEM SETTINGS:
  update-price <price>           Update CAB share price (e.g. 1.25)
  set-lock <seconds>             Set lock period in seconds
  
  🚨 EMERGENCY:
  emergency-withdraw <to> <amount>  Emergency withdraw USDC from vault
  force-transfer <from> <to> <amount>  Force transfer CAB tokens
  
  📈 MONITORING:
  events                         Show recent events
  balances                      Show all contract balances

EXAMPLES:
  node admincli.js verify 0x742...7eA
  node admincli.js fulfill-deposit 0x742...7eA
  node admincli.js update-price 1.25
  node admincli.js set-lock 300
  node admincli.js emergency-withdraw 0x742...7eA 1000

ENVIRONMENT:
  Requires hardhat network configuration
  Uses first signer from hardhat accounts
  
`);
  }

  async run() {
    await this.init();
    
    const command = process.argv[2];
    const arg1 = process.argv[3];
    const arg2 = process.argv[4];
    const arg3 = process.argv[5];

    switch (command) {
      case undefined:
        await this.showDashboard();
        break;
        
      case 'help':
        this.showHelp();
        break;
        
      case 'verify':
        if (!arg1) {
          console.log('❌ Usage: node admincli.js verify <address>');
          return;
        }
        await this.verifyUser(arg1);
        break;
        
      case 'unverify':
        if (!arg1) {
          console.log('❌ Usage: node admincli.js unverify <address>');
          return;
        }
        await this.unverifyUser(arg1);
        break;
        
      case 'fulfill-deposit':
        if (!arg1) {
          console.log('❌ Usage: node admincli.js fulfill-deposit <address>');
          return;
        }
        await this.fulfillDeposit(arg1);
        break;
        
      case 'fulfill-redeem':
        if (!arg1) {
          console.log('❌ Usage: node admincli.js fulfill-redeem <address>');
          return;
        }
        await this.fulfillRedeem(arg1);
        break;
        
      case 'check-deposit':
        if (!arg1) {
          console.log('❌ Usage: node admincli.js check-deposit <address>');
          return;
        }
        await this.checkUserDeposit(arg1);
        break;
        
      case 'check-user':
        if (!arg1) {
          console.log('❌ Usage: node admincli.js check-user <address>');
          return;
        }
        const isVerified = await this.identity.isVerified(arg1);
        console.log(`\n👤 USER: ${arg1}`);
        console.log(`   ✅ Verified: ${isVerified ? 'YES' : 'NO'}`);
        await this.checkUserDeposit(arg1);
        break;
        
      case 'update-price':
        if (!arg1) {
          console.log('❌ Usage: node admincli.js update-price <price>');
          return;
        }
        await this.updateSharePrice(parseFloat(arg1));
        break;
        
      case 'set-lock':
        if (!arg1) {
          console.log('❌ Usage: node admincli.js set-lock <seconds>');
          return;
        }
        await this.setLockTime(parseInt(arg1));
        break;
        
      case 'events':
        console.log('\n📈 RECENT EVENTS');
        await this.showRecentEvents();
        break;
        
      case 'balances':
        await this.showDashboard();
        break;
        
      case 'emergency-withdraw':
        if (!arg1 || !arg2) {
          console.log('❌ Usage: node admincli.js emergency-withdraw <to_address> <amount_usdc>');
          return;
        }
        await this.emergencyWithdraw(arg1, parseFloat(arg2));
        break;
        
      case 'force-transfer':
        if (!arg1 || !arg2 || !arg3) {
          console.log('❌ Usage: node admincli.js force-transfer <from> <to> <amount_cab>');
          return;
        }
        await this.forceTransfer(arg1, arg2, parseFloat(arg3));
        break;
        
      default:
        console.log(`❌ Unknown command: ${command}`);
        console.log('Run "node admincli.js help" for available commands');
    }
  }
}

// Run the CLI
const cli = new AdminCLI();
cli.run().catch(console.error);