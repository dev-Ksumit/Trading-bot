import { JsonRpcProvider } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const provider = new JsonRpcProvider(process.env.RPC_URL);

async function test() {
  const block = await provider.getBlockNumber();
  console.log("Latest block:", block);
}

test();
