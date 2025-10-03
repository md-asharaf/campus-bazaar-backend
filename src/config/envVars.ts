import dotenv from "dotenv";
import path from "path";
import { z } from "zod";
import { logger } from "./logger";

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Define the environment configuration schema
const EnvConfigSchema = z.object({
    PORT: z.coerce
        .number({
            required_error: "PORT environment variable is required",
            invalid_type_error: "PORT must be a valid number",
        })
        .int()
        .positive()
        .default(3000),
    FRONTEND_URL: z.string({
        required_error: "FRONTEND_URL environment variable is required",
        invalid_type_error: "FRONTEND_URL must be a string",
    }),
    NODE_ENV: z
        .enum(["development", "production", "test"], {
            required_error: "NODE_ENV environment variable is required",
            invalid_type_error:
                "NODE_ENV must be one of: development, production, test",
        })
        .default("development"),

    // Database configuration
    DATABASE_URL: z
        .string({
            required_error: "DATABASE_URL environment variable is required",
            invalid_type_error: "DATABASE_URL must be a string",
        })
        .url("DATABASE_URL must be a valid URL"),
    GOOGLE_CLIENT_SECRET: z
        .string({
            required_error:
                "GOOGLE_CLIENT_SECRET environment variable is required",
            invalid_type_error: "GOOGLE_CLIENT_SECRET must be a string",
        })
        .optional(),
    GOOGLE_CLIENT_ID: z
        .string({
            required_error: "GOOGLE_CLIENT_ID environment variable is required",
            invalid_type_error: "GOOGLE_CLIENT_ID must be a string",
        })
        .optional(),

    // JWT configuration
    JWT_SECRET: z
        .string({
            required_error: "JWT_SECRET environment variable is required",
            invalid_type_error: "JWT_SECRET must be a string",
        })
        .min(8, "JWT_SECRET must be at least 8 characters long"),
        
    // Security
    REDIS_HOST: z
        .string({
            required_error: "REDIS_HOST environment variable is required",
            invalid_type_error: "REDIS_HOST must be a string",
        })
        .default("localhost"),
    REDIS_PORT: z.coerce
        .number({
            required_error: "REDIS_PORT environment variable is required",
            invalid_type_error: "REDIS_PORT must be a valid number",
        })
        .int()
        .positive()
        .default(4567),
    REDIS_DB: z.coerce
        .number({
            required_error: "REDIS_DB environment variable is required",
            invalid_type_error: "REDIS_DB must be a valid number",
        })
        .int()
        .min(0)
        .default(0),
    RESEND_API_KEY: z.string({
        required_error: "RESEND_API_KEY environment variable is required",
        invalid_type_error: "RESEND_API_KEY must be a string",
    }),
    RESEND_DOMAIN: z.string({
        required_error: "RESEND_DOMAIN environment variable is required",
        invalid_type_error: "RESEND_DOMAIN must be a string",
    }),

    IMAGEKIT_PUBLIC_KEY: z.string({
        required_error: "IMAGEKIT_PUBLIC_KEY environment variable is required",
        invalid_type_error: "IMAGEKIT_PUBLIC_KEY must be a string",
    }),
    IMAGEKIT_PRIVATE_KEY: z.string({
        required_error: "IMAGEKIT_PRIVATE_KEY environment variable is required",
        invalid_type_error: "IMAGEKIT_PRIVATE_KEY must be a string",
    }),
    IMAGEKIT_API_URL: z.string({
        required_error: "IMAGEKIT_API_URL environment variable is required",
        invalid_type_error: "IMAGEKIT_API_URL must be a string",
    }),
    ELASTICSEARCH_URL: z.string({
        required_error: "ELASTICSEARCH_URL environment variable is required",
        invalid_type_error: "ELASTICSEARCH_URL must be a string",
    }),
    ELASTICSEARCH_INDEX: z.string({
        required_error: "ELASTICSEARCH_INDEX environment variable is required",
        invalid_type_error: "ELASTICSEARCH_INDEX must be a string",
    }),
    ELASTICSEARCH_USERNAME: z.string({
        required_error:
            "ELASTICSEARCH_USERNAME environment variable is required",
        invalid_type_error: "ELASTICSEARCH_USERNAME must be a string",
    }),
    ELASTICSEARCH_PASSWORD: z.string({
        required_error:
            "ELASTICSEARCH_PASSWORD environment variable is required",
        invalid_type_error: "ELASTICSEARCH_PASSWORD must be a string",
    }),
});

// Define the config type using Zod inference
export type EnvConfig = z.infer<typeof EnvConfigSchema>;

// Load raw configuration from environment variables
const rawConfig = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_DB: process.env.REDIS_DB,
    FRONTEND_URL: process.env.FRONTEND_URL,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_DOMAIN: process.env.RESEND_DOMAIN,
    IMAGEKIT_API_URL: process.env.IMAGEKIT_API_URL,
    IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
    IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
    ELASTICSEARCH_URL: process.env.ELASTICSEARCH_URL,
    ELASTICSEARCH_INDEX: process.env.ELASTICSEARCH_INDEX,
    ELASTICSEARCH_USERNAME: process.env.ELASTICSEARCH_USERNAME,
    ELASTICSEARCH_PASSWORD: process.env.ELASTICSEARCH_PASSWORD,
};

// Validate and parse configuration
let envVars: EnvConfig;

try {
    envVars = EnvConfigSchema.parse(rawConfig);
    logger.info("Environment configuration loaded.");
} catch (error) {
    if (error instanceof z.ZodError) {
        logger.error(
            "Environment configuration validation failed:",
            error.errors,
        );
        error.errors.forEach((err) => {
            logger.error(`- ${err.path.join(".")}: ${err.message}`);
        });
    } else {
        logger.error(
            "Unknown error during environment config validation:",
            error,
        );
    }

    // Throw error to prevent application from starting with invalid config
    throw new Error(
        "Environment configuration validation failed. Check environment variables.",
    );
}

// Export individual config values for convenience
export const {
    PORT,
    NODE_ENV,
    DATABASE_URL,
    JWT_SECRET,
    REDIS_HOST,
    REDIS_PORT,
    REDIS_DB,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CLIENT_ID,
    RESEND_API_KEY,
    FRONTEND_URL,
    RESEND_DOMAIN,
    IMAGEKIT_API_URL,
    IMAGEKIT_PRIVATE_KEY,
    IMAGEKIT_PUBLIC_KEY,
    ELASTICSEARCH_INDEX,
    ELASTICSEARCH_PASSWORD,
    ELASTICSEARCH_URL,
    ELASTICSEARCH_USERNAME,
} = envVars;

export default envVars;
