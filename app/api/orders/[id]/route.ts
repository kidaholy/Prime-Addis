import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import Order from "@/lib/models/order"
import MenuItem from "@/lib/models/menu-item"
import Stock from "@/lib/models/stock"
import { addNotification } from "@/lib/notifications"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

// PUT update order status with automatic stock consumption
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const token = request.headers.get("authorization")?.replace("Bearer ", "")
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

        const decoded = jwt.verify(token, JWT_SECRET) as any
        await connectDB()

        const { id } = await params
        const body = await request.json()
        const { status } = body

        const order = await Order.findById(id)
        if (!order) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 })
        }

        const previousStatus = order.status

        // 🔗 BUSINESS LOGIC: Auto-consume stock when order is completed
        if (status === "completed" && previousStatus !== "completed") {
            console.log(`🍽️ Processing stock consumption for completed order #${order.orderNumber}`)
            
            // Get menu items with stock links
            const menuItemIds = order.items.map((item: any) => item.menuItemId)
            const linkedMenuItems = await MenuItem.find({ _id: { $in: menuItemIds } }).populate('stockItemId')
            
            // Calculate and consume stock
            const stockConsumptionMap = new Map()
            
            for (const orderItem of order.items) {
                const menuData = linkedMenuItems.find(m => m._id.toString() === orderItem.menuItemId)
                if (menuData && menuData.stockItemId && menuData.reportQuantity > 0) {
                    const stockId = (menuData.stockItemId as any)._id.toString()
                    const consumptionAmount = menuData.reportQuantity * orderItem.quantity
                    
                    if (stockConsumptionMap.has(stockId)) {
                        stockConsumptionMap.set(stockId, stockConsumptionMap.get(stockId) + consumptionAmount)
                    } else {
                        stockConsumptionMap.set(stockId, consumptionAmount)
                    }
                    
                    console.log(`📦 ${menuData.name} x${orderItem.quantity} → ${consumptionAmount} ${menuData.reportUnit} of ${(menuData.stockItemId as any).name}`)
                }
            }

            // Apply stock consumption
            for (const [stockId, consumptionAmount] of stockConsumptionMap) {
                const stockItem = await Stock.findById(stockId)
                if (stockItem && stockItem.trackQuantity) {
                    const newQuantity = Math.max(0, (stockItem.quantity || 0) - consumptionAmount)
                    
                    console.log(`🔄 ${stockItem.name}: ${stockItem.quantity} → ${newQuantity} ${stockItem.unit}`)
                    
                    stockItem.quantity = newQuantity
                    
                    // Auto-mark as finished if quantity reaches 0
                    if (newQuantity === 0 && stockItem.status !== 'finished') {
                        stockItem.status = 'finished'
                        console.log(`🏁 ${stockItem.name} automatically marked as finished`)
                        
                        // Send low stock notification
                        addNotification(
                            "warning",
                            `⚠️ ${stockItem.name} is now finished (0 ${stockItem.unit} remaining)`,
                            "admin"
                        )
                    }
                    // Check for low stock warning
                    else if (newQuantity <= (stockItem.minLimit || 0) && newQuantity > 0) {
                        addNotification(
                            "warning",
                            `⚠️ Low Stock Alert: ${stockItem.name} (${newQuantity} ${stockItem.unit} remaining)`,
                            "admin"
                        )
                    }
                    
                    await stockItem.save()
                }
            }
        }

        // Update order status
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        )

        // Send status update notifications
        if (status !== previousStatus) {
            const statusMessages = {
                pending: "📋 Order is pending preparation",
                preparing: "👨‍🍳 Order is being prepared",
                ready: "🔔 Order is ready for pickup",
                completed: "✅ Order has been completed"
            }

            addNotification(
                "info",
                `${statusMessages[status as keyof typeof statusMessages]} - Order #${order.orderNumber}`,
                status === "ready" ? "cashier" : "chef"
            )

            if (status === "completed") {
                addNotification(
                    "success",
                    `💰 Order #${order.orderNumber} completed - Revenue: ${order.totalAmount} Br`,
                    "admin"
                )
            }
        }

        const serializedOrder = {
            ...updatedOrder.toObject(),
            _id: updatedOrder._id.toString()
        }

        return NextResponse.json(serializedOrder)
    } catch (error: any) {
        console.error("❌ Update order error:", error)
        return NextResponse.json({ message: error.message || "Failed to update order" }, { status: 500 })
    }
}

// DELETE order
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const token = request.headers.get("authorization")?.replace("Bearer ", "")
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

        const decoded = jwt.verify(token, JWT_SECRET) as any
        await connectDB()

        const { id } = await params

        const deletedOrder = await Order.findByIdAndDelete(id)
        if (!deletedOrder) {
            return NextResponse.json({ message: "Order not found" }, { status: 404 })
        }

        // Send cancellation notification
        addNotification(
            "info",
            `🗑️ Order #${deletedOrder.orderNumber} has been cancelled`,
            "admin"
        )

        return NextResponse.json({ message: "Order deleted successfully" })
    } catch (error: any) {
        console.error("❌ Delete order error:", error)
        return NextResponse.json({ message: error.message || "Failed to delete order" }, { status: 500 })
    }
}