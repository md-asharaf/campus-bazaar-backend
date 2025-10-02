import { Request, Response } from "express";
import catchAsync from "@/handlers/async.handler";
import wishlistService from "@/services/wishlist.service";
import itemService from "@/services/item.service";
import { User } from "@/@types/schema";
import { APIError } from "@/utils/APIError";
import { APIResponse } from "@/utils/APIResponse";

const getWishlist = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as User;
    const { page = 1, limit = 10, includeRelations = false } = req.query;

    const result = await wishlistService.findMany({
        userId: user.id,
        page: Number(page),
        limit: Number(limit),
        includeRelations: includeRelations === 'true'
    });

    res.json(new APIResponse(true, "Wishlist retrieved successfully", result));
});

const addToWishlist = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as User;
    const { itemId } = req.body;

    if (!itemId) {
        throw new APIError(400, "Item ID is required");
    }

    // Check if item exists
    const item = await itemService.findById(itemId);
    if (!item) {
        throw new APIError(404, "Item not found");
    }

    // Check if already in wishlist
    const existingWishlistItem = await wishlistService.findByUserAndItem(user.id, itemId);
    if (existingWishlistItem) {
        throw new APIError(409, "Item already in wishlist");
    }

    const wishlistItem = await wishlistService.create({
        userId: user.id,
        itemId
    });

    res.status(201).json(new APIResponse(true, "Item added to wishlist", { item: wishlistItem }));
});

const removeFromWishlist = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as User;
    const { itemId } = req.params;

    // Check if item is in wishlist
    const wishlistItem = await wishlistService.findByUserAndItem(user.id, itemId);
    if (!wishlistItem) {
        throw new APIError(404, "Item not found in wishlist");
    }

    await wishlistService.deleteByUserAndItem(user.id, itemId);

    res.json(new APIResponse(true, "Item removed from wishlist"));
});

const checkWishlistStatus = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as User;
    const { itemId } = req.params;

    const wishlistItem = await wishlistService.findByUserAndItem(user.id, itemId);

    res.json(new APIResponse(true, "Wishlist status checked", {
        inWishlist: !!wishlistItem,
        wishlistItem
    }));
});

export default {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    checkWishlistStatus
};