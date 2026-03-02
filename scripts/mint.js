// scripts/mint-usdc.js
const { ethers } = require("hardhat");

async function main() {
  const deployed = require("../deployed.json");
  const usdc = await ethers.getContractAt("MockUSDC", deployed.USDC);
  const amount = ethers.utils.parseUnits("100", 6); // 100 USDC
  // await (await usdc.mint("0x3A7fECFe9057E1A3CcAdB313D57b94E755a2d9D6", amount)).wait();
  //
   console.log("Minted 100 MockUSDC to deployer");
  await (await usdc.mint("0xD3B1146d702c1d971eD6F485206AA5065Bf7a0b1", amount)).wait();
  console.log("Minted 100 MockUSDC to investor ,0xD3B1146d702c1d971eD6F485206AA5065Bf7a0b1 ");
}

main().catch(console.error);