import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import Order from "@/lib/models/order"
import { addNotification } from "@/lib/notifications"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

// GET all orders
export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    console.log("📋 User fetching orders:", decoded.email || decoded.id)

    await connectDB()
    console.log("📊 Database connected for order retrieval")
    
    const orders = await Order.find().sort({ createdAt: -1 }).lean()
    console.log(`📦 Found ${orders.length} orders in database`)

    return NextResponse.json(orders)
  } catch (error: any) {
    console.error("❌ Get orders error:", error)
    return NextResponse.json({ message: error.message || "Failed to get orders" }, { status: 500 })
  }
}

// POST create new order
export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    console.log("🔐 User creating order:", decoded.email || decoded.id)

    // Connect to database
    await connectDB()
    console.log("📊 Database connected successfully")

    const body = await request.json()
    const { items, totalAmount, paymentMethod, customerName } = body
    console.log("📝 Order data received:", { items: items.length, totalAmount, paymentMethod })

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: "Items are required" }, { status: 400 })
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json({ message: "Valid total amount is required" }, { status: 400 })
    }

    // Generate order number
    const lastOrder = await Order.findOne().sort({ createdAt: -1 })
    const orderNumber = lastOrder
      ? String(Number(lastOrder.orderNumber) + 1).padStart(3, "0")
      : "001"
    
    console.log("🔢 Generated order number:", orderNumber)

    // Create order data
    const orderData = {
      orderNumber,
      items,
      totalAmount,
      status: "pending" as const,
      paymentMethod: paymentMethod || "cash",
      customerName,
      createdBy: decoded.id,
    }

    console.log("💾 Creating order in database:", orderData)

    // Create order
    const order = await Order.create(orderData)
    console.log("✅ Order saved to database:", order._id)

    // Send notifications to kitchen staff
    try {
      addNotification(
        "info",
        `🍽️ New Order #${order.orderNumber} - ${order.items.length} items (${order.totalAmount} Br)`,
        "chef"
      )
      
      addNotification(
        "success",
        `✅ Order #${order.orderNumber} created successfully`,
        "cashier"
      )
      
      addNotification(
        "info",
        `📋 New Order #${order.orderNumber} received - Total: ${order.totalAmount} Br`,
        "admin"
      )
      
      console.log(`✅ New order notifications sent for order: ${order.orderNumber}`)
    } catch (error) {
      console.error("❌ Failed to send order notifications:", error)
    }

    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    console.error("Create order error:", error)
    return NextResponse.json({ message: error.message || "Failed to create order" }, { status: 500 })
  }
}
