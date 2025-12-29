import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import Order from "@/lib/models/order"
import MenuItem from "@/lib/models/menu-item"
import Stock from "@/lib/models/stock"
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

    // Convert ObjectId to string for frontend compatibility
    const serializedOrders = orders.map(order => ({
      ...order,
      _id: order._id.toString()
    }))

    return NextResponse.json(serializedOrders)
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

    // 🔬 BUSINESS LOGIC: Validate stock availability and check consumption requirements
    const menuItemIds = items.map(i => i.menuItemId)
    const linkedMenuItems = await MenuItem.find({ _id: { $in: menuItemIds } }).populate('stockItemId')

    // Check if any linked stock is finished
    for (const menuData of linkedMenuItems) {
      if ((menuData.stockItemId as any)?.status === 'finished') {
        return NextResponse.json({
          message: `Order Failed: ${menuData.name} is currently out of stock (Finished).`,
          outOfStockItem: menuData.name
        }, { status: 400 })
      }
    }

    // 🔗 BUSINESS LOGIC: Calculate total stock consumption for this order
    const stockConsumptionMap = new Map()
    
    for (const orderItem of items) {
      const menuData = linkedMenuItems.find(m => m._id.toString() === orderItem.menuItemId)
      if (menuData && menuData.stockItemId && menuData.reportQuantity > 0) {
        const stockId = (menuData.stockItemId as any)._id.toString()
        const consumptionAmount = menuData.reportQuantity * orderItem.quantity
        
        if (stockConsumptionMap.has(stockId)) {
          stockConsumptionMap.set(stockId, stockConsumptionMap.get(stockId) + consumptionAmount)
        } else {
          stockConsumptionMap.set(stockId, consumptionAmount)
        }
      }
    }

    // Validate sufficient stock quantities
    for (const [stockId, requiredAmount] of stockConsumptionMap) {
      const stockItem = await Stock.findById(stockId)
      if (stockItem && stockItem.trackQuantity) {
        if ((stockItem.quantity || 0) < requiredAmount) {
          return NextResponse.json({
            message: `Insufficient stock: ${stockItem.name}. Required: ${requiredAmount} ${stockItem.unit}, Available: ${stockItem.quantity || 0} ${stockItem.unit}`,
            insufficientStock: stockItem.name
          }, { status: 400 })
        }
      }
    }

    // Generate order number based on highest existing number + 1
    const lastOrder = await Order.findOne({}, { orderNumber: 1 }).sort({ orderNumber: -1 })
    let orderNumber: string

    if (lastOrder && lastOrder.orderNumber) {
      // Increment the highest order number
      const lastNumber = Number(lastOrder.orderNumber)
      orderNumber = String(lastNumber + 1).padStart(3, "0")
    } else {
      // No orders exist, start with 001
      orderNumber = "001"
    }

    console.log("🔢 Last order number:", lastOrder?.orderNumber || "none")
    console.log("🔢 Generated order number:", orderNumber)

    // Log total order count for verification
    const totalOrders = await Order.countDocuments()
    console.log("📊 Total orders in database:", totalOrders)

    // Double-check that this order number doesn't already exist (safety check)
    const existingOrder = await Order.findOne({ orderNumber })
    if (existingOrder) {
      console.log("⚠️ Order number conflict detected, finding next available number")
      // Find all order numbers and get the next available one
      const allOrderNumbers = await Order.find({}, { orderNumber: 1 }).sort({ orderNumber: 1 })
      const numbers = allOrderNumbers.map(o => Number(o.orderNumber)).filter(n => !isNaN(n))
      let nextNumber = 1
      while (numbers.includes(nextNumber)) {
        nextNumber++
      }
      orderNumber = String(nextNumber).padStart(3, "0")
      console.log("🔢 Using next available number:", orderNumber)
    }

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

    // Return order with string ID
    const serializedOrder = {
      ...order.toObject(),
      _id: order._id.toString()
    }

    return NextResponse.json(serializedOrder, { status: 201 })
  } catch (error: any) {
    console.error("Create order error:", error)
    return NextResponse.json({ message: error.message || "Failed to create order" }, { status: 500 })
  }
}
