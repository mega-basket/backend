import mongoose from "mongoose";
import { Cart } from "../Model/Cart.model.js";

export const dbConnetion = async () => {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log("*******************************");
      console.log("MongoDb Connection on 🚀 ", process.env.PORT);
      console.log("*******************************");

      // Drop stale indexes and recreate from schema.
      // Fixes: old { userId, productId } unique index blocking
      // multiple variants of the same product in the cart.
      try {
        await Cart.syncIndexes();
        console.log("Cart indexes synced ✓");
      } catch (err) {
        console.error("Cart index sync failed:", err.message);
      }
    })
    .catch((error)=>{
        console.log("Failed to Connection", error);
    })
};
