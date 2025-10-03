import { Category, CategoryCreate, CategoryCreateSchema, CategoryUpdate, CategoryUpdateSchema } from "@/@types/schema";
import { db } from "@/config/database";
import { Prisma } from "../../generated/prisma";

class CategoryService {
    async create(data: CategoryCreate): Promise<Category> {
        const validatedData = CategoryCreateSchema.parse(data);
        return await db.category.create({ data: validatedData });
    }

    async findById(id: string): Promise<Category | null> {
        return await db.category.findUnique({ where: { id } });
    }

    async findByName(name: string): Promise<Category | null> {
        return await db.category.findUnique({ where: { name } });
    }

    async findMany(params?: {
        search?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        includeRelations?: boolean;
    }): Promise<{
        items: Category[];
        total: number;
        totalPages: number;
        page: number;
        limit: number;
    }> {
        const {
            search,
            page = 1,
            limit = 10,
            sortBy = 'name',
            sortOrder = 'asc',
            includeRelations = false
        } = params || {};

        const where: Prisma.CategoryWhereInput = {};

        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        const total = await db.category.count({ where });

        const queryOptions: Prisma.CategoryFindManyArgs = { where };

        queryOptions.skip = (page - 1) * limit;
        queryOptions.take = limit;

        const orderBy: Prisma.CategoryOrderByWithRelationInput = {};
        orderBy[sortBy as keyof Prisma.CategoryOrderByWithRelationInput] = sortOrder;
        queryOptions.orderBy = orderBy;

        if (includeRelations) {
            queryOptions.include = {
                image: true,
                items: {
                    include: {
                        images: true,
                        wishlists: {
                            select: {
                                id: true,
                                userId: true
                            }
                        }
                    }
                }
            };
        }

        const items = await db.category.findMany(queryOptions);
        const totalPages = Math.ceil(total / limit);

        return {
            items,
            total,
            totalPages,
            page,
            limit
        };
    }

    async update(id: string, data: CategoryUpdate): Promise<Category> {
        const validatedData = CategoryUpdateSchema.parse(data);
        return await db.category.update({ where: { id }, data: validatedData });
    }


    async delete(id: string): Promise<void> {
        await db.category.delete({ where: { id } });
    }
}

export default new CategoryService();