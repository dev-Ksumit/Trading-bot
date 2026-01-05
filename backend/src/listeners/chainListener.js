import { ethers } from "ethers";
import dotenv from "dotenv";
import Transaction from "../models/Transaction.js";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

export async function startListener() {
  const network = await provider.getNetwork();
  console.log(`Connected Network: ${network.name} (${network.chainId})`);

  provider.on("block", async (blockNumber) => {
    const block = await provider.getBlock(blockNumber, true);
    if (!block || !block.transactions) return;

    for (const tx of block.transactions) {
      if (!tx.to || tx.value === 0n) continue;

      const exists = await Transaction.findOne({ txHashIn: tx.hash });
      if (exists) continue;

      await Transaction.create({
        txHashIn: tx.hash,
        from: tx.from,
        to: tx.to,
        amount: ethers.formatEther(tx.value),
        status: "PENDING"
      });

      console.log("New ETH Deposit Detected:", tx.hash);
    }
  });

  console.log("Blockchain Listener Started");
}
