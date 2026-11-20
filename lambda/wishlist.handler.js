import "dotenv/config";
import serverless from "serverless-http";
import wishlistRouter from "../routes/WishList.routes.js";
import { createApp } from "./createApp.js";

const app = createApp({ basePath: "/api/v1/wishlist", router: wishlistRouter });

export const handler = serverless(app);
