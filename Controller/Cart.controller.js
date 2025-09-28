import { Product } from "../Model/ProductSchema.model.js";
import User from "../Model/Users.model.js";

export const addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.body;
    console.log("productId", productId);
    console.log("userId", userId);

    // check if product is exists or not
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }
    // Add to cart if not already present
    const user = await User.findById(userId);
    if (user.cart.includes(productId)) {
      return res.status(400).json({ message: "Product already in cart" });
    }

    user.cart.push(productId);
    await user.save();
    res.status(200).json({
      message: "Product added to cart",
      success: true,
      cart: user.cart,
    });
  } catch (error) {
    res.status(500).json({
      message: "Product not found 123",
      error: error.message,
      success: false,
    });
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).populate("cart");
    res.status(200).json({
      message: "Cart fetched successfully",
      success: true,
      cart: user.cart,
    });
  } catch (error) {
    res.status(500).json({
      message: "Product not found 123",
      error: error.message,
      success: false,
    });
  }
};
