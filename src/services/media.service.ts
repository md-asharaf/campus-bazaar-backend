import { Media, MediaCreate, MediaCreateSchema } from "@/@types/schema";
import { db } from "@/config/database";
import { Prisma } from "../../generated/prisma";

class MediaService {
    async create(data: MediaCreate): Promise<Media> {
        const validatedData = MediaCreateSchema.parse(data);
        return await db.media.create({ data: validatedData });
    }

    async findById(id: string): Promise<Media | null> {
        return await db.media.findUnique({ where: { id } });
    }

    async findByMessageId(messageId: string): Promise<Media[]> {
        return await db.media.findMany({ where: { messageId } });
    }

    async findMany(params?: {
        messageId?: string;
        url?: string;
        dateFrom?: Date;
        dateTo?: Date;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        includeRelations?: boolean;
    }): Promise<{
        items: Media[];
        total: number;
        totalPages: number;
        page: number;
        limit: number;
    }> {
        const { 
            messageId,
            url,
            dateFrom,
            dateTo,
            page = 1, 
            limit = 10, 
            sortBy = 'createdAt',
            sortOrder = 'desc',
            includeRelations = false 
        } = params || {};
        
        // Build where clause
        const where: Prisma.MediaWhereInput = {};
        
        if (messageId) where.messageId = messageId;
        if (url) where.url = { contains: url, mode: 'insensitive' };
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = dateFrom;
            if (dateTo) where.createdAt.lte = dateTo;
        }
        
        // Get total count
        const total = await db.media.count({ where });
        
        // Build query options
        const queryOptions: Prisma.MediaFindManyArgs = { where };
        
        // Pagination
        queryOptions.skip = (page - 1) * limit;
        queryOptions.take = limit;
        
        // Sorting
        const orderBy: Prisma.MediaOrderByWithRelationInput = {};
        orderBy[sortBy as keyof Prisma.MediaOrderByWithRelationInput] = sortOrder;
        queryOptions.orderBy = orderBy;
        
        // Relations
        if (includeRelations) {
            queryOptions.include = {
                message: {
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true
                            }
                        }
                    }
                }
            };
        }
        
        const items = await db.media.findMany(queryOptions);
        const totalPages = Math.ceil(total / limit);
        
        return {
            items,
            total,
            totalPages,
            page,
            limit
        };
    }


    async delete(id: string): Promise<void> {
        await db.media.delete({ where: { id } });
    }
}

export default new MediaService();