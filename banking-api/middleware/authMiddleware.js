// authMiddleware.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    console.log("🔑 Incoming Authorization Header:", req.headers.authorization);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("⚠️ No token provided in Authorization header");
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

    const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password"); 
    if (!req.user) {
      return res.status(404).json({ error: "User not found" });
    }
    next();
  } catch (err) {
    console.error("Auth Error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = authMiddleware;

