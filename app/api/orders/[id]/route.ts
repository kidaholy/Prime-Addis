import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import Order from "@/lib/models/order"
import { addNotification } from "@/lib/notifications"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

export async function DELETE(request: Request, context: any) {
  try {
    const params = await context.params
    console.log("🗑️ Deleting order with ID:", params.id)
    
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any

    // Only admins can delete orders
    if (decoded.role !== "admin") {
      return NextResponse.json({ message: "Forbidden - Admin access required" }, { status: 403 })
    }

    await connectDB()

    const order = await Order.findById(params.id)
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 })
    }

    await Order.findByIdAndDelete(params.id)

    // Send notification about order deletion
    try {
      addNotification(
        "warning",
        `🗑️ Order #${order.orderNumber} has been deleted by admin`,
        "admin"
      )
      console.log(`Order deletion notification sent: ${order.orderNumber}`)
    } catch (error) {
      console.error("Failed to send deletion notification:", error)
    }

    console.log(`✅ Order #${order.orderNumber} deleted successfully`)
    return NextResponse.json({ message: "Order deleted successfully" })
  } catch (error: any) {
    console.error("Delete order error:", error)
    return NextResponse.json({ message: error.message || "Failed to delete order" }, { status: 500 })
  }
}