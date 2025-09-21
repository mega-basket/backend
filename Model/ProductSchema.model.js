import mongoose from "mongoose";
const productStatusEnum = [
  "DRAFT",
  "ACTIVE",
  "INACTIVE",
  "OUT_OF_STOCK",
  "DISCONTINUED",
];
const productSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productName: {
      type: String,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    description: {
      type: String,
    },
    size: [
      {
        label: { type: String, required: true },
      },
    ],
    color: [
      {
        name: { type: String, required: true },
      },
    ],
    brand: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    thumbnail: {
      type: String,
      required: true,
    },
    discountPrice: { type: Number },
    stockQuantity: { type: Number, default: 0 },
    productStatus: { type: String, enum: productStatusEnum, default: "DRAFT" },
    weight: { type: Number },
    isActive: { type: Boolean, default: true },
    avgRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
