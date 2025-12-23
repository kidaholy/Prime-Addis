import mongoose from "mongoose"
import dotenv from "dotenv"
import path from "path"
import Category from "../lib/models/category"

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const MONGODB_URI = process.env.MONGODB_URI

const menuCategories = [
    "Hot Coffee", "Iced & Cold Coffee", "Tea & Infusions", "Hot Specialties",
    "Drinks", "Juice", "Mojito", "Breakfast", "Salad", "Burrito", "Burgers",
    "Wraps", "Sandwich", "Pasta", "Chicken", "Ethiopian Taste"
]

const stockCategories = ["Ingredients", "Beverages", "Packaging", "Cleaning", "Others"]

async function seedCategories() {
    if (!MONGODB_URI) {
        console.error("❌ MONGODB_URI is not defined")
        return
    }

    try {
        console.log("🔌 Connecting to MongoDB...")
        await mongoose.connect(MONGODB_URI)
        console.log("✅ Connected!")

        // Clear existing categories
        await Category.deleteMany({})
        console.log("🗑️ Cleared existing categories")

        const categoriesToSeed = [
            ...menuCategories.map(name => ({ name, type: 'menu' as const })),
            ...stockCategories.map(name => ({ name, type: 'stock' as const }))
        ]

        await Category.insertMany(categoriesToSeed)
        console.log(`✅ Seeded ${categoriesToSeed.length} categories!`)

        await mongoose.disconnect()
        console.log("👋 Done.")
    } catch (error) {
        console.error("❌ Seeding failed:", error)
    }
}

seedCategories()
