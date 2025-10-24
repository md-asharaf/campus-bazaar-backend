import { admin } from "@/controllers";
import { Router } from "express";

const router = Router();

router.get("/", admin.item.getAllItems);
router.get("/:itemId", admin.item.getItemById);
router.patch("/:itemId", admin.item.updateItem);
router.patch("/:itemId/verify", admin.item.verifyItem);
router.patch("/:itemId/reject", admin.item.rejectItem);
router.delete("/:itemId", admin.item.deleteItem);

export default router;
