import { ethers } from "ethers";
import { decrypt } from "./encryption.service.js";

const ROUTER = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";

const ROUTER_ABI = [
  "function swapExactETHForTokens(uint,address[],address,uint) payable returns (uint[])",
  "function swapExactTokensForETH(uint,uint,address[],address,uint) returns (uint[])"
];

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function decimals() view returns (uint8)"
];

function getWallet(walletDoc) {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const pk = decrypt(walletDoc.encryptedKey);
  return new ethers.Wallet(pk, provider);
}

export async function buyWithEth(walletDoc, ethAmount) {
  const wallet = getWallet(walletDoc);
  const router = new ethers.Contract(ROUTER, ROUTER_ABI, wallet);

  const path = [
    process.env.WETH_ADDRESS,
    process.env.MY_TOKEN_ADDRESS
  ];

  const deadline = Math.floor(Date.now() / 1000) + 600;

  const tx = await router.swapExactETHForTokens(
    0,
    path,
    wallet.address,
    deadline,
    {
      value: ethers.parseEther(ethAmount),
      gasLimit: 300000
    }
  );

  const receipt = await tx.wait();
  return receipt.hash;
}

export async function sellTokenForEth(walletDoc, tokenAmount) {
  const wallet = getWallet(walletDoc);

  const token = new ethers.Contract(
    process.env.MY_TOKEN_ADDRESS,
    ERC20_ABI,
    wallet
  );

  const decimals = await token.decimals();
  const amount = ethers.parseUnits(tokenAmount, decimals);

  const balance = await token.balanceOf(wallet.address);
  if (balance < amount) {
    throw new Error("Insufficient token balance");
  }

  const allowance = await token.allowance(wallet.address, ROUTER);

  if (allowance < amount) {
    const approveTx = await token.approve(
      ROUTER,
      ethers.MaxUint256 
    );
    await approveTx.wait();
  }

  const router = new ethers.Contract(ROUTER, ROUTER_ABI, wallet);

  const path = [
    process.env.MY_TOKEN_ADDRESS,
    process.env.WETH_ADDRESS
  ];

  const deadline = Math.floor(Date.now() / 1000) + 600;

  const tx = await router.swapExactTokensForETH(
    amount,
    0,
    path,
    wallet.address,
    deadline,
    { gasLimit: 300000 }
  );

  const receipt = await tx.wait();
  return receipt.hash;
}

export async function getBalances(walletDoc) {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

  const ethBalWei = await provider.getBalance(walletDoc.address);
  const eth = ethers.formatEther(ethBalWei);

  const token = new ethers.Contract(
    process.env.MY_TOKEN_ADDRESS,
    ERC20_ABI,
    provider
  );

  const decimals = await token.decimals();
  const tokenBal = await token.balanceOf(walletDoc.address);

  return {
    eth,
    token: ethers.formatUnits(tokenBal, decimals)
  };
}
