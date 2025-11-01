const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("🔑 Incoming Authorization Header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("⚠️ No token provided in Authorization header");
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    // Extract and verify token
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token decoded:", decoded);

    const userId = decoded._id || decoded.id;
    if (!userId) {
      console.error("❌ Invalid token payload: no user ID found");
      return res.status(401).json({ error: "Invalid token payload." });
    }

    // Retrieve user
    const user = await User.findById(userId).select("_id fullName role");
    if (!user) {
      console.warn("❌ User not found for token ID:", userId);
      return res.status(404).json({ error: "User not found." });
    }

    // Attach user to request
    req.user = user;
    console.log(`🔓 Authenticated as: ${user.fullName} (${user.role})`);

    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err.message);
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

module.exports = authMiddleware;
