import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

// Import the MenuItem model
import MenuItem from "../lib/models/menu-item"

async function addImages() {
  try {
    console.log("🔍 Connecting to MongoDB Atlas...")
    const mongoUri = "mongodb+srv://kidayos2014:holyunion@cluster0.tcqv1p5.mongodb.net/restaurant-management"
    await mongoose.connect(mongoUri)
    console.log("✅ Connected to MongoDB Atlas")

    // Sample images for different categories
    const categoryImages = {
      "Hot Coffee": [
        "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400",
        "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400",
        "https://images.unsplash.com/photo-1557006021-b85faa2bc5e2?w=400",
        "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400",
        "https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400"
      ],
      "Iced & Cold Coffee": [
        "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400",
        "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400",
        "https://images.unsplash.com/photo-1662047102608-a6f2e492411f?w=400",
        "https://images.unsplash.com/photo-1578374173705-c08e7e3d99b0?w=400"
      ],
      "Tea & Infusions": [
        "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400",
        "https://images.unsplash.com/photo-1597318181274-c68affe0f6e5?w=400",
        "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400",
        "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400"
      ],
      "Breakfast": [
        "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400",
        "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400",
        "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400"
      ],
      "Burgers": [
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
        "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400",
        "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400",
        "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400"
      ],
      "Salad": [
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
        "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400"
      ],
      "Juice": [
        "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400",
        "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400",
        "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400",
        "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400"
      ],
      "Sandwich": [
        "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400",
        "https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=400",
        "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=400"
      ],
      "Pasta": [
        "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400",
        "https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=400"
      ],
      "Chicken": [
        "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400",
        "https://images.unsplash.com/photo-1562967914-608f82629710?w=400",
        "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400"
      ]
    }

    // Get all menu items
    const menuItems = await MenuItem.find({})
    console.log(`📋 Found ${menuItems.length} menu items`)

    let updatedCount = 0

    for (const item of menuItems) {
      // Skip if item already has an image
      if (item.image && item.image.trim() !== "") {
        console.log(`⏭️  Skipping ${item.name} - already has image`)
        continue
      }

      // Get images for this category
      const categoryImageList = categoryImages[item.category as keyof typeof categoryImages]
      
      if (categoryImageList && categoryImageList.length > 0) {
        // Pick a random image from the category
        const randomImage = categoryImageList[Math.floor(Math.random() * categoryImageList.length)]
        
        // Update the item
        await MenuItem.findByIdAndUpdate(item._id, { image: randomImage })
        console.log(`✅ Updated ${item.name} with image`)
        updatedCount++
      } else {
        // Use a default food image
        const defaultImage = "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400"
        await MenuItem.findByIdAndUpdate(item._id, { image: defaultImage })
        console.log(`🍽️  Updated ${item.name} with default food image`)
        updatedCount++
      }
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} menu items with images!`)
    console.log("🖼️  All menu items now have beautiful images")

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error("❌ Error adding images:", error)
    process.exit(1)
  }
}

addImages()