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

// Run after userAuthentication — rejects anyone whose JWT role isn't "admin".
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// For public routes that behave differently when the caller happens to be
// logged in (e.g. admins see draft products in listings) — attaches
// req.user if a valid token is present, but never blocks the request.
export const optionalAuthentication = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) return next();

  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    // invalid/expired token on a public route — just proceed as a guest
  }
  next();
};

