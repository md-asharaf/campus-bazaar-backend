import { auth } from "@/controllers";
import { Router } from "express";

const router = Router();

router.post("/register", auth.user.register);
router.get("/google", auth.user.googleAuth);
router.get("/google/callback", auth.user.googleCallback);
router.get("/google/failure", auth.user.googleAuthFailure);

export default router;
