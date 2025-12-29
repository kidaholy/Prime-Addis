import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import Order from "@/lib/models/order"
import MenuItem from "@/lib/models/menu-item"
import Stock from "@/lib/models/stock"
import DailyExpense from "@/lib/models/daily-expense"

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

        // 3. Fetch Stock & Menu Items
        const stockItems = await Stock.find({}).lean()
        const menuItems = await MenuItem.find({}).lean()
        const menuMap = new Map(menuItems.map(m => [m._id.toString(), m]))

        // 4. Fetch Daily Expenses (Purchases)
        const dailyExpenses = await DailyExpense.find({
            date: { $gte: startDate, $lte: endDate }
        }).lean()

        // 5. Aggregate Purchases
        const purchaseStats: Record<string, number> = {}
        dailyExpenses.forEach((exp: any) => {
            // Aggregate Ox
            if (exp.oxQuantity > 0) {
                purchaseStats['ox'] = (purchaseStats['ox'] || 0) + (exp.oxQuantity || 0)
            }
            // Aggregate other items
            exp.items?.forEach((item: any) => {
                const nameKey = item.name.toLowerCase()
                purchaseStats[nameKey] = (purchaseStats[nameKey] || 0) + (item.quantity || 0)
            })
        })

        // 6. Calculate Consumption (Aggregated by Unit & Stock Item)
        const usageStats: Record<string, { unit: string, total: number, items: any[] }> = {
            'kg': { unit: 'kg', total: 0, items: [] },
            'liter': { unit: 'liter', total: 0, items: [] },
            'piece': { unit: 'piece', total: 0, items: [] }
        }

        const itemConsumption: Record<string, { name: string, unit: string, quantity: number, stockId: string }> = {}

        for (const order of orders) {
            for (const item of order.items) {
                if (!item.menuItemId) continue;

                const menuData = menuMap.get(item.menuItemId)
                if (menuData) {
                    const unit = menuData.reportUnit || 'piece'
                    const amount = (menuData.reportQuantity || 0) * item.quantity

                    if (usageStats[unit]) {
                        usageStats[unit].total += amount
                    }

                    const itemId = item.menuItemId.toString()
                    if (!itemConsumption[itemId]) {
                        itemConsumption[itemId] = {
                            name: menuData.name,
                            unit: unit,
                            quantity: 0,
                            stockId: menuData.stockItemId?.toString() || ""
                        }
                    }
                    itemConsumption[itemId].quantity += amount
                }
            }
        }

        // 7. Calculate total revenue from orders
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)

        // 8. Combine into full analysis - Include ALL stock items
        const stockAnalysis = stockItems.map(stock => {
            const fullName = stock.name.toLowerCase()
            // Extract root name (e.g., "Milk (Finished...)" -> "milk")
            const rootName = fullName.split(' (finished')[0].trim()

            const purchased = purchaseStats[rootName] || purchaseStats[fullName] || 0

            // Sum all menu item consumption linked to this stock item
            const consumed = Object.values(itemConsumption)
                .filter(c => c.stockId === stock._id.toString())
                .reduce((acc, c) => acc + c.quantity, 0)

            // Calculate net stock: Current stock minus consumed (what should remain)
            const netStock = (stock.quantity || 0) - consumed

            // Calculate stock value
            const stockValue = (stock.quantity || 0) * (stock.unitCost || 0)
            const purchaseValue = purchased * (stock.unitCost || 0)
            const consumedValue = consumed * (stock.unitCost || 0)

            return {
                id: stock._id,
                name: stock.name,
                category: stock.category,
                unit: stock.unit,
                purchased,
                consumed,
                remaining: stock.quantity || 0, // Current stock
                netStock, // Stock minus ordered consumption
                minLimit: stock.minLimit,
                unitCost: stock.unitCost || 0,
                stockValue,
                purchaseValue,
                consumedValue,
                status: stock.status,
                supplier: stock.supplier || 'N/A',
                lastUpdated: stock.updatedAt
            }
        })

        // 9. Calculate totals
        const totalStockValue = stockAnalysis.reduce((sum, item) => sum + item.stockValue, 0)
        const totalPurchaseValue = stockAnalysis.reduce((sum, item) => sum + item.purchaseValue, 0)
        const totalConsumedValue = stockAnalysis.reduce((sum, item) => sum + item.consumedValue, 0)

        return NextResponse.json({
            period,
            startDate,
            endDate,
            summary: {
                totalBeef: usageStats['kg'].total,
                totalMilk: usageStats['liter'].total,
                totalDrinks: usageStats['piece'].total,
                totalOrders: orders.length,
                totalRevenue,
                totalStockValue,
                totalPurchaseValue,
                totalConsumedValue
            },
            stockAnalysis,
            usage: Object.values(usageStats),
            revenue: {
                totalRevenue,
                averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
                revenuePerUnit: {
                    beef: usageStats['kg'].total > 0 ? totalRevenue / usageStats['kg'].total : 0,
                    milk: usageStats['liter'].total > 0 ? totalRevenue / usageStats['liter'].total : 0,
                    drinks: usageStats['piece'].total > 0 ? totalRevenue / usageStats['piece'].total : 0
                }
            }
        })

    } catch (error: any) {
        console.error("❌ Stock Usage Report Error:", error)
        return NextResponse.json({ message: "Failed to generate consumption report" }, { status: 500 })
    }
}
