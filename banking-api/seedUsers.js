const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");


    await User.deleteMany({ role: "employee" });
    console.log("🧹 Old employees removed");

    
    const newEmployees = [
      {
        fullName: "Nomvula Khumalo",
        idNumber: "9203054809081",
        accountNumber: "7058391620471",
        password: "Password123",
        email: "nomvula@bank.com",
        role: "employee",
      },
      {
        fullName: "Themba Dlamini",
        idNumber: "8806215809082",
        accountNumber: "8149623705482",
        password: "Password123",
        email: "themba@bank.com",
        role: "employee",
      },
      {
        fullName: "Sibongile Mthethwa",
        idNumber: "9009145809083",
        accountNumber: "6294713085627",
        password: "Password123",
        email: "sibongile@bank.com",
        role: "employee",
      },
      {
        fullName: "Lwazi Ncube",
        idNumber: "9502135809084",
        accountNumber: "9371628453019",
        password: "Password123",
        email: "lwazi@bank.com",
        role: "employee",
      },
      
      {
        fullName: "Zinhle Mokoena",
        idNumber: "9107295809085",
        accountNumber: "8613942057806",
        password: "Password123",
        email: "zinhle@bank.com",
        role: "employee",
      },
      {
        fullName: "Thulani Mthembu",
        idNumber: "8905045809086",
        accountNumber: "7205184962037",
        password: "Password123",
        email: "thulani@bank.com",
        role: "employee",
      },

      {
        fullName: "Sibusiso Dlamini",
        idNumber: "9007215482093",
        accountNumber: "7109834501274",
        password: "Secure#459",
        email: "sibusiso.dlamini@example.com",
        role: "customer",
      },

      {
        fullName: "Anele Mokoena",
        idNumber: "9702147856031",
        accountNumber: "6805421973308",
        password: "Client*2024",
        email: "anele.mokoena@example.com",
        role: "customer",
      },

      {
        fullName: "Boitumelo Molefe",
        idNumber: "8809103746025",
        accountNumber: "7301198456021",
        password: "Pass@9988",
        email: "boitumelo.molefe@example.com",
        role: "customer",
      },
      {
        fullName: "Karabo Selemela",
        idNumber: "0204056432081",
        accountNumber: "7802654920134",
        password: "Karabo!2025",
        email: "karabo.selemela@example.com",
        role: "customer",
      },
    ];

    for (const userData of newEmployees) {
      const newUser = new User(userData);
      await newUser.save();
      console.log(`✅ Created: ${newUser.fullName} (${newUser.accountNumber})`);
    }

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  } catch (err) {
    console.error("❌ Seeding error:", err.message);
  }
};

seedUsers();
