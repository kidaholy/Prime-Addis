import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

async function checkDatabase() {
  try {
    console.log("🔍 Checking database connection...")
    console.log("📍 MongoDB URI:", process.env.MONGODB_URI)

    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant-management")
    console.log("✅ Successfully connected to MongoDB")

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray()
    console.log("📚 Available collections:", collections.map(c => c.name))

    // Check if collections exist and have data
    const stats = await Promise.all([
      mongoose.connection.db.collection('orders').countDocuments(),
      mongoose.connection.db.collection('users').countDocuments(),
      mongoose.connection.db.collection('menuitems').countDocuments(),
    ])

    console.log("📊 Collection stats:")
    console.log("  - Orders:", stats[0])
    console.log("  - Users:", stats[1])
    console.log("  - Menu Items:", stats[2])

    await mongoose.disconnect()
    console.log("👋 Disconnected from MongoDB")

  } catch (error) {
    console.error("❌ Database check failed:", error)
    process.exit(1)
  }
}

checkDatabase()