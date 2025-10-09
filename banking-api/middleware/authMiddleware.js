const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 🔐 Check for Bearer token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("⚠️ No token provided in Authorization header");
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // 🔍 Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      console.warn("⚠️ Token decoded but missing user ID");
      return res.status(401).json({ error: "Invalid token payload." });
    }

    // 🔎 Fetch user and attach to request
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      console.warn("⚠️ Token valid but user not found in DB");
      return res.status(404).json({ error: "User not found." });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("❌ Auth error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

module.exports = authMiddleware;
