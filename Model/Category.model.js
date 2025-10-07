import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    slug: { type: String, unique: true },
    categoryName: { type: String, required: true },
    description: { type: String },
    categoryImage: { type: String },
    parentCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" }, // self-reference
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);
categorySchema.pre("save", async function (next) {
  if (this.isModified("categoryName")) {
    let baseSlug = slugify(this.categoryName, { lower: true, strict: true });

    let slug = baseSlug;
    let count = 1;
    while (await mongoose.models.Category.exists({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }
    this.slug = slug;
  }
  next();
});
export const Category = mongoose.model("Category", categorySchema);
