import { Request, Response } from "express";
import catchAsync from "@/handlers/async.handler";
import chatService from "@/services/chat.service";
import messageService from "@/services/message.service";
import mediaService from "@/services/media.service";
import userService from "@/services/user.service";
import { User, Chat } from "@/@types/schema";
import { APIError } from "@/utils/APIError";
import { APIResponse } from "@/utils/APIResponse";
import { uploadImage } from "@/services/imagekit.service";
import { socketManager } from "@/index";

const validateChatAccess = async (chatId: string, userId: string): Promise<Chat> => {
  const chat = await chatService.findById(chatId);
  if (!chat) {
    throw new APIError(404, "Chat not found");
  }
  if (chat.user1_id !== userId && chat.user2_id !== userId) {
    throw new APIError(403, "You are not part of this chat");
  }
  return chat;
};

const getOtherUserId = (chat: Chat, currentUserId: string): string => {
  return chat.user1_id === currentUserId ? chat.user2_id : chat.user1_id;
};

const getMyChats = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as User;
  const { page = 1, limit = 20 } = req.query;
  const result = await chatService.findMany({
    userId: user.id,
    page: Number(page),
    limit: Number(limit)
  });
  const chatsWithUserDetails = await Promise.all(
    result.items.map(async (chat) => {
      const otherUserId = getOtherUserId(chat, user.id);
      const otherUser = await userService.findById(otherUserId);
      const latestMessages = await messageService.findByChatId(chat.id, {
        page: 1,
        limit: 1,
        includeRelations: true
      });

      const allMessages = await messageService.findByChatId(chat.id);
      const unreadCount = allMessages.items.filter(msg =>
        msg.senderId !== user.id && !msg.readAt
      ).length;

      return {
        ...chat,
        otherUser: {
          id: otherUser?.id,
          name: otherUser?.name,
          avatar: otherUser?.avatar
        },
        latestMessage: latestMessages.items?.[0] || null,
        unreadCount
      };
    })
  );
  res.json(new APIResponse(true, "Chats retrieved successfully", chatsWithUserDetails));
});

const createOrGetChat = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as User;
  const { otherUserId } = req.body;

  if (!otherUserId) {
    throw new APIError(400, "Other user ID is required");
  }
  if (otherUserId === user.id) {
    throw new APIError(400, "Cannot create chat with yourself");
  }

  const otherUser = await userService.findById(otherUserId);
  if (!otherUser) {
    throw new APIError(404, "User not found");
  }

  let chat = await chatService.findByUsers(user.id, otherUserId);
  const isNewChat = !chat;

  if (isNewChat) {
    chat = await chatService.create({
      user1_id: user.id,
      user2_id: otherUserId
    });
  }

  // Get recent messages for existing chats
  const recentMessages = isNewChat ? { items: [] } : await messageService.findByChatId(chat!.id, {
    page: 1,
    limit: 20,
    includeRelations: true
  });

  const response = {
    chat,
    otherUser: {
      id: otherUser.id,
      name: otherUser.name,
      avatar: otherUser.avatar
    },
    recentMessages: recentMessages.items?.reverse(),
    isNewChat
  };

  const message = isNewChat ? "Chat created successfully" : "Chat retrieved successfully";
  res.status(isNewChat ? 201 : 200).json(new APIResponse(true, message, response));
});

const getChatMessages = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as User;
  const { chatId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  await validateChatAccess(chatId, user.id);

  // Get messages
  const messages = await messageService.findByChatId(chatId, {
    page: Number(page),
    limit: Number(limit),
    includeRelations: true
  });

  res.json(new APIResponse(true, "Messages retrieved successfully",
    messages.items?.reverse()
  ));
});

const sendImageMessage = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as User;
  const { chatId } = req.params;
  const { content } = req.body;
  const images = req.files as Express.Multer.File[];

  if (!images?.length) {
    throw new APIError(400, "At least one image is required");
  }

  await validateChatAccess(chatId, user.id);

  const message = await messageService.create({
    content: content || "📷 Image",
    senderId: user.id,
    chatId
  });

  const uploadedImages = await Promise.all(
    images.map(file => uploadImage(file))
  );

  await Promise.all(
    uploadedImages.map(image => mediaService.create({
      imageId: image.id,
      messageId: message.id
    }))
  );

  socketManager.sendMessageWithImages(message.id, user.id, chatId, message.content, uploadedImages.map(image => image.url));

  res.status(201).json(new APIResponse(true, "Image message sent successfully", message));
});

export default {
  getMyChats,
  createOrGetChat,
  getChatMessages,
  sendImageMessage
};