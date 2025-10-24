import { public as public_ } from "@/controllers";
import { Router } from "express";

const router = Router();

router.get("/", public_.category.getAllCategories);
router.get("/:categoryId", public_.category.getCategoryById);

export default router;
