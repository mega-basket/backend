import express from "express";
import {
  editUser,
  getUser,
  login,
  logout,
  profile,
  refreshToken,
  register,
} from "../Controller/User.controller.js";
import { userAuthentication } from "../Middleware/User.middleware.js";
const router = express.Router();

router.post("/create", register);
router.post("/login", login);
router.post('/refresh', refreshToken)
router.post("/logout", userAuthentication, logout);

router.get("/:id", userAuthentication, profile);
router.put("/edit/:id", userAuthentication, editUser);

router.get("/", userAuthentication, getUser);

export default router;
