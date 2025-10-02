import { Verification, VerificationStatus } from "@/@types/schema";
import { db } from "@/config/database";

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

    async findMany(where?: any): Promise<Verification[]> {
        return await db.verification.findMany({ where });
    }

    async updateStatus(id: string, status: VerificationStatus): Promise<Verification> {
        return await db.verification.update({ where: { id }, data: { status } });
    }

    async delete(id: string): Promise<void> {
        await db.verification.delete({ where: { id } });
    }
}
export default new VerificationService();
