import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import Order from "@/lib/models/order"
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

        let startDate = new Date()
        let endDate = new Date()

        // Set time to end of day for endDate
        endDate.setHours(23, 59, 59, 999)

        // Calculate start date based on period
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
                    // Last 7 days
                    startDate = new Date(today);
                    startDate.setDate(today.getDate() - 7);
                    startDate.setHours(0, 0, 0, 0);
                    break
                case "month":
                    startDate = new Date(today.getFullYear(), today.getMonth(), 1)
                    break
                case "year":
                    startDate = new Date(today.getFullYear(), 0, 1)
                    break
                default:
                    startDate = today
            }
        }

        // Get all orders (including cancelled) for reporting
        const allOrdersQuery = {
            createdAt: { $gte: startDate, $lte: endDate }
        }
        
        // Get revenue-generating orders (excluding cancelled)
        const revenueQuery = {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $ne: "cancelled" }
        }

        const allOrders = await Order.find(allOrdersQuery).sort({ createdAt: -1 }).lean()
        const revenueOrders = await Order.find(revenueQuery).lean()

        // Aggregation for revenue (excluding cancelled orders)
        const paymentStats: any = {}
        const totalRevenue = revenueOrders.reduce((sum, order) => sum + order.totalAmount, 0)
        const totalOrders = allOrders.length
        const completedOrders = allOrders.filter(o => o.status === "completed").length
        const pendingOrders = allOrders.filter(o => o.status === "pending").length
        const cancelledOrders = allOrders.filter(o => o.status === "cancelled").length

        revenueOrders.forEach(order => {
            const method = order.paymentMethod || "cash"
            paymentStats[method] = (paymentStats[method] || 0) + order.totalAmount
        })

        // Fetch Expenses
        const expenseQuery = {
            date: { $gte: startDate, $lte: endDate }
        }
        const dailyExpenses = await DailyExpense.find(expenseQuery).lean()
        const totalOxCost = dailyExpenses.reduce((sum, exp) => sum + (exp.oxCost || 0), 0)
        const totalOtherExpenses = dailyExpenses.reduce((sum, exp) => sum + (exp.otherExpenses || 0), 0)
        const totalExpenses = totalOxCost + totalOtherExpenses
        const netProfit = totalRevenue - totalExpenses

        return NextResponse.json({
            period,
            startDate,
            endDate,
            summary: {
                totalRevenue,
                totalOrders,
                completedOrders,
                pendingOrders,
                cancelledOrders,
                paymentStats,
                totalOxCost,
                totalOtherExpenses,
                totalExpenses,
                netProfit
            },
            orders: allOrders, // Return all orders for display
            revenueOrders, // Revenue-generating orders for calculations
            dailyExpenses
        })

    } catch (error: any) {
        console.error("❌ Sales Report Error:", error)
        return NextResponse.json({ message: "Failed to generate report" }, { status: 500 })
    }
}
