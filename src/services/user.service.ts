import { db } from "@/config/database";
import { UserCreateSchema, UserCreate, User, UserUpdate, UserUpdateSchema } from "@/@types/schema";
import { Prisma } from "../../generated/prisma";

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

    async findMany(params?: {
        email?: string;
        registrationNo?: string;
        isVerified?: boolean;
        isActive?: boolean;
        branch?: string;
        year?: number;
        search?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        includeRelations?: boolean;
    }): Promise<{
        items: User[];
        total: number;
        totalPages: number;
        page: number;
        limit: number;
    }> {
        const { 
            email,
            registrationNo, 
            isVerified, 
            isActive, 
            branch,
            year,
            search, 
            page = 1, 
            limit = 10, 
            sortBy = 'createdAt',
            sortOrder = 'desc',
            includeRelations = false 
        } = params || {};
        
        // Build where clause
        const where: Prisma.UserWhereInput = {};
        
        if (email) where.email = email;
        if (registrationNo) where.registrationNo = registrationNo;
        if (isVerified !== undefined) where.isVerified = isVerified;
        if (isActive !== undefined) where.isActive = isActive;
        if (branch) where.branch = branch;
        if (year) where.year = year;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { registrationNo: { contains: search, mode: 'insensitive' } }
            ];
        }
        
        // Get total count
        const total = await db.user.count({ where });
        
        // Build query options
        const queryOptions: Prisma.UserFindManyArgs = { where };
        
        // Pagination
        queryOptions.skip = (page - 1) * limit;
        queryOptions.take = limit;
        
        // Sorting
        const orderBy: Prisma.UserOrderByWithRelationInput = {};
        orderBy[sortBy as keyof Prisma.UserOrderByWithRelationInput] = sortOrder;
        queryOptions.orderBy = orderBy;
        
        // Relations
        if (includeRelations) {
            queryOptions.include = {
                feedback: true,
                wishlists: {
                    include: {
                        item: {
                            include: {
                                images: true,
                                category: true
                            }
                        }
                    }
                },
                messages: {
                    include: {
                        media: true
                    }
                },
                chatsAsUser1: {
                    include: {
                        user1: true,
                        user2: true
                    }
                }
            };
        }
        
        const items = await db.user.findMany(queryOptions);
        const totalPages = Math.ceil(total / limit);
        
        return {
            items,
            total,
            totalPages,
            page,
            limit
        };
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
