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
                    // Start of current week (assuming Monday start)
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
                default:
                    startDate = today
            }
        }

        const query = {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $ne: "cancelled" } // Exclude cancelled orders from revenue
        }

        const orders = await Order.find(query).sort({ createdAt: -1 }).lean()

        // Aggregation
        const paymentStats: any = {}
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
        const totalOrders = orders.length
        const completedOrders = orders.filter(o => o.status === "completed").length

        orders.forEach(order => {
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
                paymentStats,
                totalOxCost,
                totalOtherExpenses,
                totalExpenses,
                netProfit
            },
            orders,
            dailyExpenses
        })

    } catch (error: any) {
        console.error("❌ Sales Report Error:", error)
        return NextResponse.json({ message: "Failed to generate report" }, { status: 500 })
    }
}
