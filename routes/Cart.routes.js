import express from "express";
import {
  addToCart,
  checkOutValidate,
  getCart,
  removeFromCart,
  updateCartQuantity,
} from "../Controller/Cart.controller.js";
import { userAuthentication } from "../Middleware/User.middleware.js";

const router = express.Router();

router.post("/add", userAuthentication, addToCart);
router.get("/", userAuthentication, getCart);
router.post("/remove", userAuthentication, removeFromCart);
router.patch("/update-quantity", userAuthentication, updateCartQuantity);
router.post("/validate", userAuthentication, checkOutValidate);

export default router;
