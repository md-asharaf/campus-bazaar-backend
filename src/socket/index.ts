import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import envVars from '@/config/envVars';
import { logger } from '@/config/logger';
import userService from '@/services/user.service';
import chatService from '@/services/chat.service';
import messageService from '@/services/message.service';
import { User } from '@/@types/schema';
import { 
    ServerToClientEvents, 
    ClientToServerEvents, 
    InterServerEvents, 
    SocketData 
} from '@/@types/socket';
import { chatEvents } from '@/socket/events.service';

// Store active user connections
const activeUsers = new Map<string, string>(); // userId -> socketId
const userSockets = new Map<string, string>(); // socketId -> userId

export class SocketManager {
    private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

    constructor(server: HTTPServer) {
        this.io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
            cors: {
                origin: envVars.NODE_ENV === 'production' 
                    ? envVars.FRONTEND_URL 
                    : [envVars.FRONTEND_URL || "http://localhost:5173", "http://localhost:3000"],
                credentials: true,
                methods: ['GET', 'POST']
            }
        });

        this.setupMiddleware();
        this.setupEventHandlers();
        this.setupChatEventListeners();
        
        logger.info('[SOCKET] Socket.IO server initialized');
    }

    private setupMiddleware() {
        // Authentication middleware for socket connections
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
                
                if (!token) {
                    return next(new Error('Authentication error: No token provided'));
                }

                const decoded = jwt.verify(token, envVars.JWT_SECRET) as jwt.JwtPayload;
                
                if (!decoded.id || !decoded.jti) {
                    return next(new Error('Authentication error: Invalid token payload'));
                }

                const user = await userService.findById(decoded.id);
                if (!user) {
                    return next(new Error('Authentication error: User not found'));
                }

                socket.data.user = user;
                next();
            } catch (error) {
                logger.error('[SOCKET] Authentication error:', error);
                next(new Error('Authentication error: Invalid token'));
            }
        });
    }

    private setupEventHandlers() {
        this.io.on('connection', (socket) => {
            const user = socket.data.user as User;
            logger.info(`[SOCKET] User connected: ${user.name} (${user.id})`);

            // Store user connection
            activeUsers.set(user.id, socket.id);
            userSockets.set(socket.id, user.id);

            // Join user to their personal room for notifications
            socket.join(`user:${user.id}`);

            // Notify user of their online status
            socket.emit('connected', { 
                message: 'Connected successfully',
                userId: user.id 
            });

            // Handle joining one-to-one conversations
            socket.on('join_chat', async (data) => {
                try {
                    const { chatId } = data;
                    
                    // Verify user is part of this one-to-one conversation
                    const chat = await chatService.findById(chatId);
                    if (!chat) {
                        socket.emit('error', { message: 'One-to-one conversation not found' });
                        return;
                    }

                    // Ensure only the two participants can join
                    if (chat.user1_id !== user.id && chat.user2_id !== user.id) {
                        socket.emit('error', { message: 'This is a private conversation between two individuals' });
                        return;
                    }

                    // Join the private conversation room
                    socket.join(`chat:${chatId}`);
                    
                    // Get the other person's info
                    const otherUserId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
                    const otherUser = await userService.findById(otherUserId);
                    
                    if (!otherUser) {
                        socket.emit('error', { message: 'Other participant not found' });
                        return;
                    }
                    
                    socket.emit('joined_chat', { 
                        chatId,
                        otherUser: {
                            id: otherUser.id,
                            name: otherUser.name,
                            avatar: otherUser.avatar
                        },
                        conversationType: 'one-to-one'
                    });
                    
                    // Notify the other person you're online in this conversation
                    socket.to(`chat:${chatId}`).emit('conversation_partner_online', {
                        userId: user.id,
                        userName: user.name,
                        avatar: user.avatar
                    });
                    
                    logger.info(`[SOCKET] User ${user.id} joined one-to-one conversation ${chatId} with ${otherUserId}`);
                } catch (error) {
                    logger.error('[SOCKET] Error joining conversation:', error);
                    socket.emit('error', { message: 'Failed to join conversation' });
                }
            });

            // Handle leaving one-to-one conversations
            socket.on('leave_chat', (data) => {
                const { chatId } = data;
                
                // Notify the other person you're leaving the conversation
                socket.to(`chat:${chatId}`).emit('conversation_partner_offline', {
                    userId: user.id,
                    userName: user.name
                });
                
                socket.leave(`chat:${chatId}`);
                socket.emit('left_chat', { chatId });
                
                logger.info(`[SOCKET] User ${user.id} left one-to-one conversation ${chatId}`);
            });

            // Handle sending TEXT messages directly via Socket.IO (fast path)
            socket.on('send_message', async (data) => {
                try {
                    const { chatId, content, tempId } = data;

                    if (!content || content.trim() === '') {
                        socket.emit('message_error', { 
                            tempId, 
                            error: 'Message content cannot be empty' 
                        });
                        return;
                    }

                    // Verify user is part of this chat
                    const chat = await chatService.findById(chatId);
                    if (!chat) {
                        socket.emit('message_error', { 
                            tempId, 
                            error: 'Chat not found' 
                        });
                        return;
                    }

                    // Ensure it's a one-to-one chat
                    if (chat.user1_id !== user.id && chat.user2_id !== user.id) {
                        socket.emit('message_error', { 
                            tempId, 
                            error: 'You are not part of this chat' 
                        });
                        return;
                    }

                    // Create message in database (Socket.IO can do this for simple text)
                    const message = await messageService.create({
                        content: content.trim(),
                        senderId: user.id,
                        chatId
                    });

                    // Update chat timestamp
                    await chatService.updateTimestamp(chatId);

                    // Get the other user (this is always one-to-one)
                    const otherUserId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
                    const otherUser = await userService.findById(otherUserId);

                    // Prepare message data with sender info
                    const messageData = {
                        ...message,
                        sender: {
                            id: user.id,
                            name: user.name,
                            avatar: user.avatar
                        },
                        tempId,
                        chatId,
                        type: 'text' as const
                    };

                    // Instantly send to both users (ultra-fast delivery)
                    this.io.to(`chat:${chatId}`).emit('new_message', messageData);

                    // Send push notification to other user if they're online but not actively in chat
                    const otherUserSocketId = activeUsers.get(otherUserId);
                    if (otherUserSocketId) {
                        const otherUserSocket = this.io.sockets.sockets.get(otherUserSocketId);
                        if (otherUserSocket && !otherUserSocket.rooms.has(`chat:${chatId}`)) {
                            otherUserSocket.emit('new_message_notification', {
                                chatId,
                                senderId: user.id,
                                senderName: user.name,
                                senderAvatar: user.avatar,
                                otherUserName: otherUser?.name || 'Unknown',
                                preview: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                                timestamp: message.sentAt,
                                type: 'text'
                            });
                        }
                    }

                    logger.info(`[SOCKET] ⚡ FAST TEXT message sent in chat ${chatId} by ${user.name}`);
                } catch (error) {
                    logger.error('[SOCKET] Error sending text message:', error);
                    socket.emit('message_error', { 
                        tempId: data.tempId, 
                        error: 'Failed to send message' 
                    });
                }
            });

            // Handle typing indicators
            socket.on('typing_start', (data) => {
                const { chatId } = data;
                socket.to(`chat:${chatId}`).emit('user_typing', {
                    userId: user.id,
                    userName: user.name,
                    chatId
                });
            });

            socket.on('typing_stop', (data) => {
                const { chatId } = data;
                socket.to(`chat:${chatId}`).emit('user_stopped_typing', {
                    userId: user.id,
                    chatId
                });
            });

            // Handle message read receipts
            socket.on('mark_message_read', async (data) => {
                try {
                    const { messageId } = data;
                    
                    const message = await messageService.findById(messageId);
                    if (!message) {
                        socket.emit('error', { message: 'Message not found' });
                        return;
                    }

                    // Only the receiver can mark message as read
                    if (message.senderId === user.id) {
                        socket.emit('error', { message: 'Cannot mark your own message as read' });
                        return;
                    }

                    // Verify user is part of the chat
                    const chat = await chatService.findById(message.chatId);
                    if (!chat || (chat.user1_id !== user.id && chat.user2_id !== user.id)) {
                        socket.emit('error', { message: 'You are not part of this chat' });
                        return;
                    }

                    // Mark message as read
                    const updatedMessage = await messageService.markAsRead(messageId);

                    // Notify the sender that their message was read
                    const senderSocketId = activeUsers.get(message.senderId);
                    if (senderSocketId) {
                        this.io.to(senderSocketId).emit('message_read', {
                            messageId,
                            readBy: user.id,
                            readAt: updatedMessage.readAt
                        });
                    }

                    logger.info(`[SOCKET] Message ${messageId} marked as read by user ${user.id}`);
                } catch (error) {
                    logger.error('[SOCKET] Error marking message as read:', error);
                    socket.emit('error', { message: 'Failed to mark message as read' });
                }
            });

            // Handle disconnection
            socket.on('disconnect', (reason) => {
                // Notify all conversation partners that this user went offline
                socket.rooms.forEach(room => {
                    if (room.startsWith('chat:')) {
                        socket.to(room).emit('conversation_partner_offline', {
                            userId: user.id,
                            userName: user.name
                        });
                    }
                });
                
                activeUsers.delete(user.id);
                userSockets.delete(socket.id);
                
                logger.info(`[SOCKET] User disconnected: ${user.name} (${user.id}) - Reason: ${reason}`);
            });

            // Handle connection errors
            socket.on('error', (error) => {
                logger.error(`[SOCKET] Socket error for user ${user.id}:`, error);
            });
        });
    }

    private setupChatEventListeners() {
        // Listen for messages created via HTTP API and emit via Socket.IO
        chatEvents.onChatEvent('message:created', (data) => {
            const messageData = {
                id: data.messageId,
                content: data.content,
                senderId: data.senderId,
                chatId: data.chatId,
                sentAt: data.sentAt,
                deliveredAt: null,
                readAt: null,
                sender: {
                    id: data.senderId,
                    name: data.senderName,
                    avatar: data.senderAvatar
                },
                type: data.type,
                media: data.media
            };

            // Send to chat room
            this.io.to(`chat:${data.chatId}`).emit('new_message', messageData);

            // Send notification if other user is online but not in chat
            const otherUserSocketId = activeUsers.get(data.otherUserId);
            if (otherUserSocketId) {
                const otherUserSocket = this.io.sockets.sockets.get(otherUserSocketId);
                if (otherUserSocket && !otherUserSocket.rooms.has(`chat:${data.chatId}`)) {
                    otherUserSocket.emit('new_message_notification', {
                        chatId: data.chatId,
                        senderId: data.senderId,
                        senderName: data.senderName,
                        senderAvatar: data.senderAvatar,
                        otherUserName: 'You', // This should be set by the controller
                        preview: data.type === 'image' 
                            ? `📷 Sent ${data.media?.length || 1} image${(data.media?.length || 1) > 1 ? 's' : ''}`
                            : data.content.substring(0, 50) + (data.content.length > 50 ? '...' : ''),
                        timestamp: data.sentAt,
                        type: data.type
                    });
                }
            }

            logger.info(`[SOCKET] Emitted message from HTTP API: ${data.messageId}`);
        });

        // Listen for read receipts
        chatEvents.onChatEvent('message:read', (data) => {
            const senderSocketId = activeUsers.get(data.senderId);
            if (senderSocketId) {
                this.io.to(senderSocketId).emit('message_read', {
                    messageId: data.messageId,
                    readBy: data.readBy,
                    readAt: data.readAt
                });
            }

            logger.info(`[SOCKET] Emitted read receipt: ${data.messageId}`);
        });

        // Listen for chat creation events
        chatEvents.onChatEvent('chat:created', (data) => {
            logger.info(`[SOCKET] New chat created: ${data.chatId}`);
            // Could emit to both users if needed
        });

        logger.info('[SOCKET] Chat event listeners initialized');
    }

    // Method to send notifications to specific users
    public sendNotificationToUser(userId: string, event: string, data: any) {
        const socketId = activeUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).emit(event as keyof ServerToClientEvents, data);
            return true;
        }
        return false;
    }

    // Method to get online users count
    public getOnlineUsersCount(): number {
        return activeUsers.size;
    }

    // Method to check if user is online
    public isUserOnline(userId: string): boolean {
        return activeUsers.has(userId);
    }

    // Method to get all online users
    public getOnlineUsers(): string[] {
        return Array.from(activeUsers.keys());
    }

    // Get the Socket.IO server instance
    public getIO(): SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
        return this.io;
    }
}

// Export a function to initialize the socket manager
export function initializeSocket(server: HTTPServer): SocketManager {
    return new SocketManager(server);
}