import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"

dotenv.config()

// Inventory Schema
const inventorySchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  unit: String,
  minStock: Number,
  lastUpdated: { type: Date, default: Date.now },
})

// Import models
import User from "../lib/models/user"
const Inventory = mongoose.models.Inventory || mongoose.model("Inventory", inventorySchema)

async function seedMinimal() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant-management")
    console.log("Connected to MongoDB")

    // Clear existing users and inventory (optional)
    await User.deleteMany({})
    await Inventory.deleteMany({})
    console.log("Cleared existing users and inventory")

    // Create only essential admin user
    const adminPassword = await bcrypt.hash("123456", 10)
    
    const admin = await User.create({
      name: "Kidus",
      email: "kidayos2014@gmail.com",
      password: adminPassword,
      role: "admin"
    })

    console.log("Created admin user")

    // Create essential inventory items (24 items)
    const inventory = await Inventory.insertMany([
      { name: "Coffee Beans (Arabica)", quantity: 50, unit: "kg", minStock: 10 },
      { name: "Coffee Beans (Robusta)", quantity: 30, unit: "kg", minStock: 8 },
      { name: "Milk (Fresh)", quantity: 100, unit: "liters", minStock: 20 },
      { name: "Milk (Almond)", quantity: 20, unit: "liters", minStock: 5 },
      { name: "Sugar", quantity: 40, unit: "kg", minStock: 10 },
      { name: "Chocolate Powder", quantity: 15, unit: "kg", minStock: 5 },
      { name: "Vanilla Syrup", quantity: 10, unit: "liters", minStock: 3 },
      { name: "Caramel Syrup", quantity: 10, unit: "liters", minStock: 3 },
      { name: "Tea Leaves", quantity: 8, unit: "kg", minStock: 2 },
      { name: "Ginger", quantity: 5, unit: "kg", minStock: 1 },
      { name: "Mint Leaves", quantity: 3, unit: "kg", minStock: 1 },
      { name: "Avocado", quantity: 50, unit: "pieces", minStock: 10 },
      { name: "Papaya", quantity: 30, unit: "pieces", minStock: 8 },
      { name: "Strawberry", quantity: 20, unit: "kg", minStock: 5 },
      { name: "Watermelon", quantity: 40, unit: "kg", minStock: 10 },
      { name: "Ice", quantity: 200, unit: "kg", minStock: 50 },
      { name: "Cups (Small)", quantity: 500, unit: "pieces", minStock: 100 },
      { name: "Cups (Medium)", quantity: 500, unit: "pieces", minStock: 100 },
      { name: "Cups (Large)", quantity: 500, unit: "pieces", minStock: 100 },
      { name: "Lids", quantity: 600, unit: "pieces", minStock: 150 },
      { name: "Straws", quantity: 1000, unit: "pieces", minStock: 200 },
      { name: "Napkins", quantity: 2000, unit: "pieces", minStock: 500 },
      { name: "Ambo Water", quantity: 100, unit: "bottles", minStock: 30 },
      { name: "Soft Drinks", quantity: 150, unit: "cans", minStock: 50 },
    ])
    console.log(`Created ${inventory.length} inventory items`)

    console.log("\n✅ Minimal database setup completed!")
    console.log("\nLogin credentials:")
    console.log("Admin: kidayos2014@gmail.com / 123456")
    console.log("\n📦 Created 24 essential inventory items")
    console.log("\nYou can now:")
    console.log("1. Login as admin")
    console.log("2. Create real menu items through the admin interface")
    console.log("3. Create additional users (cashiers, chefs) as needed")
    console.log("4. Manage inventory through the admin panel")

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error("Error setting up minimal database:", error)
    process.exit(1)
  }
}

seedMinimal()