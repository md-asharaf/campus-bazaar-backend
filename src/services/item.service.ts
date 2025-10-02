import { Item, ItemCreate, ItemCreateSchema, ItemUpdate, ItemUpdateSchema } from "@/@types/schema";
import { db } from "@/config/database";
import { Prisma } from "../../generated/prisma";

class ItemService {
    async create(data: ItemCreate): Promise<Item> {
        const validatedData = ItemCreateSchema.parse(data);
        return await db.item.create({ data: validatedData });
    }

    async findById(id: string): Promise<Item | null> {
        return await db.item.findUnique({ where: { id } });
    }

    async findMany(params?: {
        sellerId?: string;
        categoryId?: string;
        minPrice?: number;
        maxPrice?: number;
        verified?: boolean;
        available?: boolean;
        search?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        includeRelations?: boolean;
    }): Promise<{
        items: Item[];
        total: number;
        totalPages: number;
        page: number;
        limit: number;
    }> {
        const { 
            sellerId,
            categoryId, 
            minPrice,
            maxPrice,
            verified,
            available,
            search,
            page = 1, 
            limit = 10, 
            sortBy = 'createdAt',
            sortOrder = 'desc',
            includeRelations = false 
        } = params || {};
        
        // Build where clause
        const where: Prisma.ItemWhereInput = {};
        
        if (sellerId) where.sellerId = sellerId;
        if (categoryId) where.categoryId = categoryId;
        if (verified !== undefined) where.isVerified = verified;
        if (available !== undefined) where.isSold = !available;
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined) where.price.gte = minPrice;
            if (maxPrice !== undefined) where.price.lte = maxPrice;
        }
        if (search) {
            where.title = { contains: search, mode: 'insensitive' };
        }
        
        // Get total count
        const total = await db.item.count({ where });
        
        // Build query options
        const queryOptions: Prisma.ItemFindManyArgs = { where };
        
        // Pagination
        queryOptions.skip = (page - 1) * limit;
        queryOptions.take = limit;
        
        // Sorting
        const orderBy: Prisma.ItemOrderByWithRelationInput = {};
        orderBy[sortBy as keyof Prisma.ItemOrderByWithRelationInput] = sortOrder;
        queryOptions.orderBy = orderBy;
        
        // Relations
        if (includeRelations) {
            queryOptions.include = {
                images: true,
                category: {
                    include: {
                        image: true
                    }
                },
                wishlists: {
                    select: {
                        id: true,
                        userId: true
                    }
                }
            };
        }
        
        const items = await db.item.findMany(queryOptions);
        const totalPages = Math.ceil(total / limit);
        
        return {
            items,
            total,
            totalPages,
            page,
            limit
        };
    }

    async update(id: string, data: ItemUpdate): Promise<Item> {
        const validatedData = ItemUpdateSchema.parse(data);
        return await db.item.update({ where: { id }, data: validatedData });
    }

    async delete(id: string): Promise<void> {
        await db.item.delete({ where: { id } });
    }
}
export default new ItemService();