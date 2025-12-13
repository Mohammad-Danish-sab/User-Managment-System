import express from "express";
import { requireLogin } from "../middleware/auth.js";
import Account from "../models/Account.js";

const router = express.Router();

router.get("/", requireLogin, async (req, res) => {
  const account = await Account.findById(req.session.user.id).lean();

  res.render("dashboard", {
    user: req.session.user,
    account,
  });
});

export default router;
