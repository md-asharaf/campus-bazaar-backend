import { Router } from "express";
import { authenticateAdmin } from "@/middlewares/admin.middleware";
import userRoutes from "./user.routes";
import verificationRoutes from "./verification.routes";
const router = Router();

router.use(authenticateAdmin);

// add admin authenticated routes here
router.use("/user", userRoutes);
router.use("/verification", verificationRoutes);

export default router;
