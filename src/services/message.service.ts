import { Message, MessageCreate, MessageCreateSchema } from "@/@types/schema";
import { db } from "@/config/database";
import { Prisma } from "../../generated/prisma";

// Transform message with media relation to include media URLs
const transformMessage = (message: any): Message => {
    if (message.media && Array.isArray(message.media)) {
        return {
            ...message,
            media: message.media.map((m: any) => m.image?.url).filter(Boolean)
        };
    }
    return message;
};

const transformMessages = (messages: any[]): Message[] => {
    return messages.map(transformMessage);
};

class MessageService {
    async create(data: MessageCreate): Promise<Message> {
        const validatedData = MessageCreateSchema.parse(data);
        return await db.message.create({ data: validatedData });
    }

    async findById(id: string, options?: { includeRelations?: boolean }): Promise<Message | null> {
        const { includeRelations = false } = options || {};

        const message = await db.message.findUnique({
            where: { id },
            include: includeRelations ? {
                media: {
                    include: {
                        image: true
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
                    include: {
                        image: true
                    }
                }
            }
        });

        return message ? transformMessage(message) : null;
    }

    async findByChatId(chatId: string, options?: {
        page?: number;
        limit?: number;
        includeRelations?: boolean;
    }): Promise<{
        items: Message[];
        total: number;
        totalPages: number;
        page: number;
        limit: number;
    }> {
        const { page = 1, limit = 50, includeRelations = false } = options || {};

        const total = await db.message.count({ where: { chatId } });

        const items = await db.message.findMany({
            where: { chatId },
            orderBy: { sentAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: includeRelations ? {
                media: {
                    include: {
                        image: true
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
                    include: {
                        image: true
                    }
                }
            }
        });

        const totalPages = Math.ceil(total / limit);

        return {
            items: transformMessages(items),
            total,
            totalPages,
            page,
            limit
        };
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

        const total = await db.message.count({ where });

        const queryOptions: Prisma.MessageFindManyArgs = { where };

        queryOptions.skip = (page - 1) * limit;
        queryOptions.take = limit;

        const orderBy: Prisma.MessageOrderByWithRelationInput = {};
        orderBy[sortBy as keyof Prisma.MessageOrderByWithRelationInput] = sortOrder;
        queryOptions.orderBy = orderBy;

        if (includeRelations) {
            queryOptions.include = {
                media: {
                    include: {
                        image: true
                    }
                },
                sender: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            };
        } else {
            queryOptions.include = {
                media: {
                    include: {
                        image: true
                    }
                }
            };
        }

        const items = await db.message.findMany(queryOptions);
        const totalPages = Math.ceil(total / limit);

        return {
            items: transformMessages(items),
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