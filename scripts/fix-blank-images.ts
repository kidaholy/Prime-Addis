import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

// Import the MenuItem model
import MenuItem from "../lib/models/menu-item"

async function fixBlankImages() {
  try {
    console.log("🔍 Connecting to MongoDB Atlas...")
    const mongoUri = "mongodb+srv://kidayos2014:holyunion@cluster0.tcqv1p5.mongodb.net/restaurant-management"
    await mongoose.connect(mongoUri)
    console.log("✅ Connected to MongoDB Atlas")

    // Comprehensive image mapping for all categories
    const categoryImages = {
      "Hot Coffee": [
        "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1557006021-b85faa2bc5e2?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1545665225-b23b99e4d45e?w=400&h=300&fit=crop"
      ],
      "Iced & Cold Coffee": [
        "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1662047102608-a6f2e492411f?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1578374173705-c08e7e3d99b0?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop"
      ],
      "Tea & Infusions": [
        "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1597318181274-c68affe0f6e5?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&h=300&fit=crop"
      ],
      "Hot Specialties": [
        "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1578374173705-c08e7e3d99b0?w=400&h=300&fit=crop"
      ],
      "Drinks": [
        "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400&h=300&fit=crop"
      ],
      "Juice": [
        "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1587049352846-4a222e784acc?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop"
      ],
      "Mojito": [
        "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1546171753-97d7676e4602?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop"
      ],
      "Breakfast": [
        "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&h=300&fit=crop"
      ],
      "Salad": [
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1505576391880-b3f9d713dc4f?w=400&h=300&fit=crop"
      ],
      "Burrito": [
        "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1565299585323-38174c4a6471?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400&h=300&fit=crop"
      ],
      "Burgers": [
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop"
      ],
      "Wraps": [
        "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1604467794349-0b74285de7e7?w=400&h=300&fit=crop"
      ],
      "Sandwich": [
        "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=400&h=300&fit=crop"
      ],
      "Pasta": [
        "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1563379091339-03246963d7d3?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop"
      ],
      "Chicken": [
        "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1630431341973-02e1f662ec19?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&h=300&fit=crop"
      ],
      "Ethiopian Taste": [
        "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop"
      ]
    }

    // Get all menu items
    const menuItems = await MenuItem.find({})
    console.log(`📋 Found ${menuItems.length} menu items`)

    let updatedCount = 0
    let blankCount = 0

    for (const item of menuItems) {
      // Check if item has no image or empty image
      if (!item.image || item.image.trim() === "" || item.image === "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400") {
        blankCount++
        
        // Get images for this category
        const categoryImageList = categoryImages[item.category as keyof typeof categoryImages]
        
        if (categoryImageList && categoryImageList.length > 0) {
          // Pick a random image from the category
          const randomImage = categoryImageList[Math.floor(Math.random() * categoryImageList.length)]
          
          // Update the item
          await MenuItem.findByIdAndUpdate(item._id, { image: randomImage })
          console.log(`✅ Fixed ${item.name} (${item.category}) with new image`)
          updatedCount++
        } else {
          // Use a high-quality default food image
          const defaultImage = "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop"
          await MenuItem.findByIdAndUpdate(item._id, { image: defaultImage })
          console.log(`🍽️  Fixed ${item.name} with default food image`)
          updatedCount++
        }
      } else {
        console.log(`✓ ${item.name} already has image`)
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   Total items: ${menuItems.length}`)
    console.log(`   Blank items found: ${blankCount}`)
    console.log(`   Items updated: ${updatedCount}`)
    console.log(`\n🎉 All menu items now have images!`)

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error("❌ Error fixing blank images:", error)
    process.exit(1)
  }
}

fixBlankImages()