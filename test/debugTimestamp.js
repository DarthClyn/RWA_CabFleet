// scripts/debugTimestamp.js
// Usage: npx hardhat run scripts/debugTimestamp.js --network baseSepolia

const { ethers } = require("hardhat");
const deployed = require("../deployed.json");

async function main() {
  const [admin] = await ethers.getSigners();
  const vault = await ethers.getContractAt("RWAAsyncVault", deployed.RWAAsyncVault);

  // Get current block timestamp
  const block = await ethers.provider.getBlock("latest");
  console.log("Current block.timestamp:", block.timestamp, new Date(block.timestamp * 1000).toLocaleString());

  // Print lockSeconds
  const lockSeconds = await vault.lockSeconds();
  console.log("Vault lockSeconds:", lockSeconds.toString());

  // Print deposit struct for a test user (replace with actual address)
  const user = "0xD3B1146d702c1d971eD6F485206AA5065Bf7a0b1";
  const deposit = await vault.deposits(user);
  console.log(`\nDeposit struct for ${user}:`);
  console.log("  usdcAmount:", ethers.utils.formatUnits(deposit.usdcAmount, 6));
  console.log("  timestamp:", deposit.timestamp.toString(), new Date(deposit.timestamp.toNumber() * 1000).toLocaleString());
  console.log("  status:", deposit.status.toString());
  console.log("  unlockTime:", (deposit.timestamp.add(lockSeconds)).toString(), new Date(deposit.timestamp.add(lockSeconds).toNumber() * 1000).toLocaleString());
}

main().catch(console.error);
