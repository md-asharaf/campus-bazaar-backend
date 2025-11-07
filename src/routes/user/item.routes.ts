import { Router } from "express";
import { user } from "@/controllers";
import { multerMultipleUpload } from "@/middlewares/multer.middleware";

const router = Router();

router.post("/", multerMultipleUpload, user.item.createItem);
router.get("/", user.item.getMyItems);
router.patch("/:itemId", user.item.updateMyItem);
router.patch("/:itemId/sold", user.item.markItemAsSold);
router.delete("/:itemId", user.item.deleteMyItem);

export default router;