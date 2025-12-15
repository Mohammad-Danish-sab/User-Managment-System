import bcrypt from "bcrypt";
import Account from "../models/Account.js";
import { logActivity } from "../middleware/logActivity.js";

export const showLogin = (req, res) => {
  res.render("login", { error: null });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await Account.findOne({ email });
  if (!user) {
    return res.render("login", { error: "User not found" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.render("login", { error: "Invalid password" });
  }

  req.session.user = {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar || "",
    bio: user.bio || "",
  };

  await logActivity(req, "User logged in");

  res.redirect("/");
};

export const logoutUser = async (req, res) => {
  await logActivity(req, "User logged out");
  req.session.destroy(() => res.redirect("/login"));
};
