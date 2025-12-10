import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"

dotenv.config()

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["admin", "cashier", "chef"] },
})

// Menu Item Schema
const menuItemSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  available: { type: Boolean, default: true },
  ingredients: [String],
})

// Inventory Schema
const inventorySchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  unit: String,
  minStock: Number,
  lastUpdated: { type: Date, default: Date.now },
})

const User = mongoose.models.User || mongoose.model("User", userSchema)
const MenuItem = mongoose.models.MenuItem || mongoose.model("MenuItem", menuItemSchema)
const Inventory = mongoose.models.Inventory || mongoose.model("Inventory", inventorySchema)

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant-management")
    console.log("Connected to MongoDB")

    // Clear existing data
    await User.deleteMany({})
    await MenuItem.deleteMany({})
    await Inventory.deleteMany({})
    console.log("Cleared existing data")

    // Create users
    const adminPassword = await bcrypt.hash("123456", 10)
    const defaultPassword = await bcrypt.hash("password", 10)
    const users = await User.insertMany([
      { name: "Kidus", email: "kidayos2014@gmail.com", password: adminPassword, role: "admin" },
      { name: "Cashier User", email: "cashier@cafeteria.com", password: defaultPassword, role: "cashier" },
      { name: "Chef User", email: "chef@cafeteria.com", password: defaultPassword, role: "chef" },
    ])
    console.log(`Created ${users.length} users`)

    // Create menu items - Prime Addis Coffee Complete Menu
    const menuItems = await MenuItem.insertMany([
      // Hot Coffee
      { name: "Siphon Coffee", category: "Hot Coffee", price: 50, available: true, image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400" },
      { name: "Espresso", category: "Hot Coffee", price: 50, available: true, image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400" },
      { name: "Macchiato", category: "Hot Coffee", price: 80, available: true, image: "https://images.unsplash.com/photo-1557006021-b85faa2bc5e2?w=400" },
      { name: "Double Macchiato", category: "Hot Coffee", price: 150, available: true, image: "https://images.unsplash.com/photo-1557006021-b85faa2bc5e2?w=400" },
      { name: "Cappuccino", category: "Hot Coffee", price: 110, available: true, image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400" },
      { name: "Café Latte", category: "Hot Coffee", price: 100, available: true, image: "https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400" },
      { name: "Flat White", category: "Hot Coffee", price: 80, available: true, image: "https://images.unsplash.com/photo-1545665225-b23b99e4d45e?w=400" },
      { name: "Fasting Macchiato", category: "Hot Coffee", price: 100, available: true, image: "https://images.unsplash.com/photo-1557006021-b85faa2bc5e2?w=400" },
      { name: "Espress", category: "Hot Coffee", price: 80, available: true, image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400" },

      // Iced & Cold Coffee
      { name: "Iced Americano", category: "Iced & Cold Coffee", price: 180, available: true, image: "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400" },
      { name: "Iced Latte", category: "Iced & Cold Coffee", price: 200, available: true, image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400" },
      { name: "Caramel / Vanilla Frappé", category: "Iced & Cold Coffee", price: 250, available: true, image: "https://images.unsplash.com/photo-1662047102608-a6f2e492411f?w=400" },
      { name: "Cold Brew", category: "Iced & Cold Coffee", price: 150, available: true, image: "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400" },
      { name: "Chocolate Iced Latte", category: "Iced & Cold Coffee", price: 250, available: true, image: "https://images.unsplash.com/photo-1578374173705-c08e7e3d99b0?w=400" },

      // Tea & Infusions
      { name: "Tea", category: "Tea & Infusions", price: 40, available: true, image: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400" },
      { name: "Flavored Tea", category: "Tea & Infusions", price: 45, available: true, image: "https://images.unsplash.com/photo-1597318181274-c68affe0f6e5?w=400" },
      { name: "Ginger Tea", category: "Tea & Infusions", price: 50, available: true, image: "https://images.unsplash.com/photo-1597318181274-c68affe0f6e5?w=400" },
      { name: "Special Tea", category: "Tea & Infusions", price: 100, available: true, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400" },
      { name: "Peanuts Tea", category: "Tea & Infusions", price: 80, available: true, image: "https://images.unsplash.com/photo-1597318181274-c68affe0f6e5?w=400" },
      { name: "Iced Tea", category: "Tea & Infusions", price: 110, available: true, image: "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400" },
      { name: "Chai Latte (Hot or Iced)", category: "Tea & Infusions", price: 100, available: true, image: "https://images.unsplash.com/photo-1578374173705-c08e7e3d99b0?w=400" },

      // Hot Specialties
      { name: "Hot Chocolate", category: "Hot Specialties", price: 180, available: true, image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400" },
      { name: "Steamed Milk", category: "Hot Specialties", price: 120, available: true, image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400" },

      // Drinks
      { name: "Soft Drinks", category: "Drinks", price: 50, available: true, image: "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=400" },
      { name: "Ambo Water", category: "Drinks", price: 50, available: true, image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400" },
      { name: "½ Water", category: "Drinks", price: 30, available: true, image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400" },
      { name: "1 Ltr Water", category: "Drinks", price: 40, available: true, image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400" },

      // Juice
      { name: "Avocado", category: "Juice", price: 180, available: true, image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400" },
      { name: "Papaya", category: "Juice", price: 180, available: true, image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400" },
      { name: "Strawberry", category: "Juice", price: 220, available: true, image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400" },
      { name: "Watermelon", category: "Juice", price: 180, available: true, image: "https://images.unsplash.com/photo-1587049352846-4a222e784acc?w=400" },
      { name: "Mixed", category: "Juice", price: 250, available: true, image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400" },
      { name: "Prime Shake", category: "Juice", price: 300, available: true, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400" },

      // Mojito
      { name: "Mixed Mojito", category: "Mojito", price: 250, available: true, image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400" },
      { name: "Strawberry Mojito", category: "Mojito", price: 220, available: true, image: "https://images.unsplash.com/photo-1546171753-97d7676e4602?w=400" },
      { name: "Mint Mojito", category: "Mojito", price: 200, available: true, image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400" },

      // Breakfast
      { name: "Spinach Cheese Omelet", category: "Breakfast", price: 250, available: true, image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400" },
      { name: "Vegetable Scramble Egg", category: "Breakfast", price: 200, available: true, image: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400" },
      { name: "Special Fetira Egg & Sausage Roll", category: "Breakfast", price: 300, available: true, image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400" },
      { name: "Normal Fetira with Honey", category: "Breakfast", price: 180, available: true, image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400" },
      { name: "Special Chechebsa", category: "Breakfast", price: 250, available: true, image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400" },
      { name: "Foull Madam", category: "Breakfast", price: 200, available: true, image: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400" },
      { name: "Special Foull Madam", category: "Breakfast", price: 250, available: true, image: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400" },

      // Salad
      { name: "Garden Mixed Salad", category: "Salad", price: 350, available: true, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400" },
      { name: "Chicken Salad", category: "Salad", price: 450, available: true, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400" },
      { name: "House of Special Salad", category: "Salad", price: 490, available: true, image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400" },

      // Burrito
      { name: "Chicken Burrito", category: "Burrito", price: 550, available: true, image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400" },
      { name: "Beef Burrito", category: "Burrito", price: 500, available: true, image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400" },
      { name: "Fasting Burrito", category: "Burrito", price: 390, available: true, image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400" },

      // Burgers
      { name: "Spicy Classic Beef Burger", category: "Burgers", price: 450, available: true, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" },
      { name: "Classic Cheese Burger", category: "Burgers", price: 400, available: true, image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400" },
      { name: "Prime Addis Cheese Burger", category: "Burgers", price: 600, available: true, image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400" },
      { name: "Chicken Burger", category: "Burgers", price: 550, available: true, image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400" },
      { name: "Special Burger", category: "Burgers", price: 550, available: true, image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400" },
      { name: "French Fries", category: "Burgers", price: 150, available: true, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400" },

      // Wraps
      { name: "Chicken Wrap", category: "Wraps", price: 450, available: true, image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400" },
      { name: "Beef Wrap", category: "Wraps", price: 400, available: true, image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400" },
      { name: "Tuna Wrap", category: "Wraps", price: 400, available: true, image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400" },
      { name: "Vegetable Wrap", category: "Wraps", price: 300, available: true, image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400" },
      { name: "Falafel Wrap", category: "Wraps", price: 300, available: true, image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400" },

      // Sandwich
      { name: "Chicken Sandwich", category: "Sandwich", price: 450, available: true, image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400" },
      { name: "Club Sandwich", category: "Sandwich", price: 500, available: true, image: "https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=400" },
      { name: "Vegetables Sandwich", category: "Sandwich", price: 300, available: true, image: "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=400" },
      { name: "Tuna Melt Sandwich", category: "Sandwich", price: 450, available: true, image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400" },
      { name: "Potato Sandwich (Special Erteb)", category: "Sandwich", price: 250, available: true, image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400" },
      { name: "Avocado Sandwich", category: "Sandwich", price: 250, available: true, image: "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=400" },

      // Pasta (Spaghetti, Penne, Rice, Tagliatelle)
      { name: "Bolognaise Sauce", category: "Pasta", price: 350, available: true, image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400" },
      { name: "Tuna Sauce", category: "Pasta", price: 350, available: true, image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400" },
      { name: "Primavera Sauce", category: "Pasta", price: 250, available: true, image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400" },
      { name: "Pesto Sauce", category: "Pasta", price: 300, available: true, image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400" },

      // Chicken
      { name: "BBQ Chicken Wing", category: "Chicken", price: 500, available: true, image: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400" },
      { name: "Chicken Nugget", category: "Chicken", price: 400, available: true, image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=400" },
      { name: "Loaded Chicken Chili Fries", category: "Chicken", price: 550, available: true, image: "https://images.unsplash.com/photo-1630431341973-02e1f662ec19?w=400" },
      { name: "Chicken Shawarma", category: "Chicken", price: 490, available: true, image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400" },

      // Ethiopian Taste
      { name: "Chekena Tibs", category: "Ethiopian Taste", price: 500, available: true, image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400" },
      { name: "Tibs Firfir", category: "Ethiopian Taste", price: 400, available: true, image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400" },
    ])
    console.log(`Created ${menuItems.length} menu items`)

    // Create inventory - Coffee Shop Supplies
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

    console.log("\n✅ Database seeded successfully!")
    console.log("\nLogin credentials:")
    console.log("Admin: kidayos2014@gmail.com / 123456")
    console.log("Cashier: cashier@cafeteria.com / password")
    console.log("Chef: chef@cafeteria.com / password")

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error("Error seeding database:", error)
    process.exit(1)
  }
}

seed()
