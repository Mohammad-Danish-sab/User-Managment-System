import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // store hashed password
    role: {
      type: String,
      enum: ["admin", "editor", "viewer"],
      default: "viewer",
    },

    avatar: { type: String, default: "" }, // path: /uploads/filename.jpg
    bio: { type: String, default: "" },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Account", accountSchema);
