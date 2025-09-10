import { admin } from "@/controllers";
import { Router } from "express";

const router = Router();

router.get("/", admin.verification.getAllVerifications);
router.get("/:userId", admin.verification.getVerification);
router.patch("/:id", admin.verification.updateVerification);

export default router;
