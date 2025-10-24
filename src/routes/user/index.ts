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
router.use("/chats", chatRoutes);
router.use("/items", itemRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/", profileRoutes);

export default router;
