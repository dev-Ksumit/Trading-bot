import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true,
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
    },
    type: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },
    ethAmount: String,
    tokenAmount: String,
    txHashIn: {
      type: String,
      sparse: true
    },
    txHashOut: {
      type: String,
      sparse: true
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
