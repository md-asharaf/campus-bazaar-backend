import { admin } from "@/controllers";
import { Router } from "express";

const router = Router();

router.get("/", admin.feedback.getAllFeedback);
router.get("/:feedbackId", admin.feedback.getFeedbackById);
router.delete("/:feedbackId", admin.feedback.deleteFeedback);

export default router;
