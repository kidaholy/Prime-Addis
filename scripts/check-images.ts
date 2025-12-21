import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

// Import the MenuItem model
import MenuItem from "../lib/models/menu-item"

async function checkImages() {
  try {
    console.log("🔍 Connecting to MongoDB Atlas...")
    const mongoUri = "mongodb+srv://kidayos2014:holyunion@cluster0.tcqv1p5.mongodb.net/restaurant-management"
    await mongoose.connect(mongoUri)
    console.log("✅ Connected to MongoDB Atlas")

    // Get all menu items
    const menuItems = await MenuItem.find({})
    console.log(`📋 Found ${menuItems.length} menu items`)

    let withImages = 0
    let withoutImages = 0
    let blankImages = 0

    console.log("\n📊 Image Status Report:")
    console.log("=" .repeat(50))

    for (const item of menuItems) {
      if (!item.image || item.image.trim() === "") {
        console.log(`❌ ${item.name} (${item.category}) - NO IMAGE`)
        withoutImages++
      } else if (item.image === "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400") {
        console.log(`⚠️  ${item.name} (${item.category}) - DEFAULT IMAGE`)
        blankImages++
      } else {
        console.log(`✅ ${item.name} (${item.category}) - HAS IMAGE`)
        withImages++
      }
    }

    console.log("\n" + "=" .repeat(50))
    console.log(`📊 Summary:`)
    console.log(`   ✅ Items with images: ${withImages}`)
    console.log(`   ⚠️  Items with default images: ${blankImages}`)
    console.log(`   ❌ Items without images: ${withoutImages}`)
    console.log(`   📋 Total items: ${menuItems.length}`)

    if (withoutImages === 0 && blankImages === 0) {
      console.log(`\n🎉 Perfect! All menu items have proper images!`)
    } else {
      console.log(`\n⚠️  ${withoutImages + blankImages} items need image fixes`)
    }

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error("❌ Error checking images:", error)
    process.exit(1)
  }
}

checkImages()