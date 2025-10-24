import { Router } from "express";
import { authenticateAdmin } from "@/middlewares/admin.middleware";
import userRoutes from "./user.routes";
import verificationRoutes from "./verification.routes";
import itemRoutes from "./item.routes";
import categoryRoutes from "./category.routes";
import feedbackRoutes from "./feedback.routes";
import dashboardRoutes from "./dashboard.routes";
import profileRoutes from "./profile.routes";

const router = Router();

router.use(authenticateAdmin);

// add admin authenticated routes here
router.use("/user", userRoutes);
router.use("/verification", verificationRoutes);
router.use("/item", itemRoutes);
router.use("/category", categoryRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/", profileRoutes);

export default router;
