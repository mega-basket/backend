import jwt from "jsonwebtoken";

export const userAuthentication = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // 🔥 ALLOW logout even if token expired
    if (req.originalUrl.includes("/logout")) {
      next();
    } else {
      return res.status(401).json({
        message: "Token is not valid",
        error: error.message,
      });
    }
  }
};

