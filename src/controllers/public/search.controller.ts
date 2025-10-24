import { Request, Response } from "express";
import catchAsync from "@/handlers/async.handler";
import searchService from "@/services/search.service";
import { APIError } from "@/utils/APIError";
import { APIResponse } from "@/utils/APIResponse";

const getSuggestions = catchAsync(async (req: Request, res: Response) => {
    const { query, size = 10 } = req.query;
    
    if (!query || typeof query !== 'string') {
        throw new APIError(400, "Query parameter is required");
    }
    
    const suggestions = await searchService.getSuggestions(query, Number(size));
    
    res.json(new APIResponse(true, "Suggestions retrieved successfully", { suggestions }));
});

const search = catchAsync(async (req: Request, res: Response) => {
    const { query, size = 20 } = req.query;
    
    if (!query || typeof query !== 'string') {
        throw new APIError(400, "Query parameter is required");
    }
    
    const results = await searchService.search(query, Number(size));
    
    res.json(new APIResponse(true, "Search results retrieved successfully", { results }));
});

export default {
    getSuggestions,
    search
};
