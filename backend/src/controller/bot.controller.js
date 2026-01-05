import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import { ethers } from "ethers";
import { encrypt } from "../services/encryption.service.js";
import {
  buyWithEth,
  sellTokenForEth,
  getBalances
} from "../services/uniswap.service.js";

export async function startCommand(ctx) {
  try {
    const telegramId = ctx.from.id;
    const username = ctx.from.username || "";
    const firstName = ctx.from.first_name || "";

    let user = await User.findOne({ telegramId });

    if (!user) {
      user = await User.create({
        telegramId,
        username,
        firstName
      });

      console.log(" New user created:", telegramId);
    } else {
      console.log(" Existing user:", telegramId);
    }

    await ctx.reply(
      `Welcome ${firstName || "Trader"} \n\n` +
      `Use /addwallet to add a wallet\n` +
      `Use /buy or /sell to trade`
    );
  } catch (err) {
    console.error(" Start command error:", err);
    await ctx.reply("Something went wrong. Please try again.");
  }
}

async function resolveWallet(ctx) {
  if (ctx.session?.walletId) {
    return Wallet.findById(ctx.session.walletId);
  }
  return Wallet.findOne({ userId: ctx.from.id, isDefault: true });
}

export async function addWalletCommand(ctx) {
  ctx.session = { action: "ADD_WALLET" };
  await ctx.reply(" Send private key:");
}

export async function walletsCommand(ctx) {
  const wallets = await Wallet.find({ userId: ctx.from.id });

  if (!wallets.length) {
    await ctx.reply("No wallets found.");
    return;
  }

  let msg = " Your wallets:\n\n";
  wallets.forEach((w, i) => {
    msg += `${i + 1}. ${w.label} ${w.isDefault ? "(default)" : ""}\n${w.address}\n\n`;
  });

  await ctx.reply(msg);
}

export async function setDefaultCommand(ctx) {
  ctx.session = { action: "SET_DEFAULT" };
  await walletsCommand(ctx);
  await ctx.reply("Reply with wallet number to set default");
}

export async function useWalletCommand(ctx) {
  ctx.session = { action: "USE_WALLET" };
  await walletsCommand(ctx);
  await ctx.reply("Reply with wallet number to use");
}

export async function buyCommand(ctx) {
  ctx.session = { action: "BUY" };
  await ctx.reply(" Enter ETH amount:");
}

export async function sellCommand(ctx) {
  ctx.session = { action: "SELL" };
  await ctx.reply(" Enter token amount:");
}

export async function balanceCommand(ctx) {
  const wallet = await resolveWallet(ctx);
  const bal = await getBalances(wallet);

  await ctx.reply(
    ` Balance\nETH: ${bal.eth}\nToken: ${bal.token}`
  );
}

export async function handleMessage(ctx) {
  const text = ctx.message.text;
  const userId = ctx.from.id;

  try {
    if (ctx.session?.action === "ADD_WALLET") {
      const wallet = new ethers.Wallet(text);

      const isFirst = !(await Wallet.exists({ userId }));

      await Wallet.create({
        userId,
        address: wallet.address,
        encryptedKey: encrypt(wallet.privateKey),
        isDefault: isFirst
      });

      ctx.session = null;
      return ctx.reply(" Wallet added");
    }

    if (["SET_DEFAULT", "USE_WALLET"].includes(ctx.session?.action)) {
      const index = Number(text) - 1;
      const wallets = await Wallet.find({ userId });

      const selected = wallets[index];
      if (!selected) return ctx.reply(" Invalid selection");

      if (ctx.session.action === "SET_DEFAULT") {
        await Wallet.updateMany({ userId }, { isDefault: false });
        selected.isDefault = true;
        await selected.save();
        ctx.reply(" Default wallet set");
      } else {
        ctx.session.walletId = selected._id;
        ctx.reply(" Wallet selected");
      }

      ctx.session.action = null;
      return;
    }

    if (ctx.session?.action === "BUY") {
      const wallet = await resolveWallet(ctx);
      const txHash = await buyWithEth(wallet, text);

      await Transaction.create({
        userId,
        walletId: wallet._id,
        type: "BUY",
        ethAmount: text,
        txHashIn: txHash
      });

      ctx.session = null;
      return ctx.reply(` Buy successful\nTx: ${txHash}`);
    }

    if (ctx.session?.action === "SELL") {
      const wallet = await resolveWallet(ctx);
      const txHash = await sellTokenForEth(wallet, text);

      await Transaction.create({
        userId,
        walletId: wallet._id,
        type: "SELL",
        tokenAmount: text,
        txHashOut: txHash
      });

      ctx.session = null;
      return ctx.reply(` Sell successful\nTx: ${txHash}`);
    }

  } catch (err) {
    console.error("Bot Error:", err);
    ctx.reply("Operation failed");
    ctx.session = null;
  }
}
