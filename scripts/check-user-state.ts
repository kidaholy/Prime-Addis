import mongoose from "mongoose"
import dotenv from "dotenv"
import User from "../lib/models/user"

dotenv.config()

async function checkUserState() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant-management")
    console.log("Connected to MongoDB Atlas")

    // Get all users and show their current state
    const allUsers = await User.find({}).lean()
    console.log("\n📋 Current users in Atlas database:")
    console.log("=" .repeat(50))
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. User: ${user.name}`)
      console.log(`   ID: ${user._id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Active: ${user.isActive}`)
      console.log(`   Created: ${user.createdAt}`)
      console.log(`   Updated: ${user.updatedAt}`)
      console.log("-".repeat(30))
    })

    console.log(`\n📊 Total users: ${allUsers.length}`)
    
    // Show database connection info
    console.log(`\n🔗 Database: ${mongoose.connection.name}`)
    console.log(`🌐 Host: ${mongoose.connection.host}`)
    console.log(`📡 Ready state: ${mongoose.connection.readyState} (1 = connected)`)

    await mongoose.disconnect()
    console.log("\n👋 Disconnected from MongoDB Atlas")
    
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

checkUserState()