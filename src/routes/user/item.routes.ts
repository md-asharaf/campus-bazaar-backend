import { Router } from "express";
import { user } from "@/controllers";
import { multerUpload } from "@/middlewares/multer.middleware";

const router = Router();

// Item CRUD
router.post("/", multerUpload, user.item.createItem);
router.get("/", user.item.getMyItems);
router.get("/search", user.item.searchItems);
router.get("/:itemId", user.item.getItemById);
router.patch("/:itemId", user.item.updateMyItem);
router.patch("/:itemId/sold", user.item.markItemAsSold);
router.delete("/:itemId", user.item.deleteMyItem);

export default router;