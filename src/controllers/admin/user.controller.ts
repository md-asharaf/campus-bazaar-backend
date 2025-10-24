import { Request, Response } from "express";
import catchAsync from "@/handlers/async.handler";
import userService from "@/services/user.service";
import { APIError } from "@/utils/APIError";
import { APIResponse } from "@/utils/APIResponse";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
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
    } = req.query;

    const result = await userService.findMany({
        email: email as string,
        registrationNo: registrationNo as string,
        isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        branch: branch as string,
        year: year ? Number(year) : undefined,
        search: search as string,
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        includeRelations: includeRelations === 'true'
    });

    res.json(new APIResponse(true, "Users retrieved successfully", result));
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const user = await userService.findById(userId);
    if (!user) {
        throw new APIError(404, "User not found");
    }

    res.json(new APIResponse(true, "User retrieved successfully", { user }));
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const updateData = req.body;

    const existingUser = await userService.findById(userId);
    if (!existingUser) {
        throw new APIError(404, "User not found");
    }

    const updatedUser = await userService.update(userId, updateData);

    res.json(new APIResponse(true, "User updated successfully", { user: updatedUser }));
});

const toggleUserStatus = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const user = await userService.findById(userId);
    if (!user) {
        throw new APIError(404, "User not found");
    }

    const updatedUser = await userService.update(userId, {
        isActive: !user.isActive
    });

    const message = updatedUser.isActive ? "User activated successfully" : "User deactivated successfully";
    res.json(new APIResponse(true, message, { user: updatedUser }));
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const user = await userService.findById(userId);
    if (!user) {
        throw new APIError(404, "User not found");
    }

    await userService.delete(userId);

    res.json(new APIResponse(true, "User deleted successfully"));
});

export default {
    getAllUsers,
    getUserById,
    updateUser,
    toggleUserStatus,
    deleteUser
};
