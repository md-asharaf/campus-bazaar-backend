import { Request, Response } from "express";
import catchAsync from "@/handlers/async.handler";
import categoryService from "@/services/category.service";
import { APIError } from "@/utils/APIError";
import { APIResponse } from "@/utils/APIResponse";

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const {
    search,
    page = 1,
    limit = 20,
    sortBy = 'name',
    sortOrder = 'asc',
    includeRelations = false
  } = req.query;

  const result = await categoryService.findMany({
    search: search as string,
    page: Number(page),
    limit: Number(limit),
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
    includeRelations: includeRelations === 'true'
  });

  res.json(new APIResponse(true, "Categories retrieved successfully", result));
});

const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const { categoryId } = req.params;

  const category = await categoryService.findById(categoryId);
  if (!category) {
    throw new APIError(404, "Category not found");
  }

  res.json(new APIResponse(true, "Category retrieved successfully", category));
});

export default {
  getAllCategories,
  getCategoryById
};
