import { Request, Response } from "express";
import catchAsync from "@/handlers/async.handler";
import feedbackService from "@/services/feedback.service";
import { APIError } from "@/utils/APIError";
import { APIResponse } from "@/utils/APIResponse";

const getAllFeedback = catchAsync(async (req: Request, res: Response) => {
    const {
        userId,
        rating,
        minRating,
        maxRating,
        search,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeRelations = true
    } = req.query;

    const result = await feedbackService.findMany({
        userId: userId as string,
        rating: rating ? Number(rating) : undefined,
        minRating: minRating ? Number(minRating) : undefined,
        maxRating: maxRating ? Number(maxRating) : undefined,
        search: search as string,
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        includeRelations: includeRelations === 'true'
    });

    res.json(new APIResponse(true, "Feedback retrieved successfully", result));
});

const getFeedbackById = catchAsync(async (req: Request, res: Response) => {
    const { feedbackId } = req.params;

    const feedback = await feedbackService.findById(feedbackId);
    if (!feedback) {
        throw new APIError(404, "Feedback not found");
    }

    res.json(new APIResponse(true, "Feedback retrieved successfully", { feedback }));
});

const deleteFeedback = catchAsync(async (req: Request, res: Response) => {
    const { feedbackId } = req.params;

    const feedback = await feedbackService.findById(feedbackId);
    if (!feedback) {
        throw new APIError(404, "Feedback not found");
    }

    await feedbackService.delete(feedbackId);

    res.json(new APIResponse(true, "Feedback deleted successfully"));
});

export default {
    getAllFeedback,
    getFeedbackById,
    deleteFeedback
};
