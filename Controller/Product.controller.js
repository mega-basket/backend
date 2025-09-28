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
      discountPrice,
      stockQuantity,
      productStatus,
      weight,
      isActive,
      avgRating,
      totalReviews,
      deliveryDate,
      returnPolicy,
      shippingCharge,
    } = req.body;

    const userId = req.user.userId;

    // ✅ Validate required fields
    if (!productName || !price) {
      return res.status(400).json({
        message: "productName and price are required",
        success: false,
      });
    }

    // ✅ Validate images
    const imagesFiles = req.files?.images;
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!imagesFiles || imagesFiles.length === 0 || !thumbnailFile) {
      return res.status(400).json({
        message: "At least one image and a thumbnail are required",
        success: false,
      });
    }

    // ✅ Upload images to Cloudinary
    const imagesLocalPaths = imagesFiles.map((f) => f.path);
    const thumbnailLocalPath = thumbnailFile.path;

    const uploadedImages = await uploadMultipleCloudinary(imagesLocalPaths);
    const thumbnail = await uploadCloudinary(thumbnailLocalPath);

    // ✅ Parse size and color arrays
    let parsedSize = [];
    let parsedColor = [];
    if (req.body.size) parsedSize = JSON.parse(req.body.size);
    if (req.body.color) parsedColor = JSON.parse(req.body.color);

    // ✅ Format deliveryDate to YYYY-MM-DD if provided
    let formattedDeliveryDate = null;
    if (deliveryDate) {
      const dateObj = new Date(deliveryDate);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
      const dd = String(dateObj.getDate()).padStart(2, "0");
      formattedDeliveryDate = `${yyyy}-${mm}-${dd}`;
    }

    // ✅ Create product
    const product = await Product.create({
      userId,
      productName,
      categoryId,
      description,
      brand,
      price,
      discountPrice,
      stockQuantity,
      productStatus,
      weight,
      isActive,
      avgRating,
      totalReviews,
      images: uploadedImages.map((img) => img.secure_url),
      thumbnail: thumbnail.secure_url,
      size: parsedSize,
      color: parsedColor,
      deliveryDate: formattedDeliveryDate,
      returnPolicy,
      shippingCharge,
    });

    res.status(201).json({
      message: "Product created successfully",
      success: true,
      product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Product not created",
      error: error.message,
      success: false,
    });
  }
};

export const getProducts = async (req, res) => {
  const userId = req.user.id;
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // search and filter

    const search = req.query.search || "";
    const categoryId = req.query.categoryId;
    const status = req.query.status;

    const filter = {};

    if (search) {
      filter.productName = { $regex: search, $options: "i" };
    }

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (status) {
      filter.productStatus = status;
    }

    const totalCount = await Product.countDocuments(filter);

    const product = await Product.find(filter)
      .populate("userId", "name")
      .populate("categoryId", "categoryName")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Product fetched successfully",
      success: true,
      product,
      totalPages: Math.ceil(totalCount / limit),
      limit,
      totalProduct: totalCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Product not found",
      error: error.message,
      success: false,
    });
  }
};

export const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      res.status(400).json({
        message: "Product not found",
      });
    }

    res.status(200).json({
      message: "Product fetch successfully",
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Product not found",
      error: error.message,
      success: false,
    });
  }
};
