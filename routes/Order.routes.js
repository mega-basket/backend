import express from "express";
import { userAuthentication } from "../Middleware/User.middleware.js";
import {
  createOrder,
  createPaymentIntent,
  stripeWebhook,
  getOrderByPaymentIntent,
  getOrderById,
  getOrders,
  changeOrderStatus,
  requestOrderReturn,
  requestOrderCancellation,
  getOrderRequests,
  reviewOrderRequest,
} from "../Controller/Order.controller.js";
import { requireAdmin } from "../Middleware/User.middleware.js";

const router = express.Router();

// Stripe webhook — NO auth middleware, Stripe verifies via signature
router.post("/webhook", stripeWebhook);

// Online payment flow
router.post("/create-payment-intent", userAuthentication, createPaymentIntent);
router.get(
  "/payment/:paymentIntentId",
  userAuthentication,
  getOrderByPaymentIntent,
);

// COD order
router.post("/create", userAuthentication, createOrder);

// Order queries
router.get("/", userAuthentication, getOrders);
// Keep this fixed path above /:orderId so "requests" is not treated as an order ID.
router.get("/requests", userAuthentication, requireAdmin, getOrderRequests);
router.get("/:orderId", userAuthentication, getOrderById);

// Admin / status update
router.put(
  "/:orderId/status",
  userAuthentication,
  requireAdmin,
  changeOrderStatus,
);

router.post(
  "/:orderId/cancel-request",
  userAuthentication,
  requestOrderCancellation,
);

router.post("/:orderId/return-request", userAuthentication, requestOrderReturn);

router.patch(
  "/:orderId/requests/:type",
  userAuthentication,
  requireAdmin,
  reviewOrderRequest,
);

export default router;
