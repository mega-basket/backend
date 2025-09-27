import express from "express";
import { userAuthentication } from "../Middleware/User.middleware.js";
import {
  addToWishList,
  getWishList,
  removeWishList,
} from "../Controller/WishList.controller.js";

const router = express.Router();
router.post("/add", userAuthentication, addToWishList);
router.get("/", userAuthentication, getWishList);
router.delete("/remove", userAuthentication, removeWishList);
export default router;
