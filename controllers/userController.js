import Account from "../models/Account.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "..", "public", "uploads");

export const getProfile = async (req, res) => {
  try {
    const account = await Account.findById(req.session.user.id).lean();

    res.render("profile", {
      account,
      user: req.session.user,
      flash: req.session.flash || {},
    });

    req.session.flash = null;
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

export const updateProfile = async (req, res) => {
  try {
    let avatarUrl = req.session.user.avatar || "";

    if (req.file) {
      avatarUrl = `/uploads/${req.file.filename}`;
    }

    const safeBio = (req.body.bio || "").toString().slice(0, 500).trim();

    const updated = await Account.findByIdAndUpdate(
      req.session.user.id,
      { avatar: avatarUrl, bio: safeBio },
      { new: true }
    ).lean();

    req.session.user.avatar = updated.avatar;
    req.session.user.bio = updated.bio;

    req.session.flash = {
      type: "success",
      msg: "Profile updated successfully!",
    };

    req.session.save(() => {
      res.redirect("/profile");
    });
  } catch (err) {
    console.error(err);
    req.session.flash = {
      type: "danger",
      msg: "Failed to update profile",
    };
    res.redirect("/profile");
  }
};

export const removeAvatar = async (req, res) => {
  try {
    const account = await Account.findById(req.session.user.id);

    if (account?.avatar) {
      const filename = path.basename(account.avatar);
      const filePath = path.join(uploadDir, filename);

      fs.unlink(filePath, () => {});
      account.avatar = "";
      await account.save();
    }

    req.session.user.avatar = "";

    req.session.flash = {
      type: "success",
      msg: "Avatar removed successfully",
    };

    res.redirect("/profile");
  } catch (err) {
    console.error(err);
    req.session.flash = {
      type: "danger",
      msg: "Failed to remove avatar",
    };
    res.redirect("/profile");
  }
};
