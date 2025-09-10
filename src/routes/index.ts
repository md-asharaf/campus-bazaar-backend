import { Router } from "express";
import authRoutes from "./auth";
import userRoutes from "./user";
import publicRoutes from "./public";
import adminRoutes from "./admin";
const router = Router();

router.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "Server is running",
        timestamp: new Date().toISOString(),
    });
    return;
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/public", publicRoutes);
router.use("/admins", adminRoutes);

export default router;
