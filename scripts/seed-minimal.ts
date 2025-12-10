import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"

dotenv.config()

// Import models
import User from "../lib/models/user"

async function seedMinimal() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant-management")
    console.log("Connected to MongoDB")

    // Clear existing users (optional)
    await User.deleteMany({})
    console.log("Cleared existing users")

    // Create only essential admin user
    const adminPassword = await bcrypt.hash("123456", 10)
    
    const admin = await User.create({
      name: "Kidus",
      email: "kidayos2014@gmail.com",
      password: adminPassword,
      role: "admin"
    })

    console.log("Created admin user")

    console.log("\n✅ Minimal database setup completed!")
    console.log("\nLogin credentials:")
    console.log("Admin: kidayos2014@gmail.com / 123456")
    console.log("\nYou can now:")
    console.log("1. Login as admin")
    console.log("2. Create menu items through the admin interface")
    console.log("3. Create additional users (cashiers, chefs) as needed")

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error("Error setting up minimal database:", error)
    process.exit(1)
  }
}

seedMinimal()