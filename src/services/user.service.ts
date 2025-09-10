import { db } from "@/config/database";
import { logger } from "@/config/logger";
import { APIError } from "@/utils/APIError";
import {
    UserCreateSchema,
    type UserCreate,
    type User,
    UserUpdate,
    UserUpdateSchema,
} from "@/@types/schema";
import { z } from "zod";
class UserService {
    async createUser(userData: UserCreate): Promise<User> {
        try {
            const validatedData = UserCreateSchema.parse(userData);
            // Check if user with email already exists
            const existingUser = await db.user.findUnique({
                where: { email: validatedData.email },
                select: { id: true },
            });

            if (existingUser) {
                throw new APIError(
                    409,
                    "User with this email already exists. Please use a different email.",
                );
            }
            //check if admin exists with the same email
            const adminExists = await db.admin.findUnique({
                where: { email: validatedData.email },
            });
            if (adminExists) {
                throw new APIError(
                    409,
                    "Admin with this email already exists. Please use a different email.",
                );
            }
            // Create the user
            const user = await db.user.create({
                data: validatedData,
            });

            logger.info(
                `[USER_SERVICE] User created successfully with ID: ${user.id}`,
            );
            return user;
        } catch (error: any) {
            if (error instanceof APIError) {
                throw error;
            }
            if (error instanceof z.ZodError) {
                throw new APIError(
                    400,
                    error.errors.map((e) => e.message).join(", "),
                );
            }
            logger.error("[USER_SERVICE] Error creating user:", error);
            throw new APIError(500, "Failed to create user");
        }
    }

    async getUserById(
        userId: string,
        includeRelations: boolean = false,
    ): Promise<User | null> {
        try {
            const user = await db.user.findUnique({
                where: { id: userId },
                // include: includeRelations
                //     ? {
                //         cart: true,
                //         orders: true,
                //         reviews: true,
                //         addresses: true
                //     }
                //     : undefined,
            });

            if (!user) {
                logger.warn(`[USER_SERVICE] User not found with ID: ${userId}`);
                return null;
            }

            logger.info(
                `[USER_SERVICE] User retrieved successfully with ID: ${userId}`,
            );
            return user;
        } catch (error) {
            logger.error(
                `[USER_SERVICE] Error getting user by ID ${userId}:`,
                error,
            );
            throw new APIError(500, "Failed to retrieve user");
        }
    }

    async getUserByEmail(email: string): Promise<User | null> {
        try {
            const user = await db.user.findUnique({
                where: { email },
            });

            if (!user) {
                logger.warn(
                    `[USER_SERVICE] User not found with email: ${email}`,
                );
                return null;
            }

            logger.info(
                `[USER_SERVICE] User retrieved successfully with email: ${email}`,
            );
            return user;
        } catch (error) {
            logger.error(
                `[USER_SERVICE] Error getting user by email ${email}:`,
                error,
            );
            throw new APIError(500, "Failed to retrieve user");
        }
    }

    async updateUser(userId: string, data: UserUpdate): Promise<User> {
        try {
            const validatedData = UserUpdateSchema.parse(data);
            const user = await db.user.update({
                where: { id: userId },
                data: validatedData,
            });

            if (!user) {
                logger.warn(`[USER_SERVICE] User not found with ID: ${userId}`);
                throw new APIError(404, "User not found");
            }

            logger.info(
                `[USER_SERVICE] User updated successfully with ID: ${userId}`,
            );
            return user;
        } catch (error) {
            logger.error(
                `[USER_SERVICE] Error updating user by ID ${userId}:`,
                error,
            );
            throw new APIError(500, "Failed to update user");
        }
    }

    async getAllUsers(options?: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
    }): Promise<{
        users: User[];
        total: number;
        totalPages: number;
        page: number;
    }> {
        try {
            const {
                page = 1,
                limit = 10,
                sortBy = "asc",
                sortOrder = "asc",
            } = options || {};
            const total = await db.user.count();
            const users = await db.user.findMany({
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            });

            logger.info(`[USER_SERVICE] All users retrieved successfully`);
            return {
                users,
                total,
                totalPages: Math.ceil(total / limit),
                page,
            };
        } catch (error) {
            logger.error(`[USER_SERVICE] Error getting all users:`, error);
            throw new APIError(500, "Failed to retrieve users");
        }
    }
}

export default new UserService();
