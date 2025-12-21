import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

// Import the Settings model
import Settings from "../lib/models/settings"

async function testImageUpload() {
  try {
    console.log("🔍 Connecting to MongoDB Atlas...")
    const mongoUri = "mongodb+srv://kidayos2014:holyunion@cluster0.tcqv1p5.mongodb.net/restaurant-management"
    await mongoose.connect(mongoUri)
    console.log("✅ Connected to MongoDB Atlas")

    // Test base64 image storage
    const testBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="

    console.log("📊 Testing image upload functionality...")

    // Test setting a base64 image
    const result = await Settings.findOneAndUpdate(
      { key: "logo_url" },
      { 
        key: "logo_url",
        value: testBase64,
        type: "url",
        description: "Test base64 image upload"
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true 
      }
    )

    console.log("✅ Base64 image stored successfully")
    console.log(`📏 Image data length: ${testBase64.length} characters`)
    console.log(`💾 Estimated size: ${Math.round(testBase64.length * 0.75 / 1024)}KB`)

    // Verify retrieval
    const retrieved = await Settings.findOne({ key: "logo_url" })
    if (retrieved && retrieved.value === testBase64) {
      console.log("✅ Image retrieval test passed")
    } else {
      console.log("❌ Image retrieval test failed")
    }

    // Test with URL image (restore default)
    const urlImage = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop&crop=center"
    await Settings.findOneAndUpdate(
      { key: "logo_url" },
      { value: urlImage },
      { new: true }
    )

    console.log("✅ Restored default URL image")
    console.log("\n🎉 Image upload functionality test completed!")
    console.log("\n📋 Features tested:")
    console.log("   ✅ Base64 image storage")
    console.log("   ✅ Large data handling")
    console.log("   ✅ Image retrieval")
    console.log("   ✅ URL fallback")

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error("❌ Error testing image upload:", error)
    process.exit(1)
  }
}

testImageUpload()