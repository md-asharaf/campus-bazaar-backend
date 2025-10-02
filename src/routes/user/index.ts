import { Router } from "express";
import { authenticateUser } from "@/middlewares/auth.middleware";
import profileRoutes from "./profile.routes";
import chatRoutes from "./chat.routes";
import itemRoutes from "./item.routes";
import wishlistRoutes from "./wishlist.routes";
import feedbackRoutes from "./feedback.routes";
const router = Router();

router.use(authenticateUser);

// add user authenticated routes here
router.use("/", profileRoutes);
router.use("/chat", chatRoutes);
router.use("/items", itemRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/feedback", feedbackRoutes);

export default router;
