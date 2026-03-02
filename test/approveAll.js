// scripts/approveAll.js
// Approve vault for USDC and CAB tokens for the current signer
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [signer] = await ethers.getSigners();
  const user = signer.address;
  const filePath = path.join(__dirname, "..", "deployed.json");
  const deployed = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const vault = deployed.RWAAsyncVault;
  const usdc = await ethers.getContractAt("MockUSDC", deployed.USDC);
  const cab = await ethers.getContractAt("CabShareToken", deployed.CabShareToken);

  const usdcAmount = ethers.utils.parseUnits("1000000000", 6); // Approve a large amount
  const cabAmount = ethers.utils.parseUnits("1000000000", 18); // Approve a large amount

  console.log("Approving vault for USDC...");
  const tx1 = await usdc.approve(vault, usdcAmount);
  await tx1.wait();
  console.log("USDC approved.");

  console.log("Approving vault for CAB...");
  const tx2 = await cab.approve(vault, cabAmount);
  await tx2.wait();
  console.log("CAB approved.");

  console.log("All approvals complete for:", user);

  // Simulate fulfillDeposit and fulfillRedeem as admin (callStatic)
  const vaultContract = await ethers.getContractAt("RWAAsyncVault", vault);
  // Simulate fulfillDeposit for user
  try {
    await vaultContract.callStatic.fulfillDeposit(user);
    console.log("fulfillDeposit: would succeed for", user);
  } catch (e) {
    console.error("fulfillDeposit revert reason:", e.error?.message || e.message);
  }

  // Simulate fulfillRedeem for user
  try {
    await vaultContract.callStatic.fulfillRedeem(user);
    console.log("fulfillRedeem: would succeed for", user);
  } catch (e) {
    console.error("fulfillRedeem revert reason:", e.error?.message || e.message);
  }
}

main().catch(console.error);
