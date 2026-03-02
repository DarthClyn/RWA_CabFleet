// scripts/simulateFulfill.js
// Usage: npx hardhat run scripts/simulateFulfill.js --network baseSepolia

const { ethers } = require("hardhat");
const deployed = require("../deployed.json");

async function main() {
  const [admin] = await ethers.getSigners();
  const vault = await ethers.getContractAt("RWAAsyncVault", deployed.RWAAsyncVault);
  const user = "0x3A7fECFe9057E1A3CcAdB313D57b94E755a2d9D6";

  // Simulate fulfillDeposit call
  try {
    const gasEstimate = await vault.estimateGas.fulfillDeposit(user);
    console.log("Estimated gas for fulfillDeposit:", gasEstimate.toString());
    // If you want, you can also call staticCall to check for reverts
    await vault.callStatic.fulfillDeposit(user);
    console.log("Simulation: fulfillDeposit would succeed.");
  } catch (err) {
    console.error("Simulation: fulfillDeposit would revert.");
    if (err.error && err.error.message) {
      console.error("Revert reason:", err.error.message);
    } else if (err.message) {
      console.error("Revert reason:", err.message);
    } else {
      console.error(err);
    }
  }
}

main().catch(console.error);
