import { Request, Response, NextFunction } from "express";
import { authService } from "../core/services/auth.service";

export interface AuthenticatedRequest extends Request {
    user: NonNullable<Request['user']>;
    token: string;
}

/**
 * Authentication middleware for Express routes
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    try {

        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : null;

        if (!token) {
            res.status(401).json({
                error: "Access denied. No token provided.",
                code: "NO_TOKEN"
            });
            return;
        }

        const session = authService.validateAndRefreshSession(token);
        if (!session) {
            res.status(401).json({
                error: "Access denied. Invalid or expired token.",
                code: "INVALID_TOKEN"
            });
            return;
        }

        req.user = session;
        req.token = token;

        next();
    } catch (error) {
        console.error('Authentication middleware error:', error);
        res.status(500).json({
            error: "Internal server error during authentication",
            code: "AUTH_ERROR"
        });
    }
};

/**
 * Socket.IO authentication middleware
 */
export const authenticateSocket = (socket: any, next: any): void => {
    try {

        const token = socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization?.replace('Bearer ', '');

        if (!token) {
            const err = new Error('Authentication error: No token provided');
            (err as any).data = { code: 'NO_TOKEN' };
            return next(err);
        }

        const session = authService.validateAndRefreshSession(token);
        if (!session) {
            const err = new Error('Authentication error: Invalid or expired token');
            (err as any).data = { code: 'INVALID_TOKEN' };
            return next(err);
        }

        socket.user = session;
        socket.token = token;

        next();
    } catch (error) {
        console.error('Socket authentication error:', error);
        const err = new Error('Authentication error: Internal server error');
        (err as any).data = { code: 'AUTH_ERROR' };
        next(err);
    }
};
