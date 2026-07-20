import express from "express";
import { upload } from "../Middleware/upload.middleware.js";
import {
  createProduct,
  getPopularProducts,
  getProductById,
  getProducts,
  updateProduct,
} from "../Controller/Product.controller.js";
import { userAuthentication } from "../Middleware/User.middleware.js";

const router = express.Router();

router.post(
  "/create",
  userAuthentication,
  upload.any(),
  createProduct
);
router.patch("/:id", userAuthentication, upload.any(), updateProduct);
router.get("/", getProducts);
router.get("/popular", getPopularProducts);
router.get("/:slug", getProductById);

export default router;
