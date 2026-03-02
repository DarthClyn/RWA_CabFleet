// scripts/deploy.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // 1. IdentityRegistry
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.deployed();
  console.log("IdentityRegistry →", identityRegistry.address);

  // 2. MockUSDC (comment out + use real address on Base mainnet)
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.deployed();
  console.log("MockUSDC       →", usdc.address);

  // For Base mainnet example:
  // const usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  // console.log("Using real USDC →", usdcAddress);

  // 3. CabShareToken (vault placeholder)
  const CabShareToken = await ethers.getContractFactory("CabShareToken");
  const cabShareToken = await CabShareToken.deploy(
    identityRegistry.address,
    ethers.constants.AddressZero // placeholder
  );
  await cabShareToken.deployed();
  console.log("CabShareToken  →", cabShareToken.address);

  // 4. RWAAsyncVault
  const RWAAsyncVault = await ethers.getContractFactory("RWAAsyncVault");
  const vault = await RWAAsyncVault.deploy(usdc.address, cabShareToken.address);
  await vault.deployed();
  console.log("RWAAsyncVault  →", vault.address);


  // 5. Set vault address in CabShareToken (one-time, only if not set)
  const currentVault = await cabShareToken.vault();
  console.log("CabShareToken.vault before:", currentVault);
  if (currentVault === ethers.constants.AddressZero) {
    const setVaultTx = await cabShareToken.setVault(vault.address);
    await setVaultTx.wait();
    console.log("CabShareToken.vault set →", vault.address);
  } else {
    console.log("CabShareToken.vault already set, skipping setVault");
  }
  const afterVault = await cabShareToken.vault();
  console.log("CabShareToken.vault after:", afterVault);

  // 6. Transfer ownership of CabShareToken to Vault
  const tx = await cabShareToken.transferOwnership(vault.address);
  await tx.wait();
  console.log("CabShareToken ownership → Vault");

  // Save to deployed.json
  const deployed = {
    network: (await ethers.provider.getNetwork()).name,
    deployer: deployer.address,
    IdentityRegistry: identityRegistry.address,
    USDC: usdc.address,
    CabShareToken: cabShareToken.address,
    RWAAsyncVault: vault.address,
    timestamp: new Date().toISOString()
  };

  const filePath = path.join(__dirname, "..", "deployed.json");
  fs.writeFileSync(filePath, JSON.stringify(deployed, null, 2));
  console.log(`\nAddresses saved → ${filePath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });