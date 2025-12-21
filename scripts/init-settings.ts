import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

// Import the Settings model
import Settings from "../lib/models/settings"

async function initSettings() {
  try {
    console.log("🔍 Connecting to MongoDB Atlas...")
    const mongoUri = "mongodb+srv://kidayos2014:holyunion@cluster0.tcqv1p5.mongodb.net/restaurant-management"
    await mongoose.connect(mongoUri)
    console.log("✅ Connected to MongoDB Atlas")

    // Default settings
    const defaultSettings = [
      {
        key: "logo_url",
        value: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop&crop=center",
        type: "url",
        description: "Application logo URL"
      },
      {
        key: "app_name", 
        value: "Prime Addis",
        type: "string",
        description: "Application name"
      },
      {
        key: "app_tagline",
        value: "Coffee Management",
        type: "string", 
        description: "Application tagline"
      }
    ]

    console.log("⚙️ Initializing default settings...")

    for (const setting of defaultSettings) {
      const existing = await Settings.findOne({ key: setting.key })
      
      if (!existing) {
        await Settings.create(setting)
        console.log(`✅ Created setting: ${setting.key} = "${setting.value}"`)
      } else {
        console.log(`ℹ️  Setting already exists: ${setting.key} = "${existing.value}"`)
      }
    }

    console.log("\n🎉 Settings initialization completed!")
    console.log("📋 Available settings:")
    
    const allSettings = await Settings.find({}).sort({ key: 1 })
    for (const setting of allSettings) {
      console.log(`   ${setting.key}: "${setting.value}" (${setting.type})`)
    }

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error("❌ Error initializing settings:", error)
    process.exit(1)
  }
}

initSettings()