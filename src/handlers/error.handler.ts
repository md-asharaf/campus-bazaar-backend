import { APIError } from "@/utils/APIError";
import { logger } from "@/config/logger";
import type {
    ErrorRequestHandler,
    NextFunction,
    Request,
    Response,
} from "express";
import { ZodError } from "zod";

export const errorConverter: ErrorRequestHandler = (
    err,
    req: Request,
    _res: Response,
    next,
) => {
    let error = err;

    // Handle Zod validation errors
    if (error instanceof ZodError) {
        const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        error = new APIError(400, `Validation Error: ${message}`);
    }
    // Handle JWT errors
    else if (error.name === 'JsonWebTokenError') {
        error = new APIError(401, 'Invalid token');
    }
    else if (error.name === 'TokenExpiredError') {
        error = new APIError(401, 'Token expired');
    }

    // Handle Multer errors (file upload)
    else if (error.code === 'LIMIT_FILE_SIZE') {
        error = new APIError(400, 'File size too large');
    }
    else if (error.code === 'LIMIT_FILE_COUNT') {
        error = new APIError(400, 'Too many files uploaded');
    }
    else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        error = new APIError(400, 'Unexpected file field');
    }

    // Handle syntax errors (malformed JSON, etc.)
    else if (error instanceof SyntaxError && error.message.includes('JSON')) {
        error = new APIError(400, 'Invalid JSON format');
    }

    // Handle type errors
    else if (error instanceof TypeError) {
        error = new APIError(400, 'Invalid data type provided');
    }

    // Handle cast errors (MongoDB-like, but good for general use)
    else if (error.name === 'CastError') {
        error = new APIError(400, 'Invalid ID format');
    }

    // Handle validation errors from other libraries
    else if (error.name === 'ValidationError') {
        const message = error.message || 'Validation failed';
        error = new APIError(400, message);
    }

    // Handle network/timeout errors
    else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        error = new APIError(503, 'Service temporarily unavailable');
    }

    // Default handling for unknown errors
    else if (!(error instanceof APIError)) {
        const statusCode = error.statusCode || error.status || 500;
        const message = error.message || 'Internal server error';
        error = new APIError(statusCode, message);
    }

    next(error);
};

export const errorHandler: ErrorRequestHandler = (
    err: APIError,
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    // Log error details
    const logData = {
        error: {
            message: err.message,
            stack: err.stack,
            statusCode,
        },
        request: {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        },
        timestamp: new Date().toISOString(),
    };
    // Log based on severity
    if (statusCode >= 500) {
        logger.error('Server Error:', logData);
    } else if (statusCode >= 400) {
        logger.warn('Client Error:', logData);
    }

    // Prepare response
    const response = {
        success: false,
        error: {
            code: statusCode,
            message,
            ...(process.env.NODE_ENV === "development" && {
                stack: err.stack,
                details: logData
            }),
        },
        timestamp: new Date().toISOString(),
    };
    console.log(response)

    res.status(statusCode).json(response);
};

// Handle unhandled promise rejections
export const handleUnhandledRejection = () => {
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
        logger.error('Unhandled Promise Rejection:', {
            reason: reason?.message || reason,
            stack: reason?.stack,
            promise
        });
    });
};

// Handle uncaught exceptions
export const handleUncaughtException = () => {
    process.on('uncaughtException', (error: Error) => {
        logger.error('Uncaught Exception:', {
            message: error.message,
            stack: error.stack
        });
        process.exit(1);
    });
};
