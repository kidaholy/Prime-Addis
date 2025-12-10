import mongoose from "mongoose"
import dotenv from "dotenv"
import User from "../lib/models/user"

dotenv.config()

async function migrateUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant-management")
    console.log("Connected to MongoDB Atlas")

    // Update all users to have isActive field if missing
    const result = await User.updateMany(
      { isActive: { $exists: false } },
      { $set: { isActive: true } }
    )

    console.log(`✅ Updated ${result.modifiedCount} users with isActive field`)

    // Show updated users
    const allUsers = await User.find({}).lean()
    console.log("\n📋 Updated users in Atlas database:")
    console.log("=" .repeat(50))
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. User: ${user.name}`)
      console.log(`   ID: ${user._id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Active: ${user.isActive}`)
      console.log("-".repeat(30))
    })

    await mongoose.disconnect()
    console.log("\n👋 Disconnected from MongoDB Atlas")
    
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

migrateUsers()