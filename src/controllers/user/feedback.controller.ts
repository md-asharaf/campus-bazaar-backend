import { Request, Response } from "express";
import catchAsync from "@/handlers/async.handler";
import feedbackService from "@/services/feedback.service";
import { User, FeedbackCreate, FeedbackUpdate } from "@/@types/schema";
import { APIError } from "@/utils/APIError";
import { APIResponse } from "@/utils/APIResponse";

const createFeedback = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as User;
    const feedbackData = req.body as FeedbackCreate;
    
    // Check if user already has feedback
    const existingFeedback = await feedbackService.findByUserId(user.id);
    if (existingFeedback) {
        throw new APIError(409, "You have already submitted feedback. Use update instead.");
    }
    
    const feedback = await feedbackService.create({
        ...feedbackData,
        userId: user.id
    });
    
    res.status(201).json(new APIResponse(true, "Feedback submitted successfully", { feedback }));
});

const getMyFeedback = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as User;
    
    const feedback = await feedbackService.findByUserId(user.id);
    
    res.json(new APIResponse(true, "Feedback retrieved successfully", { feedback }));
});

const updateMyFeedback = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as User;
    const updateData = req.body as FeedbackUpdate;
    
    // Check if user has feedback
    const existingFeedback = await feedbackService.findByUserId(user.id);
    if (!existingFeedback) {
        throw new APIError(404, "No feedback found. Create feedback first.");
    }
    
    const updatedFeedback = await feedbackService.update(existingFeedback.id, updateData);
    
    res.json(new APIResponse(true, "Feedback updated successfully", { feedback: updatedFeedback }));
});

const deleteMyFeedback = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as User;
    
    // Check if user has feedback
    const existingFeedback = await feedbackService.findByUserId(user.id);
    if (!existingFeedback) {
        throw new APIError(404, "No feedback found");
    }
    
    await feedbackService.delete(existingFeedback.id);
    
    res.json(new APIResponse(true, "Feedback deleted successfully"));
});

export default {
    createFeedback,
    getMyFeedback,
    updateMyFeedback,
    deleteMyFeedback
};