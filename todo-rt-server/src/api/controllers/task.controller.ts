import { Request, Response } from "express";
import { TaskService } from "../../core/services/task.service";
import { getEmitter } from "../../realtime/socket";

export const TaskController = {
    /**
     * GET /tasks - List all tasks
     */
    list: async (_req: Request, res: Response): Promise<void> => {
        try {
            const tasks = await TaskService.list();
            res.json(tasks);
        } catch (error) {
            res.status(500).json({
                error: "Failed to fetch tasks",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    },

    /**
     * GET /tasks/:id - Get a single task
     */
    findById: async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const task = await TaskService.findById(id);

            if (!task) {
                res.status(404).json({ error: "Task not found" });
                return;
            }

            res.json(task);
        } catch (error) {
            res.status(500).json({
                error: "Failed to fetch task",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    },

    /**
     * POST /tasks - Create a new task
     */
    create: async (req: Request, res: Response): Promise<void> => {
        try {
            const { userId } = req.body;

            const emit = getEmitter();
            const task = await TaskService.create(req.body, userId, emit);
            res.status(201).json(task);
        } catch (error) {
            res.status(400).json({
                error: "Failed to create task",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    },

    /**
     * PUT /tasks/:id - Update a task
     */
    update: async (req: Request, res: Response): Promise<void> => {
        try {
            const emit = getEmitter();
            const { userId } = req.body;

            const updated = await TaskService.update(
                req.params.id,
                req.body,
                userId,
                emit
            );

            if (!updated) {
                res.status(404).json({ error: "Task not found" });
                return;
            }

            res.json(updated);
        } catch (error) {
            res.status(400).json({
                error: "Failed to update task",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    },

    /**
     * DELETE /tasks/:id - Delete a task
     */
    remove: async (req: Request, res: Response): Promise<void> => {
        try {
            const emit = getEmitter();
            await TaskService.remove(req.params.id, emit);
            res.status(204).end();
        } catch (error) {
            res.status(400).json({
                error: "Failed to delete task",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    },

    /**
     * PATCH /tasks/:id/toggle - Toggle task completion status
     */
    toggleStatus: async (req: Request, res: Response): Promise<void> => {
        try {
            const emit = getEmitter();
            const { userId } = req.body;

            const updated = await TaskService.toggleStatus(
                req.params.id,
                userId,
                emit
            );

            if (!updated) {
                res.status(404).json({ error: "Task not found" });
                return;
            }

            res.json(updated);
        } catch (error) {
            res.status(400).json({
                error: "Failed to toggle task status",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    },

    /**
     * GET /tasks/status/:status - Get tasks by status
     */
    findByStatus: async (req: Request, res: Response): Promise<void> => {
        try {
            const { status } = req.params;

            if (status !== "open" && status !== "done") {
                res.status(400).json({ error: "Invalid status. Must be 'open' or 'done'" });
                return;
            }

            const tasks = await TaskService.findByStatus(status);
            res.json(tasks);
        } catch (error) {
            res.status(500).json({
                error: "Failed to fetch tasks by status",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    },

    /**
     * GET /tasks/priority/:priority - Get tasks by priority
     */
    findByPriority: async (req: Request, res: Response): Promise<void> => {
        try {
            const { priority } = req.params;

            if (priority !== "low" && priority !== "med" && priority !== "high") {
                res.status(400).json({ error: "Invalid priority. Must be 'low', 'med', or 'high'" });
                return;
            }

            const tasks = await TaskService.findByPriority(priority);
            res.json(tasks);
        } catch (error) {
            res.status(500).json({
                error: "Failed to fetch tasks by priority",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }
};
