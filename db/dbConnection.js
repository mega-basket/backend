import mongoose from "mongoose";
import { Cart } from "../Model/Cart.model.js";

// Lambda keeps the module scope warm between invocations, so we cache the
// connection promise instead of reconnecting on every request.
let connectionPromise = null;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose
    .connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 5,
    })
    .then(async (conn) => {
      console.log("MongoDb connected 🚀");

      // Drop stale indexes and recreate from schema.
      // Fixes: old { userId, productId } unique index blocking
      // multiple variants of the same product in the cart.
      try {
        await Cart.syncIndexes();
        console.log("Cart indexes synced ✓");
      } catch (err) {
        console.error("Cart index sync failed:", err.message);
      }

      return conn;
    })
    .catch((error) => {
      connectionPromise = null;
      console.error("Failed to connect to MongoDB:", error.message);
      throw error;
    });

  return connectionPromise;
};

// Kept for backwards compatibility with existing local-server entrypoint.
export const dbConnetion = connectDB;
