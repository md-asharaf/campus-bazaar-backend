import { admin } from "@/controllers";
import { multerUpload } from "@/middlewares/multer.middleware";
import { Router } from "express";

const router = Router();

router.post("/", multerUpload, admin.category.createCategory);
router.get("/", admin.category.getAllCategories);
router.get("/:categoryId", admin.category.getCategoryById);
router.patch("/:categoryId", multerUpload, admin.category.updateCategory);
router.delete("/:categoryId", admin.category.deleteCategory);

export default router;
