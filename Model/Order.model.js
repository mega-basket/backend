import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productName: {
      type: String,
      required: true,
    },

    thumbnail: String,

    size: {
      type: String,
    },

    color: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    totalPrice: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    shippingAddress: {
      fullName: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "STRIPE"],
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },

    // Stripe PaymentIntent ID — unique + sparse so COD orders (no PI) are unaffected
    paymentIntentId: {
      type:   String,
      unique: true,
      sparse: true,
    },

    orderStatus: {
      type: String,
      enum: [
        "PLACED",
        "CONFIRMED",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "RETURNED",
      ],
      default: "PLACED",
    },

    subTotal: {
      type: Number,
      required: true,
    },

    shippingCharge: {
      type: Number,
      default: 0,
    },

    discount: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    expectedDeliveryDate: Date,

    notes: String,
  },
  { timestamps: true }
);

orderSchema.pre("save", function (next) {
  if (!this.orderNumber) {
    this.orderNumber = `ORD-${Date.now()}`;
  }
  next();
});

export const Order = mongoose.model("Order", orderSchema);
