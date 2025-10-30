const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const users = [
      {
        fullName: "Thabo Mokoena",
        idNumber: "1234567890123",
        accountNumber: "100000000001",
        password: "Password123",
        email: "thabo@bank.com",
        role: "employee",
      },
      {
        fullName: "Lerato Dlamini",
        idNumber: "1234567890124",
        accountNumber: "100000000002",
        password: "Password123",
        email: "lerato@bank.com",
        role: "employee",
      },
      {
        fullName: "Itumeleng Ndlovu",
        idNumber: "1234567890125",
        accountNumber: "200000000001",
        password: "Password123",
        email: "itu@bank.com",
        role: "customer",
      },
      {
        fullName: "Ndelisiwe Khumalo",
        idNumber: "1234567890126",
        accountNumber: "200000000002",
        password: "Password123",
        email: "ndeldi@bank.com",
        role: "customer",
      },
    ];

    for (const user of users) {
      const exists = await User.findOne({ accountNumber: user.accountNumber });
      if (exists) {
        console.log(`⚠️ Already exists: ${user.fullName}`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(user.password, 10);
      const newUser = new User({
        fullName: user.fullName,
        idNumber: user.idNumber,
        accountNumber: user.accountNumber,
        password: hashedPassword,
        email: user.email,
        role: user.role,
      });

      await newUser.save();
      console.log(`✅ Created: ${user.fullName} (${user.role})`);
    }

    mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  } catch (err) {
    console.error("❌ Seeding error:", err.message);
  }
};

seedUsers();
