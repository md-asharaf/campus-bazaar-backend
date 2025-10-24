import { admin } from "@/controllers";
import { Router } from "express";

const router = Router();

router.get('/me', admin.profile.getMe);

export default router;
