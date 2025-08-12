import { User, IUser } from "../models/user.model";
import { UserRepo } from "../repositories/user.repo";
import { authService, AuthTokenData } from "./auth.service";

export interface CreateUserData {
    email: string;
    name: string;
    password: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: {
        id: string;
        email: string;
        name: string;
        createdAt: Date;
        lastLogin?: Date;
    };
    token: string;
}

class UserService {
    /**
     * Create a new user
     */
    async createUser(userData: CreateUserData): Promise<IUser> {
        const { email, name, password } = userData;

        const existingUser = await UserRepo.findByEmail(email);
        if (existingUser) {
            throw new Error("User already exists with this email");
        }

        const passwordHash = await authService.hashPassword(password);

        const user = await UserRepo.create({
            email: email.toLowerCase(),
            name,
            passwordHash
        });

        return user;
    }

    /**
     * Login user
     */
    async login(loginData: LoginData): Promise<LoginResponse> {
        const { email, password } = loginData;

        const user = await UserRepo.findByEmail(email);
        if (!user) {
            throw new Error("Invalid email or password");
        }

        const isPasswordValid = await authService.verifyPassword(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error("Invalid email or password");
        }

        await UserRepo.updateLastLogin(user._id.toString());

        const tokenData: AuthTokenData = {
            userId: user._id.toString(),
            email: user.email,
            name: user.name
        };

        const token = authService.createSession(tokenData);

        return {
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
                lastLogin: new Date()
            },
            token
        };
    }

    /**
     * Logout user
     */
    async logout(token: string): Promise<void> {
        authService.invalidateSession(token);
    }

    /**
     * Get user by ID
     */
    async getUserById(userId: string): Promise<IUser | null> {
        return UserRepo.findById(userId);
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email: string): Promise<IUser | null> {
        const user = await UserRepo.findByEmail(email);

        if (user) {
            const { passwordHash, ...userWithoutPassword } = user;
            return userWithoutPassword as IUser;
        }
        return null;
    }

    /**
     * Update user profile
     */
    async updateUser(userId: string, updateData: Partial<Pick<IUser, 'name' | 'email'>>): Promise<IUser | null> {

        if (updateData.email) {
            const existingUser = await User.findOne({
                email: updateData.email.toLowerCase(),
                _id: { $ne: userId }
            });
            if (existingUser) {
                throw new Error("Email already in use by another user");
            }
            updateData.email = updateData.email.toLowerCase();
        }

        return User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        );
    }
}

export const userService = new UserService();
