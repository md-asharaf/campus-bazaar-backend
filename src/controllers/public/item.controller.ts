import { Request, Response } from "express";
import catchAsync from "@/handlers/async.handler";
import itemService from "@/services/item.service";
import { APIError } from "@/utils/APIError";
import { APIResponse } from "@/utils/APIResponse";

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
    getItemById,
    searchItems
}