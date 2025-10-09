const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

// 🔍 Log every request
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use(helmet());

// ✅ Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);

// 🧯 Handle unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// ✅ MongoDB Connection
if (!process.env.MONGO_URI) {
  throw new Error("❌ Missing MONGO_URI in .env file");
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ✅ Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.disconnect();
  console.log("🛑 MongoDB disconnected");
  process.exit(0);
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Uncaught error:", err.stack);
  res.status(500).json({ error: "Internal server error." });
});
