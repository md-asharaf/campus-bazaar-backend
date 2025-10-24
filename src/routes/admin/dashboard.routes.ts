import { Router } from "express";
import dashboard from "@/controllers/admin/dashboard.controller";

const router = Router();

router.get("/stats", dashboard.getDashboardStats);

export default router;