import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import catchAsync from "@/handlers/async.handler";
import { generateOtp, verifyOtp } from "@/services/otp.service";
import { generateTokens, verifyToken } from "@/services/token.service";
import { APIError } from "@/utils/APIError";
import { db } from "@/config/database";
import { Login, VerifyLogin } from "@/@types/interface";
import mailService from "@/services/email.service";
const login = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body as Login;
  if (!email) {
    throw new APIError(400, "Email is required");
  }
  const admin = await db.admin.findUnique({
    where: { email },
  });
  console.log(admin)
  if (!admin) {
    throw new APIError(404, "Admin not found");
  }
  const otp = await generateOtp(admin.email);
  await mailService.sendEmail(
    admin.email,
    "OTP Verification",
    `Your Login OTP is ${otp}`,
  );
  res.status(200).json({
    success: true,
    message: "admin otp sent.",
  });
  return;
});

const verifyLogin = catchAsync(async (req: Request, res: Response) => {
  const { otp, email } = req.body as VerifyLogin;
  if (!otp || !email) {
    throw new APIError(400, "OTP and email are required");
  }
  const isVerified = await verifyOtp(email, otp);
  if (!isVerified) {
    throw new APIError(400, "Failed to verify otp");
  }
  const admin = await db.admin.findUnique({
    where: { email },
  });
  if (!admin) {
    throw new APIError(404, "Admin not found");
  }
  const jti = uuidv4();
  const { accessToken, refreshToken } = generateTokens({
    id: admin.id,
    jti,
  });
  res.status(200).json({
    success: true,
    message: "Admin login successful",
    data: {
      accessToken,
      refreshToken
    },
  });
  return;
});

const logout = catchAsync(async (req: Request, res: Response) => {
// No cookies to clear in bearer strategy
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
  return;
})

const refreshTokens = catchAsync(async (req: Request, res: Response) => {
  let token: string | undefined;

  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    token = auth.substring("Bearer ".length).trim();
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
  });

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

export default {
  login,
  verifyLogin,
  refreshTokens,
  logout
};
