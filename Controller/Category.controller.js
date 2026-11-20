import { Category } from "../Model/Category.model.js";
import { Product } from "../Model/ProductSchema.model.js";
import uploadCloudinary from "../utils/uploadCloudinary.js";
import { toSearchPattern } from "../utils/escapeRegex.js";

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

    let categoryImageUrl = "";
    if (req.files?.categoryImage?.[0]) {
      const localPath = req.files.categoryImage[0].path;
      const uploadResult = await uploadCloudinary(localPath);
      categoryImageUrl = uploadResult?.secure_url || uploadResult?.url;
    }
    const category = await Category.create({
      userId: req.user.userId,
      categoryName,
      description,
      categoryImage: categoryImageUrl,
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

    const search = toSearchPattern(req.query.search);
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
    // const categoriesWithProducts = await Promise.all(
    //   categories.map(async (cat) => {
    //     const products = await Product.find({ categoryId: cat._id }).limit(8);
    //     return { ...cat.toObject(), products };
    //   })
    // );

    res.status(200).json({
      message: "Category fetched successfully",
      success: true,
      categories,
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

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const { categoryName, description, isActive, sortOrder } = req.body;

    if (categoryName !== undefined) category.categoryName = categoryName;
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive === "true" || isActive === true;
    if (sortOrder !== undefined) category.sortOrder = Number(sortOrder);

    if (req.files?.categoryImage?.[0]) {
      const uploadResult = await uploadCloudinary(req.files.categoryImage[0].path);
      category.categoryImage = uploadResult?.secure_url || uploadResult?.url;
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating category",
      error: error.message,
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const inUse = await Product.countDocuments({ categoryId: id });
    if (inUse > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete — ${inUse} product(s) still use this category`,
      });
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting category",
      error: error.message,
    });
  }
};

export const getCategoriesWithProducts = async (req, res) => {
  const data = await Category.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "categoryId",
        as: "products",
      },
    },
    { $sort: { sortOrder: 1 } },
  ]);
  res.json({ success: true, data });
};
