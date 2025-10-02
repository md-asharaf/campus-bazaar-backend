import { Feedback, FeedbackCreate, FeedbackCreateSchema, FeedbackUpdate, FeedbackUpdateSchema } from "@/@types/schema";
import { db } from "@/config/database";
import { Prisma } from "../../generated/prisma";

class FeedbackService {
    async create(data: FeedbackCreate): Promise<Feedback> {
        const validatedData = FeedbackCreateSchema.parse(data);
        return await db.feedback.create({ data: validatedData });
    }

    async findById(id: string): Promise<Feedback | null> {
        return await db.feedback.findUnique({ where: { id } });
    }

    async findByUserId(userId: string): Promise<Feedback | null> {
        return await db.feedback.findUnique({ where: { userId } });
    }

    async findMany(params?: {
        userId?: string;
        rating?: number;
        minRating?: number;
        maxRating?: number;
        search?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        includeRelations?: boolean;
    }): Promise<{
        items: Feedback[];
        total: number;
        totalPages: number;
        page: number;
        limit: number;
    }> {
        const { 
            userId,
            rating,
            minRating,
            maxRating,
            search,
            page = 1, 
            limit = 10, 
            sortBy = 'createdAt',
            sortOrder = 'desc',
            includeRelations = false 
        } = params || {};
        
        // Build where clause
        const where: Prisma.FeedbackWhereInput = {};
        
        if (userId) where.userId = userId;
        if (rating) where.rating = rating;
        if (minRating !== undefined || maxRating !== undefined) {
            where.rating = {};
            if (minRating !== undefined) where.rating.gte = minRating;
            if (maxRating !== undefined) where.rating.lte = maxRating;
        }
        if (search) {
            where.content = { contains: search, mode: 'insensitive' };
        }
        
        // Get total count
        const total = await db.feedback.count({ where });
        
        // Build query options
        const queryOptions: Prisma.FeedbackFindManyArgs = { where };
        
        // Pagination
        queryOptions.skip = (page - 1) * limit;
        queryOptions.take = limit;
        
        // Sorting
        const orderBy: Prisma.FeedbackOrderByWithRelationInput = {};
        orderBy[sortBy as keyof Prisma.FeedbackOrderByWithRelationInput] = sortOrder;
        queryOptions.orderBy = orderBy;
        
        // Relations
        if (includeRelations) {
            queryOptions.include = {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        email: true,
                        branch: true,
                        year: true
                    }
                }
            };
        }
        
        const items = await db.feedback.findMany(queryOptions);
        const totalPages = Math.ceil(total / limit);
        
        return {
            items,
            total,
            totalPages,
            page,
            limit
        };
    }

    async update(id: string, data: FeedbackUpdate): Promise<Feedback> {
        const validatedData = FeedbackUpdateSchema.parse(data);
        return await db.feedback.update({ where: { id }, data: validatedData });
    }


    async delete(id: string): Promise<void> {
        await db.feedback.delete({ where: { id } });
    }
}

export default new FeedbackService();