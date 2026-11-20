import express from "express";
import { userAuthentication, requireAdmin } from "../Middleware/User.middleware.js";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesWithProducts,
  getCategory,
} from "../Controller/Category.controller.js";
import { upload } from "../Middleware/upload.middleware.js";

const router = express.Router();

router.post(
  "/create",
  userAuthentication,
  requireAdmin,
  upload.fields([{ name: "categoryImage", maxCount: 1 }]),
  createCategory
);

router.put(
  "/:id",
  userAuthentication,
  requireAdmin,
  upload.fields([{ name: "categoryImage", maxCount: 1 }]),
  updateCategory
);

router.delete("/:id", userAuthentication, requireAdmin, deleteCategory);

router.get("/",  getCategory);
router.get(
  "/categories-with-products",
  getCategoriesWithProducts
);

export default router;
