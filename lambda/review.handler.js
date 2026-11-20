import "dotenv/config";
import serverless from "serverless-http";
import reviewRouter from "../routes/Review.routes.js";
import { createApp } from "./createApp.js";

const app = createApp({ basePath: "/api/v1/review", router: reviewRouter });

export const handler = serverless(app);
