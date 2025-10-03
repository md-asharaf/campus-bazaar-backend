import { Wishlist, WishlistCreate, WishlistCreateSchema } from "@/@types/schema";
import { db } from "@/config/database";
import { Prisma } from "../../generated/prisma";

class WishlistService {
    async create(data: WishlistCreate): Promise<Wishlist> {
        const validatedData = WishlistCreateSchema.parse(data);
        return await db.wishlist.create({ data: validatedData });
    }

    async findById(id: string): Promise<Wishlist | null> {
        return await db.wishlist.findUnique({ where: { id } });
    }

    async findByUserAndItem(userId: string, itemId: string): Promise<Wishlist | null> {
        return await db.wishlist.findUnique({
            where: { userId_itemId: { userId, itemId } }
        });
    }

    async findByUserId(userId: string, filters?: {
        itemCategory?: string;
        itemAvailable?: boolean;
        priceRange?: { min?: number; max?: number };
    }, options?: {
        page?: number;
        limit?: number;
        includeRelations?: boolean;
    }): Promise<Wishlist[]> {
        const { page, limit, includeRelations = false } = options || {};
        
        let where: Prisma.WishlistWhereInput = { userId };
        
        if (filters?.itemCategory || filters?.itemAvailable !== undefined || filters?.priceRange) {
            where.item = {};
            
            if (filters.itemCategory) {
                where.item.categoryId = filters.itemCategory;
            }
            
            if (filters.itemAvailable !== undefined) {
                where.item.isSold = !filters.itemAvailable;
            }
            
            if (filters.priceRange?.min !== undefined || filters.priceRange?.max !== undefined) {
                where.item.price = {};
                if (filters.priceRange.min !== undefined) where.item.price.gte = filters.priceRange.min;
                if (filters.priceRange.max !== undefined) where.item.price.lte = filters.priceRange.max;
            }
        }
        
        const queryOptions: Prisma.WishlistFindManyArgs = { where };
        
        if (page && limit) {
            queryOptions.skip = (page - 1) * limit;
            queryOptions.take = limit;
        }
        
        if (includeRelations) {
            queryOptions.include = {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        email: true
                    }
                },
                item: {
                    include: {
                        images: true,
                        category: {
                            include: {
                                image: true
                            }
                        }
                    }
                }
            };
        }
        
        return await db.wishlist.findMany(queryOptions);
    }

    async findMany(params?: {
        userId?: string;
        itemId?: string;
        itemCategory?: string;
        itemAvailable?: boolean;
        priceRange?: { min?: number; max?: number };
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        includeRelations?: boolean;
    }): Promise<{
        items: Wishlist[];
        total: number;
        totalPages: number;
        page: number;
        limit: number;
    }> {
        const { 
            userId,
            itemId,
            itemCategory,
            itemAvailable,
            priceRange,
            page = 1, 
            limit = 10, 
            sortBy = 'createdAt',
            sortOrder = 'desc',
            includeRelations = false 
        } = params || {};
        
        const where: Prisma.WishlistWhereInput = {};
        
        if (userId) where.userId = userId;
        if (itemId) where.itemId = itemId;
        
        if (itemCategory || itemAvailable !== undefined || priceRange) {
            where.item = {};
            
            if (itemCategory) {
                where.item.categoryId = itemCategory;
            }
            
            if (itemAvailable !== undefined) {
                where.item.isSold = !itemAvailable;
            }
            
            if (priceRange?.min !== undefined || priceRange?.max !== undefined) {
                where.item.price = {};
                if (priceRange.min !== undefined) where.item.price.gte = priceRange.min;
                if (priceRange.max !== undefined) where.item.price.lte = priceRange.max;
            }
        }
        
        const total = await db.wishlist.count({ where });
        
        const queryOptions: Prisma.WishlistFindManyArgs = { where };
        
        queryOptions.skip = (page - 1) * limit;
        queryOptions.take = limit;
        
        const orderBy: Prisma.WishlistOrderByWithRelationInput = {};
        orderBy[sortBy as keyof Prisma.WishlistOrderByWithRelationInput] = sortOrder;
        queryOptions.orderBy = orderBy;
        
        if (includeRelations) {
            queryOptions.include = {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        email: true
                    }
                },
                item: {
                    include: {
                        images: true,
                        category: {
                            include: {
                                image: true
                            }
                        }
                    }
                }
            };
        }
        
        const items = await db.wishlist.findMany(queryOptions);
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
        await db.wishlist.delete({ where: { id } });
    }

    async deleteByUserAndItem(userId: string, itemId: string): Promise<void> {
        await db.wishlist.delete({
            where: { userId_itemId: { userId, itemId } }
        });
    }
}

export default new WishlistService();