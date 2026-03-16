import dotenv from "dotenv";
dotenv.config(); // ✅ MUST be first

import express from "express";
import cors from "cors";
import { dbConnetion } from "./db/dbConnection.js";

import userRouter from "./routes/User.routes.js";
import products from "./routes/Product.routes.js";
import category from "./routes/Category.routes.js";
import wishlist from "./routes/WishList.routes.js";
import cart from "./routes/Cart.routes.js";
import address from "./routes/Address.routes.js";
import order from "./routes/Order.routes.js";
import review from "./routes/Review.routes.js";

const app = express();
const port = process.env.PORT || 8080;

// Stripe webhook needs raw body BEFORE express.json() parses it
app.use("/api/v1/order/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello");
});

dbConnetion();

app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", products);
app.use("/api/v1/category", category);
app.use("/api/v1/wishlist", wishlist);
app.use("/api/v1/cart", cart);
app.use("/api/v1/address", address);
app.use("/api/v1/order", order);
app.use("/api/v1/review", review);

app.listen(port, () => {
  console.log("Server running on 🚀", port);
});
