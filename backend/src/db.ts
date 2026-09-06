import mongoose from "mongoose";
import { config } from "./config.ts";

/**
 * Connect to MongoDB. Resolves once the connection is established;
 * throws (rejecting startup) if the database is unreachable.
 */
export async function connectDB(): Promise<typeof mongoose> {
  mongoose.set("strictQuery", true);

  const conn = await mongoose.connect(config.mongodbUri);
  const { host, name } = conn.connection;
  console.log(`[db] connected to ${host}/${name}`);

  mongoose.connection.on("error", (err) => {
    console.error("[db] connection error:", err);
  });

  return conn;
}
