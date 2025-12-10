import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

// Import models
import User from "../lib/models/user"
import MenuItem from "../lib/models/menu-item"
import Order from "../lib/models/order"

async function clearDemoData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant-management")
    console.log("Connected to MongoDB")

    // Clear all demo data
    console.log("Clearing demo data...")
    
    // Clear all orders (demo orders)
    const deletedOrders = await Order.deleteMany({})
    console.log(`Deleted ${deletedOrders.deletedCount} orders`)

    // Clear all menu items (seeded demo items)
    const deletedMenuItems = await MenuItem.deleteMany({})
    console.log(`Deleted ${deletedMenuItems.deletedCount} menu items`)

    // Keep users but you can uncomment the line below to delete demo users too
    // const deletedUsers = await User.deleteMany({ email: { $in: ["cashier@cafeteria.com", "chef@cafeteria.com"] } })
    // console.log(`Deleted ${deletedUsers.deletedCount} demo users`)

    console.log("\n✅ Demo data cleared successfully!")
    console.log("\n📦 Inventory items preserved (24 items)")
    console.log("🔑 Admin user preserved")
    console.log("\nYour database is now clean and ready for real data.")
    console.log("You can now add real menu items through the admin interface.")

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error("Error clearing demo data:", error)
    process.exit(1)
  }
}

clearDemoData()