import dns from "dns";
dns.setDefaultResultOrder("ipv4first"); 

import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db.js";
import { startListener } from "./listeners/chainListener.js";
import bot from "./bot.js";

async function startApp() {
  try {
    await connectDB();
    await startListener();
    await bot.telegram.getMe();
    console.log("Telegram API reachable");

    await bot.telegram.setMyCommands([
      { command: "start", description: "Create wallet / Get deposit address" },
      { command: "buy", description: "Buy token with ETH" },
      { command: "sell", description: "Sell token for ETH" },
      { command: "balance", description: "Check ETH & token balance" },
      { command: "addwallet", description: "Add a new wallet" },
      { command: "wallets", description: "List all wallets" },
      { command: "setdefault", description: "Set default wallet" },
      { command: "usewallet", description: "Use a specific wallet" }
    ]);

    await bot.launch({ dropPendingUpdates: true });
    console.log("Telegram Bot Launched ");
  } catch (err) {
    console.error("Application failed to start:", err);
    process.exit(1);
  }
}

startApp();
