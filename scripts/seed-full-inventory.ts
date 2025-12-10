import mongoose from "mongoose"
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

const Inventory = mongoose.models.Inventory || mongoose.model("Inventory", inventorySchema)

async function seedFullInventory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant-management")
    console.log("Connected to MongoDB")

    // Clear existing inventory
    await Inventory.deleteMany({})
    console.log("Cleared existing inventory")

    // Create comprehensive inventory
    const inventory = await Inventory.insertMany([
      // Coffee & Beverages
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
      
      // Fresh Ingredients
      { name: "Avocado", quantity: 50, unit: "pieces", minStock: 10 },
      { name: "Papaya", quantity: 30, unit: "pieces", minStock: 8 },
      { name: "Strawberry", quantity: 20, unit: "kg", minStock: 5 },
      { name: "Watermelon", quantity: 40, unit: "kg", minStock: 10 },
      { name: "Ice", quantity: 200, unit: "kg", minStock: 50 },
      
      // Packaging & Supplies
      { name: "Cups (Small)", quantity: 500, unit: "pieces", minStock: 100 },
      { name: "Cups (Medium)", quantity: 500, unit: "pieces", minStock: 100 },
      { name: "Cups (Large)", quantity: 500, unit: "pieces", minStock: 100 },
      { name: "Lids", quantity: 600, unit: "pieces", minStock: 150 },
      { name: "Straws", quantity: 1000, unit: "pieces", minStock: 200 },
      { name: "Napkins", quantity: 2000, unit: "pieces", minStock: 500 },
      
      // Beverages
      { name: "Ambo Water", quantity: 100, unit: "bottles", minStock: 30 },
      { name: "Soft Drinks", quantity: 150, unit: "cans", minStock: 50 },
    ])
    
    console.log(`✅ Created ${inventory.length} inventory items`)
    
    await mongoose.disconnect()
    console.log("👋 Disconnected from MongoDB")
    
  } catch (error) {
    console.error("❌ Error seeding inventory:", error)
    process.exit(1)
  }
}

seedFullInventory()