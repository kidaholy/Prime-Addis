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
        const startTime = Date.now()
        const { searchParams } = new URL(request.url)
        const period = searchParams.get("period") || "today"
        const customStart = searchParams.get("startDate")
        const customEnd = searchParams.get("endDate")

        const token = request.headers.get("authorization")?.replace("Bearer ", "")
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

        const decoded = jwt.verify(token, JWT_SECRET) as any
        if (decoded.role !== "admin" && decoded.role !== "super-admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 })

        await connectDB()

        // Performance check - if taking too long, return basic data
        const checkTimeout = () => {
            if (Date.now() - startTime > 15000) { // 15 second timeout
                throw new Error("Request timeout - data processing taking too long")
            }
        }

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

        // 2. Fetch Completed Orders with optimized query
        checkTimeout()
        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate },
            status: "completed"
        }).select('items totalAmount createdAt waiterName').lean()

        // 3. Fetch Stock & Menu Items with optimized queries
        checkTimeout()
        const stockItems = await Stock.find({}).select('name category quantity unit unitCost minLimit status supplier updatedAt').lean()
        const menuItems = await MenuItem.find({}).select('name reportUnit reportQuantity stockItemId').lean()
        const menuMap = new Map(menuItems.map(m => [m._id.toString(), m]))

        // 4. Fetch Daily Expenses (Purchases) and Stock History with optimized query
        checkTimeout()
        const dailyExpenses = await DailyExpense.find({
            date: { $gte: startDate, $lte: endDate }
        }).select('date otherExpenses items').lean()

        // 5. Calculate Opening Stock (stock at start of period)
        // We need to reverse-calculate what stock was at the beginning
        const openingStockMap: Record<string, number> = {}
        
        // For each stock item, calculate opening stock = current - (purchased in period) + (consumed in period)
        stockItems.forEach(stock => {
            openingStockMap[stock._id.toString()] = stock.quantity || 0
        })

        // 6. Aggregate Purchases with detailed tracking
        const purchaseStats: Record<string, { quantity: number, totalCost: number, transactions: any[] }> = {}
        const purchasesByDate: Record<string, any[]> = {}
        let totalOtherExpenses = 0
        
        dailyExpenses.forEach((exp: any) => {
            const dateKey = new Date(exp.date).toISOString().split('T')[0]
            if (!purchasesByDate[dateKey]) purchasesByDate[dateKey] = []
            
            // Add other expenses to total
            totalOtherExpenses += (exp.otherExpenses || 0)
            
            exp.items?.forEach((item: any) => {
                const nameKey = item.name.toLowerCase()
                if (!purchaseStats[nameKey]) {
                    purchaseStats[nameKey] = { quantity: 0, totalCost: 0, transactions: [] }
                }
                purchaseStats[nameKey].quantity += (item.quantity || 0)
                purchaseStats[nameKey].totalCost += (item.amount || 0)
                purchaseStats[nameKey].transactions.push({
                    date: exp.date,
                    quantity: item.quantity,
                    cost: item.amount,
                    unit: item.unit
                })
                
                purchasesByDate[dateKey].push({
                    name: item.name,
                    quantity: item.quantity,
                    cost: item.amount,
                    unit: item.unit
                })
            })
            
            // Add other expenses to daily breakdown if they exist
            if (exp.otherExpenses > 0) {
                purchasesByDate[dateKey].push({
                    name: "Other Expenses",
                    quantity: 1,
                    cost: exp.otherExpenses,
                    unit: "misc"
                })
            }
        })

        // 7. Calculate Consumption with detailed tracking
        const usageStats: Record<string, { unit: string, total: number, items: any[] }> = {
            'kg': { unit: 'kg', total: 0, items: [] },
            'liter': { unit: 'liter', total: 0, items: [] },
            'piece': { unit: 'piece', total: 0, items: [] }
        }

        const itemConsumption: Record<string, { name: string, unit: string, quantity: number, stockId: string, orders: any[] }> = {}
        const stockOutIncidents: any[] = []
        const ordersByDate: Record<string, any[]> = {}

        for (const order of orders) {
            const orderDate = new Date(order.createdAt).toISOString().split('T')[0]
            if (!ordersByDate[orderDate]) ordersByDate[orderDate] = []
            ordersByDate[orderDate].push(order)

            for (const item of order.items) {
                if (!item.menuItemId) continue;

                const menuData = menuMap.get(item.menuItemId)
                if (menuData) {
                    const unit = menuData.reportUnit || 'piece'
                    const amount = (menuData.reportQuantity || 0) * item.quantity

                    if (usageStats[unit]) {
                        usageStats[unit].total += amount
                        usageStats[unit].items.push({
                            menuItem: menuData.name,
                            quantity: item.quantity,
                            consumption: amount,
                            orderId: order._id,
                            date: order.createdAt
                        })
                    }

                    const itemId = item.menuItemId.toString()
                    if (!itemConsumption[itemId]) {
                        itemConsumption[itemId] = {
                            name: menuData.name,
                            unit: unit,
                            quantity: 0,
                            stockId: menuData.stockItemId?.toString() || "",
                            orders: []
                        }
                    }
                    itemConsumption[itemId].quantity += amount
                    itemConsumption[itemId].orders.push({
                        orderId: order._id,
                        quantity: item.quantity,
                        consumption: amount,
                        date: order.createdAt,
                        waiter: order.waiterName || 'Unknown'
                    })
                }
            }
        }

        // 8. Calculate total revenue from orders
        checkTimeout()
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
        
        // Calculate period duration for velocity calculations
        const periodDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))

        // 9. Enhanced Stock Analysis with comprehensive tracking
        checkTimeout()
        const stockAnalysis = stockItems.map(stock => {
            const fullName = stock.name.toLowerCase()
            const rootName = fullName.split(' (finished')[0].trim()

            // Get purchase data
            const purchaseData = purchaseStats[rootName] || purchaseStats[fullName] || { quantity: 0, totalCost: 0, transactions: [] }
            const purchased = purchaseData.quantity

            // Sum all menu item consumption linked to this stock item
            const consumptionData = Object.values(itemConsumption)
                .filter(c => c.stockId === stock._id.toString())
            const consumed = consumptionData.reduce((acc, c) => acc + c.quantity, 0)

            // Calculate opening stock (reverse calculation)
            const currentStock = stock.quantity || 0
            const openingStock = Math.max(0, currentStock - purchased + consumed)

            // Calculate adjustments/waste (if any discrepancies)
            const expectedStock = openingStock + purchased - consumed
            const adjustments = currentStock - expectedStock

            // Financial calculations
            const currentUnitCost = stock.unitCost || 0
            const weightedAvgCost = purchased > 0 && purchaseData.totalCost > 0 
                ? purchaseData.totalCost / purchased 
                : currentUnitCost

            const openingValue = openingStock * currentUnitCost
            const purchaseValue = purchaseData.totalCost
            const consumedValue = consumed * currentUnitCost
            const closingValue = currentStock * currentUnitCost

            // Usage analytics
            const usageVelocity = periodDays > 0 ? consumed / periodDays : 0
            const daysUntilStockOut = usageVelocity > 0 ? currentStock / usageVelocity : Infinity
            const isLowStock = currentStock <= (stock.minLimit || 0)
            const isNearStockOut = daysUntilStockOut <= 3 && daysUntilStockOut !== Infinity

            // Stock-out incidents (when stock reached zero during period)
            const stockOutCount = consumptionData.reduce((count, consumption) => {
                return count + consumption.orders.filter(order => {
                    // This is a simplified check - in reality you'd need to track stock levels over time
                    return false // Placeholder for actual stock-out detection logic
                }).length
            }, 0)

            return {
                id: stock._id,
                name: stock.name,
                category: stock.category,
                unit: stock.unit,
                
                // Inventory Movement
                openingStock,
                purchased,
                consumed,
                adjustments,
                closingStock: currentStock,
                
                // Financial Metrics
                currentUnitCost,
                weightedAvgCost,
                openingValue,
                purchaseValue,
                consumedValue,
                closingValue,
                costOfGoodsSold: consumedValue,
                
                // Usage Analytics
                usageVelocity: Math.round(usageVelocity * 100) / 100,
                daysUntilStockOut: daysUntilStockOut === Infinity ? null : Math.round(daysUntilStockOut),
                stockOutIncidents: stockOutCount,
                isLowStock,
                isNearStockOut,
                
                // Additional Info
                minLimit: stock.minLimit || 0,
                status: stock.status,
                supplier: stock.supplier || 'N/A',
                lastUpdated: stock.updatedAt,
                
                // Detailed tracking
                purchaseTransactions: purchaseData.transactions,
                consumptionDetails: consumptionData
            }
        })

        // 10. Calculate comprehensive totals and alerts
        const totalOpeningValue = stockAnalysis.reduce((sum, item) => sum + item.openingValue, 0)
        const totalPurchaseValue = stockAnalysis.reduce((sum, item) => sum + item.purchaseValue, 0)
        const totalConsumedValue = stockAnalysis.reduce((sum, item) => sum + item.consumedValue, 0)
        const totalClosingValue = stockAnalysis.reduce((sum, item) => sum + item.closingValue, 0)
        
        // Calculate total investment as sum of all purchases + other expenses
        const totalExpenses = totalPurchaseValue + totalOtherExpenses
        
        const lowStockItems = stockAnalysis.filter(item => item.isLowStock)
        const nearStockOutItems = stockAnalysis.filter(item => item.isNearStockOut)
        const totalStockOutIncidents = stockAnalysis.reduce((sum, item) => sum + item.stockOutIncidents, 0)

        return NextResponse.json({
            period,
            startDate,
            endDate,
            periodDays,
            
            // Enhanced Summary
            summary: {
                // Basic metrics
                totalOrders: orders.length,
                totalRevenue,
                
                // Investment breakdown
                totalExpenses, // Total investment (all purchases + other expenses)
                totalPurchaseValue, // Purchased price for items
                totalOtherExpenses, // Other operational expenses
                
                // Inventory movement summary
                totalOpeningValue,
                totalConsumedValue,
                totalClosingValue,
                totalCostOfGoodsSold: totalConsumedValue,
                
                // Unit-based consumption
                totalBeef: usageStats['kg'].total,
                totalMilk: usageStats['liter'].total,
                totalDrinks: usageStats['piece'].total,
                
                // Alerts and analytics
                lowStockItemsCount: lowStockItems.length,
                nearStockOutItemsCount: nearStockOutItems.length,
                totalStockOutIncidents,
                
                // Profitability
                grossProfit: totalRevenue - totalConsumedValue,
                grossProfitMargin: totalRevenue > 0 ? ((totalRevenue - totalConsumedValue) / totalRevenue * 100) : 0,
                netProfit: totalRevenue - totalExpenses,
                netProfitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100) : 0
            },
            
            // Detailed Analysis
            stockAnalysis,
            
            // Alerts
            alerts: {
                lowStockItems: lowStockItems.map(item => ({
                    name: item.name,
                    currentStock: item.closingStock,
                    minLimit: item.minLimit,
                    unit: item.unit
                })),
                nearStockOutItems: nearStockOutItems.map(item => ({
                    name: item.name,
                    currentStock: item.closingStock,
                    daysUntilStockOut: item.daysUntilStockOut,
                    unit: item.unit
                }))
            },
            
            // Usage patterns
            usage: Object.values(usageStats),
            
            // Financial analysis
            revenue: {
                totalRevenue,
                averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
                revenuePerUnit: {
                    beef: usageStats['kg'].total > 0 ? totalRevenue / usageStats['kg'].total : 0,
                    milk: usageStats['liter'].total > 0 ? totalRevenue / usageStats['liter'].total : 0,
                    drinks: usageStats['piece'].total > 0 ? totalRevenue / usageStats['piece'].total : 0
                }
            },
            
            // Daily breakdown for detailed analysis
            dailyBreakdown: {
                purchases: purchasesByDate,
                orders: ordersByDate
            }
        })

    } catch (error: any) {
        console.error("❌ Stock Usage Report Error:", error)
        
        // If it's a timeout error, return basic summary data
        if (error.message?.includes("timeout")) {
            return NextResponse.json({
                period,
                startDate: new Date(),
                endDate: new Date(),
                periodDays: 1,
                summary: {
                    totalOrders: 0,
                    totalRevenue: 0,
                    totalExpenses: 0,
                    totalPurchaseValue: 0,
                    totalOtherExpenses: 0,
                    totalOpeningValue: 0,
                    totalConsumedValue: 0,
                    totalClosingValue: 0,
                    totalCostOfGoodsSold: 0,
                    totalBeef: 0,
                    totalMilk: 0,
                    totalDrinks: 0,
                    lowStockItemsCount: 0,
                    nearStockOutItemsCount: 0,
                    totalStockOutIncidents: 0,
                    grossProfit: 0,
                    grossProfitMargin: 0,
                    netProfit: 0,
                    netProfitMargin: 0
                },
                stockAnalysis: [],
                alerts: { lowStockItems: [], nearStockOutItems: [] },
                usage: [],
                revenue: { totalRevenue: 0, averageOrderValue: 0, revenuePerUnit: { beef: 0, milk: 0, drinks: 0 } },
                dailyBreakdown: { purchases: {}, orders: {} },
                error: "Request timed out - please try a shorter time period"
            }, { status: 200 })
        }
        
        return NextResponse.json({ message: "Failed to generate consumption report", error: error.message }, { status: 500 })
    }
}
