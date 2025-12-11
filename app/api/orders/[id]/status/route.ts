import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import Order from "@/lib/models/order"
import { addNotification } from "@/lib/notifications"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

export async function PUT(request: Request, context: any) {
  try {
    const params = await context.params
    console.log("🔄 Updating order status for ID:", params.id)
    
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    jwt.verify(token, JWT_SECRET)

    await connectDB()

    const { status } = await request.json()
    console.log("📝 New status:", status)

    const order = await Order.findByIdAndUpdate(params.id, { status }, { new: true })

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 })
    }

    // Send notifications based on status change
    try {
      const statusMessages = {
        preparing: `👨‍🍳 Order #${order.orderNumber} is now being prepared`,
        ready: `🔔 Order #${order.orderNumber} is ready for pickup!`,
        completed: `✅ Order #${order.orderNumber} has been completed`
      }

      const statusEmojis = {
        preparing: "👨‍🍳",
        ready: "🔔", 
        completed: "✅"
      }

      if (statusMessages[status as keyof typeof statusMessages]) {
        // Notify cashiers about ready orders
        if (status === "ready") {
          addNotification(
            "success",
            statusMessages[status as keyof typeof statusMessages],
            "cashier"
          )
        }
        
        // Notify admin about all status changes
        addNotification(
          "info",
          statusMessages[status as keyof typeof statusMessages],
          "admin"
        )
        
        console.log(`Order status update notification sent: ${order.orderNumber} -> ${status}`)
      }
    } catch (error) {
      console.error("Failed to send status update notifications:", error)
    }

    return NextResponse.json(order)
  } catch (error: any) {
    console.error("Update order status error:", error)
    return NextResponse.json({ message: error.message || "Failed to update order status" }, { status: 500 })
  }
}
