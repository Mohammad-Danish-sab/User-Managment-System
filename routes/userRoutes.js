import express from "express";
import { requireLogin } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import {
  getProfile,
  updateProfile,
  removeAvatar,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/profile", requireLogin, getProfile);

router.post(
  "/profile",
  requireLogin,
  upload.single("avatar"),
  updateProfile
);

router.post(
  "/profile/remove-avatar",
  requireLogin,
  removeAvatar
);

export default router;
