import { Admin } from '@/@types/schema';
import catchAsync from '@/handlers/async.handler';
import { APIResponse } from '@/utils/APIResponse';
import { Request, Response } from 'express';

const getMe = catchAsync(async (req: Request, res: Response) => {
    const admin = req.admin as Admin;
    res.status(200).json(
        new APIResponse(true, "Current User retrieved successfully", {
            admin,
        }),
    );
    return;
});

export default {
    getMe,
}