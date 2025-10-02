import { Item, ItemCreate, ItemCreateSchema, ItemUpdate, ItemUpdateSchema } from "@/@types/schema";
import { db } from "@/config/database";

class ItemService {
    async create(data: ItemCreate): Promise<Item> {
        const validatedData = ItemCreateSchema.parse(data);
        return await db.item.create({ data: validatedData });
    }

    async findById(id: string): Promise<Item | null> {
        return await db.item.findUnique({ where: { id } });
    }

    async findMany(where?: any): Promise<Item[]> {
        return await db.item.findMany({ where });
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