import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "../db/dbConnection.js";

const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
};

// Builds a minimal Express app for a single Lambda function: shared
// middleware + one domain router, mounted at the same path the frontend
// already calls (e.g. /api/v1/products) so no client changes are needed.
export function createApp({ basePath, router, rawPath }) {
  const app = express();

  // Stripe webhook needs the raw body BEFORE express.json() parses it.
  if (rawPath) {
    app.use(rawPath, express.raw({ type: "application/json" }));
  }

  app.use(express.json());
  app.use(cors(corsOptions));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(async (req, res, next) => {
    try {
      await connectDB();
      next();
    } catch (err) {
      res.status(500).json({ message: "Database connection failed" });
    }
  });

  app.use(basePath, router);

  return app;
}
