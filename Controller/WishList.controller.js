import { Product } from "../Model/ProductSchema.model.js";
import User from "../Model/Users.model.js";

export const addToWishList = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { productId } = req.body;

    // check if product is exists or not
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Add to wishlist if not already present
    const user = await User.findById(userId);
    if (user.wishList.includes(productId)) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    user.wishList.push(productId);
    await user.save();
    res.status(200).json({
      message: "Product added to wishlist",
      success: true,
      wishList: user.wishList,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWishList = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).populate("wishList");
    res.status(200).json({
      message: "Wishlist fetched successfully",
      success: true,
      wishList: user.wishList,
    });
  } catch (error) {
    res.status(500).json({ message: (error.message, "Product not found") });
  }
};

export const removeWishList = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.body;

    const user = await User.findById(userId);
    if (!user.wishList.includes(productId)) {
      return res.status(400).json({ message: "Product not in wishlist" });
    }

    user.wishList = user.wishList.filter((id) => id.toString() !== productId);

    await user.save();

    res.status(200).json({
      message: "Product removed form wishlist",
      success: true,
      wishList: user.wishList,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
