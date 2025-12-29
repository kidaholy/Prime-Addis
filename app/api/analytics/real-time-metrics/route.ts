import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import Order from "@/lib/models/order"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    await connectDB()

    // Get real-time metrics for today
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1)

    const todayOrders = await Order.find({ 
      createdAt: { $gte: todayStart, $lte: todayEnd } 
    }).lean()

    const activeOrders = todayOrders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status))
    const completedOrders = todayOrders.filter(o => o.status === 'completed')
    const todayRevenue = todayOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, order) => sum + order.totalAmount, 0)

    const metrics = {
      todayRevenue,
      todayOrders: todayOrders.length,
      activeOrders: activeOrders.length,
      completedOrders: completedOrders.length,
      completionRate: todayOrders.length > 0 ? (completedOrders.length / todayOrders.length) * 100 : 0,
      averageOrderValue: todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0
    }

    return NextResponse.json(metrics)
  } catch (error: any) {
    console.error("Real-time metrics error:", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}