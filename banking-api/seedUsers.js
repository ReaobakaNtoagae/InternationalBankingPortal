const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 🗑 Delete existing employees and customers
    await User.deleteMany({ role: { $in: ["employee", "customer"] } });
    console.log("🧹 Old employees and customers removed");

    // 🧠 Fresh Employees
    const newEmployees = [
      {
        fullName: "Ayanda Maseko",
        idNumber: "8705144809081",
        accountNumber: "7058923410071",
        password: "Password123",
        email: "ayanda@bank.com",
        role: "employee",
      },
      {
        fullName: "Kabelo Mokoena",
        idNumber: "9008215801023",
        accountNumber: "8149872301122",
        password: "Password123",
        email: "kabelo@bank.com",
        role: "employee",
      },
      {
        fullName: "Naledi Radebe",
        idNumber: "9301064805078",
        accountNumber: "6294513072227",
        password: "Password123",
        email: "naledi@bank.com",
        role: "employee",
      },
      {
        fullName: "Sipho Zuma",
        idNumber: "9509015809982",
        accountNumber: "9375628453219",
        password: "Password123",
        email: "sipho@bank.com",
        role: "employee",
      },
    ];

    // 👥 Customers
    const newCustomers = [
      {
        fullName: "Lebogang Motsepe",
        idNumber: "9603094808083",
        accountNumber: "6719234567802",
        password: "Password123",
        email: "lebogang@gmail.com",
        role: "customer",
      },
      {
        fullName: "Thandiwe Ngcobo",
        idNumber: "8407215802034",
        accountNumber: "5192837465203",
        password: "Password123",
        email: "thandiwe@gmail.com",
        role: "customer",
      },
      {
        fullName: "Mpho Khumalo",
        idNumber: "9106045809182",
        accountNumber: "7823649182036",
        password: "Password123",
        email: "mpho@gmail.com",
        role: "customer",
      },
      {
        fullName: "Sizwe Ndlela",
        idNumber: "8804234801029",
        accountNumber: "4318762598172",
        password: "Password123",
        email: "sizwe@gmail.com",
        role: "customer",
      },
      {
        fullName: "Precious Dube",
        idNumber: "9708125805031",
        accountNumber: "9021837465201",
        password: "Password123",
        email: "precious@gmail.com",
        role: "customer",
      },
    ];

    const allUsers = [...newEmployees, ...newCustomers];

    for (const userData of allUsers) {
      const newUser = new User(userData);
      await newUser.save();
      console.log(`✅ Created: ${newUser.fullName} (${newUser.role})`);
    }

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  } catch (err) {
    console.error("❌ Seeding error:", err.message);
  }
};

seedUsers();
