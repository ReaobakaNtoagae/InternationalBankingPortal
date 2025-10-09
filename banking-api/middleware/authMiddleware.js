// authMiddleware.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // 🛡️ Protection: Reject if no Bearer token is provided
    // Helps prevent fake or malformed tokens from being used
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        // 🛡️ Protection: Verify JWT with secret key
        // Ensures token integrity and that it hasn’t been tampered with
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 🛡️ Protection: Token Expiry Check
        // Prevents stolen tokens from being used indefinitely
        if (Date.now() >= decoded.exp * 1000) {
            return res.status(401).json({ error: "Token expired" });
        }

        // 🛡️ Protection: User Lookup
        // We re-fetch user to ensure token matches a real, active account
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // 🛡️ Protection: Session Hijacking Prevention
        // Optionally check if user's token matches what’s stored in DB (if using stored sessions)
        // Example: if (user.sessionToken !== token) return res.status(401).json({ error: "Session invalid" });

        // 🛡️ Protection: Attach sanitized user object to request
        // Removes sensitive fields before continuing
        req.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        next();
    } catch (err) {
        console.error("Auth Error:", err.message);

        // 🛡️ Protection: Do not leak token validation info
        // Prevents attackers from learning if token is invalid or expired
        return res.status(401).json({ error: "Unauthorized request" });
    }
};

module.exports = authMiddleware;

