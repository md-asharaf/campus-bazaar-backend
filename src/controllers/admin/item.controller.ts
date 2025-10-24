import { Request, Response } from "express";
import catchAsync from "@/handlers/async.handler";
import itemService from "@/services/item.service";
import { APIError } from "@/utils/APIError";
import { APIResponse } from "@/utils/APIResponse";

const getAllItems = catchAsync(async (req: Request, res: Response) => {
    const { 
        sellerId,
        categoryId,
        minPrice,
        maxPrice,
        verified,
        available,
        search,
        page = 1, 
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeRelations = false
    } = req.query;
    
    const result = await itemService.findMany({
        sellerId: sellerId as string,
        categoryId: categoryId as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
        available: available === 'true' ? true : available === 'false' ? false : undefined,
        search: search as string,
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        includeRelations: includeRelations === 'true'
    });
    
    res.json(new APIResponse(true, "Items retrieved successfully", result));
});

const getItemById = catchAsync(async (req: Request, res: Response) => {
    const { itemId } = req.params;
    
    const item = await itemService.findById(itemId);
    if (!item) {
        throw new APIError(404, "Item not found");
    }
    
    res.json(new APIResponse(true, "Item retrieved successfully", { item }));
});

const verifyItem = catchAsync(async (req: Request, res: Response) => {
    const { itemId } = req.params;
    
    const item = await itemService.findById(itemId);
    if (!item) {
        throw new APIError(404, "Item not found");
    }
    
    if (item.isVerified) {
        throw new APIError(400, "Item is already verified");
    }
    
    const updatedItem = await itemService.update(itemId, { isVerified: true });
    
    res.json(new APIResponse(true, "Item verified successfully", { item: updatedItem }));
});

const rejectItem = catchAsync(async (req: Request, res: Response) => {
    const { itemId } = req.params;
    
    const item = await itemService.findById(itemId);
    if (!item) {
        throw new APIError(404, "Item not found");
    }
    
    const updatedItem = await itemService.update(itemId, { isVerified: false });
    
    res.json(new APIResponse(true, "Item verification rejected", { item: updatedItem }));
});

const updateItem = catchAsync(async (req: Request, res: Response) => {
    const { itemId } = req.params;
    const updateData = req.body;
    
    const item = await itemService.findById(itemId);
    if (!item) {
        throw new APIError(404, "Item not found");
    }
    
    const updatedItem = await itemService.update(itemId, updateData);
    
    res.json(new APIResponse(true, "Item updated successfully", { item: updatedItem }));
});

const deleteItem = catchAsync(async (req: Request, res: Response) => {
    const { itemId } = req.params;
    
    const item = await itemService.findById(itemId);
    if (!item) {
        throw new APIError(404, "Item not found");
    }
    
    await itemService.delete(itemId);
    
    res.json(new APIResponse(true, "Item deleted successfully"));
});

export default {
    getAllItems,
    getItemById,
    verifyItem,
    rejectItem,
    updateItem,
    deleteItem
};
