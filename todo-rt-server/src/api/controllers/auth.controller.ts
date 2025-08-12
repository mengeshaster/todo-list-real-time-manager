import { Request, Response } from "express";
import { userService } from "../../core/services/user.service";

export interface AuthenticatedRequest extends Request {
    user: NonNullable<Request['user']>;
    token: string;
}

export class AuthController {
    /**
     * Register a new user
     */
    async register(req: Request, res: Response): Promise<void> {
        try {
            const { email, name, password } = req.body;

            if (!email || !name || !password) {
                res.status(400).json({
                    message: "Email, name, and password are required",
                    code: "MISSING_FIELDS"
                });
                return;
            }

            if (password.length < 6) {
                res.status(400).json({
                    message: "Password must be at least 6 characters long",
                    code: "WEAK_PASSWORD"
                });
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                res.status(400).json({
                    message: "Invalid email format",
                    code: "INVALID_EMAIL"
                });
                return;
            }

            const user = await userService.createUser({ email, name, password });

            res.status(201).json({
                message: "User created successfully",
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    createdAt: user.createdAt
                }
            });
        } catch (error: any) {
            console.error('Registration error:', error);

            if (error.message === "User already exists with this email") {
                res.status(409).json({
                    error: error.message,
                    code: "USER_EXISTS"
                });
            } else {
                res.status(500).json({
                    message: "Failed to create user",
                    code: "REGISTRATION_FAILED"
                });
            }
        }
    }

    /**
     * Login user
     */
    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                res.status(400).json({
                    message: "Email and password are required",
                    code: "MISSING_CREDENTIALS"
                });
                return;
            }

            const loginResponse = await userService.login({ email, password });

            res.json({
                message: "Login successful",
                ...loginResponse
            });
        } catch (error: any) {
            console.error('Login error:', error);

            if (error.message === "Invalid email or password") {
                res.status(401).json({
                    message: error.message,
                    code: "INVALID_CREDENTIALS"
                });
            } else {
                res.status(500).json({
                    message: "Login failed",
                    code: "LOGIN_FAILED"
                });
            }
        }
    }

    /**
     * Logout user
     */
    async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            await userService.logout(req.token);

            res.json({
                message: "Logout successful"
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                message: "Logout failed",
                code: "LOGOUT_FAILED"
            });
        }
    }

}

export const authController = new AuthController();
