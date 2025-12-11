/**
 * Frontend Image Update Test Script
 * Run this in the browser console on the admin menu page to test image updates
 */

async function testFrontendImageUpdate() {
  console.log("🧪 Starting frontend image update test...")
  
  // Get auth token from localStorage
  const token = localStorage.getItem('token')
  if (!token) {
    console.error("❌ No auth token found. Please log in first.")
    return
  }
  
  try {
    // 1. Fetch current menu items
    console.log("📋 Fetching menu items...")
    const response = await fetch('/api/admin/menu', {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch menu items: ${response.status}`)
    }
    
    const menuItems = await response.json()
    console.log(`✅ Found ${menuItems.length} menu items`)
    
    if (menuItems.length === 0) {
      console.log("❌ No menu items found for testing")
      return
    }
    
    // 2. Select first item for testing
    const testItem = menuItems[0]
    console.log("🔍 Testing with item:", testItem.name)
    console.log("🖼️ Current image:", testItem.image || "(no image)")
    
    // 3. Test image update
    const testImageUrl = `https://example.com/test-${Date.now()}.jpg`
    console.log("📝 Updating image to:", testImageUrl)
    
    const updateResponse = await fetch(`/api/admin/menu/${testItem._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...testItem,
        image: testImageUrl
      })
    })
    
    if (!updateResponse.ok) {
      throw new Error(`Update failed: ${updateResponse.status}`)
    }
    
    const updateResult = await updateResponse.json()
    console.log("✅ Update response:", updateResult)
    console.log("🖼️ Updated image:", updateResult.menuItem?.image)
    
    // 4. Verify with fresh fetch
    console.log("🔍 Verifying with fresh fetch...")
    const verifyResponse = await fetch(`/api/admin/menu?t=${Date.now()}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    })
    
    const verifyItems = await verifyResponse.json()
    const verifyItem = verifyItems.find(item => item._id === testItem._id)
    
    console.log("🔍 Verified image:", verifyItem?.image)
    
    if (verifyItem?.image === testImageUrl) {
      console.log("✅ TEST PASSED: Image update successful!")
    } else {
      console.log("❌ TEST FAILED: Image update not persisted")
      console.log("   Expected:", testImageUrl)
      console.log("   Actual:", verifyItem?.image)
    }
    
    // 5. Test empty string update
    console.log("\n📝 Testing empty string update...")
    const emptyResponse = await fetch(`/api/admin/menu/${testItem._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...testItem,
        image: ""
      })
    })
    
    const emptyResult = await emptyResponse.json()
    console.log("✅ Empty string update response:", emptyResult)
    console.log("🖼️ Empty image result:", emptyResult.menuItem?.image === "" ? "(empty string)" : emptyResult.menuItem?.image)
    
    // 6. Restore original image
    console.log("\n🔄 Restoring original image...")
    await fetch(`/api/admin/menu/${testItem._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...testItem,
        image: testItem.image || ""
      })
    })
    
    console.log("✅ Original image restored")
    console.log("🎉 Frontend image update test completed!")
    
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

// Instructions for use
console.log(`
🧪 Frontend Image Update Test Ready!

To run the test:
1. Make sure you're logged in as admin
2. Navigate to the admin menu page
3. Open browser console (F12)
4. Run: testFrontendImageUpdate()

This will test:
- Image URL updates
- Empty string handling  
- Database persistence
- Cache busting
`)

// Make function available globally
window.testFrontendImageUpdate = testFrontendImageUpdate