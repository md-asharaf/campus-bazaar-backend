import { Request, Response } from "express";
import catchAsync from "@/handlers/async.handler";
import chatService from "@/services/chat.service";
import messageService from "@/services/message.service";
import mediaService from "@/services/media.service";
import userService from "@/services/user.service";
import { User } from "@/@types/schema";
import { APIError } from "@/utils/APIError";
import { APIResponse } from "@/utils/APIResponse";
import { uploadImage } from "@/services/imagekit.service";
import { chatEvents } from "@/socket/events.service";

const getMyChats = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as User;
    const { page = 1, limit = 20, includeRelations = false } = req.query;
    
    const result = await chatService.findMany({
        userId: user.id,
        page: Number(page),
        limit: Number(limit),
        includeRelations: includeRelations === 'true'
    });
    
    // Get other user details for each chat
    const chatsWithUserDetails = await Promise.all(
        result.items.map(async (chat) => {
            const otherUserId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
            const otherUser = await userService.findById(otherUserId);
            
            // Get latest message
            const latestMessages = await messageService.findByChatId(chat.id, { 
                page: 1, 
                limit: 1 
            });
            const latestMessage = latestMessages[0] || null;
            
            // Get unread count
            const allMessages = await messageService.findByChatId(chat.id);
            const unreadCount = allMessages.filter(msg => 
                msg.senderId !== user.id && !msg.readAt
            ).length;
            
            return {
                ...chat,
                otherUser: {
                    id: otherUser?.id,
                    name: otherUser?.name,
                    avatar: otherUser?.avatar
                },
                latestMessage,
                unreadCount
            };
        })
    );
    
    res.json(new APIResponse(true, "Chats retrieved successfully", {
        ...result,
        items: chatsWithUserDetails
    }));
});

const createOrGetChat = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as User;
    const { otherUserId } = req.body;
    
    // One-to-One Chat Creation Only (No Group Chats)
    if (!otherUserId) {
        throw new APIError(400, "Other user ID is required for private conversation");
    }
    
    if (otherUserId === user.id) {
        throw new APIError(400, "Cannot create conversation with yourself");
    }
    
    // Check if other user exists and is active
    const otherUser = await userService.findById(otherUserId);
    if (!otherUser) {
        throw new APIError(404, "User not found");
    }
    
    if (!otherUser.isActive) {
        throw new APIError(400, "Cannot start chat with inactive user");
    }
    
    // Check if private conversation already exists between these two individuals
    let chat = await chatService.findByUsers(user.id, otherUserId);
    let isNewChat = false;
    
    if (!chat) {
        // Create new private conversation (only 2 participants)
        chat = await chatService.create({
            user1_id: user.id,
            user2_id: otherUserId
        });
        isNewChat = true;
        
        // Emit event for real-time handling
        chatEvents.emitChatCreated({
            chatId: chat.id,
            user1Id: user.id,
            user2Id: otherUserId,
            createdAt: chat.createdAt
        });
    }
    
    // Get recent messages for existing chat
    let recentMessages: any[] = [];
    if (!isNewChat) {
        recentMessages = await messageService.findByChatId(chat.id, { 
            page: 1, 
            limit: 20,
            includeRelations: true 
        });
    }
    
    res.status(isNewChat ? 201 : 200).json(
        new APIResponse(
            true, 
            isNewChat ? "One-to-one chat created successfully" : "Chat retrieved successfully",
            { 
                chat: {
                    ...chat,
                    type: 'one-to-one',
                    participantCount: 2
                },
                otherUser: {
                    id: otherUser.id,
                    name: otherUser.name,
                    avatar: otherUser.avatar,
                    isActive: otherUser.isActive,
                    isVerified: otherUser.isVerified
                },
                recentMessages: recentMessages.reverse(), // Show oldest first
                isNewChat
            }
        )
    );
});

const getChatMessages = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as User;
    const { chatId } = req.params;
    const { page = 1, limit = 50, includeRelations = false } = req.query;
    
    // Verify user is part of this chat
    const chat = await chatService.findById(chatId);
    if (!chat) {
        throw new APIError(404, "Chat not found");
    }
    
    if (chat.user1_id !== user.id && chat.user2_id !== user.id) {
        throw new APIError(403, "You are not part of this chat");
    }
    
    // Get messages with pagination and relations if requested
    const messages = await messageService.findByChatId(chatId, {
        page: Number(page),
        limit: Number(limit),
        includeRelations: includeRelations === 'true'
    });
    
    const totalMessages = await messageService.countByChatId(chatId);
    
    res.json({
        success: true,
        message: "Messages retrieved successfully",
        data: { 
            messages: messages.reverse(), // Reverse to show oldest first in UI
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: totalMessages,
                totalPages: Math.ceil(totalMessages / Number(limit)),
                hasNext: Number(page) * Number(limit) < totalMessages,
                hasPrev: Number(page) > 1
            },
            chat
        }
    });
});

const sendMessage = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as User;
    const { chatId } = req.params;
    const { content } = req.body;
    const mediaFiles = req.files as Express.Multer.File[];
    
    // HTTP endpoint is ONLY for IMAGE messages (with optional text)
    // Pure text messages should use Socket.IO for instant delivery
    if (!mediaFiles || mediaFiles.length === 0) {
        throw new APIError(400, "This endpoint is for image messages only. Use Socket.IO for text messages.");
    }
    
    // Verify user is part of this one-to-one chat
    const chat = await chatService.findById(chatId);
    if (!chat) {
        throw new APIError(404, "Chat not found");
    }
    
    if (chat.user1_id !== user.id && chat.user2_id !== user.id) {
        throw new APIError(403, "You are not part of this chat");
    }
    
    // Get the other user in this one-to-one conversation  
    const otherUserId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
    
    // Determine message type
    const hasImages = mediaFiles && mediaFiles.length > 0;
    const messageType = hasImages ? 'image' : 'text';
    
    // Upload images first if provided
    let uploadedMedia: Array<{ id: string; url: string; messageId: string; createdAt: Date; updatedAt: Date }> = [];
    if (hasImages) {
        const uploadedImages = await Promise.all(
            mediaFiles.map(async (file) => {
                return await uploadImage(file);
            })
        );
        
        // Create message first
        const message = await messageService.create({
            content: content || (hasImages ? "📷 Image" : ""),
            senderId: user.id,
            chatId
        });
        
        // Link images to message
        uploadedMedia = await Promise.all(
            uploadedImages.map(async (image) => {
                return await mediaService.create({
                    id: image.id,
                    url: image.url,
                    messageId: message.id
                });
            })
        );
        
        // Update chat timestamp
        await chatService.updateTimestamp(chatId);
        
        // Emit event for real-time handling (separated from HTTP controller)
        chatEvents.emitMessageCreated({
            messageId: message.id,
            chatId,
            senderId: user.id,
            senderName: user.name,
            senderAvatar: user.avatar,
            content: message.content,
            type: messageType,
            media: undefined, // Text messages don't have media
            sentAt: message.sentAt,
            otherUserId
        });        res.status(201).json({
            success: true,
            message: "Image message sent successfully",
            data: { 
                message: {
                    ...message,
                    type: messageType,
                    media: uploadedMedia,
                    sender: {
                        id: user.id,
                        name: user.name,
                        avatar: user.avatar
                    }
                }
            }
        });
    } else {
        // Text message only
        const message = await messageService.create({
            content: content.trim(),
            senderId: user.id,
            chatId
        });
        
        // Update chat timestamp
        await chatService.updateTimestamp(chatId);
        
        // Emit event for real-time handling (separated from HTTP controller)
        chatEvents.emitMessageCreated({
            messageId: message.id,
            chatId,
            senderId: user.id,
            senderName: user.name,
            senderAvatar: user.avatar,
            content: message.content,
            type: messageType,
            media: uploadedMedia.map(m => ({
                id: m.id,
                url: m.url,
                messageId: m.messageId
            })),
            sentAt: message.sentAt,
            otherUserId
        });
        
        res.status(201).json({
            success: true,
            message: "Text message sent successfully",
            data: { 
                message: {
                    ...message,
                    type: messageType,
                    sender: {
                        id: user.id,
                        name: user.name,
                        avatar: user.avatar
                    }
                }
            }
        });
    }
});

const markMessageAsRead = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as User;
    const { messageId } = req.params;
    
    const message = await messageService.findById(messageId);
    if (!message) {
        throw new APIError(404, "Message not found");
    }
    
    // Only the receiver can mark message as read
    if (message.senderId === user.id) {
        throw new APIError(400, "Cannot mark your own message as read");
    }
    
    // Verify user is part of the chat
    const chat = await chatService.findById(message.chatId);
    if (!chat || (chat.user1_id !== user.id && chat.user2_id !== user.id)) {
        throw new APIError(403, "You are not part of this chat");
    }
    
    const updatedMessage = await messageService.markAsRead(messageId);
    
    // Emit event for real-time handling (separated from HTTP controller)
    chatEvents.emitMessageRead({
        messageId,
        chatId: message.chatId,
        readBy: user.id,
        readAt: updatedMessage.readAt,
        senderId: message.senderId
    });
    
    res.json(new APIResponse(true, "Message marked as read", { message: updatedMessage }));
});

export default {
    getMyChats,
    createOrGetChat,
    getChatMessages,
    sendMessage,
    markMessageAsRead
};