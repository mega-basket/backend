import "dotenv/config";
import serverless from "serverless-http";
import orderRouter from "../routes/Order.routes.js";
import { createApp } from "./createApp.js";

// Stripe's webhook signature check needs the untouched raw body, so this
// route is excluded from express.json() parsing (see createApp.js).
const app = createApp({
  basePath: "/api/v1/order",
  router: orderRouter,
  rawPath: "/api/v1/order/webhook",
});

export const handler = serverless(app);
