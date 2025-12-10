import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

// Menu Item Schema
const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  description: String,
  image: String,
  preparationTime: { type: Number, default: 10 },
  available: { type: Boolean, default: true },
}, { timestamps: true })

const MenuItem = mongoose.models.MenuItem || mongoose.model("MenuItem", menuItemSchema)

async function seedMenuOnly() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant-management")
    console.log("Connected to MongoDB")

    // Clear existing menu items
    await MenuItem.deleteMany({})
    console.log("Cleared existing menu items")

    // Create comprehensive menu
    const menuItems = await MenuItem.insertMany([
      // Hot Coffee
      { name: "Espresso", category: "Hot Coffee", price: 25, description: "Rich and bold espresso shot", preparationTime: 3 },
      { name: "Americano", category: "Hot Coffee", price: 30, description: "Espresso with hot water", preparationTime: 4 },
      { name: "Cappuccino", category: "Hot Coffee", price: 35, description: "Espresso with steamed milk and foam", preparationTime: 5 },
      { name: "Latte", category: "Hot Coffee", price: 40, description: "Espresso with steamed milk", preparationTime: 5 },
      { name: "Macchiato", category: "Hot Coffee", price: 38, description: "Espresso with a dollop of foam", preparationTime: 4 },
      { name: "Mocha", category: "Hot Coffee", price: 45, description: "Espresso with chocolate and steamed milk", preparationTime: 6 },

      // Iced & Cold Coffee
      { name: "Iced Americano", category: "Iced & Cold Coffee", price: 32, description: "Chilled espresso with cold water", preparationTime: 4 },
      { name: "Iced Latte", category: "Iced & Cold Coffee", price: 42, description: "Espresso with cold milk over ice", preparationTime: 5 },
      { name: "Cold Brew", category: "Iced & Cold Coffee", price: 38, description: "Smooth cold-brewed coffee", preparationTime: 2 },
      { name: "Frappuccino", category: "Iced & Cold Coffee", price: 50, description: "Blended coffee with ice and cream", preparationTime: 7 },
      { name: "Affogato", category: "Iced & Cold Coffee", price: 55, description: "Espresso poured over vanilla ice cream", preparationTime: 5 },

      // Tea & Infusions
      { name: "Ethiopian Tea", category: "Tea & Infusions", price: 20, description: "Traditional Ethiopian black tea", preparationTime: 5 },
      { name: "Green Tea", category: "Tea & Infusions", price: 22, description: "Fresh green tea leaves", preparationTime: 4 },
      { name: "Chamomile Tea", category: "Tea & Infusions", price: 25, description: "Calming herbal tea", preparationTime: 5 },
      { name: "Ginger Tea", category: "Tea & Infusions", price: 28, description: "Spicy fresh ginger tea", preparationTime: 6 },
      { name: "Mint Tea", category: "Tea & Infusions", price: 24, description: "Refreshing mint leaves tea", preparationTime: 5 },

      // Hot Specialties
      { name: "Hot Chocolate", category: "Hot Specialties", price: 35, description: "Rich chocolate drink with whipped cream", preparationTime: 6 },
      { name: "Chai Latte", category: "Hot Specialties", price: 38, description: "Spiced tea with steamed milk", preparationTime: 6 },
      { name: "Golden Milk", category: "Hot Specialties", price: 40, description: "Turmeric latte with spices", preparationTime: 7 },

      // Drinks
      { name: "Ambo Water", category: "Drinks", price: 15, description: "Ethiopian mineral water", preparationTime: 1 },
      { name: "Soft Drinks", category: "Drinks", price: 20, description: "Coca-Cola, Pepsi, Sprite", preparationTime: 1 },
      { name: "Sparkling Water", category: "Drinks", price: 18, description: "Refreshing sparkling water", preparationTime: 1 },

      // Juice
      { name: "Fresh Orange Juice", category: "Juice", price: 35, description: "Freshly squeezed orange juice", preparationTime: 5 },
      { name: "Avocado Juice", category: "Juice", price: 40, description: "Creamy avocado smoothie", preparationTime: 6 },
      { name: "Papaya Juice", category: "Juice", price: 38, description: "Sweet papaya juice", preparationTime: 5 },
      { name: "Watermelon Juice", category: "Juice", price: 32, description: "Refreshing watermelon juice", preparationTime: 4 },
      { name: "Mixed Fruit Juice", category: "Juice", price: 45, description: "Blend of seasonal fruits", preparationTime: 7 },

      // Mojito
      { name: "Classic Mojito", category: "Mojito", price: 50, description: "Mint, lime, and sparkling water", preparationTime: 8 },
      { name: "Strawberry Mojito", category: "Mojito", price: 55, description: "Fresh strawberries with mint and lime", preparationTime: 9 },
      { name: "Watermelon Mojito", category: "Mojito", price: 52, description: "Watermelon with mint and lime", preparationTime: 8 },

      // Breakfast
      { name: "Ethiopian Breakfast", category: "Breakfast", price: 120, description: "Traditional Ethiopian breakfast platter", preparationTime: 15 },
      { name: "Continental Breakfast", category: "Breakfast", price: 85, description: "Bread, eggs, and coffee", preparationTime: 12 },
      { name: "Pancakes", category: "Breakfast", price: 65, description: "Fluffy pancakes with syrup", preparationTime: 10 },
      { name: "French Toast", category: "Breakfast", price: 70, description: "Golden French toast with fruit", preparationTime: 12 },

      // Salad
      { name: "Caesar Salad", category: "Salad", price: 75, description: "Romaine lettuce with Caesar dressing", preparationTime: 8 },
      { name: "Greek Salad", category: "Salad", price: 80, description: "Fresh vegetables with feta cheese", preparationTime: 10 },
      { name: "Garden Salad", category: "Salad", price: 65, description: "Mixed greens with vegetables", preparationTime: 7 },

      // Burrito
      { name: "Chicken Burrito", category: "Burrito", price: 95, description: "Grilled chicken with rice and beans", preparationTime: 15 },
      { name: "Beef Burrito", category: "Burrito", price: 105, description: "Seasoned beef with vegetables", preparationTime: 16 },
      { name: "Veggie Burrito", category: "Burrito", price: 85, description: "Fresh vegetables and beans", preparationTime: 12 },

      // Burgers
      { name: "Classic Burger", category: "Burgers", price: 90, description: "Beef patty with lettuce and tomato", preparationTime: 15 },
      { name: "Cheese Burger", category: "Burgers", price: 100, description: "Beef patty with cheese", preparationTime: 16 },
      { name: "Chicken Burger", category: "Burgers", price: 85, description: "Grilled chicken breast", preparationTime: 14 },

      // Wraps
      { name: "Chicken Wrap", category: "Wraps", price: 75, description: "Grilled chicken in tortilla", preparationTime: 10 },
      { name: "Veggie Wrap", category: "Wraps", price: 65, description: "Fresh vegetables in tortilla", preparationTime: 8 },
      { name: "Tuna Wrap", category: "Wraps", price: 70, description: "Tuna salad in tortilla", preparationTime: 9 },

      // Sandwich
      { name: "Club Sandwich", category: "Sandwich", price: 80, description: "Triple-decker with chicken and bacon", preparationTime: 12 },
      { name: "Grilled Cheese", category: "Sandwich", price: 55, description: "Melted cheese on grilled bread", preparationTime: 8 },
      { name: "BLT Sandwich", category: "Sandwich", price: 70, description: "Bacon, lettuce, and tomato", preparationTime: 10 },

      // Pasta
      { name: "Spaghetti Bolognese", category: "Pasta", price: 110, description: "Pasta with meat sauce", preparationTime: 20 },
      { name: "Carbonara", category: "Pasta", price: 105, description: "Creamy pasta with bacon", preparationTime: 18 },
      { name: "Penne Arrabbiata", category: "Pasta", price: 95, description: "Spicy tomato pasta", preparationTime: 16 },

      // Chicken
      { name: "Grilled Chicken", category: "Chicken", price: 130, description: "Seasoned grilled chicken breast", preparationTime: 25 },
      { name: "Chicken Curry", category: "Chicken", price: 125, description: "Spicy chicken curry with rice", preparationTime: 30 },
      { name: "BBQ Chicken", category: "Chicken", price: 135, description: "Barbecue glazed chicken", preparationTime: 28 },

      // Ethiopian Taste
      { name: "Doro Wot", category: "Ethiopian Taste", price: 150, description: "Traditional chicken stew with injera", preparationTime: 35 },
      { name: "Kitfo", category: "Ethiopian Taste", price: 140, description: "Ethiopian steak tartare", preparationTime: 15 },
      { name: "Veggie Combo", category: "Ethiopian Taste", price: 120, description: "Assorted vegetarian dishes with injera", preparationTime: 25 },
      { name: "Tibs", category: "Ethiopian Taste", price: 135, description: "Sautéed meat with vegetables", preparationTime: 20 },
    ])
    
    console.log(`✅ Created ${menuItems.length} menu items`)
    
    // Show category breakdown
    const categories = [...new Set(menuItems.map(item => item.category))]
    console.log(`📋 Categories: ${categories.length}`)
    categories.forEach(cat => {
      const count = menuItems.filter(item => item.category === cat).length
      console.log(`   ${cat}: ${count} items`)
    })
    
    await mongoose.disconnect()
    console.log("👋 Disconnected from MongoDB")
    
  } catch (error) {
    console.error("❌ Error seeding menu:", error)
    process.exit(1)
  }
}

seedMenuOnly()