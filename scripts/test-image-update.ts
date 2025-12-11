#!/usr/bin/env ts-node

/**
 * Test script to verify image update functionality
 * This script tests the image update process end-to-end
 */

import { connectDB } from "../lib/db"
import MenuItem from "../lib/models/menu-item"

async function testImageUpdate() {
  console.log("🧪 Starting image update test...")
  
  try {
    // Connect to database
    await connectDB()
    console.log("✅ Database connected")
    
    // Find a test menu item
    const testItem = await MenuItem.findOne({})
    if (!testItem) {
      console.log("❌ No menu items found for testing")
      return
    }
    
    console.log("🔍 Found test item:", testItem.name)
    console.log("🖼️ Current image:", testItem.image || "No image")
    
    // Test 1: Update with a new image URL
    const testImageUrl = "https://example.com/test-image-" + Date.now() + ".jpg"
    console.log("\n📝 Test 1: Updating image URL to:", testImageUrl)
    
    const updatedItem = await MenuItem.findByIdAndUpdate(
      testItem._id,
      { image: testImageUrl },
      { new: true, runValidators: true }
    )
    
    console.log("✅ Update completed")
    console.log("🖼️ New image URL:", updatedItem?.image)
    
    // Verify the update
    const verificationItem = await MenuItem.findById(testItem._id)
    console.log("🔍 Verification - Image URL:", verificationItem?.image)
    
    if (verificationItem?.image === testImageUrl) {
      console.log("✅ Test 1 PASSED: Image URL updated correctly")
    } else {
      console.log("❌ Test 1 FAILED: Image URL mismatch")
      console.log("   Expected:", testImageUrl)
      console.log("   Actual:", verificationItem?.image)
    }
    
    // Test 2: Update with empty string
    console.log("\n📝 Test 2: Updating image URL to empty string")
    
    const clearedItem = await MenuItem.findByIdAndUpdate(
      testItem._id,
      { image: "" },
      { new: true, runValidators: true }
    )
    
    console.log("✅ Update completed")
    console.log("🖼️ New image URL:", clearedItem?.image === "" ? "(empty string)" : clearedItem?.image)
    
    // Verify the empty string update
    const verificationItem2 = await MenuItem.findById(testItem._id)
    console.log("🔍 Verification - Image URL:", verificationItem2?.image === "" ? "(empty string)" : verificationItem2?.image)
    
    if (verificationItem2?.image === "") {
      console.log("✅ Test 2 PASSED: Empty image URL handled correctly")
    } else {
      console.log("❌ Test 2 FAILED: Empty image URL not handled correctly")
      console.log("   Expected: (empty string)")
      console.log("   Actual:", verificationItem2?.image)
    }
    
    // Test 3: Update with undefined (should become empty string)
    console.log("\n📝 Test 3: Updating with undefined image")
    
    const undefinedItem = await MenuItem.findByIdAndUpdate(
      testItem._id,
      { $unset: { image: 1 } },
      { new: true, runValidators: true }
    )
    
    console.log("✅ Update completed")
    console.log("🖼️ New image URL:", undefinedItem?.image || "(undefined)")
    
    // Verify the undefined update
    const verificationItem3 = await MenuItem.findById(testItem._id)
    console.log("🔍 Verification - Image URL:", verificationItem3?.image || "(undefined)")
    
    if (verificationItem3?.image === undefined || verificationItem3?.image === null) {
      console.log("✅ Test 3 PASSED: Undefined image URL handled correctly")
    } else {
      console.log("❌ Test 3 FAILED: Undefined image URL not handled correctly")
      console.log("   Expected: undefined")
      console.log("   Actual:", verificationItem3?.image)
    }
    
    // Restore original image
    console.log("\n🔄 Restoring original image...")
    await MenuItem.findByIdAndUpdate(
      testItem._id,
      { image: testItem.image || "" },
      { new: true, runValidators: true }
    )
    
    console.log("✅ Original image restored")
    console.log("\n🎉 Image update tests completed!")
    
  } catch (error) {
    console.error("❌ Test failed:", error)
  } finally {
    process.exit(0)
  }
}

// Run the test
testImageUpdate()