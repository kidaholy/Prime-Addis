"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"
import { useSettings } from "@/context/settings-context"
import { ReportExporter, type ComprehensiveSection } from "@/lib/export-utils"
import { Download, FileText, Printer, CheckCircle, Clock, ShoppingCart, AlertTriangle, ArrowRight } from "lucide-react"

export default function ReportsPage() {
    const [timeRange, setTimeRange] = useState("week") // Default to week
    // Data State
    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState<any[]>([])
    const [stockItems, setStockItems] = useState<any[]>([])
    const [periodData, setPeriodData] = useState<any>(null) // Sales/Financial Data
    const [stockUsageData, setStockUsageData] = useState<any>(null) // Usage Data

    // Context
    const { token } = useAuth()
    const { t } = useLanguage()
    const { settings } = useSettings()

    useEffect(() => {
        if (token) {
            fetchAllData()
        }
    }, [token, timeRange])

    const fetchAllData = async () => {
        setLoading(true)
        try {
            // Parallel Fetching for performance
            const [salesRes, stockRes, usageRes, ordersRes] = await Promise.all([
                fetch(`/api/reports/sales?period=${timeRange}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`/api/stock`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`/api/reports/stock-usage?period=${timeRange}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(getOrdersUrl(timeRange), { headers: { Authorization: `Bearer ${token}` } })
            ])

            if (salesRes.ok) setPeriodData(await salesRes.json())
            if (stockRes.ok) setStockItems(await stockRes.json())
            if (usageRes.ok) setStockUsageData(await usageRes.json())
            if (ordersRes.ok) setOrders(await ordersRes.json())

        } catch (error) {
            console.error("Failed to load report data:", error)
        } finally {
            setLoading(false)
        }
    }

    // Helper to construct Orders URL
    const getOrdersUrl = (range: string) => {
        let url = "/api/orders"
        const now = new Date()
        let startDate: Date | null = null

        if (range === 'today') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        } else if (range === 'week') {
            startDate = new Date(now)
            startDate.setDate(now.getDate() - 7)
            startDate.setHours(0, 0, 0, 0)
        } else if (range === 'month') {
            startDate = new Date(now)
            startDate.setDate(now.getDate() - 30)
            startDate.setHours(0, 0, 0, 0)
        } else if (range === 'year') {
            startDate = new Date(now)
            startDate.setDate(now.getDate() - 365)
            startDate.setHours(0, 0, 0, 0)
        }

        if (startDate) {
            url += `?startDate=${startDate.toISOString()}`
        }
        return url
    }

    // --- Calculations ---

    // Safety checks
    const salesSummary = periodData?.summary || {}
    const usageSummary = stockUsageData?.summary || {}

    const totalRevenue = salesSummary.totalRevenue || 0
    // Revenue Potential (Selling Price * Quantity)
    const totalStockRetailValue = stockItems.reduce((acc, item) => acc + ((item.quantity || 0) * (item.unitCost || 0)), 0)

    // Actual Investment (Cost Price * Quantity)
    const totalStockInvestment = stockItems.reduce((acc, item) => acc + ((item.quantity || 0) * (item.averagePurchasePrice || 0)), 0)

    // Total Investment = Historical Stock Cost (Current) + Operational Expenses
    // Using averagePurchasePrice ensures we track the actual money spent, not the potential revenue.
    const totalInvestment = totalStockInvestment + (usageSummary.totalOtherExpenses || 0)

    // "Glitch Fix": Net Worth = Revenue - Total Investment
    const netWorth = totalRevenue - totalInvestment

    // Filter orders by time range again just to be safe if API returns more
    // (Though the API call should handle it, client-side safety is good)
    const getFilteredOrders = () => {
        // If API filters correctly, this is redundant but harmless. 
        // We'll trust the API for now or simple sort
        return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    const filteredOrders = getFilteredOrders()


    // --- Exports ---
    const exportFinancialReport = () => {
        const data = [
            { Metric: "Total Revenue", Type: "INCOME", Amount: `${totalRevenue.toLocaleString()} ETB`, Description: "Total completed orders value" },
            { Metric: "Total Investment", Type: "EXPENSE", Amount: `${totalInvestment.toLocaleString()} ETB`, Description: "Purchases + Operational Expenses" },
            { Metric: "NET WORTH (Profit)", Type: "RESULT", Amount: `${netWorth.toLocaleString()} ETB`, Description: "Revenue - Total Investment" }
        ]
        ReportExporter.exportToWord({
            title: "Financial Summary Report",
            period: timeRange,
            headers: ["Metric", "Type", "Amount", "Description"],
            data,
            metadata: { companyName: settings.app_name || "Prime Addis" }
        })
    }

    const exportOrdersReport = () => {
        const data = filteredOrders.map(o => {
            const itemNames = o.items.map((i: any) => i.name).join(", ")
            const totalQty = o.items.reduce((acc: number, i: any) => acc + (i.quantity || 0), 0)
            return {
                "Item Names": itemNames,
                "Table": o.tableNumber ? `T-${o.tableNumber}` : "-",
                "Items (Qty)": totalQty,
                "Total Payment": `${o.totalAmount.toLocaleString()} ETB`,
                "Status": o.status,
                "Date/Time": new Date(o.createdAt).toLocaleString()
            }
        })
        ReportExporter.exportToWord({
            title: "Order History Report",
            period: timeRange,
            headers: ["Item Names", "Table", "Items (Qty)", "Total Payment", "Status", "Date/Time"],
            data,
            metadata: { companyName: settings.app_name || "Prime Addis" }
        })
    }

    const exportInventoryReport = () => {
        const data = (stockUsageData?.stockAnalysis || stockItems || []).map((item: any) => {
            const costPrice = item.weightedAvgCost ?? item.averagePurchasePrice ?? 0;
            const sellingPrice = item.currentUnitCost ?? item.unitCost ?? 0;
            const closingQuantity = item.closingStock ?? item.quantity ?? 0;
            const consumedCount = item.consumed ?? 0;
            const displayedQuantity = closingQuantity;

            const totalPurchaseValue = displayedQuantity * costPrice;
            const remains = closingQuantity - consumedCount;
            const potentialRevenue = remains * sellingPrice;
            const isLow = item.isLowStock || (remains <= (item.minLimit || 5));

            return {
                "Item Name": item.name,
                "Unit Cost": Math.round(sellingPrice).toLocaleString(),
                "Quantity": `${displayedQuantity} ${item.unit || "unit"}`,
                "Low Limit": `${item.minLimit || 0} ${item.unit || "unit"}`,
                "Total Purchase": `${totalPurchaseValue.toLocaleString()} ETB`,
                "Consumed": `${consumedCount} Usage`,
                "Remains": `${remains} ${item.unit || "unit"}`,
                "Potential Rev.": `${potentialRevenue.toLocaleString()} ETB`,
                "Status": isLow ? "Low Stock" : "OK"
            }
        })
        ReportExporter.exportToWord({
            title: "Inventory Investment Report",
            period: timeRange,
            headers: ["Item Name", "Unit Cost", "Quantity", "Low Limit", "Total Purchase", "Consumed", "Remains", "Potential Rev.", "Status"],
            data,
            metadata: { companyName: settings.app_name || "Prime Addis" }
        })
    }

    const exportFullReport = () => {
        const sections: ComprehensiveSection[] = [
            {
                title: "Financial Summary",
                headers: ["Metric", "Type", "Amount", "Description"],
                data: [
                    { Metric: "Total Revenue", Type: "INCOME", Amount: `${totalRevenue.toLocaleString()} ETB`, Description: "Total completed orders value" },
                    { Metric: "Total Investment", Type: "EXPENSE", Amount: `${totalInvestment.toLocaleString()} ETB`, Description: "Purchases + Operational Expenses" },
                    { Metric: "NET WORTH (Profit)", Type: "RESULT", Amount: `${netWorth.toLocaleString()} ETB`, Description: "Revenue - Total Investment" }
                ]
            },
            {
                title: "Order History",
                headers: ["Item Names", "Table", "Items (Qty)", "Total Payment", "Status", "Date/Time"],
                data: filteredOrders.map(o => ({
                    "Item Names": o.items.map((i: any) => i.name).join(", "),
                    "Table": o.tableNumber ? `T-${o.tableNumber}` : "-",
                    "Items (Qty)": o.items.reduce((acc: number, i: any) => acc + (i.quantity || 0), 0),
                    "Total Payment": `${o.totalAmount.toLocaleString()} ETB`,
                    "Status": o.status,
                    "Date/Time": new Date(o.createdAt).toLocaleString()
                }))
            },
            {
                title: "Inventory Investment Details",
                headers: ["Item Name", "Unit Cost", "Quantity", "Total Purchase", "Consumed", "Remains", "Potential Rev.", "Status"],
                data: (stockUsageData?.stockAnalysis || stockItems || []).map((item: any) => {
                    const costPrice = item.weightedAvgCost ?? item.averagePurchasePrice ?? 0;
                    const sellingPrice = item.currentUnitCost ?? item.unitCost ?? 0;
                    const currentQuantity = item.closingStock ?? item.quantity ?? 0;
                    const totalPurchaseValue = currentQuantity * costPrice;
                    const consumedCount = item.consumed ?? 0;
                    const remains = currentQuantity - consumedCount;
                    const potentialRevenue = remains * sellingPrice;
                    const isLow = item.isLowStock || (item.quantity <= (item.minLimit || 5));

                    return {
                        "Item Name": item.name,
                        "Unit Cost": Math.round(sellingPrice).toLocaleString(),
                        "Quantity": `${currentQuantity} ${item.unit || "unit"}`,
                        "Total Purchase": `${totalPurchaseValue.toLocaleString()} ETB`,
                        "Consumed": `${consumedCount} Usage`,
                        "Remains": `${remains} ${item.unit || "unit"}`,
                        "Potential Rev.": `${potentialRevenue.toLocaleString()} ETB`,
                        "Status": isLow ? "Low Stock" : "OK"
                    }
                })
            }
        ]

        ReportExporter.exportComprehensiveToWord({
            title: "Comprehensive Business BI Report",
            period: timeRange,
            sections,
            metadata: { companyName: settings.app_name || "Prime Addis" }
        })
    }


    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8B4513] border-t-transparent"></div>
            </div>
        )
    }

    return (
        <ProtectedRoute requiredRoles={["admin"]}>
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <BentoNavbar />

                    {/* Header */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-1">Business Intelligence</h1>
                                <p className="text-gray-600">Consolidated financial and operational reports</p>
                            </div>

                            <div className="flex flex-wrap gap-3 items-center">
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    {["today", "week", "month", "year"].map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setTimeRange(r)}
                                            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${timeRange === r ? "bg-[#8B4513] text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
                                                }`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={exportFullReport}
                                    className="bg-[#8B4513] text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-[#D2691E] transition-colors flex items-center gap-2"
                                >
                                    <Download size={16} /> Export Report
                                </button>

                                <button
                                    onClick={() => window.print()}
                                    className="bg-white border border-gray-300 text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Printer size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-[#8B4513] rounded-full flex items-center justify-center text-white">
                                    <FileText size={20} />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800">Financial Summary</h2>
                            </div>
                            <button
                                onClick={exportFinancialReport}
                                className="flex items-center gap-2 text-[#8B4513] hover:text-[#D2691E] font-bold text-sm transition-colors"
                            >
                                <Download size={16} /> Export Section
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold tracking-wider border-b border-gray-200">
                                    <tr>
                                        <th className="p-4">Metric</th>
                                        <th className="p-4 text-center">Type</th>
                                        <th className="p-4 text-right">Amount</th>
                                        <th className="p-4 hidden md:table-cell">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium">
                                    <tr className="hover:bg-amber-50/50 transition-colors">
                                        <td className="p-4 text-lg text-slate-700">Total Revenue</td>
                                        <td className="p-4 text-center"><span className="bg-green-100 text-green-700 py-1 px-3 rounded-full text-xs font-bold">INCOME</span></td>
                                        <td className="p-4 text-right text-lg font-bold text-green-600">+{totalRevenue.toLocaleString()} ETB</td>
                                        <td className="p-4 text-gray-400 text-sm hidden md:table-cell">Total completed orders value</td>
                                    </tr>
                                    <tr className="hover:bg-amber-50/50 transition-colors">
                                        <td className="p-4 text-lg text-slate-700">Total Investment</td>
                                        <td className="p-4 text-center"><span className="bg-red-100 text-red-700 py-1 px-3 rounded-full text-xs font-bold">EXPENSE</span></td>
                                        <td className="p-4 text-right text-lg font-bold text-red-600">-{totalInvestment.toLocaleString()} ETB</td>
                                        <td className="p-4 text-gray-400 text-sm hidden md:table-cell">Purchases + Operational Expenses</td>
                                    </tr>
                                    <tr className="bg-gray-50 border-t border-gray-200">
                                        <td className="p-4 text-lg font-bold text-gray-900">NET WORTH (Profit)</td>
                                        <td className="p-4 text-center"><span className="bg-[#8B4513] text-white py-1 px-3 rounded-full text-xs font-bold">RESULT</span></td>
                                        <td className={`p-4 text-right text-2xl font-black ${netWorth >= 0 ? "text-[#8B4513]" : "text-red-600"}`}>
                                            {netWorth.toLocaleString()} ETB
                                        </td>
                                        <td className="p-4 text-[#D2691E] font-bold text-sm hidden md:table-cell">Revenue - Total Investment</td>
                                    </tr>
                                    {/* Asset Section Separate */}

                                </tbody>
                            </table>
                        </div>
                    </div>


                    {/* Order History */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-[#D2691E] rounded-full flex items-center justify-center text-white">
                                    <ShoppingCart size={20} />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800">Order History</h2>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">{filteredOrders.length} Orders</div>
                                <button
                                    onClick={exportOrdersReport}
                                    className="flex items-center gap-2 text-[#D2691E] hover:text-[#8B4513] font-bold text-sm transition-colors"
                                >
                                    <Download size={16} /> Export
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4 w-1/3">Item Names</th>
                                        <th className="p-4 text-center">Table</th>
                                        <th className="p-4 text-center">Items (Qty)</th>
                                        <th className="p-4 text-right">Total Payment</th>
                                        <th className="p-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium text-sm">
                                    {filteredOrders.length === 0 ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-gray-400 italic">No orders found for this period.</td></tr>
                                    ) : (
                                        filteredOrders.map((order) => {
                                            const itemNames = order.items.map((i: any) => i.name).join(", ")
                                            const totalQty = order.items.reduce((acc: number, i: any) => acc + (i.quantity || 0), 0)

                                            return (
                                                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-4 text-slate-700">
                                                        <div className="line-clamp-2" title={itemNames}>
                                                            {itemNames}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 font-mono mt-1">#{order._id.slice(-6)} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        {order.tableNumber ? (
                                                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-bold">T-{order.tableNumber}</span>
                                                        ) : (
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-center font-bold text-slate-600">{totalQty}</td>
                                                    <td className="p-4 text-right font-black text-[#8B4513]">{(order.totalAmount || 0).toLocaleString()} ETB</td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Inventory Investment */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-purple-600 rounded-full flex items-center justify-center text-white">
                                    <Clock size={20} />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800">Inventory Investment Details</h2>
                            </div>

                            <div className="flex items-center gap-6">
                                {stockUsageData && (
                                    <div className="text-sm font-bold text-red-500 flex items-center gap-1">
                                        <AlertTriangle size={16} />
                                        {stockUsageData.summary.lowStockItemsCount} Low Stock
                                    </div>
                                )}
                                <button
                                    onClick={exportInventoryReport}
                                    className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-bold text-sm transition-colors"
                                >
                                    <Download size={16} /> Export
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4">Item Name</th>
                                        <th className="p-4 text-center text-orange-600">Unit Cost</th>
                                        <th className="p-4 text-center">Quantity</th>
                                        <th className="p-4 text-center">Low Limit</th>
                                        <th className="p-4 text-center text-green-600">Total Purchase</th>
                                        <th className="p-4 text-center text-red-500">Consumed</th>
                                        <th className="p-4 text-center">Remains</th>
                                        <th className="p-4 text-right text-blue-600">Potential Rev.</th>
                                        <th className="p-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium text-sm">
                                    {(stockUsageData?.stockAnalysis || stockItems || []).map((item: any, idx: number) => {
                                        // Removed early isLow calc to defer after remains calculation

                                        // Improved Logic: 
                                        // Quantity = Total Available (Closing + Consumed)
                                        // Remains = Closing Stock
                                        const costPrice = item.weightedAvgCost ?? item.averagePurchasePrice ?? 0;
                                        const sellingPrice = item.currentUnitCost ?? item.unitCost ?? 0;

                                        const closingQuantity = item.closingStock ?? item.quantity ?? 0;
                                        const consumedCount = item.consumed ?? 0;
                                        const displayedQuantity = closingQuantity;

                                        const totalPurchaseValue = displayedQuantity * costPrice; // Value of current stock
                                        const remains = closingQuantity - consumedCount;
                                        const potentialRevenue = remains * sellingPrice;
                                        const isLow = item.isLowStock || (remains <= (item.minLimit || 5));

                                        return (
                                            <tr key={idx} className={`hover:bg-gray-50 transition-colors ${isLow ? 'bg-red-50/50' : ''}`}>
                                                <td className="p-4 font-bold text-slate-700">{item.name}</td>
                                                <td className="p-4 text-center text-orange-600 font-mono">
                                                    {Math.round(sellingPrice).toLocaleString()}
                                                </td>
                                                <td className="p-4 text-center font-bold text-slate-700">
                                                    {displayedQuantity} <span className="text-xs text-gray-400 font-normal">{item.unit || "unit"}</span>
                                                </td>
                                                <td className="p-4 text-center font-medium text-gray-500">
                                                    {(item.minLimit || 0)} <span className="text-xs text-gray-300 font-normal">{item.unit || "unit"}</span>
                                                </td>
                                                <td className="p-4 text-center font-bold text-green-600">
                                                    {totalPurchaseValue.toLocaleString()} ETB
                                                    <div className="text-[10px] text-gray-400 font-normal">@{Math.round(costPrice).toLocaleString()} Avg</div>
                                                </td>
                                                <td className="p-4 text-center font-bold text-red-500">
                                                    {consumedCount} <span className="text-xs text-red-300 font-normal">Usage</span>
                                                </td>
                                                <td className="p-4 text-center font-bold text-slate-700">
                                                    {remains} <span className="text-xs text-gray-400 font-normal">{item.unit || "unit"}</span>
                                                </td>
                                                <td className="p-4 text-right font-bold text-blue-600">
                                                    {potentialRevenue.toLocaleString()} ETB
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        {isLow ? 'Low Stock' : 'OK'}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </ProtectedRoute>
    )
}
