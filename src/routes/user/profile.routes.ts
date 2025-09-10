import { user } from "@/controllers";
import { Router } from "express";

const router = Router();

router.get("/me", user.profile.getMe);
router.patch("/", user.profile.updateProfile);

export default router;
