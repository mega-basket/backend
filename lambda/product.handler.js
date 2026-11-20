import "dotenv/config";
import serverless from "serverless-http";
import productRouter from "../routes/Product.routes.js";
import { createApp } from "./createApp.js";

const app = createApp({ basePath: "/api/v1/products", router: productRouter });

export const handler = serverless(app);
