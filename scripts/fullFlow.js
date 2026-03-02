// scripts/fullFlow.js
// FIXED: approve before requestRedeem + requestDeposit

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [signer] = await ethers.getSigners();
  const user = signer.address;

  console.log("\n=== FULL FLOW TEST (ADMIN MODE) ===");
  console.log("Signer:", user);

  const deployed = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "deployed.json"), "utf8"));

  const vault = await ethers.getContractAt("RWAAsyncVault", deployed.RWAAsyncVault);
  const usdc  = await ethers.getContractAt("MockUSDC", deployed.USDC);
  const cab   = await ethers.getContractAt("CabShareToken", deployed.CabShareToken);

  const depositUsdc = ethers.utils.parseUnits("10", 6);
  const redeemCab   = ethers.utils.parseUnits("1", 18);
  const lockSeconds = Number(await vault.lockSeconds());

  console.log(`Lock period: ${lockSeconds}s\n`);

  // ====================== HELPERS ======================
  async function getDeposit(addr) {
    const r = await vault.deposits(addr);
    return { usdcAmount: r[0], timestamp: r[1], status: Number(r[2]) };
  }
  async function getRedeem(addr) {
    const r = await vault.redeems(addr);
    return { tokenAmount: r[0], timestamp: r[1], status: Number(r[2]) };
  }

  async function liveWait(timestampBn) {
    const now = (await ethers.provider.getBlock("latest")).timestamp;
    let remaining = timestampBn.add(lockSeconds).toNumber() - now + 3;
    if (remaining <= 0) return console.log("  Lock already expired.");

    console.log(`  ⏳ Waiting ${remaining} seconds...`);
    while (remaining > 0) {
      process.stdout.write(`\r  ⏳ ${remaining.toString().padStart(4)} seconds remaining...`);
      await new Promise(r => setTimeout(r, 1000));
      remaining--;
    }
    process.stdout.write("\r" + " ".repeat(50) + "\r");
    console.log("  ✅ Lock expired → proceeding");
  }

  async function safeApprove(token, spender, amount, name) {
    const current = await token.allowance(user, spender);
    if (current.gte(amount)) {
      console.log(`  ${name} allowance already sufficient (${ethers.utils.formatUnits(current, 18)})`);
      return;
    }
    console.log(`  Approving ${name} for ${ethers.utils.formatUnits(amount, 18)}...`);
    await (await token.approve(spender, amount)).wait();
    console.log("  Approved.");
  }

  // ====================== DEPOSIT FLOW ======================
  console.log("[1] DEPOSIT FLOW");

  let dep = await getDeposit(user);
  if (dep.status === 1) {
    console.log("  Pending deposit → fulfilling");
    await liveWait(dep.timestamp);
    await (await vault.fulfillDeposit(user)).wait();
    console.log("  Deposit fulfilled");
  }

  await safeApprove(usdc, vault.address, depositUsdc, "USDC");
  console.log("  Requesting deposit...");
  await (await vault.requestDeposit(depositUsdc)).wait();
  console.log("  Deposit requested");

  dep = await getDeposit(user);
  if (dep.status === 1) {
    console.log("  Fulfilling deposit...");
    await liveWait(dep.timestamp);
    await (await vault.fulfillDeposit(user)).wait();
    console.log("  Deposit fulfilled → CAB minted");
  }

  // ====================== REDEEM FLOW ======================
  console.log("\n[2] REDEEM FLOW");

  let red = await getRedeem(user);
  if (red.status === 1) {
    console.log("  Pending redeem → fulfilling");
    await liveWait(red.timestamp);
    await (await vault.fulfillRedeem(user)).wait();
    console.log("  Redeem fulfilled");
  }

  // APPROVE CAB BEFORE REQUEST
  await safeApprove(cab, vault.address, redeemCab, "CAB");

  console.log("  Requesting redeem...");
  await (await vault.requestRedeem(redeemCab)).wait();
  console.log("  Redeem requested");

  red = await getRedeem(user);
  if (red.status === 1) {
    console.log("  Fulfilling redeem...");
    await liveWait(red.timestamp);
    await (await vault.fulfillRedeem(user)).wait();
    console.log("  Redeem fulfilled → USDC received");
  }

  // ====================== FINAL BALANCES ======================
  console.log("\n=== FINAL BALANCES ===");
  console.log("USDC:", ethers.utils.formatUnits(await usdc.balanceOf(user), 6));
  console.log(" CAB:", ethers.utils.formatUnits(await cab.balanceOf(user), 18));
  console.log("=== TEST COMPLETED ===\n");
}

main().catch(e => console.error("\nERROR:", e.message || e));