import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userUniqueId: { type: String, required: true, unique: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    userAge: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

