import mongoose from "mongoose";
import slugify from "slugify";

const variantSchema = new mongoose.Schema(
  {
    color: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      hex: {
        type: String,
        trim: true,
      },
    },

    images: {
      type: [String],
      required: true,
    },

    thumbnail: {
      type: String,
      required: true,
    },

    stockQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    sku: {
      type: String,
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      index: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    description: {
      type: String,
      trim: true,
    },

    brand: {
      type: String,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 90,
    },

    discountPrice: {
      type: Number,
      min: 0,
    },

    variants: {
      type: [variantSchema],
      validate: [(v) => v.length > 0, "At least one variant is required"],
    },

    productStatus: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "OUT_OF_STOCK", "DISCONTINUED"],
      default: "DRAFT",
      index: true,
    },

    weight: {
      type: String,
    },

    shippingCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    returnPolicy: {
      type: String,
      default: "No Return",
    },

    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    isPopular: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

productSchema.pre("save", async function (next) {
  if (!this.isModified("productName")) return next();

  const baseSlug = slugify(this.productName, {
    lower: true,
    strict: true,
  });

  let slug = baseSlug;
  let counter = 1;

  while (await mongoose.models.Product.exists({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }

  this.slug = slug;
  next();
});

productSchema.pre("save", function (next) {
  this.isPopular = this.avgRating >= 4 && this.totalReviews >= 20;
  next();
});

productSchema.pre("save", function (next) {
  if (this.discountPercentage > 0) {
    this.discountPrice = Math.round(
      this.price - (this.price * this.discountPercentage) / 100
    );
  } else {
    this.discountPrice = this.price;
  }
  next();
});

productSchema.pre("save", function (next) {
  this.variants.forEach((variant, index) => {
    if (!variant.sku) {
      variant.sku = `${this.slug}-${variant.color.name}-${index}`;
    }
  });
  next();
});

export const Product = mongoose.model("Product", productSchema);
