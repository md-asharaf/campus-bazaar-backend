import envVars from "./config/envVars";
import express from "express";
import cors from "cors";
import router from "./routes";
import morgan from "morgan";
import helmet from "helmet";
import passport from "passport";
import session from "express-session";
import { errorConverter, errorHandler, handleUnhandledRejection, handleUncaughtException } from "./handlers/error.handler";

import "./strategies/google-oauth";
const app = express();

// Handle unhandled rejections and exceptions
handleUnhandledRejection();
handleUncaughtException();

app.use(express.json({ 
    limit: '10mb',
    strict: true 
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
}));
app.use(
    cors({
        origin: envVars.NODE_ENV === 'production' 
            ? envVars.FRONTEND_URL 
            : [envVars.FRONTEND_URL || "http://localhost:5173", "http://localhost:3000"],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }),
);
app.use(morgan(envVars.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: envVars.NODE_ENV === 'production' ? undefined : false,
}));

// Session configuration for Passport
app.use(
    session({
        secret: envVars.SESSION_SECRET || envVars.JWT_SECRET,
        resave: false,
        saveUninitialized: false,
        name: 'campus-bazaar-session',
        cookie: {
            secure: envVars.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: envVars.NODE_ENV === "production" ? 'strict' : 'lax',
        },
    }),
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use(router);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 404,
            message: `Route ${req.originalUrl} not found`,
        },
        timestamp: new Date().toISOString(),
    });
});

// Error handling middleware (must be last)
app.use(errorConverter);
app.use(errorHandler);

export default app;
