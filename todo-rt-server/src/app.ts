import express from "express";
import cors from "cors";
import { config } from "./config/env";
import taskRoutes from "./api/routes/task.routes";
import authRoutes from "./api/routes/auth.routes";
import { errorHandler } from "./middleware/error";

export const app = express();

app.use(cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

app.get("/", (_req, res) => {
    res.json({
        message: "Todo RT Server API",
        version: "1.0.0",
        endpoints: {
            auth: "/api/auth",
            tasks: "/api/tasks",
            socket: "/socket.io/"
        }
    });
});

app.use("*", (_req, res) => {
    res.status(404).json({
        error: "Not Found",
        message: "The requested resource was not found on this server."
    });
});

app.use(errorHandler);
