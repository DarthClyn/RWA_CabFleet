// scripts/initial-setup.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Running initial setup with:", signer.address);

  const filePath = path.join(__dirname, "..", "deployed.json");
  if (!fs.existsSync(filePath)) {
    throw new Error("deployed.json not found. Run deploy.js first.");
  }

  const deployed = JSON.parse(fs.readFileSync(filePath, "utf8"));

  console.log("Using addresses from deployed.json:");
  console.log("  IdentityRegistry:", deployed.IdentityRegistry);
  console.log("  CabShareToken:   ", deployed.CabShareToken);
  console.log("  RWAAsyncVault:   ", deployed.RWAAsyncVault);

  const identityRegistry = await ethers.getContractAt(
    "IdentityRegistry",
    deployed.IdentityRegistry
  );

  const cabShareToken = await ethers.getContractAt(
    "CabShareToken",
    deployed.CabShareToken
  );

  // 1. Verify investor and admin
  const addressesToVerify = [
    deployed.RWAAsyncVault, // vault itself (admin)
    "0xD3B1146d702c1d971eD6F485206AA5065Bf7a0b1", // investor
    "0x3A7fECFe9057E1A3CcAdB313D57b94E755a2d9D6", // admin
  ];

  for (const addr of addressesToVerify) {
    const isAlreadyVerified = await identityRegistry.isVerified(addr);
    if (!isAlreadyVerified) {
      const tx = await identityRegistry.updateIdentity(addr, true);
      await tx.wait();
      console.log(`→ Verified: ${addr}`);
    } else {
      console.log(`→ Already verified: ${addr}`);
    }
  }

  // 2. Set initial share price via VAULT
  const currentPrice = await cabShareToken.sharePrice();

  if (currentPrice === 0n || currentPrice !== 1000000n) {
    const vault = await ethers.getContractAt("RWAAsyncVault", deployed.RWAAsyncVault);
    const tx = await vault.updateTokenSharePrice(1_000_000);
    await tx.wait();
    console.log("→ sharePrice set to 1 USDC via vault");
  } else {
    console.log("→ sharePrice already set to 1 USDC");
  }

  console.log("\nInitial setup complete.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });