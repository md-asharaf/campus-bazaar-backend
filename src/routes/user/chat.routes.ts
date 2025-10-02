import { Router } from "express";
import { user } from "@/controllers";
import { multerMultipleUpload } from "@/middlewares/multer.middleware";

const router = Router();

// Chat management
router.get("/", user.chat.getMyChats);
router.post("/", user.chat.createOrGetChat);

// Messages
router.get("/:chatId/messages", user.chat.getChatMessages);
router.post("/:chatId/messages", multerMultipleUpload, user.chat.sendMessage);
router.patch("/messages/:messageId/read", user.chat.markMessageAsRead);

export default router;