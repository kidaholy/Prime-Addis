import mongoose from "mongoose"
import dotenv from "dotenv"
import path from "path"

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const MONGODB_URI = process.env.MONGODB_URI

async function checkMenuDB() {
    if (!MONGODB_URI) {
        console.error("❌ MONGODB_URI is not defined in .env.local")
        return
    }

    try {
        console.log("🔌 Connecting to MongoDB Atlas...")
        await mongoose.connect(MONGODB_URI)
        console.log("✅ Connected successfully!")

        const collections = await mongoose.connection.db?.listCollections().toArray()
        const menuCollectionExists = collections?.some(c => c.name === "menuitems")

        if (!menuCollectionExists) {
            console.log("❌ 'menuitems' collection does not exist!")
            // Check if it's named differently
            console.log("📂 Collections found:", collections?.map(c => c.name).join(", "))
        } else {
            const count = await mongoose.connection.db?.collection("menuitems").countDocuments()
            console.log(`🍽️ Found ${count} documents in 'menuitems' collection.`)

            if (count && count > 0) {
                const samples = await mongoose.connection.db?.collection("menuitems").find().limit(1).toArray()
                console.log("📝 Sample item keys:", Object.keys(samples?.[0] || {}))
                console.log("📝 Sample item:", samples?.[0])
            }
        }

        await mongoose.disconnect()
        console.log("👋 Disconnected.")
    } catch (error) {
        console.error("❌ Error:", error)
    }
}

checkMenuDB()
