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

    // Create Prime Addis Coffee authentic menu
    const menuItems = await MenuItem.insertMany([
      // Hot Coffee
      { name: "Siphon Coffee", category: "Hot Coffee", price: 50, description: "Premium siphon brewed coffee", preparationTime: 8 },
      { name: "Cappuccino", category: "Hot Coffee", price: 110, description: "Espresso with steamed milk and foam", preparationTime: 5 },
      { name: "Flat White", category: "Hot Coffee", price: 80, description: "Double shot espresso with microfoam", preparationTime: 4 },
      { name: "Café Latte", category: "Hot Coffee", price: 100, description: "Espresso with steamed milk", preparationTime: 5 },
      { name: "Espresso", category: "Hot Coffee", price: 50, description: "Rich and bold espresso shot", preparationTime: 3 },
      { name: "Double Macchiato", category: "Hot Coffee", price: 150, description: "Double espresso with foam", preparationTime: 4 },
      { name: "Macchiato", category: "Hot Coffee", price: 80, description: "Espresso with a dollop of foam", preparationTime: 4 },
      { name: "Fasting Macchiato", category: "Hot Coffee", price: 100, description: "Special macchiato for fasting", preparationTime: 4 },
      { name: "Espress", category: "Hot Coffee", price: 80, description: "Single espresso shot", preparationTime: 3 },

      // Tea & Infusions
      { name: "Tea", category: "Tea & Infusions", price: 40, description: "Traditional black tea", preparationTime: 5 },
      { name: "Flavored Tea", category: "Tea & Infusions", price: 45, description: "Assorted flavored teas", preparationTime: 5 },
      { name: "Ginger Tea", category: "Tea & Infusions", price: 50, description: "Spicy fresh ginger tea", preparationTime: 6 },
      { name: "Special Tea", category: "Tea & Infusions", price: 100, description: "Premium blend tea", preparationTime: 7 },
      { name: "Peanuts Tea", category: "Tea & Infusions", price: 80, description: "Tea with roasted peanuts", preparationTime: 6 },
      { name: "Iced Tea", category: "Tea & Infusions", price: 110, description: "Refreshing iced tea", preparationTime: 4 },
      { name: "Chai Latte (Hot or Iced)", category: "Tea & Infusions", price: 100, description: "Spiced tea latte", preparationTime: 6 },

      // Drinks
      { name: "Soft Drinks", category: "Drinks", price: 50, description: "Coca-Cola, Pepsi, Sprite", preparationTime: 1 },
      { name: "Ambo Water", category: "Drinks", price: 50, description: "Ethiopian mineral water", preparationTime: 1 },
      { name: "½ Water", category: "Drinks", price: 30, description: "Half liter water bottle", preparationTime: 1 },
      { name: "1 Ltr Water", category: "Drinks", price: 40, description: "One liter water bottle", preparationTime: 1 },

      // Juice
      { name: "Avocado", category: "Juice", price: 180, description: "Fresh avocado juice", preparationTime: 6 },
      { name: "Papaya", category: "Juice", price: 180, description: "Sweet papaya juice", preparationTime: 5 },
      { name: "Strawberry", category: "Juice", price: 220, description: "Fresh strawberry juice", preparationTime: 5 },
      { name: "Watermelon", category: "Juice", price: 180, description: "Refreshing watermelon juice", preparationTime: 4 },
      { name: "Mixed", category: "Juice", price: 250, description: "Mixed fruit juice", preparationTime: 7 },
      { name: "Prime Shake", category: "Juice", price: 300, description: "Special Prime Addis shake", preparationTime: 8 },

      // Iced & Cold Coffee
      { name: "Iced Americano", category: "Iced & Cold Coffee", price: 180, description: "Chilled americano", preparationTime: 4 },
      { name: "Iced Latte", category: "Iced & Cold Coffee", price: 200, description: "Iced coffee with milk", preparationTime: 5 },
      { name: "Caramel / Vanilla Frappé", category: "Iced & Cold Coffee", price: 250, description: "Blended frappé with flavor", preparationTime: 7 },
      { name: "Cold Brew", category: "Iced & Cold Coffee", price: 150, description: "Smooth cold brew coffee", preparationTime: 2 },
      { name: "Chocolate Iced Latte", category: "Iced & Cold Coffee", price: 250, description: "Iced latte with chocolate", preparationTime: 6 },

      // Hot Specialties
      { name: "Hot Chocolate", category: "Hot Specialties", price: 180, description: "Rich hot chocolate", preparationTime: 6 },
      { name: "Steamed Milk", category: "Hot Specialties", price: 120, description: "Warm steamed milk", preparationTime: 4 },

      // Mojito
      { name: "Mixed Mojito", category: "Mojito", price: 250, description: "Mixed fruit mojito", preparationTime: 8 },
      { name: "Strawberry Mojito", category: "Mojito", price: 220, description: "Fresh strawberry mojito", preparationTime: 8 },
      { name: "Mint Mojito", category: "Mojito", price: 200, description: "Classic mint mojito", preparationTime: 7 },

      // Breakfast
      { name: "Spinach Cheese Omelet", category: "Breakfast", price: 250, description: "Omelet with spinach and cheese", preparationTime: 12 },
      { name: "Vegetable Scramble Egg", category: "Breakfast", price: 200, description: "Scrambled eggs with vegetables", preparationTime: 10 },
      { name: "Special Fetira Egg & Sausage Roll", category: "Breakfast", price: 300, description: "Ethiopian bread with egg and sausage", preparationTime: 15 },
      { name: "Normal Fetira with Honey", category: "Breakfast", price: 180, description: "Traditional bread with honey", preparationTime: 8 },
      { name: "Special Chechebsa", category: "Breakfast", price: 250, description: "Special Ethiopian breakfast bread", preparationTime: 12 },
      { name: "Foull Madam", category: "Breakfast", price: 200, description: "Fava beans dish", preparationTime: 15 },
      { name: "Special Foull Madam", category: "Breakfast", price: 250, description: "Special fava beans with extras", preparationTime: 18 },

      // Salad
      { name: "Garden Mixed Salad", category: "Salad", price: 350, description: "Fresh mixed garden salad", preparationTime: 8 },
      { name: "Chicken Salad", category: "Salad", price: 450, description: "Salad with grilled chicken", preparationTime: 12 },
      { name: "House of Special Salad", category: "Salad", price: 490, description: "Prime Addis special salad", preparationTime: 15 },

      // Burrito
      { name: "Chicken Burrito", category: "Burrito", price: 550, description: "Grilled chicken burrito", preparationTime: 15 },
      { name: "Beef Burrito", category: "Burrito", price: 500, description: "Seasoned beef burrito", preparationTime: 16 },
      { name: "Fasting Burrito", category: "Burrito", price: 390, description: "Vegetarian burrito for fasting", preparationTime: 12 },

      // Burgers
      { name: "Spicy Classic Beef Burger", category: "Burgers", price: 450, description: "Spicy beef burger", preparationTime: 15 },
      { name: "Classic Cheese Burger", category: "Burgers", price: 400, description: "Classic burger with cheese", preparationTime: 14 },
      { name: "Prime Addis Cheese Burger", category: "Burgers", price: 600, description: "Special Prime Addis burger", preparationTime: 18 },
      { name: "Chicken Burger", category: "Burgers", price: 550, description: "Grilled chicken burger", preparationTime: 14 },
      { name: "Special Burger", category: "Burgers", price: 550, description: "House special burger", preparationTime: 16 },
      { name: "French Fries", category: "Burgers", price: 150, description: "Crispy french fries", preparationTime: 8 },

      // Wraps
      { name: "Chicken Wrap", category: "Wraps", price: 450, description: "Grilled chicken wrap", preparationTime: 10 },
      { name: "Beef Wrap", category: "Wraps", price: 400, description: "Seasoned beef wrap", preparationTime: 10 },
      { name: "Tuna Wrap", category: "Wraps", price: 400, description: "Tuna salad wrap", preparationTime: 9 },
      { name: "Vegetable Wrap", category: "Wraps", price: 300, description: "Fresh vegetable wrap", preparationTime: 8 },
      { name: "Falafel Wrap", category: "Wraps", price: 300, description: "Falafel with vegetables", preparationTime: 10 },

      // Sandwich
      { name: "Chicken Sandwich", category: "Sandwich", price: 450, description: "Grilled chicken sandwich", preparationTime: 12 },
      { name: "Club Sandwich", category: "Sandwich", price: 500, description: "Triple-decker club sandwich", preparationTime: 15 },
      { name: "Vegetables Sandwich", category: "Sandwich", price: 300, description: "Fresh vegetable sandwich", preparationTime: 8 },
      { name: "Tuna Melt Sandwich", category: "Sandwich", price: 450, description: "Tuna melt with cheese", preparationTime: 12 },
      { name: "Potato Sandwich (Special Erteb)", category: "Sandwich", price: 250, description: "Special potato sandwich", preparationTime: 10 },
      { name: "Avocado Sandwich", category: "Sandwich", price: 250, description: "Fresh avocado sandwich", preparationTime: 8 },

      // Pasta (Spaghetti, Penne, Rice, Tagliatelle)
      { name: "Bolognaise Sauce", category: "Pasta", price: 350, description: "Pasta with meat sauce", preparationTime: 20 },
      { name: "Tuna Sauce", category: "Pasta", price: 350, description: "Pasta with tuna sauce", preparationTime: 18 },
      { name: "Primavera Sauce", category: "Pasta", price: 250, description: "Pasta with vegetable sauce", preparationTime: 16 },
      { name: "Pesto Sauce", category: "Pasta", price: 300, description: "Pasta with pesto sauce", preparationTime: 18 },

      // Chicken
      { name: "BBQ Chicken Wing", category: "Chicken", price: 500, description: "Barbecue chicken wings", preparationTime: 20 },
      { name: "Chicken Nugget", category: "Chicken", price: 400, description: "Crispy chicken nuggets", preparationTime: 15 },
      { name: "Loaded Chicken Chili Fries", category: "Chicken", price: 550, description: "Fries with chicken and chili", preparationTime: 18 },
      { name: "Chicken Shawarma", category: "Chicken", price: 490, description: "Middle Eastern chicken wrap", preparationTime: 15 },

      // Ethiopian Taste
      { name: "Chekena Tibs", category: "Ethiopian Taste", price: 500, description: "Ethiopian sautéed meat", preparationTime: 25 },
      { name: "Tibs Firfir", category: "Ethiopian Taste", price: 400, description: "Ethiopian meat with injera", preparationTime: 20 },
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