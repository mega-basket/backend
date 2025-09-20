import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    categoryName: { type: String, required: true },
    description: { type: String },
    categoryImage: { type: String },
    parentCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" }, // self-reference
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Category = mongoose.model("Category", categorySchema);
