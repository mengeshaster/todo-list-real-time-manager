import { Task, TaskDoc } from "../models/task.model";
import { UserRepo } from "./user.repo";

export interface CreateTaskData {
    title: string;
    description?: string;
    priority?: "low" | "medium" | "high";
    dueDate?: Date;
    createdBy?: string;
}

export interface UpdateTaskData {
    title?: string;
    description?: string;
    status?: "open" | "done";
    priority?: "low" | "medium" | "high";
    dueDate?: Date;
    updatedBy?: string;
}

const transformTask = async (task: any): Promise<any> => {
    if (!task) return task;

    if (Array.isArray(task)) {
        return Promise.all(task.map(transformTask));
    }

    const transformed = { ...task };
    if (transformed._id) {
        transformed.id = transformed._id.toString();
        delete transformed._id;
    }
    delete transformed.__v;

    if (transformed.lock && transformed.lock.lockedBy) {
        try {
            const user = await UserRepo.findById(transformed.lock.lockedBy);
            if (user) {
                transformed.lock.lockedBy = user.name;
            }
        } catch (error) {
            console.warn(`User not found for lock: ${transformed.lock.lockedBy}`);
        }
    }

    return transformed;
};

export const TaskRepo = {
    list: async (): Promise<TaskDoc[]> => {
        const tasks = await Task.find().sort({ createdAt: -1 }).lean();
        return await transformTask(tasks);
    },

    listByUser: async (userId: string): Promise<TaskDoc[]> => {
        const tasks = await Task.find({ createdBy: userId }).sort({ createdAt: -1 }).lean();
        return await transformTask(tasks);
    },

    findById: async (id: string): Promise<TaskDoc | null> => {
        const task = await Task.findById(id).lean();
        return await transformTask(task);
    },

    findByIdAndUser: async (id: string, userId: string): Promise<TaskDoc | null> => {
        const task = await Task.findOne({ _id: id, createdBy: userId }).lean();
        return await transformTask(task);
    },

    create: async (data: CreateTaskData): Promise<TaskDoc> => {
        const task = await Task.create(data);
        return await transformTask(task.toObject());
    },

    update: async (id: string, data: UpdateTaskData): Promise<TaskDoc | null> => {
        const task = await Task.findByIdAndUpdate(id, data, { new: true }).lean();
        return await transformTask(task);
    },

    remove: async (id: string): Promise<TaskDoc | null> => {
        const task = await Task.findByIdAndDelete(id);
        return await transformTask(task?.toObject());
    },

    acquireLock: async (id: string, userId: string): Promise<TaskDoc | null> => {
        const task = await Task.findOneAndUpdate(
            {
                _id: id,
                $or: [
                    { "lock.isLocked": false },
                    { "lock.lockedBy": userId },
                    { lock: { $exists: false } }
                ]
            },
            {
                $set: {
                    "lock.isLocked": true,
                    "lock.lockedBy": userId,
                    "lock.lockedAt": new Date()
                }
            },
            { new: true }
        ).lean();
        return await transformTask(task);
    },

    releaseLock: async (id: string, userId?: string): Promise<TaskDoc | null> => {
        const task = await Task.findOneAndUpdate(
            userId ? { _id: id, "lock.lockedBy": userId } : { _id: id },
            {
                $set: { "lock.isLocked": false },
                $unset: { "lock.lockedBy": "", "lock.lockedAt": "" }
            },
            { new: true }
        ).lean();
        return await transformTask(task);
    },

    findByStatus: async (status: "open" | "done"): Promise<TaskDoc[]> => {
        const tasks = await Task.find({ status }).sort({ createdAt: -1 }).lean();
        return await transformTask(tasks);
    },

    findByStatusAndUser: async (status: "open" | "done", userId: string): Promise<TaskDoc[]> => {
        const tasks = await Task.find({ status, createdBy: userId }).sort({ createdAt: -1 }).lean();
        return await transformTask(tasks);
    },

    findByPriority: async (priority: "low" | "medium" | "high"): Promise<TaskDoc[]> => {
        const tasks = await Task.find({ priority }).sort({ createdAt: -1 }).lean();
        return await transformTask(tasks);
    },

    findByPriorityAndUser: async (priority: "low" | "medium" | "high", userId: string): Promise<TaskDoc[]> => {
        const tasks = await Task.find({ priority, createdBy: userId }).sort({ createdAt: -1 }).lean();
        return await transformTask(tasks);
    },

    findExpiredLocks: async (ttlSeconds: number): Promise<TaskDoc[]> => {
        const expiredTime = new Date(Date.now() - ttlSeconds * 1000);
        const tasks = await Task.find({
            "lock.isLocked": true,
            "lock.lockedAt": { $lt: expiredTime }
        }).lean();
        return await transformTask(tasks);
    },

    releaseExpiredLocks: (ttlSeconds: number): Promise<any> => {
        const expiredTime = new Date(Date.now() - ttlSeconds * 1000);
        return Task.updateMany(
            {
                "lock.isLocked": true,
                "lock.lockedAt": { $lt: expiredTime }
            },
            {
                $set: { "lock.isLocked": false },
                $unset: { "lock.lockedBy": "", "lock.lockedAt": "" }
            }
        );
    }
};
