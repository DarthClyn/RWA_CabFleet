// scripts/check-pending.js  (or wherever it is)
async function main() {
  const [signer] = await ethers.getSigners();
  const user = signer.address;
  console.log("Signer:", user);

  const vault = await ethers.getContractAt("RWAAsyncVault", "0xca29C1C6b3254B8a8F52c4050bC74632AD4bFFA3");

  const dep = await vault.deposits(user);

  console.log("Pending deposit status:", dep.status.toString());
  console.log("Timestamp:           ", dep.timestamp.toString());

  // Safe printing
  console.log("Amount (raw):        ", dep.amount ? dep.amount.toString() : "undefined");
  console.log("Shares (raw):        ", dep.shares  ? dep.shares.toString()  : "undefined");
}

main().catch(console.error);