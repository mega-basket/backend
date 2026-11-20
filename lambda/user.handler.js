import "dotenv/config";
import serverless from "serverless-http";
import userRouter from "../routes/User.routes.js";
import { createApp } from "./createApp.js";

const app = createApp({ basePath: "/api/v1/users", router: userRouter });

export const handler = serverless(app);
