import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import envVars from '@/config/envVars';
import { logger } from '@/config/logger';
import userService from '@/services/user.service';
import messageService from '@/services/message.service';
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from '@/@types/socket';

type CustomSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const activeUsers = new Map<string, string>();
const userSockets = new Map<string, string>();

class SimpleSocketManager {
    private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

    constructor(server: HTTPServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        this.setupMiddleware();
        this.setupEventHandlers();
    }

    private setupMiddleware() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('No token provided'));
                }

                const decoded = jwt.verify(token, envVars.JWT_SECRET) as { userId: string };
                const user = await userService.findById(decoded.userId);

                if (!user) {
                    return next(new Error('User not found'));
                }

                socket.data = {
                    userId: user.id,
                    userName: user.name
                };

                next();
            } catch (error) {
                next(new Error('Authentication failed'));
            }
        });
    }

    private setupEventHandlers() {
        this.io.on('connection', (socket: CustomSocket) => {
            const { userId } = socket.data;

            activeUsers.set(userId, socket.id);
            userSockets.set(socket.id, userId);

            socket.emit('connected', { userId });
            socket.on('join_chat', async ({ chatId }) => {
                try {
                    socket.join(`chat:${chatId}`);
                    socket.emit('joined_chat', { chatId });
                    
                    socket.to(`chat:${chatId}`).emit('user_online', { userId });
                    
                    logger.info(`User ${userId} joined chat ${chatId}`);
                } catch (error) {
                    socket.emit('error', { message: 'Failed to join chat' });
                }
            });

            socket.on('leave_chat', ({ chatId }) => {
                socket.leave(`chat:${chatId}`);
                socket.emit('left_chat', { chatId });
                
                socket.to(`chat:${chatId}`).emit('user_offline', { userId });
                
                logger.info(`User ${userId} left chat ${chatId}`);
            });

            socket.on('send_message', async ({ chatId, content }) => {
                try {
                    const message = await messageService.create({
                        content,
                        senderId: userId,
                        chatId
                    });

                    this.io.to(`chat:${chatId}`).emit('new_message', {
                        messageId: message.id,
                        content: message.content,
                        senderId: userId,
                        chatId
                    });

                    logger.info(`Message sent in chat ${chatId} by ${userId}`);
                } catch (error) {
                    socket.emit('error', { message: 'Failed to send message' });
                }
            });

            socket.on('mark_delivered', async ({ messageId }) => {
                try {
                    const message = await messageService.findById(messageId);
                    if (!message) {
                        socket.emit('error', { message: 'Message not found' });
                        return;
                    }

                    await messageService.markAsDelivered(messageId);

                    const senderSocketId = activeUsers.get(message.senderId);
                    if (senderSocketId) {
                        this.io.to(senderSocketId).emit('message_delivered', {
                            messageId,
                            deliveredTo: userId
                        });
                    }

                    logger.info(`Message ${messageId} marked as delivered to ${userId}`);
                } catch (error) {
                    socket.emit('error', { message: 'Failed to mark as delivered' });
                }
            });

            socket.on('mark_read', async ({ messageId }) => {
                try {
                    const message = await messageService.findById(messageId);
                    if (!message) {
                        socket.emit('error', { message: 'Message not found' });
                        return;
                    }

                    await messageService.markAsRead(messageId);

                    const senderSocketId = activeUsers.get(message.senderId);
                    if (senderSocketId) {
                        this.io.to(senderSocketId).emit('message_read', {
                            messageId,
                            readBy: userId
                        });
                    }

                    logger.info(`Message ${messageId} marked as read by ${userId}`);
                } catch (error) {
                    socket.emit('error', { message: 'Failed to mark as read' });
                }
            });

            socket.on('typing_start', ({ chatId }) => {
                socket.to(`chat:${chatId}`).emit('user_typing', { 
                    userId, 
                    chatId 
                });
            });

            socket.on('typing_stop', ({ chatId }) => {
                socket.to(`chat:${chatId}`).emit('user_stopped_typing', { 
                    userId, 
                    chatId 
                });
            });
            socket.on('disconnect', (reason) => {
                socket.rooms.forEach((room: string) => {
                    if (room.startsWith('chat:')) {
                        socket.to(room).emit('user_offline', { userId });
                    }
                });

                activeUsers.delete(userId);
                userSockets.delete(socket.id);

                logger.info(`User ${userId} disconnected: ${reason}`);
            });
        });
    }

    public isUserOnline(userId: string): boolean {
        return activeUsers.has(userId);
    }

    public getOnlineUsersCount(): number {
        return activeUsers.size;
    }
}

export function initializeSocket(server: HTTPServer): SimpleSocketManager {
    return new SimpleSocketManager(server);
}