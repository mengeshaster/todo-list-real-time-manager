import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { TaskService } from "../core/services/task.service";
import { authenticateSocket } from "../middleware/auth";

let io: Server | undefined;

export function initSocket(server: HttpServer, opts?: any): void {
    io = new Server(server, opts);

    const taskNamespace = io.of("/tasks");

    taskNamespace.use(authenticateSocket);

    taskNamespace.on("connection", (socket) => {
        console.log(`📡 Client connected to /tasks namespace: ${socket.id} (User: ${socket.user?.name})`);

        socket.on("task:lock", async ({ taskId }) => {
            try {
                const emit = getEmitter();
                const success = await TaskService.acquireLock(taskId, socket.user ? socket.user.userId : '', emit);

                socket.emit("task:lock:response", {
                    taskId,
                    userId: socket.user?.userId,
                    lockedBy: socket.user?.name,
                    success,
                    message: success ? "Lock acquired" : "Lock failed"
                });
            } catch (error) {
                socket.emit("task:lock:response", {
                    taskId,
                    userId: socket.user?.userId,
                    success: false,
                    message: `Lock error: ${error}`
                });
            }
        });

        socket.on("task:unlock", async ({ taskId }) => {
            try {
                const emit = getEmitter();
                const success = await TaskService.releaseLock(taskId, socket.user ? socket.user.userId : '', emit);

                socket.emit("task:unlock:response", {
                    taskId,
                    userId: socket.user?.userId,
                    success,
                    message: success ? "Lock released" : "Unlock failed"
                });
            } catch (error) {
                socket.emit("task:unlock:response", {
                    taskId,
                    userId: socket.user?.userId,
                    success: false,
                    message: `Unlock error: ${error}`
                });
            }
        });

        socket.on("disconnect", () => {
            console.log(`📡 Client disconnected from /tasks namespace: ${socket.id} (User: ${socket.user?.name})`);
        });
    });

    console.log("📡 Socket.IO initialized with /tasks namespace");
}

/**
 * Get the emitter function for broadcasting events
 */
export function getEmitter() {
    if (!io) {
        throw new Error("Socket.IO not initialized. Call initSocket() first.");
    }

    return (event: string, payload: any) => {
        const taskNamespace = io!.of("/tasks");
        taskNamespace.emit(event, payload);

        console.log(`📡 Emitted event: ${event}`, payload);
    };
}

