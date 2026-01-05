import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true,
      index: true
    },
    address: {
      type: String,
      required: true
    },
    encryptedKey: {
      type: String,
      required: true
    },
    label: {
      type: String,
      default: "Wallet"
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("Wallet", walletSchema);
