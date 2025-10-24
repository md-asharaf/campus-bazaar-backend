import { Request, Response } from "express";
import catchAsync from "@/handlers/async.handler";
import { APIResponse } from "@/utils/APIResponse";
import { db } from "@/config/database";

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
    // Get total users count
    const totalUsers = await db.user.count();

    // Get active users count
    const activeUsers = await db.user.count({
        where: { isActive: true }
    });

    // Get verified users count
    const verifiedUsers = await db.user.count({
        where: { isVerified: true }
    });

    // Get total items count
    const totalItems = await db.item.count();

    // Get verified items count
    const verifiedItems = await db.item.count({
        where: { isVerified: true }
    });

    // Get sold items count
    const soldItems = await db.item.count({
        where: { isSold: true }
    });

    // Get total categories count
    const totalCategories = await db.category.count();

    // Get pending verifications count
    const pendingVerifications = await db.verification.count({
        where: { status: 'PENDING' }
    });

    // Get total feedback count
    const totalFeedback = await db.feedback.count();

    // Get recent activity (items created in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentItems = await db.item.count({
        where: {
            createdAt: {
                gte: thirtyDaysAgo
            }
        }
    });

    // Calculate growth percentage (simplified - comparing to previous 30 days)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const previousPeriodItems = await db.item.count({
        where: {
            createdAt: {
                gte: sixtyDaysAgo,
                lt: thirtyDaysAgo
            }
        }
    });

    const itemGrowth = previousPeriodItems === 0 ? 100 :
        ((recentItems - previousPeriodItems) / previousPeriodItems) * 100;

    const stats = {
        totalUsers,
        activeUsers,
        verifiedUsers,
        totalItems,
        verifiedItems,
        soldItems,
        totalCategories,
        pendingVerifications,
        totalFeedback,
        recentItems,
        itemGrowth: Math.round(itemGrowth * 100) / 100, // Round to 2 decimal places
        // Additional metrics
        inactiveUsers: totalUsers - activeUsers,
        unverifiedUsers: totalUsers - verifiedUsers,
        availableItems: totalItems - soldItems,
        unverifiedItems: totalItems - verifiedItems
    };

    res.json(new APIResponse(true, "Dashboard statistics retrieved successfully", stats));
});

export default {
    getDashboardStats
};