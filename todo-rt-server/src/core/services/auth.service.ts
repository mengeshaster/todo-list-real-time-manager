import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { config } from "../../config/env";

export interface AuthTokenData {
    userId: string;
    email: string;
    name: string;
}

export interface CachedSession {
    userId: string;
    email: string;
    name: string;
    lastActivity: Date;
    token: string;
}

class AuthService {
    private sessionCache = new Map<string, CachedSession>();
    private readonly TOKEN_EXPIRY = 20 * 60 * 1000;
    private readonly CLEANUP_INTERVAL = 5 * 60 * 1000;

    constructor() {
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, this.CLEANUP_INTERVAL);
    }

    /**
     * Hash password using bcrypt
     */
    async hashPassword(password: string): Promise<string> {
        const saltRounds = 12;
        return bcrypt.hash(password, saltRounds);
    }

    /**
     * Verify password against hash
     */
    async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    /**
     * Generate JWT token
     */
    generateToken(payload: AuthTokenData): string {
        if (!config.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured");
        }

        if (!config.JWT_EXPIRATION) {
            throw new Error("JWT_EXPIRATION is not configured");
        }

        const options: SignOptions = {
            expiresIn: config.JWT_EXPIRATION as string & SignOptions['expiresIn'],
            issuer: "todo-rt-server",
            audience: "todo-rt-client"
        };

        return jwt.sign(payload, config.JWT_SECRET, options);
    }

    /**
     * Create session and cache it
     */
    createSession(userData: AuthTokenData): string {
        const token = this.generateToken(userData);
        const session: CachedSession = {
            userId: userData.userId,
            email: userData.email,
            name: userData.name,
            lastActivity: new Date(),
            token
        };

        this.sessionCache.set(token, session);
        return token;
    }

    /**
     * Validate session and refresh if valid
     */
    validateAndRefreshSession(token: string): CachedSession | null {
        const session = this.sessionCache.get(token);

        if (!session) {
            return null;
        }

        const now = new Date();
        const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();

        if (timeSinceLastActivity > this.TOKEN_EXPIRY) {
            this.sessionCache.delete(token);
            return null;
        }

        session.lastActivity = now;
        this.sessionCache.set(token, session);

        return session;
    }

    /**
     * Invalidate session (logout)
     */
    invalidateSession(token: string): void {
        this.sessionCache.delete(token);
    }

    /**
     * Get session without refreshing
     */
    getSession(token: string): CachedSession | null {
        return this.sessionCache.get(token) || null;
    }

    /**
     * Clean up expired sessions
     */
    private cleanupExpiredSessions(): void {
        const now = new Date();
        const expiredTokens: string[] = [];

        for (const [token, session] of this.sessionCache.entries()) {
            const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();
            if (timeSinceLastActivity > this.TOKEN_EXPIRY) {
                expiredTokens.push(token);
            }
        }

        expiredTokens.forEach(token => {
            this.sessionCache.delete(token);
        });

        if (expiredTokens.length > 0) {
            console.log(`Cleaned up ${expiredTokens.length} expired sessions`);
        }
    }

    /**
     * Get session statistics
     */
    getSessionStats(): { activeSessions: number; totalSessions: number } {
        return {
            activeSessions: this.sessionCache.size,
            totalSessions: this.sessionCache.size
        };
    }

    /**
     * Clear all sessions (for admin use)
     */
    clearAllSessions(): void {
        this.sessionCache.clear();
    }
}

export const authService = new AuthService();
