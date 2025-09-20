import { Category } from "../Model/Category.model.js";
import { Product } from "../Model/ProductSchema.model.js";
import uploadCloudinary from "../utils/uploadCloudinary.js";

export const createCategory = async (req, res) => {
  const { categoryName, description, isActive, sortOrder } = req.body;

  try {
    if (!categoryName) {
      return res.status(400).json({
        message: "Category name is required",
      });
    }

    const imageArray = req.files.categoryImage;
    if (!imageArray || imageArray.length === 0) {
      return res.status(400).json({
        message: "Category image is required",
      });
    }

    const imageLocalPath = imageArray[0].path;
    const categoryImage = await uploadCloudinary(imageLocalPath);

    const category = await Category.create({
      userId: req.user.userId,
      categoryName,
      description,
      categoryImage: categoryImage.secure_url,
      isActive,
      sortOrder,
    });

    res.status(201).json({
      message: "Category created successfully",
      success: true,
      category,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating category",
      success: false,
      error: error.message,
    });
  }
};

export const getCategory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";
    const filter = {};
    if (search) {
      filter.categoryName = { $regex: search, $options: "i" }; // $options plural
    }

    const total = await Category.countDocuments(filter);

    const categories = await Category.find(filter)
      .populate("userId", "name")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: 1 });

    // Fetch products for each category
    const categoriesWithProducts = await Promise.all(
      categories.map(async (cat) => {
        const products = await Product.find({ categoryId: cat._id });
        return { ...cat.toObject(), products };
      })
    );

    res.status(200).json({
      message: "Category fetched successfully",
      success: true,
      category: categoriesWithProducts,
      totalPages: Math.ceil(total / limit),
      limit,
      total,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching category",
      success: false,
      error: error.message,
    });
  }
};
