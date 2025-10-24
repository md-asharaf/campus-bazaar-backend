import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import catchAsync from "@/handlers/async.handler";
import { generateOtp, verifyOtp } from "@/services/otp.service";
import { generateTokens } from "@/services/token.service";
import { APIError } from "@/utils/APIError";
import { db } from "@/config/database";
import { Login, VerifyLogin } from "@/@types/interface";
import mailService from "@/services/email.service";
import envVars from "@/config/envVars";
const login = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body as Login;
  if (!email) {
    throw new APIError(400, "Email is required");
  }
  const admin = await db.admin.findUnique({
    where: { email },
  });
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
  const prod = envVars.NODE_ENV == "production";
  res.status(200).cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: prod,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7 * 1000,
  }).cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: prod,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15 * 1000,
  }).json({
    success: true,
    message: "user registered successfully",
    data: {
      accessToken,
      refreshToken
    },
  });
  return;
});

const logout = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
  return;
})

export default {
  login,
  verifyLogin,
  logout
};
