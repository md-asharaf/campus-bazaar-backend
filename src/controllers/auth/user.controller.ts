import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import catchAsync from "@/handlers/async.handler";
import userService from "@/services/user.service";
import { APIError } from "@/utils/APIError";
import { Register, userInterface } from "@/@types/interface";
import { generateTokens, verifyToken } from "@/services/token.service";
import { redis } from "@/config/database";
import passport from "passport";
import envVars from "@/config/envVars";

const register = catchAsync(async (req: Request, res: Response) => {
  const { email, bio, branch, registrationNo, year, phone } =
    req.body as Register;
  if (!email || !branch || !registrationNo || !year) {
    throw new APIError(400, "Missing required fields.");
  }
  const existingUser = await userService.findByEmail(email);
  if (existingUser) {
    throw new APIError(400, "User already exists with this email.");
  }
  const redisData = await redis.getValue(`register:${email}`);
  if (!redisData) {
    throw new APIError(400, "User not found");
  }
  const { name, avatar } = JSON.parse(redisData)
  // create user
  const user = await userService.create({
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
      accessToken,
      refreshToken
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
    passport.authenticate("google", {
      session: false,
      failureRedirect: "/auth/users/google/failure"
    })(
      req,
      res,
      async () => {
        try {
          if (!req.user) {
            throw new APIError(401, "Google authentication failed");
          }
          const googleUser = req.user as userInterface;

          let existingUser = await userService.findByEmail(
            googleUser.email,
          );

          if (!existingUser) {
            await redis.setValue(
              `register:${googleUser.email}`,
              JSON.stringify({
                email: googleUser.email,
                name: googleUser.name,
                avatar: googleUser.avatar,
              }),
              60 * 5,
            );
            return res.redirect(`${envVars.FRONTEND_URL}/register?email=${googleUser.email}`)
          } else {
            // Generate JWT tokens
            const jti = uuidv4();
            const { accessToken, refreshToken } = generateTokens({
              id: existingUser.id,
              jti,
            });
            /**
             * Bearer tokens: redirect with tokens in query string.
             * Frontend should capture and store accessToken in memory (or secure storage) and refresh when needed.
             */
            const redirectUrl = new URL(`${envVars.FRONTEND_URL}/dashboard`);
            redirectUrl.searchParams.set("accessToken", accessToken);
            redirectUrl.searchParams.set("refreshToken", refreshToken);
            return res.redirect(redirectUrl.toString());
          }
        } catch (error: any) {
          console.log(error)
          return res.redirect(`${envVars.FRONTEND_URL}`);
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

const refreshTokens = catchAsync(async (req: Request, res: Response) => {
  let token: string | undefined;

  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    token = auth.substring("Bearer ".length).trim();
  } else if (req.body && typeof req.body.refreshToken === "string") {
    token = req.body.refreshToken;
  } else if (typeof (req.query as any)?.refreshToken === "string") {
    token = (req.query as any).refreshToken as string;
  }

  if (!token) {
    throw new APIError(400, "Refresh token is required");
  }

  const decodedToken = verifyToken(token);
  if (!decodedToken) {
    throw new APIError(400, "Invalid refresh token");
  }

  const { accessToken, refreshToken } = generateTokens({
    id: decodedToken.id,
    jti: decodedToken.jti
  })
  res.status(200).json({
    success: true,
    message: "Tokens refreshed successfully",
    data: {
      accessToken,
      refreshToken
    },
  });
  return;
})

const logout = catchAsync(async (req: Request, res: Response) => {

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
  return;
})

export default {
  googleAuth,
  googleCallback,
  googleAuthFailure,
  register,
  refreshTokens,
  logout
};
