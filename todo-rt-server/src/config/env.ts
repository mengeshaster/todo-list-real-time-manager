import * as dotenv from "dotenv";

dotenv.config();

export const config = {
    PORT: Number(process.env.PORT),
    MONGO_URI: process.env.MONGO_URI,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRATION: process.env.JWT_EXPIRATION,
    LOCK_TTL_SECONDS: Number(process.env.LOCK_TTL_SECONDS),
};
