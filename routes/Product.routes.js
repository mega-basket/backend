import express from "express";
import { upload } from "../Middleware/upload.middleware.js";
import {
  createProduct,
  deleteProduct,
  getPopularProducts,
  getProductById,
  getProductForAdmin,
  getProducts,
  updateProduct,
} from "../Controller/Product.controller.js";
import {
  userAuthentication,
  requireAdmin,
  optionalAuthentication,
} from "../Middleware/User.middleware.js";

const router = express.Router();

router.post(
  "/create",
  userAuthentication,
  requireAdmin,
  upload.any(),
  createProduct
);
router.patch("/:id", userAuthentication, requireAdmin, upload.any(), updateProduct);
router.delete("/:id", userAuthentication, requireAdmin, deleteProduct);
router.get("/", optionalAuthentication, getProducts);
router.get("/popular", getPopularProducts);
router.get("/admin/:id", userAuthentication, requireAdmin, getProductForAdmin);
router.get("/:slug", getProductById);

export default router;
