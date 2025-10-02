import { Router } from "express";
import { user } from "@/controllers";

const router = Router();

// Wishlist management
router.get("/", user.wishlist.getWishlist);
router.post("/", user.wishlist.addToWishlist);
router.delete("/:itemId", user.wishlist.removeFromWishlist);
router.get("/:itemId/status", user.wishlist.checkWishlistStatus);

export default router;