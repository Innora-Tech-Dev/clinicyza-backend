import mongoose from "mongoose";
import { env } from "@/config/env";

/**
 * Cached MongoDB connection — reused across requests and dev hot-reloads
 * instead of opening a new connection every time a route runs.
 */
const cache = globalThis.__mongoose ?? (globalThis.__mongoose = { conn: null, promise: null });

export async function connectDB() {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(env.mongoUri, {
        dbName: env.mongoDbName,
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
      })
      .catch((error) => {
        cache.promise = null; // allow retry on next request
        throw error;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
