import { User, UserUpdate } from "@/@types/schema";
import catchAsync from "@/handlers/async.handler";
import userService from "@/services/user.service";
import { APIError } from "@/utils/APIError";
import { APIResponse } from "@/utils/APIResponse";
import { Request, Response } from "express";

const getMe = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as User;
    res.status(200).json(
        new APIResponse(true, "Current User retrieved successfully", {
            user,
        }),
    );
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as User;
    const { avatar, bio, branch, name, phone, year } = req.body as UserUpdate;
    if (!avatar && !bio && !branch && !name && !phone && !year) {
        throw new APIError(400, "No fields to update");
    }
    const updatedUser = await userService.updateUser(user.id, {
        avatar,
        bio,
        branch,
        name,
        phone,
        year,
    });
    res.status(200).json(
        new APIResponse(true, "Profile updated successfully", {
            user: updatedUser,
        }),
    );
});

export default { getMe, updateProfile };
