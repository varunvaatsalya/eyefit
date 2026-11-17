import mongoose from "mongoose";

const globalCache = globalThis.__mongoose ?? (globalThis.__mongoose = { conn: null, promise: null });

export async function connectDB() {
  if (globalCache.conn) return globalCache.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Add it to .env.local");
  if (!globalCache.promise) {
    globalCache.promise = mongoose.connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 8000 }).catch((err) => {
      globalCache.promise = null;
      throw err;
    });
  }
  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}
