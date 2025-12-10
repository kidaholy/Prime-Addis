import dotenv from "dotenv"

dotenv.config()

async function testAdminMenuAPI() {
  try {
    console.log("🧪 Testing Admin Menu API...")
    
    // First, login to get admin token
    console.log("🔐 Logging in as admin...")
    const loginResponse = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "kidayos2014@gmail.com",
        password: "123456"
      }),
    })

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`)
    }

    const loginData = await loginResponse.json()
    console.log("✅ Login successful:", loginData.user)
    
    const token = loginData.token

    // Test fetching menu items
    console.log("🍽️ Testing menu items fetch...")
    const menuResponse = await fetch("http://localhost:3000/api/admin/menu", {
      headers: { "Authorization": `Bearer ${token}` },
    })

    console.log("📥 Menu API response status:", menuResponse.status)
    
    if (menuResponse.ok) {
      const menuItems = await menuResponse.json()
      console.log("✅ Menu items fetched successfully:", menuItems.length, "items")
      
      // Show sample items by category
      const categories = [...new Set(menuItems.map((item: any) => item.category))]
      console.log("📋 Categories found:", categories.length)
      
      categories.slice(0, 5).forEach((category: string) => {
        const itemsInCategory = menuItems.filter((item: any) => item.category === category)
        console.log(`  📂 ${category}: ${itemsInCategory.length} items`)
        itemsInCategory.slice(0, 2).forEach((item: any) => {
          console.log(`    - ${item.name} (${item.price} Br)`)
        })
      })
      
    } else {
      const errorData = await menuResponse.json()
      console.error("❌ Menu API failed:", errorData)
    }

  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

testAdminMenuAPI()