import { Request } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import refresh from "passport-oauth2-refresh";
import envVars from "@/config/envVars";
import { logger } from "@/config/logger";
import { db } from "../config/database";
import { userInterface } from "@/@types/interface";

class GoogleAuthStrategy {
    constructor() {
        const strategy = new GoogleStrategy(
            {
                clientID: envVars.GOOGLE_CLIENT_ID as string,
                clientSecret: envVars.GOOGLE_CLIENT_SECRET as string,
                callbackURL: `http://localhost:${envVars.PORT}/auth/users/google/callback`,
                passReqToCallback: true,
                scope: ["profile", "email"],
            },
            this.validateUser.bind(this),
        );
        passport.use(strategy);
        refresh.use(strategy);

        // Initialize serialization/deserialization
        this.serializeUser();
        this.deserializeUser();

        logger.info(
            "[GOOGLE_OAUTH] Google authentication strategy initialized successfully",
        );
    }

    serializeUser() {
        passport.serializeUser(
            (user: any, cb: (err: any, userId?: string) => void) => {
                try {
                    const email = user.email ?? undefined;
                    logger.debug("[GOOGLE_OAUTH] Serializing user", { email });
                    cb(null, email);
                } catch (error) {
                    logger.error(
                        "[GOOGLE_OAUTH] Error serializing user:",
                        error,
                    );
                    cb(error, undefined);
                }
            },
        );
    }

    deserializeUser() {
        passport.deserializeUser(
            async (
                email: string,
                cb: (err: any, user?: Express.User | null) => void,
            ) => {
                try {
                    logger.debug("[GOOGLE_OAUTH] Deserializing user", {
                        email,
                    });
                    const user = await db.user.findFirst({
                        where: {
                            email: email,
                            isActive: true,
                        },
                    });
                    if (user) {
                        logger.debug(
                            "[GOOGLE_OAUTH] User deserialized successfully",
                            { userId: user.id, email: user.email },
                        );
                        return cb(null, user);
                    } else {
                        logger.warn(
                            "[GOOGLE_OAUTH] User not found during deserialization",
                            { email },
                        );
                        return cb(null, null);
                    }
                } catch (err) {
                    logger.error(
                        "[GOOGLE_OAUTH] Error deserializing user:",
                        err,
                    );
                    return cb(err, null);
                }
            },
        );
    }

    async validateUser(
        req: Request,
        accessToken: string,
        refreshToken: string,
        params: any,
        profile: Profile,
        done: any,
    ) {
        try {
            logger.info("[GOOGLE_OAUTH] Validating Google user", {
                profileId: profile.id,
                email: profile.emails?.[0]?.value,
                name: profile.displayName,
            });
            profile.profileUrl;

            if (!profile.emails?.[0]?.value) {
                logger.error(
                    "[GOOGLE_OAUTH] No email provided from Google profile",
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
}

export default new GoogleAuthStrategy();
