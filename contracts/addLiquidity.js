const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Using Account:", deployer.address);

  const TOKEN_ADDRESS = process.env.MY_TOKEN_ADDRESS;
  const UNISWAP_V2_ROUTER = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";

  const ETH_AMOUNT = "0.01";
  const TOKEN_AMOUNT = "1000";

  if (!TOKEN_ADDRESS) {
    console.error("Error: MY_TOKEN_ADDRESS is missing in your .env file.");
    return;
  }

  console.log(`\n Checking Token at ${TOKEN_ADDRESS}.`);
  const MyToken = await hre.ethers.getContractFactory("MyToken");
  const token = MyToken.attach(TOKEN_ADDRESS);

  const balance = await token.balanceOf(deployer.address);
  console.log(` Your Token Balance: ${hre.ethers.formatUnits(balance, 18)}`);

  const requiredAmount = hre.ethers.parseUnits(TOKEN_AMOUNT, 18);

  if (balance < requiredAmount) {
    console.error("ERROR: You do not have enough!");
    return;
  }

  console.log(`\n Checking Allowance.`);
  const allowance = await token.allowance(deployer.address, UNISWAP_V2_ROUTER);
  console.log(`Current Allowance: ${hre.ethers.formatUnits(allowance, 18)}`);

  if (allowance < requiredAmount) {
    console.log(" Allowance too low. Approving now.");
    const approveTx = await token.approve(UNISWAP_V2_ROUTER, requiredAmount);
    await approveTx.wait();
    console.log("Approved!");
  } else {
    console.log("Allowance is good!");
  }

  console.log(`\n Adding Liquidity.`);
  const routerAbi = [
    "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
  ];
  const router = new hre.ethers.Contract(
    UNISWAP_V2_ROUTER,
    routerAbi,
    deployer
  );
  const timestamp = Math.floor(Date.now() / 1000) + 60 * 10;

  try {
    const tx = await router.addLiquidityETH(
      TOKEN_ADDRESS,
      requiredAmount,
      0,
      0,
      deployer.address,
      timestamp,
      { value: hre.ethers.parseEther(ETH_AMOUNT) }
    );

    console.log(" Sending Transaction.");
    await tx.wait();
    console.log(`\n Liquidity Added Successfully.`);
    console.log(`Tx Hash: ${tx.hash}`);
  } catch (error) {
    console.error("\n Failed to Add Liquidity");
    console.error("Reason:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
