import { Router } from "express";
import { user } from "@/controllers";

const router = Router();

// Feedback management
router.post("/", user.feedback.createFeedback);
router.get("/", user.feedback.getMyFeedback);
router.patch("/", user.feedback.updateMyFeedback);
router.delete("/", user.feedback.deleteMyFeedback);

export default router;