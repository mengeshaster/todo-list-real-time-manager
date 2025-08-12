import mongoose from "mongoose";

let connected = false;

export async function loadDB(uri: string): Promise<void> {
    if (connected) return;

    try {
        await mongoose.connect(uri);
        connected = true;
        console.log("🗄️  MongoDB connected successfully");
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error);
        throw error;
    }
}

mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error);
});

mongoose.connection.on("disconnected", () => {
    console.log("MongoDB disconnected");
    connected = false;
});
