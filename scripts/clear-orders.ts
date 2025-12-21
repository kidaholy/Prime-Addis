import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

// Import the Order model
import Order from "../lib/models/order"

async function clearOrders() {
  try {
    console.log("🔍 Connecting to MongoDB Atlas...")
    const mongoUri = "mongodb+srv://kidayos2014:holyunion@cluster0.tcqv1p5.mongodb.net/restaurant-management"
    await mongoose.connect(mongoUri)
    console.log("✅ Connected to MongoDB Atlas")

    // Get count before deletion
    const orderCount = await Order.countDocuments()
    console.log(`📋 Found ${orderCount} orders in database`)

    if (orderCount === 0) {
      console.log("ℹ️  No orders to delete")
      await mongoose.disconnect()
      process.exit(0)
    }

    // Confirm deletion
    console.log("\n⚠️  WARNING: This will delete ALL orders from the database!")
    console.log("   This action cannot be undone.")
    
    // Delete all orders
    const result = await Order.deleteMany({})
    
    console.log(`\n✅ Successfully deleted ${result.deletedCount} orders`)
    console.log("🗑️  All order data has been cleared from the database")
    console.log("\n📊 Database is now clean and ready for new orders")

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error("❌ Error clearing orders:", error)
    process.exit(1)
  }
}

clearOrders()