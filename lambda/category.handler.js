import "dotenv/config";
import serverless from "serverless-http";
import categoryRouter from "../routes/Category.routes.js";
import { createApp } from "./createApp.js";

const app = createApp({ basePath: "/api/v1/category", router: categoryRouter });

export const handler = serverless(app);
