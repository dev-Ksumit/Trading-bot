import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true,
  },
  username: String,
  firstName: String,
},
 { timestamps: true }
);

export default mongoose.model("User", userSchema);
