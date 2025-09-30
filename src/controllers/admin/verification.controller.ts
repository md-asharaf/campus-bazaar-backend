import { QuerySchema } from "@/@types/interface";
import { VerificationStatus } from "@/@types/schema";
import verificationService from "@/services/verification.service";
import { APIResponse } from "@/utils/APIResponse";
import { Request, Response } from "express";

const getVerification = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const verification =
        await verificationService.getVerificationByUserId(userId);
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
        sortOrder,
        sortBy,
    } = QuerySchema.parse(req.query);
    const verifications = await verificationService.getAllVerifications({
        page,
        limit,
        sortBy,
        sortOrder,
    });
    res.status(200).json(
        new APIResponse(true, "verification retrieved successfully", {
            verifications,
        }),
    );
    return;
};

const updateVerification = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body as {
        status: VerificationStatus;
    };
    const verification = await verificationService.updateVerification(
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
