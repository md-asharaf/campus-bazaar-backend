import { auth } from "@/controllers";
import { Router } from "express";

const router = Router();

router.post("/login", auth.admin.login);
router.post("/login/verify", auth.admin.verifyLogin);
router.post("/refresh-tokens", auth.admin.refreshTokens);
router.post("/logout", auth.admin.logout);

export default router;
