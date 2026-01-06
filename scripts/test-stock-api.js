// Simple test to check if stock API is working
console.log("🧪 Testing Stock API...")

// This would be run in browser console or as a test
const testStockAPI = async () => {
    try {
        const response = await fetch('/api/stock', {
            headers: {
                'Authorization': 'Bearer YOUR_TOKEN_HERE'
            }
        })
        
        console.log("📡 Response status:", response.status)
        
        if (response.ok) {
            const data = await response.json()
            console.log("📦 Stock data:", data)
            console.log("📊 Number of items:", data.length)
            
            if (data.length > 0) {
                console.log("🔍 First item structure:", Object.keys(data[0]))
                console.log("🔍 First item data:", data[0])
            }
        } else {
            console.error("❌ API Error:", response.status, response.statusText)
            const errorText = await response.text()
            console.error("❌ Error details:", errorText)
        }
    } catch (error) {
        console.error("❌ Network error:", error)
    }
}

// Instructions for manual testing
console.log(`
🔧 To test the stock API manually:
1. Open browser console on the stock page
2. Replace YOUR_TOKEN_HERE with actual token
3. Run: testStockAPI()

Or check these things:
1. Are you logged in as admin?
2. Check browser console for errors
3. Check network tab for API calls
4. Verify database has stock items
`)

// Export for use
if (typeof module !== 'undefined') {
    module.exports = { testStockAPI }
}