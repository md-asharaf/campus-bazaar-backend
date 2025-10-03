import envVars from "./config/envVars";
import express from "express";
import cors from "cors";
import router from "./routes";
import morgan from "morgan";
import helmet from "helmet";
import passport from "passport";
import "./config/passport";
import { errorConverter, errorHandler, handleUnhandledRejection, handleUncaughtException } from "./handlers/error.handler";

const app = express();
const isProd = envVars.NODE_ENV === 'production';

handleUnhandledRejection();
handleUncaughtException();

app.use(express.json({ limit: '10mb', strict: true }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cors({
    origin: isProd ? envVars.FRONTEND_URL : '*',
    credentials: true,
}));
app.use(morgan(isProd ? 'combined' : 'dev'));
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: isProd ? undefined : false,
}));

app.use(passport.initialize());

app.use(router);
app.use((req, res) => res.status(404).json({
    success: false,
    error: { code: 404, message: `Route ${req.originalUrl} not found` },
    timestamp: new Date().toISOString(),
}));
app.use(errorConverter, errorHandler);

export default app;
