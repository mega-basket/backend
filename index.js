import express from "express";
import dotenv from "dotenv";
import { dbConnetion } from "./db/dbConnection.js";
import cors from "cors";

import userRouter from "./routes/User.routes.js";
import products from "./routes/Product.routes.js";
import category from "./routes/Category.routes.js";

const port = process.env.PORT || 8080;
const app = express();
dotenv.config();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello");
});

dbConnetion();

app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", products);
app.use("/api/v1/category", category);
app.listen(port, () => {
  console.log("MongoDb Connection on 🚀 ", port);
});
