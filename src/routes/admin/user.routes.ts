import { admin } from "@/controllers";
import { Router } from "express";

const router = Router();

router.get("/", admin.user.getAllUsers);
router.get("/:userId", admin.user.getUserById);
router.patch("/:userId", admin.user.updateUser);
router.patch("/:userId/toggle-status", admin.user.toggleUserStatus);
router.delete("/:userId", admin.user.deleteUser);

export default router;
