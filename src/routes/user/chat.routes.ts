import { Router } from "express";
import { multerMultipleUpload } from "@/middlewares/multer.middleware";
import { user } from "@/controllers";

const router = Router();

router.get("/", user.chat.getMyChats);
router.post("/", user.chat.createOrGetChat);
router.get("/:chatId/messages", user.chat.getChatMessages);
router.post("/:chatId/images", multerMultipleUpload, user.chat.sendImageMessage);

export default router;