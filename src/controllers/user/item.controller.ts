import { Request, Response } from "express";
import catchAsync from "@/handlers/async.handler";
import itemService from "@/services/item.service";
import { User, ItemCreate, ItemUpdate } from "@/@types/schema";
import { APIError } from "@/utils/APIError";
import { APIResponse } from "@/utils/APIResponse";
import { uploadImage } from "@/services/imagekit.service";

const createItem = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as User;
    const itemData = req.body as ItemCreate;
    const images = req.files as Express.Multer.File[];
    
    if (!images || images.length === 0) {
        throw new APIError(400, "At least one image is required");
    }
    
    // Upload images
    const uploadedImages = await Promise.all(
        images.map(image => uploadImage(image))
    );
    
    // Create item with seller ID
    const item = await itemService.create({
        ...itemData,
        sellerId: user.id
    });
    
    res.status(201).json(new APIResponse(true, "Item created successfully", { 
        item,
        images: uploadedImages 
    }));
});

const getMyItems = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as User;
    const { page = 1, limit = 10, status, includeRelations = false, sortBy, sortOrder } = req.query;
    
    const params = {
        sellerId: user.id,
        status: status as 'sold' | 'available' | 'all' | undefined,
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        includeRelations: includeRelations === 'true'
    };
    
    const result = await itemService.findMany(params);
    
    res.json(new APIResponse(true, 'Items retrieved successfully', result));
});

const updateMyItem = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as User;
    const { itemId } = req.params;
    const updateData = req.body as ItemUpdate;
    
    // Check if item exists and belongs to user
    const existingItem = await itemService.findById(itemId);
    if (!existingItem) {
        throw new APIError(404, "Item not found");
    }
    
    if (existingItem.sellerId !== user.id) {
        throw new APIError(403, "You can only update your own items");
    }
    
    const updatedItem = await itemService.update(itemId, updateData);
    
    res.json(new APIResponse(true, "Item updated successfully", { item: updatedItem }));
});

const deleteMyItem = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as User;
    const { itemId } = req.params;
    
    // Check if item exists and belongs to user
    const existingItem = await itemService.findById(itemId);
    if (!existingItem) {
        throw new APIError(404, "Item not found");
    }
    
    if (existingItem.sellerId !== user.id) {
        throw new APIError(403, "You can only delete your own items");
    }
    
    await itemService.delete(itemId);
    
    res.json(new APIResponse(true, "Item deleted successfully"));
});

const markItemAsSold = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as User;
    const { itemId } = req.params;
    
    // Check if item exists and belongs to user
    const existingItem = await itemService.findById(itemId);
    if (!existingItem) {
        throw new APIError(404, "Item not found");
    }
    
    if (existingItem.sellerId !== user.id) {
        throw new APIError(403, "You can only update your own items");
    }
    
    if (existingItem.isSold) {
        throw new APIError(400, "Item is already marked as sold");
    }
    
    const updatedItem = await itemService.update(itemId, { isSold: true });
    
    res.json(new APIResponse(true, "Item marked as sold", { item: updatedItem }));
});

const getItemById = catchAsync(async (req: Request, res: Response) => {
    const { itemId } = req.params;
    
    const item = await itemService.findById(itemId);
    if (!item) {
        throw new APIError(404, "Item not found");
    }
    
    res.json(new APIResponse(true, "Item retrieved successfully", { item }));
});

const searchItems = catchAsync(async (req: Request, res: Response) => {
    const { 
        category, 
        minPrice, 
        maxPrice, 
        verified, 
        available = true,
        search,
        page = 1,
        limit = 10,
        includeRelations = false,
        sortBy,
        sortOrder
    } = req.query;
    
    const params = {
        categoryId: category as string | undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
        available: available === 'true' ? true : available === 'false' ? false : undefined,
        search: search as string | undefined,
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        includeRelations: includeRelations === 'true'
    };
    
    const result = await itemService.findMany(params);
    
    res.json(new APIResponse(true, "Items retrieved successfully", result));
});

export default {
    createItem,
    getMyItems,
    updateMyItem,
    deleteMyItem,
    markItemAsSold,
    getItemById,
    searchItems
};