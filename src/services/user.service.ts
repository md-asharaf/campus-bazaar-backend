import { db } from "@/config/database";
import { UserCreateSchema, UserCreate, User, UserUpdate, UserUpdateSchema } from "@/@types/schema";

class UserService {
    async create(data: UserCreate): Promise<User> {
        const validatedData = UserCreateSchema.parse(data);
        return await db.user.create({ data: validatedData });
    }

    async findById(id: string): Promise<User | null> {
        return await db.user.findUnique({ where: { id } });
    }

    async findByEmail(email: string): Promise<User | null> {
        return await db.user.findUnique({ where: { email } });
    }

    async findByRegistrationNo(registrationNo: string): Promise<User | null> {
        return await db.user.findUnique({ where: { registrationNo } });
    }

    async findMany(where?: any): Promise<User[]> {
        return await db.user.findMany({ where });
    }

    async update(id: string, data: UserUpdate): Promise<User> {
        const validatedData = UserUpdateSchema.parse(data);
        return await db.user.update({ where: { id }, data: validatedData });
    }

    async delete(id: string): Promise<void> {
        await db.user.delete({ where: { id } });
    }
}

export default new UserService();
