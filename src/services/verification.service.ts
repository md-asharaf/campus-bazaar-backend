import { Verification } from "@/@types/schema";
import { db } from "@/config/database";
import { logger } from "@/config/logger";
import { APIError } from "@/utils/APIError";
import { VerificationStatus } from "generated/prisma";

class VerificationService {
    async createVerification(
        userId: string,
        imageId: string,
    ): Promise<Verification> {
        try {
            const verification = await db.verification.findUnique({
                where: {
                    userId,
                },
            });
            if (verification) {
                throw new APIError(400, "Verification already exists");
            }
            const newVerification = await db.verification.create({
                data: {
                    userId,
                    imageId,
                },
            });
            return newVerification;
        } catch (error) {
            throw new Error("Failed to create verification");
        }
    }

    async updateVerification(
        userId: string,
        status: VerificationStatus,
    ): Promise<Verification> {
        try {
            const verification = await db.verification.findUnique({
                where: {
                    userId,
                },
            });
            if (!verification) {
                throw new APIError(404, "Verification not found");
            }
            const updatedVerification = await db.verification.update({
                where: {
                    userId,
                },
                data: {
                    status,
                },
            });
            return updatedVerification;
        } catch (error) {
            if (error instanceof APIError) {
                throw error;
            }
            throw new Error("Failed to update verification");
        }
    }

    async getVerificationByUserId(
        userId: string,
    ): Promise<Verification | null> {
        try {
            const verification = await db.verification.findUnique({
                where: {
                    userId,
                },
            });
            return verification;
        } catch (error) {
            throw new Error("Failed to get verification");
        }
    }

    async getAllVerifications(options?: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
    }): Promise<{
        verifications: Verification[];
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
            const total = await db.verification.count();
            const verifications = await db.verification.findMany({
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            });

            logger.info(
                `[VERIFICATION_SERVICE] All verifications retrieved successfully`,
            );
            return {
                verifications,
                total,
                totalPages: Math.ceil(total / limit),
                page,
            };
        } catch (error) {
            logger.error(
                `[VERIFICATION_SERVICE] Error getting all verifications:`,
                error,
            );
            throw new APIError(500, "Failed to retrieve verifications");
        }
    }
}
export default new VerificationService();
