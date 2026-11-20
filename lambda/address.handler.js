import "dotenv/config";
import serverless from "serverless-http";
import addressRouter from "../routes/Address.routes.js";
import { createApp } from "./createApp.js";

const app = createApp({ basePath: "/api/v1/address", router: addressRouter });

export const handler = serverless(app);
