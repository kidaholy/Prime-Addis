import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

async function cleanupInventory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant-management")
    console.log("Connected to MongoDB")

    // Drop the inventory collection if it exists
    try {
      await mongoose.connection.db.dropCollection("inventories")
      console.log("✅ Dropped inventory collection")
    } catch (error: any) {
      if (error.code === 26) {
        console.log("ℹ️ Inventory collection doesn't exist (already clean)")
      } else {
        console.log("⚠️ Error dropping inventory collection:", error.message)
      }
    }

    // List all collections to verify
    const collections = await mongoose.connection.db.listCollections().toArray()
    console.log("\n📋 Remaining collections:")
    collections.forEach(col => {
      console.log(`   - ${col.name}`)
    })

    await mongoose.disconnect()
    console.log("\n👋 Disconnected from MongoDB")
    console.log("✅ Inventory cleanup completed!")
    
  } catch (error) {
    console.error("❌ Error cleaning up inventory:", error)
    process.exit(1)
  }
}

cleanupInventory()