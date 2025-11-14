import { Request } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy, Profile, GoogleCallbackParameters, StrategyOptionsWithRequest } from "passport-google-oauth20";
import envVars from "@/config/envVars";
import { logger } from "@/config/logger";
import { userInterface } from "@/@types/interface";

const verify = async (
  _req: Request,
  _accessToken: string,
  _refreshToken: string,
  _params: GoogleCallbackParameters,
  profile: Profile,
  done: (error: any, user?: any) => void,
) => {
  try {
    logger.info("[GOOGLE_OAUTH] Validating Google user");
    if (!profile.emails?.[0]?.value) {
      logger.error(
        "[GOOGLE_OAUTH] No email provided from Google profile"
      );
      return done(new Error("No email provided from Google"), false);
    }
    const user: userInterface = {
      id: profile.id,
      name: profile.displayName || "Google User",
      email: profile.emails[0].value,
      avatar: profile._json.picture,
    };

    logger.info("[GOOGLE_OAUTH] User validation successful", {
      email: user.email,
      name: user.name,
    });

    return done(null, user);
  } catch (err) {
    logger.error("[GOOGLE_OAUTH] Error validating Google user:", err);
    return done(new Error("Google authentication failed"), false);
  }
}

const options: StrategyOptionsWithRequest = {
  clientID: envVars.GOOGLE_CLIENT_ID as string,
  clientSecret: envVars.GOOGLE_CLIENT_SECRET as string,
  callbackURL: '/auth/users/google/callback',
  passReqToCallback: true,
  scope: ["profile", "email"],
}
const strategy = new GoogleStrategy(options, verify);

passport.use(strategy);

logger.info(
  "[GOOGLE_OAUTH] Google authentication strategy initialized successfully",
);
