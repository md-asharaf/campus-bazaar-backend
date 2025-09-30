import { user } from "@/controllers";
import { multerUpload } from "@/middlewares/multer.middleware";
import { Router } from "express";

const router = Router();

router.post("/verify", multerUpload, user.profile.verifyMyself);
router.get("/me", user.profile.getMe);
router.patch("/", user.profile.updateProfile);

export default router;
