import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
    error: AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {

    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    console.error(`[ERROR] ${req.method} ${req.path} - ${statusCode}: ${message}`);
    console.error("Stack trace:", error.stack);

    res.status(statusCode).json({
        error: {
            message,
            status: statusCode,
            ...(process.env.NODE_ENV === "development" && {
                stack: error.stack,
                details: error
            })
        }
    });
};

/**
 * Async error wrapper to catch async errors in route handlers
 */
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Create an operational error
 */
export const createError = (message: string, statusCode: number = 500): AppError => {
    const error = new Error(message) as AppError;
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};

/**
 * Not found middleware
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
    const error = createError(`Not found - ${req.originalUrl}`, 404);
    next(error);
};
