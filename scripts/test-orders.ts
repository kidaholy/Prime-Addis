import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

// Import the Order model
import Order from "../lib/models/order"

async function testOrders() {
  try {
    console.log("🔍 Connecting to MongoDB Atlas...")
    const mongoUri = "mongodb+srv://kidayos2014:holyunion@cluster0.tcqv1p5.mongodb.net/restaurant-management"
    await mongoose.connect(mongoUri)
    console.log("✅ Connected to MongoDB Atlas")

    // Get all orders
    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(10)
    console.log(`📋 Found ${orders.length} recent orders`)

    console.log("\n📊 Order Status Report:")
    console.log("=" .repeat(60))

    const statusCounts = {
      pending: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0
    }

    for (const order of orders) {
      const statusEmoji = {
        pending: "⏳",
        preparing: "🔥", 
        ready: "✅",
        completed: "🍽️",
        cancelled: "❌"
      }

      console.log(`${statusEmoji[order.status as keyof typeof statusEmoji] || "❓"} Order #${order.orderNumber} - ${order.status.toUpperCase()} - ${order.totalAmount} Br - ${new Date(order.createdAt).toLocaleString()}`)
      
      if (order.status in statusCounts) {
        statusCounts[order.status as keyof typeof statusCounts]++
      }
    }

    console.log("\n" + "=" .repeat(60))
    console.log(`📊 Status Summary:`)
    console.log(`   ⏳ Pending: ${statusCounts.pending}`)
    console.log(`   🔥 Preparing: ${statusCounts.preparing}`)
    console.log(`   ✅ Ready: ${statusCounts.ready}`)
    console.log(`   🍽️ Completed: ${statusCounts.completed}`)
    console.log(`   ❌ Cancelled: ${statusCounts.cancelled}`)

    console.log(`\n🎯 Chef can cancel orders with status: "pending"`)
    console.log(`📋 Total orders: ${orders.length}`)

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error("❌ Error testing orders:", error)
    process.exit(1)
  }
}

testOrders()