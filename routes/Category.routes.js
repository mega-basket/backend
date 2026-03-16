import express from "express";
import { userAuthentication } from "../Middleware/User.middleware.js";
import {
  createCategory,
  getCategoriesWithProducts,
  getCategory,
} from "../Controller/Category.controller.js";
import { upload } from "../Middleware/upload.middleware.js";

const router = express.Router();

router.post(
  "/create",
  userAuthentication,
  upload.fields([{ name: "categoryImage", maxCount: 1 }]),
  createCategory
);

router.get("/",  getCategory);
router.get(
  "/categories-with-products",
  getCategoriesWithProducts
);

export default router;
