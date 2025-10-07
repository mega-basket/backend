import mongoose from "mongoose";
import slugify from "slugify";
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
    isPopular: { type: Boolean, default: false },
    slug: { type: String, unique: true },
    discountPrice: { type: Number },
    stockQuantity: { type: Number, default: 0 },
    productStatus: { type: String, enum: productStatusEnum, default: "DRAFT" },
    weight: { type: String },
    isActive: { type: Boolean, default: true },
    avgRating: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    returnPolicy: { type: String, default: 0 },
    deliveryDate: { type: Date },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.pre("save", async function (next) {
  if (this.isModified("productName") || this.isNew) {
    let baseSlug = slugify(this.productName, { lower: true, strict: true });

    let slug = baseSlug;
    let count = 1;
    const Product = mongoose.model("Product", productSchema);

    while (await Product.exists({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }
    this.slug = slug;
  }
  next();
});

productSchema.pre("save", async function (next) {
  if (this.avgRating >= 3 && this.totalReviews >= 20) {
    this.isPopular = true;
  }
  next();
});
export const Product = mongoose.model("Product", productSchema);
