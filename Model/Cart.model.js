// models/Cart.model.js
import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    quantity: {
      type: Number,
      min: 1,
      default: 1,
    },

    priceAtAdd: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

cartSchema.index(
  { userId: 1, productId: 1, variantId: 1 },
  { unique: true }
);

export const Cart = mongoose.model("Cart", cartSchema);
