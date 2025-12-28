import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import Order from "@/lib/models/order"
import MenuItem from "@/lib/models/menu-item"
import Stock from "@/lib/models/stock"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const period = searchParams.get("period") || "today"
        const customStart = searchParams.get("startDate")
        const customEnd = searchParams.get("endDate")

        const token = request.headers.get("authorization")?.replace("Bearer ", "")
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

        const decoded = jwt.verify(token, JWT_SECRET) as any
        if (decoded.role !== "admin" && decoded.role !== "super-admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 })

        await connectDB()

        // 1. Determine Date Range
        let startDate = new Date()
        let endDate = new Date()
        endDate.setHours(23, 59, 59, 999)

        if (customStart && customEnd) {
            startDate = new Date(customStart)
            endDate = new Date(customEnd)
            endDate.setHours(23, 59, 59, 999)
        } else {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            switch (period) {
                case "today":
                    startDate = today
                    break
                case "week":
                    const day = today.getDay()
                    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
                    startDate = new Date(today.setDate(diff))
                    startDate.setHours(0, 0, 0, 0)
                    break
                case "month":
                    startDate = new Date(today.getFullYear(), today.getMonth(), 1)
                    break
                case "year":
                    startDate = new Date(today.getFullYear(), 0, 1)
                    break
            }
        }

        // 2. Fetch Completed Orders
        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate },
            status: "completed"
        }).lean()

        // 3. Fetch Menu Items (for reporting units)
        const menuItems = await MenuItem.find({}).lean()
        const menuMap = new Map(menuItems.map(m => [m._id.toString(), m]))

        // 4. Calculate Usage (Aggregated by Unit)
        const usageStats: Record<string, { unit: string, total: number, items: any[] }> = {
            'kg': { unit: 'kg', total: 0, items: [] },
            'liter': { unit: 'liter', total: 0, items: [] },
            'piece': { unit: 'piece', total: 0, items: [] }
        }

        const itemConsumption: Record<string, { name: string, unit: string, quantity: number }> = {}

        for (const order of orders) {
            for (const item of order.items) {
                if (!item.menuItemId) continue;

                const menuData = menuMap.get(item.menuItemId)
                if (menuData) {
                    const unit = menuData.reportUnit || 'piece'
                    const amount = (menuData.reportQuantity || 0) * item.quantity

                    // Global aggregate for this unit
                    if (usageStats[unit]) {
                        usageStats[unit].total += amount
                    }

                    // Per-item breakdown
                    const itemId = item.menuItemId.toString()
                    if (!itemConsumption[itemId]) {
                        itemConsumption[itemId] = {
                            name: menuData.name,
                            unit: unit,
                            quantity: 0
                        }
                    }
                    itemConsumption[itemId].quantity += amount
                }
            }
        }

        // Convert itemConsumption to lists inside usageStats
        Object.values(itemConsumption).forEach(item => {
            if (usageStats[item.unit]) {
                usageStats[item.unit].items.push(item)
            }
        })

        return NextResponse.json({
            period,
            startDate,
            endDate,
            summary: {
                totalBeef: usageStats['kg'].total,
                totalMilk: usageStats['liter'].total,
                totalDrinks: usageStats['piece'].total
            },
            usage: Object.values(usageStats),
            totalOrders: orders.length
        })

    } catch (error: any) {
        console.error("❌ Stock Usage Report Error:", error)
        return NextResponse.json({ message: "Failed to generate consumption report" }, { status: 500 })
    }
}
