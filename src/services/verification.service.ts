import { Verification, VerificationStatus } from "@/@types/schema";
import { db } from "@/config/database";
import { Prisma } from "../../generated/prisma";

class VerificationService {
    async create(userId: string, imageId: string): Promise<Verification> {
        return await db.verification.create({ data: { userId, imageId } });
    }

    async findById(id: string): Promise<Verification | null> {
        return await db.verification.findUnique({ where: { id } });
    }

    async findByUserId(userId: string): Promise<Verification | null> {
        return await db.verification.findUnique({ where: { userId } });
    }

    async findByImageId(imageId: string): Promise<Verification | null> {
        return await db.verification.findUnique({ where: { imageId } });
    }

    async findMany(params?: {
        userId?: string;
        status?: VerificationStatus;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        includeRelations?: boolean;
    }): Promise<{
        items: Verification[];
        total: number;
        totalPages: number;
        page: number;
        limit: number;
    }> {
        const { 
            userId, 
            status, 
            page = 1, 
            limit = 10, 
            sortBy = 'createdAt',
            sortOrder = 'desc',
            includeRelations = false 
        } = params || {};
        
        const where: Prisma.VerificationWhereInput = {};
        
        if (userId) where.userId = userId;
        if (status) where.status = status;
        
        const total = await db.verification.count({ where });
        
        const queryOptions: Prisma.VerificationFindManyArgs = { where };
        
        queryOptions.skip = (page - 1) * limit;
        queryOptions.take = limit;
        
        const orderBy: Prisma.VerificationOrderByWithRelationInput = {};
        orderBy[sortBy as keyof Prisma.VerificationOrderByWithRelationInput] = sortOrder;
        queryOptions.orderBy = orderBy;
        
        if (includeRelations) {
            queryOptions.include = {
                image: true
            };
        }
        
        const items = await db.verification.findMany(queryOptions);
        const totalPages = Math.ceil(total / limit);
        
        return {
            items,
            total,
            totalPages,
            page,
            limit
        };
    }

    async updateStatus(id: string, status: VerificationStatus): Promise<Verification> {
        return await db.verification.update({ where: { id }, data: { status } });
    }

    async delete(id: string): Promise<void> {
        await db.verification.delete({ where: { id } });
    }
}
export default new VerificationService();
