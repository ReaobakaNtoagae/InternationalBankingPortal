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


app.use(express.json());
app.use(cors());
app.use(morgan('dev'));


// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);


// ✅ MongoDB Connection
if (!process.env.MONGO_URI) {
  throw new Error('❌ Missing MONGO_URI in .env file');
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.disconnect();
  console.log('🛑 MongoDB disconnected');
  process.exit(0);
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});