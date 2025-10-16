import { Router } from "express";
import { public as public_ } from "@/controllers"

const router = Router()

router.get("/search", public_.item.searchItems);
router.get("/:itemId", public_.item.getItemById);

export default router;