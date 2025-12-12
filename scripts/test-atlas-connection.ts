import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

async function testAtlasConnection() {
  try {
    console.log("🔍 Testing MongoDB Atlas connection...")
    
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      throw new Error("MONGODB_URI not found in environment variables")
    }

    console.log("📍 Connecting to:", mongoUri.replace(/\/\/.*:.*@/, "//***:***@"))

    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })

    console.log("✅ Successfully connected to MongoDB Atlas!")

    // Test database operations
    const db = mongoose.connection.db
    if (!db) {
      throw new Error("Database connection not established")
    }
    const collections = await db.listCollections().toArray()
    console.log("📚 Available collections:", collections.map(c => c.name))

    // Test a simple query
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
    console.log("👋 Disconnected from MongoDB Atlas")

  } catch (error) {
    console.error("❌ Atlas connection failed:", error)
    
    if (error instanceof Error) {
      if (error.message.includes('authentication failed')) {
        console.log("\n🔑 Authentication Error Solutions:")
        console.log("1. Check your username and password")
        console.log("2. Make sure you replaced <db_password> with actual password")
        console.log("3. Verify the user exists in MongoDB Atlas Database Access")
      } else if (error.message.includes('ENOTFOUND')) {
        console.log("\n🌐 Network Error Solutions:")
        console.log("1. Check your internet connection")
        console.log("2. Verify the cluster hostname is correct")
        console.log("3. Check MongoDB Atlas Network Access whitelist")
      }
    }
    
    process.exit(1)
  }
}

testAtlasConnection()