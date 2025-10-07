import express from "express";
import { upload } from "../Middleware/upload.middleware.js";
import {
  createProduct,
  getPopularProducts,
  getProductById,
  getProducts,
} from "../Controller/Product.controller.js";
import { userAuthentication } from "../Middleware/User.middleware.js";

const router = express.Router();

router.post(
  "/create",
  userAuthentication,
  upload.fields([
    {
      name: "images",
      maxCount: 10,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  createProduct
);
router.get("/", userAuthentication, getProducts);
router.get("/popular", userAuthentication, getPopularProducts);
router.get("/:slug", userAuthentication, getProductById);

export default router;
