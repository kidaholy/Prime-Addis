import mongoose from "mongoose"
import dotenv from "dotenv"
import Stock from "../server/models/Stock"

dotenv.config({ path: ".env.local" })
dotenv.config()

const checkStockDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in .env")
        }

        console.log("🔌 Connecting to MongoDB Atlas...")
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("✅ Connected successfully!")

        const count = await Stock.countDocuments()
        if (count === 0) {
            console.log("💾 Database is empty. Adding initialization items...")
            const initialStock = [
                { name: "Premium Arabica Beans", category: "Ingredients", quantity: 50, unit: "kg", minLimit: 10 },
                { name: "Full Cream Milk", category: "Ingredients", quantity: 24, unit: "l", minLimit: 5 },
                { name: "Paper Cups (Large)", category: "Packaging", quantity: 500, unit: "pcs", minLimit: 100 }
            ]
            await Stock.insertMany(initialStock)
            console.log("✅ Successfully added initialization items.")
        }

        const currentCount = await Stock.countDocuments()
        console.log(`📊 Total Stock Items Found: ${currentCount}`)

        const items = await Stock.find()
        items.forEach(item => {
            console.log(`- Item: ${item.name} | Qty: ${item.quantity} ${item.unit} | Category: ${item.category}`)
        })

    } catch (error) {
        console.error("❌ Database Verification Failed:", error)
    } finally {
        await mongoose.disconnect()
        console.log("👋 Disconnected.")
    }
}

checkStockDB()
