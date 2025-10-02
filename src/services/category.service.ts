import { Category, CategoryCreate, CategoryCreateSchema, CategoryUpdate, CategoryUpdateSchema } from "@/@types/schema";
import { db } from "@/config/database";

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

    async findMany(where?: any): Promise<Category[]> {
        return await db.category.findMany({ where });
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