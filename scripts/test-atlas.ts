import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

async function testAtlas() {
  try {
    console.log("🔄 Testing MongoDB Atlas connection...")
    console.log("URI:", process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"))
    
    await mongoose.connect(process.env.MONGODB_URI || "", {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
    })
    
    console.log("✅ Successfully connected to MongoDB Atlas!")
    
    // Test a simple operation
    const db = mongoose.connection.db
    if (!db) {
      throw new Error("Database connection not established")
    }
    const collections = await db.listCollections().toArray()
    console.log(`📋 Found ${collections.length} collections:`)
    collections.forEach(col => console.log(`   - ${col.name}`))
    
    await mongoose.disconnect()
    console.log("👋 Disconnected from MongoDB Atlas")
    
  } catch (error: any) {
    console.error("❌ Atlas connection failed:")
    console.error("Error:", error.message)
    
    if (error.message.includes("ECONNREFUSED")) {
      console.log("\n🔧 Troubleshooting steps:")
      console.log("1. Check if your cluster is paused in Atlas dashboard")
      console.log("2. Whitelist your IP address in Network Access")
      console.log("3. Verify database user credentials")
      console.log("4. Check if cluster URL has changed")
    }
    
    process.exit(1)
  }
}

testAtlas()