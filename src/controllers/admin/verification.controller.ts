import { QuerySchema } from "@/@types/interface";
import { VerificationStatus } from "@/@types/schema";
import verificationService from "@/services/verification.service";
import { APIResponse } from "@/utils/APIResponse";
import { Request, Response } from "express";

const getVerification = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const verification =
        await verificationService.findByUserId(userId);
    res.status(200).json(
        new APIResponse(true, "verification retrieved successfully", {
            verification,
        }),
    );
    return;
};
const getAllVerifications = async (req: Request, res: Response) => {
    const {
        page = 1,
        limit = 10,
        sortOrder = 'desc',
        sortBy = 'createdAt',
        status
    } = QuerySchema.parse(req.query);
    
    const result = await verificationService.findMany({
        page,
        limit,
        sortBy,
        sortOrder: sortOrder as 'asc' | 'desc',
        status: status as VerificationStatus,
        includeRelations: true
    });
    
    res.status(200).json(
        new APIResponse(true, "verifications retrieved successfully", result),
    );
    return;
};

const updateVerification = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body as {
        status: VerificationStatus;
    };
    const verification = await verificationService.updateStatus(
        id,
        status,
    );
    res.status(200).json(
        new APIResponse(true, "verification updated successfully", {
            verification,
        }),
    );
    return;
};

export default {
    getAllVerifications,
    updateVerification,
    getVerification,
};
