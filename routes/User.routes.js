import express from "express";
import {
  getUser,
  login,
  profile,
  register,
} from "../Controller/User.controller.js";
import { userAuthentication } from "../Middleware/User.middleware.js";
const router = express.Router();

router.post("/create", register);
router.get("/", getUser);
router.post("/login", login);
router.get("/:id", userAuthentication, profile);

export default router;
