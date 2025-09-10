import { Router } from "express";
import { authenticateUser } from "@/middlewares/auth.middleware";
import profileRoutes from "./profile.routes";
const router = Router();

router.use(authenticateUser);

// add user authenticated routes here
router.use("/", profileRoutes);

export default router;
