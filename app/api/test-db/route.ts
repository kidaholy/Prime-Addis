import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import Order from "@/lib/models/order"
import User from "@/lib/models/user"
import MenuItem from "@/lib/models/menu-item"

export async function GET() {
  try {
    console.log("🧪 Testing database connection...")
    
    // Test database connection
    await connectDB()
    console.log("✅ Database connected successfully")

    // Test collections
    const orderCount = await Order.countDocuments()
    const userCount = await User.countDocuments()
    const menuItemCount = await MenuItem.countDocuments()

    console.log("📊 Database stats:", { orderCount, userCount, menuItemCount })

    // Test creating a simple order
    const testOrder = {
      orderNumber: "TEST-" + Date.now(),
      items: [
        {
          menuItemId: "test-item",
          name: "Test Item",
          quantity: 1,
          price: 100
        }
      ],
      totalAmount: 100,
      status: "pending" as const,
      paymentMethod: "cash",
      customerName: "Test Customer",
      createdBy: "000000000000000000000000" // Dummy ObjectId
    }

    const createdOrder = await Order.create(testOrder)
    console.log("✅ Test order created:", createdOrder._id)

    // Clean up test order
    await Order.findByIdAndDelete(createdOrder._id)
    console.log("🧹 Test order cleaned up")

    return NextResponse.json({
      success: true,
      message: "Database connection and operations working correctly",
      stats: {
        orders: orderCount,
        users: userCount,
        menuItems: menuItemCount
      }
    })

  } catch (error: any) {
    console.error("❌ Database test failed:", error)
    return NextResponse.json({
      success: false,
      message: "Database test failed",
      error: error.message
    }, { status: 500 })
  }
}