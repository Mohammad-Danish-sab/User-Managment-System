import express from "express";
import upload from "../middleware/upload.js";
import Account from "../models/Account.js";

const router = express.Router();

router.post("/update-profile", upload.single("avatar"), async (req, res) => {
  const avatarUrl = req.file
    ? "/uploads/" + req.file.filename
    : req.session.user.avatar || "";

  const updated = await Account.findByIdAndUpdate(
    req.session.user.id,
    {
      avatar: avatarUrl,
      bio: req.body.bio || "",
    },
    { new: true }
  );

  // router.get("/profile", async (req, res) => {
  //   if (!req.session.user) return res.redirect("/login");

  //   const account = await Account.findById(req.session.user.id);

  //   res.render("profile", {
  //     user: req.session.user,
  //     account: account,
  //   });
  // });


  req.session.user.avatar = updated.avatar;
  req.session.user.bio = updated.bio;

  res.redirect("/profile");
});

export default router;
