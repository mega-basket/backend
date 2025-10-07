import express from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
} from "../Controller/Cart.controller.js";
import { userAuthentication } from "../Middleware/User.middleware.js";

const router = express.Router();

router.post("/add", userAuthentication, addToCart);
router.get("/", userAuthentication, getCart);
router.post("/remove", userAuthentication, removeFromCart);

export default router;
