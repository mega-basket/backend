import mongoose from "mongoose";
import { Address } from "../Model/AddressSchema.model.js";
import { Cart } from "../Model/Cart.model.js";
import { Product } from "../Model/ProductSchema.model.js";

export const addToCart = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { productId, variantId, quantity = 1 } = req.body;

    if (!productId || !variantId || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Product, variant and quantity are required",
      });
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);
    const variantObjectId = new mongoose.Types.ObjectId(variantId);

    const product = await Product.findById(productObjectId);
    if (!product || product.productStatus !== "PUBLISHED") {
      return res.status(404).json({
        success: false,
        message: "Product not available",
      });
    }

    const variant = product.variants?.id(variantObjectId);
    if (!variant) {
      return res.status(400).json({
        success: false,
        message: "Variant not found",
      });
    }

    if (quantity > variant.stockQuantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    const existingItem = await Cart.findOne({
      userId,
      productId: productObjectId,
      variantId: variantObjectId,
    });

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;

      if (newQty > variant.stockQuantity) {
        return res.status(400).json({
          success: false,
          message: "Quantity exceeds available stock",
        });
      }

      existingItem.quantity = newQty;
      await existingItem.save();

      return res.status(200).json({
        success: true,
        message: "Cart updated",
        data: existingItem,
      });
    }

    const newItem = await Cart.create({
      userId,
      productId: productObjectId,
      variantId: variantObjectId,
      quantity,
      priceAtAdd: product.discountPrice ?? product.price,
    });

    return res.status(201).json({
      success: true,
      message: "Product added to cart",
      data: newItem,
    });

  } catch (error) {
    console.error("Add to cart error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This variant already exists in cart",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to add product to cart",
    });
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const cartItems = await Cart.find({ userId })
      .populate("productId")
      .sort({ createdAt: -1 });

    const formattedCart = cartItems.map((item) => {
      const variant = item.productId?.variants.id(item.variantId);

      return {
        _id: item._id,
        product: item.productId,
        variant,
        quantity: item.quantity,
        priceAtAdd: item.priceAtAdd,
        subtotal: item.priceAtAdd * item.quantity,
      };
    });

    res.status(200).json({
      success: true,
      cart: formattedCart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
    });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { cartItemId } = req.body;

    if (!cartItemId) {
      return res.status(400).json({
        success: false,
        message: "Cart item id is required",
      });
    }

    const deleted = await Cart.findOneAndDelete({
      _id: cartItemId,
      userId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product removed from cart",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to remove product from cart",
    });
  }
};

export const updateCartQuantity = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { productId, variantId, quantity } = req.body;

    if (!productId || !variantId || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Product, variant and valid quantity are required",
      });
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);
    const variantObjectId = new mongoose.Types.ObjectId(variantId);

    const cartItem = await Cart.findOne({
      userId,
      productId: productObjectId,
      variantId: variantObjectId,
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    const product = await Product.findById(productObjectId);
    const variant = product?.variants.id(variantObjectId);

    if (!variant || quantity > variant.stockQuantity) {
      return res.status(400).json({
        success: false,
        message: "Requested quantity exceeds available stock",
      });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    res.status(200).json({
      success: true,
      message: "Cart quantity updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update cart",
    });
  }
};

export const checkOutValidate = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const { addressId } = req.body;

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "Address is required",
      });
    }

    const cartItems = await Cart.find({ userId }).populate("productId");

    if (!cartItems.length) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const address = await Address.findOne({ _id: addressId, userId });

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Address not found",
      });
    }

    let subtotal = 0;
    const items = [];

    for (const item of cartItems) {
      const product = item.productId;
      const variant = product?.variants.id(item.variantId);

      if (!product || product.productStatus !== "PUBLISHED" || !variant) {
        return res.status(400).json({
          success: false,
          message: "Invalid cart item detected",
        });
      }

      if (variant.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.productName}`,
        });
      }

      const itemTotal = item.priceAtAdd * item.quantity;
      subtotal += itemTotal;

      items.push({
        productId: product._id,
        productName: product.productName,
        variant: variant.color?.name,
        quantity: item.quantity,
        price: item.priceAtAdd,
        subtotal: itemTotal,
      });
    }

    const shippingCharge = subtotal >= 1000 ? 0 : 50;

    res.status(200).json({
      success: true,
      address,
      items,
      subtotal,
      shippingCharge,
      totalAmount: subtotal + shippingCharge,
    });
  } catch (error) {
    console.error("Checkout validation error:", error);
    res.status(500).json({
      success: false,
      message: "Checkout validation failed",
    });
  }
};
