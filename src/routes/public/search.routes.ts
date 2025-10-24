import { public as public_ } from "@/controllers";
import { Router } from "express";

const router = Router();

router.get("/suggestions", public_.search.getSuggestions);
router.get("/", public_.search.search);

export default router;
