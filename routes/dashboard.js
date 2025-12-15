import express from "express";
import { requireLogin } from "../middleware/auth.js";
import { getDashboard } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/dashboard", requireLogin, getDashboard);

export default router;
