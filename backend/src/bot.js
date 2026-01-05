import { Telegraf, session } from "telegraf";
import dotenv from "dotenv";

import {
  startCommand,
  addWalletCommand,
  walletsCommand,
  setDefaultCommand,
  useWalletCommand,
  buyCommand,
  sellCommand,
  balanceCommand,
  handleMessage
} from "./controller/bot.controller.js";

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session());

bot.start(startCommand);
bot.command("addwallet", addWalletCommand);
bot.command("wallets", walletsCommand);
bot.command("setdefault", setDefaultCommand);
bot.command("usewallet", useWalletCommand);
bot.command("buy", buyCommand);
bot.command("sell", sellCommand);
bot.command("balance", balanceCommand);
bot.on("text", handleMessage);

export default bot;
