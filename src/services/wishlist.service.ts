import { Wishlist, WishlistCreate, WishlistCreateSchema } from "@/@types/schema";
import { db } from "@/config/database";

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

    async findByUserId(userId: string): Promise<Wishlist[]> {
        return await db.wishlist.findMany({ where: { userId } });
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