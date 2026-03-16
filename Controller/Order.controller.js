import mongoose from "mongoose";
import Stripe from "stripe";
import { Address } from "../Model/AddressSchema.model.js";
import { Cart } from "../Model/Cart.model.js";
import { Order } from "../Model/Order.model.js";
import User from "../Model/Users.model.js";
import { sendOrderMail } from "../utils/sendOrderMail.js";
import { Product } from "../Model/ProductSchema.model.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─── Shared helper ────────────────────────────────────────────────────────────
// Validates cart items and returns { orderItems, subTotal }.
// Throws on any product/variant/stock issue.
const buildOrderItems = async (cartItems) => {
  let subTotal = 0;
  const orderItems = [];

  for (const item of cartItems) {
    const product = item.productId;

    if (!product || product.productStatus !== "PUBLISHED") {
      throw new Error(`Product unavailable: ${product?.productName ?? item.productId}`);
    }

    const variant = product.variants.id(item.variantId);
    if (!variant) {
      throw new Error(`Variant not found for ${product.productName}`);
    }

    if (variant.stockQuantity < item.quantity) {
      throw new Error(`Insufficient stock for ${product.productName}`);
    }

    const itemTotal = item.priceAtAdd * item.quantity;
    subTotal += itemTotal;

    orderItems.push({
      productId:   product._id,
      productName: product.productName,
      variantId:   variant._id,
      color:       variant.color.name,
      size:        variant.size ?? null,
      thumbnail:   variant.thumbnail,
      quantity:    item.quantity,
      price:       item.priceAtAdd,
      totalPrice:  itemTotal,
    });
  }

  return { orderItems, subTotal };
};

export const getOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
};

// ─── STEP 1: Create PaymentIntent ─────────────────────────────────────────────
// Frontend calls this first. We validate the cart + address on the server so the
// amount can never be tampered with by the client.
export const createPaymentIntent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { addressId, notes } = req.body;

    if (!addressId) {
      return res.status(400).json({ success: false, message: "Address is required" });
    }

    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    const cartItems = await Cart.find({ userId }).populate("productId");
    if (!cartItems.length) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Validate cart and compute authoritative total
    const { subTotal } = await buildOrderItems(cartItems);
    const shippingCharge = subTotal >= 1000 ? 0 : 50;
    const totalAmount    = subTotal + shippingCharge;

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   totalAmount * 100, // Stripe expects paise (smallest INR unit)
      currency: "inr",
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId:    userId.toString(),
        addressId: addressId.toString(),
        notes:     notes ?? "",
      },
    });

    res.status(200).json({
      success:      true,
      clientSecret: paymentIntent.client_secret,
      totalAmount,
      message:      "Payment intent created successfully",
    });
  } catch (error) {
    console.error("Create payment intent error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to create payment intent" });
  }
};

// ─── STEP 2: Stripe Webhook ────────────────────────────────────────────────────
// Stripe calls this after the payment is confirmed. We create the order here —
// server-side, unforgeable, idempotent.
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,                           // raw Buffer (see index.js)
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ── payment succeeded ──────────────────────────────────────────────────────
  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object;

    // Idempotency guard — skip if this PI already created an order
    const existing = await Order.findOne({ paymentIntentId: pi.id });
    if (existing) {
      return res.status(200).json({ received: true });
    }

    const { userId, addressId, notes } = pi.metadata;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(userId).select("email name").session(session);
      if (!user) throw new Error("User not found");

      const cartItems = await Cart.find({ userId }).populate("productId").session(session);
      if (!cartItems.length) throw new Error("Cart is empty");

      const address = await Address.findOne({ _id: addressId, userId }).session(session);
      if (!address) throw new Error("Address not found");

      const addressSnapshot = {
        fullName:   address.fullName,
        phone:      address.phone,
        street:     address.street,
        city:       address.city,
        state:      address.state,
        country:    address.country,
        postalCode: address.postalCode,
      };

      const { orderItems, subTotal } = await buildOrderItems(cartItems);
      const shippingCharge = subTotal >= 1000 ? 0 : 50;
      const totalAmount    = subTotal + shippingCharge;

      // Reduce stock atomically
      for (const item of cartItems) {
        const product = item.productId;
        const variant = product.variants.id(item.variantId);
        variant.stockQuantity -= item.quantity;
        await product.save({ session });
      }

      const order = await Order.create([{
        userId,
        items:           orderItems,
        shippingAddress: addressSnapshot,
        paymentMethod:   "STRIPE",
        paymentStatus:   "PAID",
        paymentIntentId: pi.id,
        orderStatus:     "PLACED",
        subTotal,
        shippingCharge,
        totalAmount,
        notes:           notes || undefined,
      }], { session });

      await Cart.deleteMany({ userId }).session(session);
      await session.commitTransaction();
      session.endSession();

      sendOrderMail({
        to:            user.email,
        userName:      user.name,
        orderId:       order[0].orderNumber || order[0]._id,
        totalAmount,
        paymentMethod: "STRIPE (Card/UPI)",
        paymentStatus: "PAID",
      }).catch(console.error);

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      // Return 200 so Stripe does NOT retry — log the failure
      console.error("Webhook order creation failed:", error.message);
    }
  }

  // ── payment failed ─────────────────────────────────────────────────────────
  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object;
    console.error(`Payment failed — PI: ${pi.id} | Reason: ${pi.last_payment_error?.message}`);
  }

  res.status(200).json({ received: true });
};

// ─── STEP 3: Get order after payment ──────────────────────────────────────────
// Fast path: webhook already created the order → return immediately.
// Fallback path: webhook failed (e.g. missing secret) → verify the PaymentIntent
// directly with Stripe and create the order here, so payment is never lost.
export const getOrderByPaymentIntent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { paymentIntentId } = req.params;

    // ── Fast path ──────────────────────────────────────────────────────────
    const existing = await Order.findOne({ paymentIntentId, userId });
    if (existing) {
      return res.status(200).json({
        success:     true,
        orderId:     existing._id,
        orderNumber: existing.orderNumber,
      });
    }

    // ── Fallback: verify with Stripe directly ──────────────────────────────
    let pi;
    try {
      pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch {
      return res.status(404).json({ success: false, message: "Order not ready yet" });
    }

    if (pi.status !== "succeeded") {
      return res.status(404).json({ success: false, message: "Payment not completed" });
    }

    if (pi.metadata?.userId !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Payment confirmed — create the order now (same logic as webhook)
    const { addressId, notes } = pi.metadata;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(userId).select("email name").session(session);
      if (!user) throw new Error("User not found");

      const cartItems = await Cart.find({ userId }).populate("productId").session(session);
      if (!cartItems.length) throw new Error("Cart already cleared — check My Orders");

      const address = await Address.findOne({ _id: addressId, userId }).session(session);
      if (!address) throw new Error("Address not found");

      const addressSnapshot = {
        fullName:   address.fullName,
        phone:      address.phone,
        street:     address.street,
        city:       address.city,
        state:      address.state,
        country:    address.country,
        postalCode: address.postalCode,
      };

      const { orderItems, subTotal } = await buildOrderItems(cartItems);
      const shippingCharge = subTotal >= 1000 ? 0 : 50;
      const totalAmount    = subTotal + shippingCharge;

      for (const item of cartItems) {
        const product = item.productId;
        const variant = product.variants.id(item.variantId);
        variant.stockQuantity -= item.quantity;
        await product.save({ session });
      }

      const order = await Order.create([{
        userId,
        items:           orderItems,
        shippingAddress: addressSnapshot,
        paymentMethod:   "STRIPE",
        paymentStatus:   "PAID",
        paymentIntentId: pi.id,
        orderStatus:     "PLACED",
        subTotal,
        shippingCharge,
        totalAmount,
        notes:           notes || undefined,
      }], { session });

      await Cart.deleteMany({ userId }).session(session);
      await session.commitTransaction();
      session.endSession();

      sendOrderMail({
        to:            user.email,
        userName:      user.name,
        orderId:       order[0].orderNumber || order[0]._id,
        totalAmount,
        paymentMethod: "STRIPE (Card/UPI)",
        paymentStatus: "PAID",
      }).catch(console.error);

      return res.status(200).json({
        success:     true,
        orderId:     order[0]._id,
        orderNumber: order[0].orderNumber,
      });

    } catch (innerError) {
      await session.abortTransaction();
      session.endSession();

      // Race condition: webhook created it between our check and create
      if (innerError.code === 11000) {
        const recovered = await Order.findOne({ paymentIntentId, userId });
        if (recovered) {
          return res.status(200).json({
            success:     true,
            orderId:     recovered._id,
            orderNumber: recovered.orderNumber,
          });
        }
      }
      throw innerError;
    }

  } catch (error) {
    console.error("getOrderByPaymentIntent error:", error.message);
    res.status(500).json({ success: false, message: "Failed to confirm order" });
  }
};

// ─── COD order (no payment gateway) ──────────────────────────────────────────
export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.userId;
    const { addressId, paymentMethod = "COD", notes } = req.body;

    if (paymentMethod !== "COD") {
      return res.status(400).json({
        success: false,
        message: "Use /create-payment-intent for online payments",
      });
    }

    const user = await User.findById(userId)
      .select("email name")
      .session(session);

    if (!user) {
      throw new Error("User not found");
    }

    const cartItems = await Cart.find({ userId })
      .populate("productId")
      .session(session);

    if (!cartItems.length) {
      throw new Error("Cart is empty");
    }

    const address = await Address.findOne({ _id: addressId, userId }).session(
      session
    );

    if (!address) {
      throw new Error("Address not found");
    }

    const addressSnapShot = {
      fullName: address.fullName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
    };

    const { orderItems, subTotal } = await buildOrderItems(cartItems);

    // Reduce stock atomically
    for (const item of cartItems) {
      const product = item.productId;
      const variant = product.variants.id(item.variantId);
      variant.stockQuantity -= item.quantity;
      await product.save({ session });
    }

    const shippingCharge = subTotal >= 1000 ? 0 : 50;
    const totalAmount    = subTotal + shippingCharge;

    const order = await Order.create(
      [{
        userId,
        items:           orderItems,
        shippingAddress: addressSnapShot,
        paymentMethod:   "COD",
        paymentStatus:   "PENDING",
        orderStatus:     "PLACED",
        subTotal,
        shippingCharge,
        totalAmount,
        notes,
      }],
      { session }
    );

    await Cart.deleteMany({ userId }).session(session);

    await session.commitTransaction();
    session.endSession();

    // 📧 Email after commit
    sendOrderMail({
      to: user.email,
      userName: user.name,
      orderId: order[0].orderNumber || order[0]._id,
      totalAmount,
      paymentMethod,
      paymentStatus: order[0].paymentStatus,
    }).catch(console.error);

    res.status(200).json({
      success: true,
      message: "Order created successfully",
      orderId: order[0]._id,
      orderNumber: order[0].orderNumber,
      totalAmount,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Create order error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create order",
    });
  }
};

export const changeOrderStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {orderId} = req.params;
    const {status} = req.body;

    const order = await Order.findOne({_id: orderId, userId})
    if(!order) {
      return res.status(404).json({success: false, message: "Order not found"})
    }

    if(status !== "PLACED" && status !== "CONFIRMED" && status !== "SHIPPED" && status !== "DELIVERED" && status !== "CANCELLED" && status !== "RETURNED") {
      return res.status(400).json({success: false, message: "Invalid status"})
    }

    order.orderStatus = status;
    await order.save();
    res.status(200).json({success: true, message: "Order status updated successfully", order})
  } catch (error) {
    
  }
}