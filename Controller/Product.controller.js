import { Product } from "../Model/ProductSchema.model.js";
import {
  uploadCloudinary,
  uploadMultipleCloudinary,
} from "../utils/uploadCloudinary.js";

export const createProduct = async (req, res) => {
  try {
    const {
      productName,
      categoryId,
      description,
      brand,
      price,
      discountPercentage = 0,
      productStatus = "DRAFT",
    } = req.body;

    const userId = req.user.userId;

    const parsedPrice = Number(price);
    const parsedDiscount = Number(discountPercentage);

    if (!productName || !categoryId || parsedPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product data",
      });
    }

    if (parsedDiscount < 0 || parsedDiscount > 90) {
      return res.status(400).json({
        success: false,
        message: "Discount must be between 0 and 90",
      });
    }

    const variantFiles = {};

    for (const file of req.files) {
      const match = file.fieldname.match(
        /variants\[(\d+)\]\[(images|thumbnail)\]/
      );

      if (!match) continue;

      const index = match[1];
      const type = match[2];

      if (!variantFiles[index]) {
        variantFiles[index] = { images: [], thumbnail: null };
      }

      if (type === "images") {
        variantFiles[index].images.push(file);
      }

      if (type === "thumbnail") {
        variantFiles[index].thumbnail = file;
      }
    }

    const variants = [];

    for (const index in variantFiles) {
      const bodyVariant = req.body.variants?.[index];

      if (!bodyVariant?.color?.name) {
        return res.status(400).json({
          success: false,
          message: `Color missing for variant ${index}`,
        });
      }

      const uploadedImages = await uploadMultipleCloudinary(
        variantFiles[index].images.map((f) => f.path)
      );

      const uploadedThumbnail = await uploadCloudinary(
        variantFiles[index].thumbnail.path
      );

      variants.push({
        color: {
          name: bodyVariant.color.name,
        },
        stockQuantity: Number(bodyVariant.stockQuantity || 0),
        images: uploadedImages.map((i) => i.secure_url),
        thumbnail: uploadedThumbnail.secure_url,
      });
    }

    if (!variants.length) {
      return res.status(400).json({
        success: false,
        message: "At least one variant is required",
      });
    }

    const totalStock = variants.reduce(
      (sum, v) => sum + v.stockQuantity,
      0
    );

    if (productStatus === "PUBLISHED" && totalStock <= 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot publish product with zero variant stock",
      });
    }

    const product = await Product.create({
      userId,
      productName,
      categoryId,
      description,
      brand,
      price: parsedPrice,
      discountPercentage: parsedDiscount,
      productStatus,
      variants,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      productId: product._id,
    });
  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).json({
      success: false,
      message: "Product creation failed",
    });
  }
};


export const getProducts = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const search = req.query.search?.trim();
    const categoryId = req.query.categoryId;
    const status = req.query.status;

    const filter = {};

    if (search) {
      filter.productName = { $regex: `^${search}`, $options: "i" };
    }

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    // 🔐 Only admin can filter by status
    if (req.user?.role === "admin" && status) {
      filter.productStatus = status;
    } else {
      filter.productStatus = "PUBLISHED";
    }

     const [products, totalCount] = await Promise.all([
      Product.find(filter)
        .populate("userId", "name")
        .populate("categoryId", "categoryName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      products,
      totalProducts: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({
      slug,
      productStatus: "PUBLISHED",
    })
      .populate("userId", "name")
      .populate("categoryId", "categoryName")
      .lean()

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

export const getPopularProducts = async (req, res) => {
  try {
    const products = await Product.find({
      productStatus: "PUBLISHED",
      isPopular: true,
    })
      .sort({ avgRating: -1, totalReviews: -1 })
      .limit(10)
      .populate("categoryId", "categoryName")
      .lean()

    res.status(200).json({
      success: true,
      message: "Popular products fetched successfully",
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch popular products",
      error: error.message,
    });
  }
};
