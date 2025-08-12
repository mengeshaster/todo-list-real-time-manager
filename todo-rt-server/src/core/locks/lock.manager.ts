import { TaskRepo } from "../repositories/task.repo";
import { config } from "../../config/env";

export interface LockResult {
    success: boolean;
    taskId: string;
    userId: string;
    lockedBy?: string;
    message?: string;
}

export class LockManager {
    private static instance: LockManager;
    private lockTTL: number;

    private constructor() {
        this.lockTTL = config.LOCK_TTL_SECONDS;
        this.startCleanupTimer();
    }

    public static getInstance(): LockManager {
        if (!LockManager.instance) {
            LockManager.instance = new LockManager();
        }
        return LockManager.instance;
    }

    /**
     * Acquire a lock on a task
     */
    public async acquireLock(taskId: string, userId: string): Promise<LockResult> {
        try {
            const result = await TaskRepo.acquireLock(taskId, userId);

            if (result) {
                return {
                    success: true,
                    taskId,
                    userId,
                    lockedBy: result.lock.lockedBy?.toString(),
                    message: "Lock acquired successfully"
                };
            } else {
                return {
                    success: false,
                    taskId,
                    userId,
                    message: "Task is already locked by another user"
                };
            }
        } catch (error) {
            return {
                success: false,
                taskId,
                userId,
                message: `Failed to acquire lock: ${error}`
            };
        }
    }

    /**
     * Release a lock on a task
     */
    public async releaseLock(taskId: string, userId?: string): Promise<LockResult> {
        try {
            const result = await TaskRepo.releaseLock(taskId, userId);

            if (result) {
                return {
                    success: true,
                    taskId,
                    userId: userId || "system",
                    message: "Lock released successfully"
                };
            } else {
                return {
                    success: false,
                    taskId,
                    userId: userId || "system",
                    message: "Failed to release lock - task not found or not locked by user"
                };
            }
        } catch (error) {
            return {
                success: false,
                taskId,
                userId: userId || "system",
                message: `Failed to release lock: ${error}`
            };
        }
    }

    /**
     * Check if a task is locked
     */
    public async isLocked(taskId: string): Promise<boolean> {
        try {
            const task = await TaskRepo.findById(taskId);
            return task?.lock?.isLocked || false;
        } catch (error) {
            console.error("Error checking lock status:", error);
            return false;
        }
    }

    /**
     * Clean up expired locks
     */
    public async cleanupExpiredLocks(): Promise<number> {
        try {
            const expiredLocks = await TaskRepo.findExpiredLocks(this.lockTTL);
            const expiredCount = expiredLocks.length;

            if (expiredCount > 0) {
                await TaskRepo.releaseExpiredLocks(this.lockTTL);
                console.log(`🧹 Cleaned up ${expiredCount} expired locks`);
            }

            return expiredCount;
        } catch (error) {
            console.error("Error cleaning up expired locks:", error);
            return 0;
        }
    }

    /**
     * Start automatic cleanup timer for expired locks
     */
    private startCleanupTimer(): void {
        setInterval(() => {
            this.cleanupExpiredLocks();
        }, 60 * 1000);

        console.log("🔧 Lock cleanup timer started (runs every 60 seconds)");
    }

    /**
     * Set custom TTL for locks
     */
    public setTTL(seconds: number): void {
        this.lockTTL = seconds;
    }

    /**
     * Get current TTL setting
     */
    public getTTL(): number {
        return this.lockTTL;
    }
}
