import { Router } from "express";
import itemRoutes from "./item.routes";
import categoryRoutes from "./category.routes";
import searchRoutes from "./search.routes";
const router = Router();

router.use("/categories", categoryRoutes);
router.use("/items", itemRoutes);
router.use("/search", searchRoutes);

export default router;
