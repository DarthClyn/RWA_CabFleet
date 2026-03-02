// scripts/debugSimulate.js
// Simulate deposit and redeem to print revert reasons
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [signer] = await ethers.getSigners();
  const user = signer.address;
  const filePath = path.join(__dirname, "..", "deployed.json");
  const deployed = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const vault = await ethers.getContractAt("RWAAsyncVault", deployed.RWAAsyncVault);
  const usdc = await ethers.getContractAt("MockUSDC", deployed.USDC);
  const token = await ethers.getContractAt("CabShareToken", deployed.CabShareToken);

  const depositAmount = ethers.utils.parseUnits("10", 6); // 10 USDC
  const redeemAmount = ethers.utils.parseUnits("1", 18); // 1 CAB

  console.log("Simulating requestDeposit for", user, "amount:", depositAmount.toString());
  try {
    await vault.callStatic.requestDeposit(depositAmount, { from: user });
    console.log("requestDeposit: would succeed");
  } catch (e) {
    console.error("requestDeposit revert reason:", e.error?.message || e.message);
  }

  console.log("Simulating requestRedeem for", user, "amount:", redeemAmount.toString());
  try {
    await vault.callStatic.requestRedeem(redeemAmount, { from: user });
    console.log("requestRedeem: would succeed");
  } catch (e) {
    console.error("requestRedeem revert reason:", e.error?.message || e.message);
  }

  // Print balances and allowances for debugging
  const usdcBal = await usdc.balanceOf(user);
  const cabBal = await token.balanceOf(user);
  const allowance = await usdc.allowance(user, deployed.RWAAsyncVault);
  console.log("USDC balance:", usdcBal.toString());
  console.log("CAB balance:", cabBal.toString());
  console.log("USDC allowance to vault:", allowance.toString());
}

main().catch(console.error);