import "dotenv/config";
import serverless from "serverless-http";
import cartRouter from "../routes/Cart.routes.js";
import { createApp } from "./createApp.js";

const app = createApp({ basePath: "/api/v1/cart", router: cartRouter });

export const handler = serverless(app);
