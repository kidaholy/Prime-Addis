import dotenv from "dotenv"

dotenv.config()

async function testUsersAPI() {
  try {
    console.log("🧪 Testing Users API...")
    
    // First, let's test login to get a token
    console.log("🔐 Testing login...")
    const loginResponse = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
    console.log("🎫 Token received:", token ? "Yes" : "No")

    // Now test the users API
    console.log("👥 Testing users API...")
    const usersResponse = await fetch("http://localhost:3000/api/users", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })

    console.log("📥 Users API response status:", usersResponse.status)
    
    if (usersResponse.ok) {
      const users = await usersResponse.json()
      console.log("✅ Users fetched successfully:", users.length, "users")
      users.forEach((user: any, index: number) => {
        console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${user.role}`)
      })
    } else {
      const errorData = await usersResponse.json()
      console.error("❌ Users API failed:", errorData)
    }

  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

testUsersAPI()