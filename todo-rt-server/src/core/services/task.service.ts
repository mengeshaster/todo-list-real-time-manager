import { TaskRepo, CreateTaskData, UpdateTaskData } from "../repositories/task.repo";
import { TaskDoc } from "../models/task.model";
import { LockManager } from "../locks/lock.manager";

export type EmitFunction = (event: string, payload: any) => void;

export const TaskService = {
    /**
     * Get all tasks
     */
    list: async (): Promise<TaskDoc[]> => {
        return TaskRepo.list();
    },

    /**
     * Get a single task by ID
     */
    findById: async (id: string): Promise<TaskDoc | null> => {
        return TaskRepo.findById(id);
    },

    /**
     * Create a new task and emit event
     */
    create: async (data: CreateTaskData, userId: string, emit: EmitFunction): Promise<TaskDoc> => {
        const task = await TaskRepo.create({ ...data, createdBy: userId });

        emit("task:created", task);

        return task;
    },

    /**
     * Update a task and emit event
     */
    update: async (
        id: string,
        data: UpdateTaskData,
        userId: string,
        emit: EmitFunction,
        toggleEvent: boolean = false
    ): Promise<TaskDoc | null> => {
        const lockManager = LockManager.getInstance();

        try {
            if (!toggleEvent) {
                const isLocked = await lockManager.isLocked(id);

                if (!isLocked) {
                    const lockResult = await lockManager.acquireLock(id, userId);

                    if (!lockResult.success) {
                        throw new Error(`Cannot acquire lock: ${lockResult.message}`);
                    }
                }
            }

            const updated = await TaskRepo.update(id, { ...data, updatedBy: userId });

            if (updated) {
                await lockManager.releaseLock(id, userId);

                emit("task:updated", updated);
            }

            return updated;
        } catch (error) {
            await lockManager.releaseLock(id, userId);
            throw error;
        }
    },

    /**
     * Delete a task and emit event
     */
    remove: async (id: string, emit: EmitFunction): Promise<void> => {
        const deleted = await TaskRepo.remove(id);

        if (deleted) {
            emit("task:deleted", { id });
        }
    },

    /**
     * Toggle task completion status
     */
    toggleStatus: async (
        id: string,
        userId: string,
        emit: EmitFunction
    ): Promise<TaskDoc | null> => {
        const task = await TaskRepo.findById(id);

        if (!task) {
            throw new Error("Task not found");
        }

        const newStatus = task.status === "open" ? "done" : "open";

        return TaskService.update(id, { status: newStatus }, userId, emit, true);
    },

    /**
     * Get tasks by status
     */
    findByStatus: async (status: "open" | "done"): Promise<TaskDoc[]> => {
        return TaskRepo.findByStatus(status);
    },

    /**
     * Get tasks by priority
     */
    findByPriority: async (priority: "low" | "medium" | "high"): Promise<TaskDoc[]> => {
        return TaskRepo.findByPriority(priority);
    },

    /**
     * Acquire lock on a task
     */
    acquireLock: async (
        taskId: string,
        userId: string,
        emit: EmitFunction
    ): Promise<boolean> => {
        const lockManager = LockManager.getInstance();
        const result = await lockManager.acquireLock(taskId, userId);

        if (result.success) {
            emit("task:locked", { taskId, userId, lockedBy: result.lockedBy });
        }

        return result.success;
    },

    /**
     * Release lock on a task
     */
    releaseLock: async (
        taskId: string,
        userId: string,
        emit: EmitFunction
    ): Promise<boolean> => {
        const lockManager = LockManager.getInstance();
        const result = await lockManager.releaseLock(taskId, userId);

        if (result.success) {
            emit("task:unlocked", { taskId, userId });
        }

        return result.success;
    }
};
