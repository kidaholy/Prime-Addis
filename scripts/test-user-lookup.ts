import mongoose from "mongoose"
import dotenv from "dotenv"
import User from "../lib/models/user"

dotenv.config()

async function testUserLookup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant-management")
    console.log("Connected to MongoDB")

    // Get all users
    const allUsers = await User.find({}).lean()
    console.log("📋 All users in database:")
    allUsers.forEach(user => {
      console.log(`   ID: ${user._id} (${user._id.toString().length} chars)`)
      console.log(`   Name: ${user.name}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Role: ${user.role}`)
      console.log("   ---")
    })

    // Test finding by ID
    if (allUsers.length > 0) {
      const firstUser = allUsers[0]
      console.log(`🔍 Testing lookup for user: ${firstUser._id}`)
      
      const foundUser = await User.findById(firstUser._id)
      console.log("✅ Lookup result:", foundUser ? "Found" : "Not found")
      
      if (foundUser) {
        console.log("   Found user:", foundUser.name, foundUser.email)
      }
    }

    await mongoose.disconnect()
    console.log("👋 Disconnected from MongoDB")
    
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

testUserLookup()