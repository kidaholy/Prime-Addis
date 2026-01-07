"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"
import { useSettings } from "@/context/settings-context"
import { ReportExporter } from "@/lib/export-utils"
import { Printer, Download, ArrowLeft, Package, TrendingUp, DollarSign, TrendingDown, FileText, ShoppingBag, Beef } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

interface StockItem {
    _id: string
    name: string
    category: string
    quantity: number
    unit: string
    unitCost: number
}

export default function NetWorthReportPage() {
    const [filter, setFilter] = useState("week")
    const [stockItems, setStockItems] = useState<StockItem[]>([])
    const [periodData, setPeriodData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const { token } = useAuth()
    const { t } = useLanguage()
    const { settings } = useSettings()

    useEffect(() => {
        if (token) {
            fetchReportData()
        }
    }, [token, filter])

    const fetchReportData = async () => {
        setLoading(true)
        try {
            // Fetch Current Stock for Valuation
            const stockRes = await fetch("/api/stock", {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (stockRes.ok) {
                const data = await stockRes.json()
                setStockItems(data)
            }

            // Fetch Period Sales & Expenses
            const salesRes = await fetch(`/api/reports/sales?period=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const usageRes = await fetch(`/api/reports/stock-usage?period=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (salesRes.ok && usageRes.ok) {
                const sales = await salesRes.json()
                const usage = await usageRes.json()
                setPeriodData({ sales, usage })
            }
        } catch (error) {
            console.error("Failed to fetch report data", error)
        } finally {
            setLoading(false)
        }
    }

    // Calculate Net Worth Components (only when not loading)
    const totalRevenue = periodData?.sales?.summary?.totalRevenue || 0
    const totalInvestment = periodData?.usage?.summary?.totalExpenses || 0
    const totalPurchasedPrice = periodData?.usage?.summary?.totalPurchaseValue || 0
    const totalOtherExpenses = periodData?.usage?.summary?.totalOtherExpenses || 0

    // Net Worth = Revenue - Total Investment (Purchased Price + Other Expenses)
    // Group stock into categories for the formula
    const totalStockValue = stockItems && stockItems.length > 0 
        ? stockItems.reduce((acc, item) => acc + ((item.quantity ?? 0) * (item.unitCost ?? 0)), 0)
        : 0

    // Business Logic: Revenue - Investment - Physical Stock Value
    // 1. Total Investment (Primary Focus)
    const displayTotalInvestment = totalInvestment

    // 2. Current Stock Asset Value
    const currentStockAssets = totalStockValue

    // Net Worth = Revenue - Total Investment
    const netWorth = totalRevenue - displayTotalInvestment

    const exportNetWorthCSV = () => {
        const exportData = {
            title: "Net Worth Analysis Report",
            period: filter,
            headers: ["Component", "Type", "Amount (ብር)", "Description"],
            data: [
                {
                    "Component": "Revenue",
                    "Type": "Income",
                    "Amount (ብር)": totalRevenue.toLocaleString(),
                    "Description": "Total sales revenue from orders"
                },
                {
                    "Component": "Total Investment",
                    "Type": "Expense",
                    "Amount (ብር)": `-${displayTotalInvestment.toLocaleString()}`,
                    "Description": "Total purchased price + other expenses"
                },
                {
                    "Component": "Purchased Price",
                    "Type": "Investment",
                    "Amount (ብር)": `-${totalPurchasedPrice.toLocaleString()}`,
                    "Description": "Cost of all purchased inventory items"
                },
                {
                    "Component": "Other Expenses",
                    "Type": "Expense",
                    "Amount (ብር)": `-${totalOtherExpenses.toLocaleString()}`,
                    "Description": "Additional operational expenses"
                },
                {
                    "Component": "Net Worth",
                    "Type": "Result",
                    "Amount (ብር)": netWorth.toLocaleString(),
                    "Description": "Revenue - Total Investment"
                }
            ],
            summary: {
                "Total Revenue": `${totalRevenue.toLocaleString()} ብር`,
                "Total Investment": `${displayTotalInvestment.toLocaleString()} ብር`,
                "Purchased Price": `${totalPurchasedPrice.toLocaleString()} ብር`,
                "Other Expenses": `${totalOtherExpenses.toLocaleString()} ብር`,
                "Net Worth": `${netWorth.toLocaleString()} ብር`,
                "Profit Margin": `${totalRevenue > 0 ? ((netWorth / totalRevenue) * 100).toFixed(1) : 0}%`
            }
        }

        ReportExporter.exportToCSV(exportData)
    }

    const exportNetWorthWord = () => {
        const exportData = {
            title: "Net Worth Analysis Report",
            period: filter,
            headers: ["Component", "Type", "Amount", "Description"],
            data: [
                {
                    "Component": "Revenue",
                    "Type": "Income",
                    "Amount": `${totalRevenue.toLocaleString()} ብር`,
                    "Description": "Total sales revenue"
                },
                {
                    "Component": "Total Investment",
                    "Type": "Expense",
                    "Amount": `${displayTotalInvestment.toLocaleString()} ብር`,
                    "Description": "Total purchased price + other expenses"
                },
                {
                    "Component": "Purchased Price",
                    "Type": "Investment",
                    "Amount": `${totalPurchasedPrice.toLocaleString()} ብር`,
                    "Description": "Cost of all purchased inventory"
                }
            ],
            summary: {
                "Net Worth": `${netWorth.toLocaleString()} ብር`,
                "Profit Margin": `${totalRevenue > 0 ? ((netWorth / totalRevenue) * 100).toFixed(1) : 0}%`,
                "Total Stock Assets": `${totalStockValue.toLocaleString()} ብር`
            },
            metadata: {
                companyName: settings.app_name || "Prime Addis"
            }
        }

        ReportExporter.exportToWord(exportData)
    }

    const exportNetWorthPDF = () => {
        const exportData = {
            title: "Net Worth Analysis Report",
            period: filter,
            headers: ["Component", "Type", "Amount", "Description"],
            data: [
                {
                    "Component": "Revenue",
                    "Type": "Income",
                    "Amount": `${totalRevenue.toLocaleString()} ብር`,
                    "Description": "Total sales revenue"
                },
                {
                    "Component": "Total Investment",
                    "Type": "Expense",
                    "Amount": `${displayTotalInvestment.toLocaleString()} ብር`,
                    "Description": "Total purchased price + other expenses"
                },
                {
                    "Component": "Purchased Price",
                    "Type": "Investment",
                    "Amount": `${totalPurchasedPrice.toLocaleString()} ብር`,
                    "Description": "Cost of all purchased inventory"
                }
            ],
            summary: {
                "Net Worth": `${netWorth.toLocaleString()} ብር`,
                "Profit Margin": `${totalRevenue > 0 ? ((netWorth / totalRevenue) * 100).toFixed(1) : 0}%`,
            },
            metadata: {
                companyName: settings.app_name || "Prime Addis"
            }
        }

        ReportExporter.exportToPDF(exportData)
    }

    return (
        <ProtectedRoute requiredRoles={["admin"]}>
            <div className="min-h-screen bg-white p-8 font-sans print:bg-white print:p-0">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header - Hidden on Print */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                        <div>
                            <Link href="/admin/reports" className="flex items-center gap-2 text-gray-400 hover:text-[#8B4513] font-bold mb-2 transition-colors">
                                <ArrowLeft size={16} /> Back to Reports
                            </Link>
                            <h1 className="text-4xl font-black text-slate-900">Net Worth Analysis</h1>
                            <p className="text-gray-500 font-medium mt-1">Comprehensive financial analysis: Orders - Expenses - Physical Stock</p>
                        </div>

                        <div className="flex gap-4 items-center">
                            <div className="flex gap-2 bg-white p-1.5 rounded-[20px] shadow-sm">
                                {["today", "week", "month", "year", "all"].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-4 py-2 rounded-[15px] text-sm font-bold capitalize transition-all ${filter === f ? "bg-[#8B4513] text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                                            }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={exportNetWorthWord}
                                    className="bg-blue-600 text-white p-4 rounded-[20px] shadow-sm hover:scale-105 transition-transform border border-gray-100 flex items-center gap-2"
                                >
                                    <FileText size={20} />
                                    <span className="hidden md:inline font-bold">DOC</span>
                                </button>
                                <button
                                    onClick={exportNetWorthPDF}
                                    className="bg-[#8B4513] text-white p-4 rounded-[20px] shadow-sm hover:scale-105 transition-transform border border-gray-100 flex items-center gap-2"
                                >
                                    <FileText size={20} />
                                    <span className="hidden md:inline font-bold">PDF</span>
                                </button>

                                <button
                                    onClick={exportNetWorthCSV}
                                    className="bg-[#D2691E] text-white p-4 rounded-[20px] shadow-sm hover:scale-105 transition-transform border border-gray-100 flex items-center gap-2"
                                >
                                    <Download size={20} />
                                    <span className="hidden md:inline font-bold">CSV</span>
                                </button>

                                <button
                                    onClick={() => window.print()}
                                    className="bg-white text-[#8B4513] p-4 rounded-[20px] shadow-sm hover:scale-105 transition-transform border border-gray-100"
                                >
                                    <Printer size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Print Header */}
                    <div className="hidden print:block mb-8">
                        <h1 className="text-2xl font-black mb-2">Net Worth Analysis Report</h1>
                        <p className="text-sm">Period: {filter.toUpperCase()}</p>
                        <p className="text-sm text-gray-500">Generated: {new Date().toLocaleString()}</p>
                    </div>

                    {loading ? (
                        <div className="p-20 text-center print:hidden">
                            <div className="w-10 h-10 border-4 border-[#8B4513] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="font-bold text-gray-400">Loading Net Worth Analysis...</p>
                        </div>
                    ) : (
                        <>
                            {/* Net Worth Formula Display */}
                            <div className="bg-gradient-to-r from-[#8B4513] to-[#D2691E] rounded-[40px] p-8 text-white relative overflow-hidden">
                                <div className="absolute -right-10 -bottom-10 opacity-10">
                                    <TrendingUp className="w-48 h-48" />
                                </div>
                                <div className="relative z-10">
                                    <h2 className="text-xs font-black uppercase tracking-widest opacity-60 mb-4">Net Worth Calculation Formula</h2>
                                    <div className="flex flex-wrap items-center gap-4 text-2xl font-black mb-6">
                                        <span className="bg-white/20 px-4 py-2 rounded-2xl">Revenue</span>
                                        <span className="text-3xl">-</span>
                                        <span className="bg-white/20 px-4 py-2 rounded-2xl">Total Investment</span>
                                        <span className="text-3xl">=</span>
                                        <span className="bg-white text-[#8B4513] px-6 py-3 rounded-2xl font-black">
                                            {netWorth.toLocaleString()} ብር
                                        </span>
                                    </div>
                                    <p className="text-sm opacity-80">
                                        Net Worth represents the actual profit after accounting for all revenue and investment including purchased price and expenses.
                                    </p>
                                </div>
                            </div>

                            {/* Component Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Revenue */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-green-50 border-2 border-green-200 rounded-[30px] p-6 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <ShoppingBag className="w-16 h-16 text-green-600" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-3 bg-green-500 text-white rounded-2xl">
                                                <DollarSign size={20} />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-wider text-green-600">Revenue ({filter})</span>
                                        </div>
                                        <p className="text-3xl font-black text-green-700 mb-2">
                                            +{totalRevenue.toLocaleString()} <span className="text-sm">ብር</span>
                                        </p>
                                        <p className="text-xs text-green-600 font-medium">
                                            Total sales from {periodData?.sales?.summary?.totalOrders || 0} orders
                                        </p>
                                    </div>
                                </motion.div>

                                {/* Total Investment */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-red-50 border-2 border-red-200 rounded-[30px] p-6 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <TrendingDown className="w-16 h-16 text-red-600" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-3 bg-red-500 text-white rounded-2xl">
                                                <TrendingDown size={20} />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-wider text-red-600">Total Investment ({filter})</span>
                                        </div>
                                        <p className="text-3xl font-black text-red-700 mb-2">
                                            -{displayTotalInvestment.toLocaleString()} <span className="text-sm">ብር</span>
                                        </p>
                                        <p className="text-xs text-red-600 font-medium">
                                            Total purchased price + other expenses
                                        </p>
                                    </div>
                                </motion.div>

                                {/* Stock Asset Card (Summary) */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-blue-50 border-2 border-blue-200 rounded-[30px] p-6 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Package className="w-16 h-16 text-blue-600" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-3 bg-blue-500 text-white rounded-2xl">
                                                <Package size={20} />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-wider text-blue-600">Total Stock Assets</span>
                                        </div>
                                        <p className="text-3xl font-black text-blue-700 mb-2">
                                            {totalStockValue.toLocaleString()} <span className="text-sm">ብር</span>
                                        </p>
                                        <p className="text-xs text-blue-600 font-medium">
                                            Current valuation of all stock
                                        </p>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Final Net Worth Result */}
                            <div className={`rounded-[40px] p-8 text-center relative overflow-hidden ${netWorth >= 0
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                                : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                                }`}>
                                <div className="absolute -right-20 -bottom-20 opacity-10">
                                    <DollarSign className="w-64 h-64" />
                                </div>
                                <div className="relative z-10">
                                    <h2 className="text-xs font-black uppercase tracking-widest opacity-60 mb-4">
                                        Final Net Worth ({filter})
                                    </h2>
                                    <p className="text-6xl font-black mb-4">
                                        {netWorth.toLocaleString()} <span className="text-2xl">ብር</span>
                                    </p>
                                    <p className="text-lg font-medium opacity-80">
                                        {netWorth >= 0 ? '🎉 Profitable Business' : '⚠️ Operating at Loss'}
                                    </p>
                                    <p className="text-sm opacity-60 mt-2">
                                        Profit Margin: {totalRevenue > 0 ? ((netWorth / totalRevenue) * 100).toFixed(1) : 0}%
                                    </p>
                                </div>
                            </div>

                            {/* Detailed Orders Analysis */}
                            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
                                <h3 className="text-xl font-black mb-6 uppercase tracking-widest text-green-600">Revenue Breakdown - Orders</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">
                                                <th className="pb-4 pl-4">Order ID</th>
                                                <th className="pb-4">Date</th>
                                                <th className="pb-4">Status</th>
                                                <th className="pb-4">Items</th>
                                                <th className="pb-4 text-right pr-4">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {periodData?.sales?.orders?.slice(0, 10).map((order: any) => (
                                                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-4 pl-4 font-bold text-slate-800">#{order.orderNumber}</td>
                                                    <td className="py-4 text-gray-600 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                                                    <td className="py-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === 'completed' ? 'bg-green-100 text-green-600' :
                                                            order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                                                                'bg-yellow-100 text-yellow-600'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-gray-600 text-sm">
                                                        {order.items.length} items
                                                    </td>
                                                    <td className="py-4 text-right pr-4 font-black text-green-600">
                                                        +{order.totalAmount} ብር
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {(periodData?.sales?.orders?.length || 0) > 10 && (
                                    <p className="text-center text-gray-500 text-sm mt-4">
                                        Showing 10 of {periodData.sales.orders.length} orders
                                    </p>
                                )}
                            </div>

                            {/* General Expenses Analysis */}
                            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
                                <h3 className="text-xl font-black mb-6 uppercase tracking-widest text-blue-600">Daily Expenses Breakdown</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {periodData?.sales?.dailyExpenses?.filter((day: any) => day.otherExpenses > 0 || day.items?.length > 0).map((day: any, idx: number) => {
                                        const totalItemCost = day.items?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0
                                        const totalDayExpense = (day.otherExpenses || 0) + totalItemCost
                                        
                                        return (
                                            <div key={idx} className="bg-blue-50 border border-blue-200 rounded-3xl p-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="font-black text-slate-800">{new Date(day.date).toLocaleDateString()}</h4>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Daily Expenses</p>
                                                    </div>
                                                    <span className="text-2xl">💰</span>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-xs text-gray-500">Other Expenses:</span>
                                                        <span className="text-sm font-bold">{day.otherExpenses || 0} ብር</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-xs text-gray-500">Item Purchases:</span>
                                                        <span className="text-sm font-bold text-blue-600">{totalItemCost} ብር</span>
                                                    </div>
                                                    <div className="flex justify-between border-t pt-2">
                                                        <span className="text-xs text-gray-500 font-bold">Total:</span>
                                                        <span className="text-sm font-bold text-blue-800">{totalDayExpense} ብር</span>
                                                    </div>
                                                    {day.items?.length > 0 && (
                                                        <div className="mt-3 pt-2 border-t">
                                                            <p className="text-xs text-gray-500 mb-1">Items purchased:</p>
                                                            {day.items.slice(0, 3).map((item: any, itemIdx: number) => (
                                                                <div key={itemIdx} className="flex justify-between text-xs">
                                                                    <span className="text-gray-600">{item.name}</span>
                                                                    <span className="text-gray-800">{item.quantity} {item.unit}</span>
                                                                </div>
                                                            ))}
                                                            {day.items.length > 3 && (
                                                                <p className="text-xs text-gray-500 mt-1">+{day.items.length - 3} more items</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                {periodData?.sales?.dailyExpenses?.filter((day: any) => day.otherExpenses > 0 || day.items?.length > 0).length === 0 && (
                                    <p className="text-center text-gray-500 py-8">No expenses recorded in this period</p>
                                )}
                            </div>

                            {/* Detailed Physical Expense Analysis */}
                            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
                                <h3 className="text-xl font-black mb-6 uppercase tracking-widest text-orange-600">Physical Expense Breakdown</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {periodData?.sales?.dailyExpenses?.filter((day: any) => day.otherExpenses > 0 || day.items?.length > 0).map((day: any, idx: number) => (
                                        <div key={idx} className="bg-orange-50 border border-orange-200 rounded-3xl p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-black text-slate-800">{new Date(day.date).toLocaleDateString()}</h4>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Misc Expenses</p>
                                                </div>
                                                <span className="text-2xl">💸</span>
                                            </div>
                                            <div className="space-y-3">
                                                {day.items?.map((item: any, i: number) => (
                                                    <div key={i} className="flex justify-between items-center bg-white/50 p-2 rounded-xl">
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-700">{item.name}</p>
                                                            <p className="text-[10px] text-gray-500">{item.quantity} {item.unit}</p>
                                                        </div>
                                                        <span className="text-sm font-black text-orange-600">{item.amount.toLocaleString()} ብር</span>
                                                    </div>
                                                ))}
                                                <div className="pt-2 border-t border-orange-200 flex justify-between items-center">
                                                    <span className="text-xs font-black uppercase text-gray-400">Total Day:</span>
                                                    <span className="text-lg font-black text-orange-700">{day.otherExpenses.toLocaleString()} ብር</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {periodData?.sales?.dailyExpenses?.filter((day: any) => day.otherExpenses > 0).length === 0 && (
                                    <p className="text-center text-gray-500 py-8">No physical expenses in this period</p>
                                )}
                            </div>

                            {/* Detailed Physical Stock Analysis */}
                            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
                                <h3 className="text-xl font-black mb-6 uppercase tracking-widest text-blue-600">Physical Stock Investment</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">
                                                <th className="pb-4 pl-4">Stock Item</th>
                                                <th className="pb-4">Category</th>
                                                <th className="pb-4 text-right">Quantity</th>
                                                <th className="pb-4 text-right">Unit Cost</th>
                                                <th className="pb-4 text-right pr-4">Total Value</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {stockItems.map((item, idx) => {
                                                const totalValue = (item.quantity ?? 0) * (item.unitCost ?? 0)
                                                return (
                                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                        <td className="py-4 pl-4 font-bold text-slate-800">{item.name}</td>
                                                        <td className="py-4">
                                                            <span className="text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                                                                {item.category}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-right font-medium">
                                                            {item.quantity} {item.unit}
                                                        </td>
                                                        <td className="py-4 text-right font-medium">
                                                            {item.unitCost?.toFixed(2)} ብር
                                                        </td>
                                                        <td className="py-4 text-right pr-4 font-black text-blue-600">
                                                            {totalValue.toLocaleString()} ብር
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-blue-200">
                                                <td colSpan={4} className="py-4 text-right font-black text-gray-400 uppercase tracking-widest text-xs">
                                                    Total Stock Investment:
                                                </td>
                                                <td className="py-4 text-right pr-4 font-black text-2xl text-blue-600">
                                                    {totalStockValue.toLocaleString()} ብር
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    )
}
