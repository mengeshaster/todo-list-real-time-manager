export interface SocketEvents {
    "task:lock": { taskId: string; userId: string };
    "task:unlock": { taskId: string; userId: string };
}

export interface SocketResponses {
    "task:lock:response": {
        taskId: string;
        userId: string;
        success: boolean;
        message: string;
    };
    "task:unlock:response": {
        taskId: string;
        userId: string;
        success: boolean;
        message: string;
    };
}

export interface BroadcastEvents {
    "task:created": any;
    "task:updated": any;
    "task:deleted": { id: string };
    "task:locked": { taskId: string; lockedBy?: string; userId: string };
    "task:unlocked": { taskId: string; userId: string };
}

export interface ApiResponse<T = any> {
    data?: T;
    error?: string;
    message?: string;
    status?: number;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface TaskFilters {
    status?: "open" | "done";
    priority?: "low" | "medium" | "high";
    search?: string;
    dueDate?: {
        from?: Date;
        to?: Date;
    };
}

export interface CachedSession {
    userId: string;
    email: string;
    name: string;
    lastActivity: Date;
    token: string;
}

declare module "socket.io" {
    interface Socket {
        user?: CachedSession;
        token?: string;
    }
}

declare global {
    namespace Express {
        interface Request {
            user?: CachedSession;
            token?: string;
        }
    }
}

export { };
