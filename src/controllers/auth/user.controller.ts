import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import catchAsync from "@/handlers/async.handler";
import userService from "@/services/user.service";
import { APIError } from "@/utils/APIError";
import { Register, userInterface } from "@/@types/interface";
import { generateTokens } from "@/services/token.service";
import { redis } from "@/config/database";
import passport from "passport";

const register = catchAsync(async (req: Request, res: Response) => {
    const { email, name, bio, branch, registrationNo, year, avatar, phone } =
        req.body as Register;
    if (!email || !name || !branch || !registrationNo || !year) {
        throw new APIError(400, "Missing required fields.");
    }
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
        throw new APIError(400, "User already exists with this email.");
    }
    const redisData = await redis.getValue(`register:${email}`);
    if (!redisData || redisData !== "true") {
        throw new APIError(400, "User not found");
    }
    // create user
    const user = await userService.createUser({
        bio,
        branch,
        email,
        name,
        registrationNo,
        year,
        avatar,
        phone,
    });
    const jti = uuidv4();
    const { accessToken, refreshToken } = generateTokens({
        id: user.id,
        jti,
    });
    res.status(200).json({
        success: true,
        message: "user registered successfully",
        data: {
            user,
            accessToken,
            refreshToken,
        },
    });
    return;
});

const googleAuth = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        passport.authenticate("google", {
            scope: ["profile", "email"],
        })(req, res, next);
    },
);

const googleCallback = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        passport.authenticate("google", { failureRedirect: "/login" })(
            req,
            res,
            async () => {
                try {
                    if (!req.user) {
                        throw new APIError(401, "Google authentication failed");
                    }
                    const googleUser = req.user as userInterface;

                    let existingUser = await userService.getUserByEmail(
                        googleUser.email,
                    );

                    if (!existingUser) {
                        await redis.setValue(
                            `register:${googleUser.email}`,
                            "true",
                            60 * 5,
                        );
                        res.status(200).json({
                            success: true,
                            message: "Authentication successful",
                            data: {
                                user: {
                                    email: googleUser.email,
                                    name: googleUser.name,
                                    avatar: googleUser.avatar,
                                },
                            },
                        });
                    } else {
                        // Generate JWT tokens
                        const jti = uuidv4();
                        const { accessToken, refreshToken } = generateTokens({
                            id: existingUser.id,
                            jti,
                        });
                        res.status(200).json({
                            success: true,
                            message: "User logged in successfully",
                            data: {
                                accessToken,
                                refreshToken,
                                user: existingUser,
                            },
                        });
                    }
                } catch (error: any) {
                    res.status(500).json({
                        success: false,
                        message: "Authentication failed",
                        error: error.message,
                    });
                }
            },
        );
    },
);

const googleAuthFailure = catchAsync(async (req: Request, res: Response) => {
    res.status(401).json({
        success: false,
        message: "Google authentication failed",
    });
});

export default {
    googleAuth,
    googleCallback,
    googleAuthFailure,
    register,
};
