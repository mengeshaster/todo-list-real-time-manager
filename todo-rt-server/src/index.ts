import http from "http";
import { app } from "./app";
import { loadDB } from "./loaders/db";
import { initSocket } from "./realtime/socket";
import { config } from "./config/env";

async function main() {
    try {

        if (!config.MONGO_URI) {
            throw new Error("MONGO_URI is not configured");
        }

        await loadDB(config.MONGO_URI);

        const server = http.createServer(app);

        initSocket(server, {
            cors: {
                origin: config.CORS_ORIGIN,
                methods: ["GET", "POST", "PUT", "DELETE"]
            }
        });

        server.listen(config.PORT, () => {
            console.log(`🚀 API listening on http://localhost:${config.PORT}`);
            console.log(`📡 Socket.IO ready for real-time connections`);
            console.log(`🗄️  Database connected to ${config.MONGO_URI}`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}

process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
});

main().catch((error) => {
    console.error("Startup error:", error);
    process.exit(1);
});
