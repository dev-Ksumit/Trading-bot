const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const MyToken = await hre.ethers.getContractFactory("MyToken");
  const token = await MyToken.deploy(1000000);

  await token.waitForDeployment();
  console.log("Token Address:", await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
