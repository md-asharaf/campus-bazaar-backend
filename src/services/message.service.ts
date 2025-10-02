import { Message, MessageCreate, MessageCreateSchema } from "@/@types/schema";
import { db } from "@/config/database";
import { Prisma } from "../../generated/prisma";

class MessageService {
    async create(data: MessageCreate): Promise<Message> {
        const validatedData = MessageCreateSchema.parse(data);
        return await db.message.create({ data: validatedData });
    }

    async findById(id: string): Promise<Message | null> {
        return await db.message.findUnique({ where: { id } });
    }

    async findByChatId(chatId: string, options?: {
        page?: number;
        limit?: number;
        includeRelations?: boolean;
    }): Promise<Message[]> {
        const { page = 1, limit = 50, includeRelations = false } = options || {};
        
        return await db.message.findMany({ 
            where: { chatId },
            orderBy: { sentAt: 'desc' }, // Latest first for pagination
            skip: (page - 1) * limit,
            take: limit,
            include: includeRelations ? {
                media: {
                    select: {
                        id: true,
                        url: true,
                        messageId: true,
                        createdAt: true
                    }
                },
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            } : {
                media: {
                    select: {
                        id: true,
                        url: true,
                        messageId: true
                    }
                }
            }
        });
    }

    async countByChatId(chatId: string): Promise<number> {
        return await db.message.count({ where: { chatId } });
    }

    async findBySenderId(senderId: string): Promise<Message[]> {
        return await db.message.findMany({ where: { senderId } });
    }

    async findMany(params?: {
        chatId?: string;
        senderId?: string;
        search?: string;
        delivered?: boolean;
        read?: boolean;
        dateFrom?: Date;
        dateTo?: Date;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        includeRelations?: boolean;
    }): Promise<{
        items: Message[];
        total: number;
        totalPages: number;
        page: number;
        limit: number;
    }> {
        const { 
            chatId,
            senderId,
            search,
            delivered,
            read,
            dateFrom,
            dateTo,
            page = 1, 
            limit = 10, 
            sortBy = 'sentAt',
            sortOrder = 'desc',
            includeRelations = false 
        } = params || {};
        
        // Build where clause
        const where: Prisma.MessageWhereInput = {};
        
        if (chatId) where.chatId = chatId;
        if (senderId) where.senderId = senderId;
        if (search) {
            where.content = { contains: search, mode: 'insensitive' };
        }
        if (delivered !== undefined) {
            where.deliveredAt = delivered ? { not: null } : null;
        }
        if (read !== undefined) {
            where.readAt = read ? { not: null } : null;
        }
        if (dateFrom || dateTo) {
            where.sentAt = {};
            if (dateFrom) where.sentAt.gte = dateFrom;
            if (dateTo) where.sentAt.lte = dateTo;
        }
        
        // Get total count
        const total = await db.message.count({ where });
        
        // Build query options
        const queryOptions: Prisma.MessageFindManyArgs = { where };
        
        // Pagination
        queryOptions.skip = (page - 1) * limit;
        queryOptions.take = limit;
        
        // Sorting
        const orderBy: Prisma.MessageOrderByWithRelationInput = {};
        orderBy[sortBy as keyof Prisma.MessageOrderByWithRelationInput] = sortOrder;
        queryOptions.orderBy = orderBy;
        
        // Relations
        if (includeRelations) {
            queryOptions.include = {
                media: true,
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            };
        }
        
        const items = await db.message.findMany(queryOptions);
        const totalPages = Math.ceil(total / limit);
        
        return {
            items,
            total,
            totalPages,
            page,
            limit
        };
    }

    async markAsDelivered(id: string): Promise<Message> {
        return await db.message.update({
            where: { id },
            data: { deliveredAt: new Date() }
        });
    }

    async markAsRead(id: string): Promise<Message> {
        return await db.message.update({
            where: { id },
            data: { readAt: new Date() }
        });
    }


    async delete(id: string): Promise<void> {
        await db.message.delete({ where: { id } });
    }
}

export default new MessageService();