import envVars from "./config/envVars";
import express from "express";
import cors from "cors";
import router from "./routes";
import morgan from "morgan";
import helmet from "helmet";
import passport from "passport";
import session from "express-session";

import "./strategies/google-oauth";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
        origin: envVars.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
    }),
);
app.use(morgan("dev"));
app.use(helmet());

// Session configuration for Passport
app.use(
    session({
        secret: envVars.JWT_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: envVars.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000,
        },
    }),
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.use(router);

export default app;
