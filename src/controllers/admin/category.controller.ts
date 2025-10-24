import { Request, Response } from "express";
import catchAsync from "@/handlers/async.handler";
import categoryService from "@/services/category.service";
import { CategoryCreate, CategoryUpdate } from "@/@types/schema";
import { APIError } from "@/utils/APIError";
import { APIResponse } from "@/utils/APIResponse";
import { uploadImage } from "@/services/imagekit.service";

const createCategory = catchAsync(async (req: Request, res: Response) => {
    const categoryData = req.body as CategoryCreate;
    const image = req.file;
    
    // Check if category with same name already exists
    const existingCategory = await categoryService.findByName(categoryData.name);
    if (existingCategory) {
        throw new APIError(409, "Category with this name already exists");
    }
    
    let imageId: string | undefined;
    if (image) {
        const uploadedImage = await uploadImage(image);
        imageId = uploadedImage.id;
    }
    
    const category = await categoryService.create({
        ...categoryData,
        imageId
    });
    
    res.status(201).json(new APIResponse(true, "Category created successfully", { category }));
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
    const { 
        search,
        page = 1, 
        limit = 10,
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
    
    res.json(new APIResponse(true, "Category retrieved successfully", { category }));
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
    const { categoryId } = req.params;
    const updateData = req.body as CategoryUpdate;
    const image = req.file;
    
    const category = await categoryService.findById(categoryId);
    if (!category) {
        throw new APIError(404, "Category not found");
    }
    
    // Check if updating name conflicts with existing category
    if (updateData.name && updateData.name !== category.name) {
        const existingCategory = await categoryService.findByName(updateData.name);
        if (existingCategory) {
            throw new APIError(409, "Category with this name already exists");
        }
    }
    
    let imageId: string | undefined = updateData.imageId;
    if (image) {
        const uploadedImage = await uploadImage(image);
        imageId = uploadedImage.id;
    }
    
    const updatedCategory = await categoryService.update(categoryId, {
        ...updateData,
        imageId
    });
    
    res.json(new APIResponse(true, "Category updated successfully", { category: updatedCategory }));
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
    const { categoryId } = req.params;
    
    const category = await categoryService.findById(categoryId);
    if (!category) {
        throw new APIError(404, "Category not found");
    }
    
    await categoryService.delete(categoryId);
    
    res.json(new APIResponse(true, "Category deleted successfully"));
});

export default {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
};
