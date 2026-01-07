"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"
import { ReportExporter } from "@/lib/export-utils"
import { 
    Printer, Download, ArrowLeft, Package, TrendingUp, TrendingDown, 
    AlertTriangle, Clock, DollarSign, ShoppingCart, FileText, Calendar
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

interface StockAnalysisItem {
    id: string
    name: string
    category: string
    unit: string
    openingStock: number
    purchased: number
    consumed: number
    adjustments: number
    closingStock: number
    currentUnitCost: number
    weightedAvgCost: number
    openingValue: number
    purchaseValue: number
    consumedValue: number
    closingValue: number
    costOfGoodsSold: number
    usageVelocity: number
    daysUntilStockOut: number | null
    stockOutIncidents: number
    isLowStock: boolean
    isNearStockOut: boolean
    minLimit: number
    status: string
    supplier: string
    lastUpdated: string
}

export default function StockUsageReportPage() {
    const [filter, setFilter] = useState("week")
    const [reportData, setReportData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<"summary" | "detailed" | "alerts">("summary")
    const { token } = useAuth()
    const { t } = useLanguage()

    useEffect(() => {
        if (token) {
            fetchReportData()
        }
    }, [token, filter])

    const fetchReportData = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/reports/stock-usage?period=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setReportData(data)
            }
        } catch (error) {
            console.error("Failed to fetch stock usage report", error)
        } finally {
            setLoading(false)
        }
    }

    const exportCSV = () => {
        if (!reportData) return
        
        const csvData = {
            title: "Stock Usage Report - Inventory Movement Analysis",
            period: `${filter.toUpperCase()} (${new Date(reportData.startDate).toLocaleDateString()} - ${new Date(reportData.endDate).toLocaleDateString()})`,
            headers: [
                "Item Name", "Unit", "Opening Stock", "Restocked", "Sold", 
                "Adjustments", "Closing Stock", "Unit Cost", "Total Value", 
                "Usage Velocity", "Days Until Stock-Out", "Status"
            ],
            data: reportData.stockAnalysis.map((item: StockAnalysisItem) => ({
                "Item Name": item.name,
                "Unit": item.unit,
                "Opening Stock": item.openingStock,
                "Restocked": item.purchased,
                "Sold": item.consumed,
                "Adjustments": item.adjustments,
                "Closing Stock": item.closingStock,
                "Unit Cost": `${item.currentUnitCost} ብር`,
                "Total Value": `${item.closingValue.toLocaleString()} ብር`,
                "Usage Velocity": `${item.usageVelocity}/${reportData.periodDays}d`,
                "Days Until Stock-Out": item.daysUntilStockOut || "N/A",
                "Status": item.isLowStock ? "LOW STOCK" : item.isNearStockOut ? "NEAR STOCK-OUT" : "OK"
            })),
            summary: {
                "Total Opening Value": `${reportData.summary.totalOpeningValue.toLocaleString()} ብር`,
                "Total Purchased Price": `${reportData.summary.totalPurchaseValue.toLocaleString()} ብር`,
                "Total Other Expenses": `${reportData.summary.totalOtherExpenses.toLocaleString()} ብር`,
                "Total Investment": `${reportData.summary.totalExpenses.toLocaleString()} ብር`,
                "Total Consumed (COGS)": `${reportData.summary.totalConsumedValue.toLocaleString()} ብር`,
                "Total Closing Value": `${reportData.summary.totalClosingValue.toLocaleString()} ብር`,
                "Gross Profit": `${reportData.summary.grossProfit.toLocaleString()} ብር`,
                "Gross Profit Margin": `${reportData.summary.grossProfitMargin.toFixed(1)}%`,
                "Net Profit": `${reportData.summary.netProfit.toLocaleString()} ብር`,
                "Net Profit Margin": `${reportData.summary.netProfitMargin.toFixed(1)}%`
            }
        }
        
        ReportExporter.exportToCSV(csvData)
    }

    const exportPDF = () => {
        if (!reportData) return
        
        const pdfData = {
            title: "Stock Usage Report - Complete Inventory Analysis",
            subtitle: `Period: ${filter.toUpperCase()} | ${new Date(reportData.startDate).toLocaleDateString()} - ${new Date(reportData.endDate).toLocaleDateString()}`,
            sections: [
                {
                    title: "Executive Summary",
                    content: [
                        `Total Orders Processed: ${reportData.summary.totalOrders}`,
                        `Total Revenue: ${reportData.summary.totalRevenue.toLocaleString()} ብር`,
                        `Total Investment: ${reportData.summary.totalExpenses.toLocaleString()} ብር`,
                        `  - Purchased Price: ${reportData.summary.totalPurchaseValue.toLocaleString()} ብር`,
                        `  - Other Expenses: ${reportData.summary.totalOtherExpenses.toLocaleString()} ብር`,
                        `Cost of Goods Sold: ${reportData.summary.totalConsumedValue.toLocaleString()} ብር`,
                        `Gross Profit: ${reportData.summary.grossProfit.toLocaleString()} ብር (${reportData.summary.grossProfitMargin.toFixed(1)}%)`,
                        `Net Profit: ${reportData.summary.netProfit.toLocaleString()} ብር (${reportData.summary.netProfitMargin.toFixed(1)}%)`,
                        `Low Stock Alerts: ${reportData.summary.lowStockItemsCount} items`,
                        `Near Stock-Out Alerts: ${reportData.summary.nearStockOutItemsCount} items`
                    ]
                },
                {
                    title: "Inventory Movement Details",
                    table: {
                        headers: ["Item", "Unit", "Opening", "Purchased", "Consumed", "Closing", "Value"],
                        rows: reportData.stockAnalysis.slice(0, 20).map((item: StockAnalysisItem) => [
                            item.name,
                            item.unit,
                            item.openingStock.toString(),
                            item.purchased.toString(),
                            item.consumed.toString(),
                            item.closingStock.toString(),
                            `${item.closingValue.toLocaleString()} ብር`
                        ])
                    }
                }
            ]
        }
        
        ReportExporter.exportToPDF(pdfData)
    }

    if (loading) {
        return (
            <ProtectedRoute requiredRoles={["admin"]}>
                <div className="min-h-screen bg-white p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="p-20 text-center">
                            <div className="w-10 h-10 border-4 border-[#8B4513] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="font-bold text-gray-400">Loading Stock Usage Report...</p>
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute requiredRoles={["admin"]}>
            <div className="min-h-screen bg-white p-8 font-sans print:bg-white print:p-0">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                        <div>
                            <Link href="/admin/reports" className="flex items-center gap-2 text-gray-400 hover:text-[#8B4513] font-bold mb-2 transition-colors">
                                <ArrowLeft size={16} /> Back to Reports
                            </Link>
                            <h1 className="text-4xl font-black text-slate-900">Stock Usage Report</h1>
                            <p className="text-gray-500 font-medium mt-1">Complete inventory movement analysis from delivery to customer plate</p>
                        </div>

                        <div className="flex gap-4 items-center">
                            {/* Period Filter */}
                            <div className="flex gap-2 bg-white p-1.5 rounded-[20px] shadow-sm">
                                {["today", "week", "month", "year"].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-4 py-2 rounded-[15px] text-sm font-bold capitalize transition-all ${
                                            filter === f ? "bg-[#8B4513] text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                                        }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>

                            {/* Export Options */}
                            <div className="flex gap-2">
                                <button
                                    onClick={exportCSV}
                                    className="bg-[#D2691E] text-white p-4 rounded-[20px] shadow-sm hover:scale-105 transition-transform border border-gray-100 flex items-center gap-2"
                                >
                                    <Download size={20} />
                                    <span className="hidden md:inline font-bold">CSV</span>
                                </button>
                                <button
                                    onClick={exportPDF}
                                    className="bg-[#8B4513] text-white p-4 rounded-[20px] shadow-sm hover:scale-105 transition-transform border border-gray-100 flex items-center gap-2"
                                >
                                    <FileText size={20} />
                                    <span className="hidden md:inline font-bold">PDF</span>
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
                        <h1 className="text-2xl font-black mb-2">Stock Usage Report - Inventory Movement Analysis</h1>
                        <p className="text-sm">Period: {filter.toUpperCase()} | {new Date(reportData?.startDate).toLocaleDateString()} - {new Date(reportData?.endDate).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-500">Generated: {new Date().toLocaleString()}</p>
                    </div>

                    {reportData && (
                        <>
                            {/* View Mode Selector */}
                            <div className="flex gap-2 bg-white p-1.5 rounded-[20px] shadow-sm print:hidden">
                                {[
                                    { key: "summary", label: "Summary", icon: TrendingUp },
                                    { key: "detailed", label: "Detailed Analysis", icon: Package },
                                    { key: "alerts", label: "Alerts & Analytics", icon: AlertTriangle }
                                ].map(({ key, label, icon: Icon }) => (
                                    <button
                                        key={key}
                                        onClick={() => setViewMode(key as any)}
                                        className={`px-4 py-2 rounded-[15px] text-sm font-bold transition-all flex items-center gap-2 ${
                                            viewMode === key ? "bg-[#8B4513] text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                                        }`}
                                    >
                                        <Icon size={16} />
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                                <motion.div 
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-[40px] p-6 text-white relative overflow-hidden"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-20">
                                        <Package className="w-12 h-12" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-xs font-black uppercase tracking-wider opacity-80 mb-2">Total Inventory Value</p>
                                        <p className="text-2xl font-black mb-1">{reportData.summary.totalClosingValue.toLocaleString()} ብር</p>
                                        <p className="text-xs opacity-70">Current stock valuation</p>
                                    </div>
                                </motion.div>

                                <motion.div 
                                    className="bg-gradient-to-r from-red-500 to-red-600 rounded-[40px] p-6 text-white relative overflow-hidden"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-20">
                                        <TrendingDown className="w-12 h-12" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-xs font-black uppercase tracking-wider opacity-80 mb-2">Total Investment</p>
                                        <p className="text-2xl font-black mb-1">{reportData.summary.totalExpenses.toLocaleString()} ብር</p>
                                        <p className="text-xs opacity-70">Total purchased price + expenses</p>
                                    </div>
                                </motion.div>

                                <motion.div 
                                    className="bg-gradient-to-r from-green-500 to-green-600 rounded-[40px] p-6 text-white relative overflow-hidden"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-20">
                                        <DollarSign className="w-12 h-12" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-xs font-black uppercase tracking-wider opacity-80 mb-2">Net Profit</p>
                                        <p className="text-2xl font-black mb-1">{reportData.summary.netProfit.toLocaleString()} ብર</p>
                                        <p className="text-xs opacity-70">{reportData.summary.netProfitMargin.toFixed(1)}% margin</p>
                                    </div>
                                </motion.div>

                                <motion.div 
                                    className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-[40px] p-6 text-white relative overflow-hidden"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-20">
                                        <ShoppingCart className="w-12 h-12" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-xs font-black uppercase tracking-wider opacity-80 mb-2">Cost of Goods Sold</p>
                                        <p className="text-2xl font-black mb-1">{reportData.summary.totalConsumedValue.toLocaleString()} ብር</p>
                                        <p className="text-xs opacity-70">Total consumption value</p>
                                    </div>
                                </motion.div>

                                <motion.div 
                                    className={`rounded-[40px] p-6 text-white relative overflow-hidden ${
                                        reportData.summary.lowStockItemsCount > 0 || reportData.summary.nearStockOutItemsCount > 0
                                            ? "bg-gradient-to-r from-red-500 to-red-600"
                                            : "bg-gradient-to-r from-gray-500 to-gray-600"
                                    }`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-20">
                                        <AlertTriangle className="w-12 h-12" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-xs font-black uppercase tracking-wider opacity-80 mb-2">Stock Alerts</p>
                                        <p className="text-2xl font-black mb-1">
                                            {reportData.summary.lowStockItemsCount + reportData.summary.nearStockOutItemsCount}
                                        </p>
                                        <p className="text-xs opacity-70">Items need attention</p>
                                    </div>
                                </motion.div>
                            </div>        
                    {/* Content based on view mode */}
                            {viewMode === "summary" && (
                                <div className="space-y-8">
                                    {/* Inventory Movement Summary */}
                                    <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
                                        <h3 className="text-xl font-black mb-6 uppercase tracking-widest text-blue-600">Inventory Movement & Investment Summary</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                                            <div className="text-center p-4 bg-blue-50 rounded-3xl">
                                                <p className="text-2xl font-black text-blue-600">{reportData.summary.totalOpeningValue.toLocaleString()}</p>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Opening Value (ብር)</p>
                                            </div>
                                            <div className="text-center p-4 bg-green-50 rounded-3xl">
                                                <p className="text-2xl font-black text-green-600">{reportData.summary.totalPurchaseValue.toLocaleString()}</p>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Purchased Price (ብር)</p>
                                            </div>
                                            <div className="text-center p-4 bg-yellow-50 rounded-3xl">
                                                <p className="text-2xl font-black text-yellow-600">{reportData.summary.totalOtherExpenses.toLocaleString()}</p>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Other Expenses (ብር)</p>
                                            </div>
                                            <div className="text-center p-4 bg-red-50 rounded-3xl">
                                                <p className="text-2xl font-black text-red-600">{reportData.summary.totalExpenses.toLocaleString()}</p>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Total Investment (ብር)</p>
                                            </div>
                                            <div className="text-center p-4 bg-purple-50 rounded-3xl">
                                                <p className="text-2xl font-black text-purple-600">{reportData.summary.totalClosingValue.toLocaleString()}</p>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Closing Value (ብር)</p>
                                            </div>
                                        </div>

                                        {/* Top Consumed Items */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            <div>
                                                <h4 className="font-black text-gray-800 mb-4">Top Consumed Items (by Value)</h4>
                                                <div className="space-y-3">
                                                    {reportData.stockAnalysis
                                                        .sort((a: StockAnalysisItem, b: StockAnalysisItem) => b.consumedValue - a.consumedValue)
                                                        .slice(0, 5)
                                                        .map((item: StockAnalysisItem, idx: number) => (
                                                            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                                                                <div>
                                                                    <p className="font-bold text-sm">{item.name}</p>
                                                                    <p className="text-xs text-gray-500">{item.consumed} {item.unit} consumed</p>
                                                                </div>
                                                                <p className="font-black text-red-600">{item.consumedValue.toLocaleString()} ብር</p>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-black text-gray-800 mb-4">Fastest Moving Items (by Velocity)</h4>
                                                <div className="space-y-3">
                                                    {reportData.stockAnalysis
                                                        .sort((a: StockAnalysisItem, b: StockAnalysisItem) => b.usageVelocity - a.usageVelocity)
                                                        .slice(0, 5)
                                                        .map((item: StockAnalysisItem, idx: number) => (
                                                            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                                                                <div>
                                                                    <p className="font-bold text-sm">{item.name}</p>
                                                                    <p className="text-xs text-gray-500">{item.closingStock} {item.unit} remaining</p>
                                                                </div>
                                                                <p className="font-black text-blue-600">{item.usageVelocity.toFixed(1)}/{reportData.periodDays}d</p>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {viewMode === "detailed" && (
                                <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
                                    <h3 className="text-xl font-black mb-6 uppercase tracking-widest text-blue-600">Detailed Inventory Analysis</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-4 px-2 font-black text-xs uppercase tracking-wider text-gray-500">Item Name</th>
                                                    <th className="text-center py-4 px-2 font-black text-xs uppercase tracking-wider text-gray-500">Unit</th>
                                                    <th className="text-center py-4 px-2 font-black text-xs uppercase tracking-wider text-gray-500">Opening</th>
                                                    <th className="text-center py-4 px-2 font-black text-xs uppercase tracking-wider text-gray-500">Restocked</th>
                                                    <th className="text-center py-4 px-2 font-black text-xs uppercase tracking-wider text-gray-500">Sold</th>
                                                    <th className="text-center py-4 px-2 font-black text-xs uppercase tracking-wider text-gray-500">Remaining</th>
                                                    <th className="text-center py-4 px-2 font-black text-xs uppercase tracking-wider text-gray-500">Unit Cost</th>
                                                    <th className="text-right py-4 px-2 font-black text-xs uppercase tracking-wider text-gray-500">Total Value</th>
                                                    <th className="text-center py-4 px-2 font-black text-xs uppercase tracking-wider text-gray-500">Velocity</th>
                                                    <th className="text-center py-4 px-2 font-black text-xs uppercase tracking-wider text-gray-500">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {reportData.stockAnalysis.map((item: StockAnalysisItem, idx: number) => (
                                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                        <td className="py-4 px-2">
                                                            <div>
                                                                <p className="font-bold text-sm">{item.name}</p>
                                                                <p className="text-xs text-gray-500">{item.category}</p>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-2 text-center text-sm">{item.unit}</td>
                                                        <td className="py-4 px-2 text-center text-sm font-bold">{item.openingStock}</td>
                                                        <td className="py-4 px-2 text-center text-sm font-bold text-green-600">+{item.purchased}</td>
                                                        <td className="py-4 px-2 text-center text-sm font-bold text-red-600">-{item.consumed}</td>
                                                        <td className="py-4 px-2 text-center text-sm font-bold">{item.closingStock}</td>
                                                        <td className="py-4 px-2 text-center text-sm">{item.currentUnitCost} ብር</td>
                                                        <td className="py-4 px-2 text-right text-sm font-bold">{item.closingValue.toLocaleString()} ብር</td>
                                                        <td className="py-4 px-2 text-center text-sm">{item.usageVelocity.toFixed(1)}/{reportData.periodDays}d</td>
                                                        <td className="py-4 px-2 text-center">
                                                            {item.isLowStock ? (
                                                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">LOW STOCK</span>
                                                            ) : item.isNearStockOut ? (
                                                                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold">NEAR OUT</span>
                                                            ) : (
                                                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">OK</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="border-t-2 border-gray-200">
                                                <tr>
                                                    <td colSpan={7} className="py-4 text-right font-black text-gray-400 uppercase tracking-widest text-xs">
                                                        Total Inventory Value:
                                                    </td>
                                                    <td className="py-4 text-right pr-2 font-black text-2xl text-blue-600">
                                                        {reportData.summary.totalClosingValue.toLocaleString()} ብር
                                                    </td>
                                                    <td colSpan={2}></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {viewMode === "alerts" && (
                                <div className="space-y-8">
                                    {/* Stock Alerts */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Low Stock Items */}
                                        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
                                            <h3 className="text-xl font-black mb-6 uppercase tracking-widest text-red-600 flex items-center gap-2">
                                                <AlertTriangle size={20} />
                                                Low Stock Alerts
                                            </h3>
                                            {reportData.alerts.lowStockItems.length > 0 ? (
                                                <div className="space-y-4">
                                                    {reportData.alerts.lowStockItems.map((item: any, idx: number) => (
                                                        <div key={idx} className="bg-red-50 border border-red-200 rounded-3xl p-4">
                                                            <div className="flex justify-between items-center">
                                                                <div>
                                                                    <p className="font-black text-red-800">{item.name}</p>
                                                                    <p className="text-xs text-red-600">Below minimum limit</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-black text-red-600">{item.currentStock} {item.unit}</p>
                                                                    <p className="text-xs text-red-500">Min: {item.minLimit}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-center text-gray-500 py-8">No low stock alerts</p>
                                            )}
                                        </div>

                                        {/* Near Stock-Out Items */}
                                        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
                                            <h3 className="text-xl font-black mb-6 uppercase tracking-widest text-orange-600 flex items-center gap-2">
                                                <Clock size={20} />
                                                Near Stock-Out
                                            </h3>
                                            {reportData.alerts.nearStockOutItems.length > 0 ? (
                                                <div className="space-y-4">
                                                    {reportData.alerts.nearStockOutItems.map((item: any, idx: number) => (
                                                        <div key={idx} className="bg-orange-50 border border-orange-200 rounded-3xl p-4">
                                                            <div className="flex justify-between items-center">
                                                                <div>
                                                                    <p className="font-black text-orange-800">{item.name}</p>
                                                                    <p className="text-xs text-orange-600">Will run out soon</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-black text-orange-600">{item.currentStock} {item.unit}</p>
                                                                    <p className="text-xs text-orange-500">{item.daysUntilStockOut} days left</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-center text-gray-500 py-8">No near stock-out alerts</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Usage Analytics */}
                                    <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
                                        <h3 className="text-xl font-black mb-6 uppercase tracking-widest text-blue-600">Usage Analytics & Recommendations</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {/* High Velocity Items */}
                                            <div className="bg-blue-50 rounded-3xl p-6">
                                                <h4 className="font-black text-blue-800 mb-4">High Velocity Items</h4>
                                                <p className="text-xs text-blue-600 mb-4">Items with fastest consumption rates</p>
                                                <div className="space-y-2">
                                                    {reportData.stockAnalysis
                                                        .filter((item: StockAnalysisItem) => item.usageVelocity > 0)
                                                        .sort((a: StockAnalysisItem, b: StockAnalysisItem) => b.usageVelocity - a.usageVelocity)
                                                        .slice(0, 3)
                                                        .map((item: StockAnalysisItem, idx: number) => (
                                                            <div key={idx} className="flex justify-between text-sm">
                                                                <span className="text-blue-700">{item.name}</span>
                                                                <span className="font-bold text-blue-800">{item.usageVelocity.toFixed(1)}/{reportData.periodDays}d</span>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>

                                            {/* High Value Items */}
                                            <div className="bg-green-50 rounded-3xl p-6">
                                                <h4 className="font-black text-green-800 mb-4">High Value Items</h4>
                                                <p className="text-xs text-green-600 mb-4">Items with highest inventory value</p>
                                                <div className="space-y-2">
                                                    {reportData.stockAnalysis
                                                        .sort((a: StockAnalysisItem, b: StockAnalysisItem) => b.closingValue - a.closingValue)
                                                        .slice(0, 3)
                                                        .map((item: StockAnalysisItem, idx: number) => (
                                                            <div key={idx} className="flex justify-between text-sm">
                                                                <span className="text-green-700">{item.name}</span>
                                                                <span className="font-bold text-green-800">{item.closingValue.toLocaleString()} ብር</span>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>

                                            {/* Reorder Recommendations */}
                                            <div className="bg-purple-50 rounded-3xl p-6">
                                                <h4 className="font-black text-purple-800 mb-4">Reorder Soon</h4>
                                                <p className="text-xs text-purple-600 mb-4">Items to restock within 7 days</p>
                                                <div className="space-y-2">
                                                    {reportData.stockAnalysis
                                                        .filter((item: StockAnalysisItem) => item.daysUntilStockOut && item.daysUntilStockOut <= 7)
                                                        .sort((a: StockAnalysisItem, b: StockAnalysisItem) => (a.daysUntilStockOut || 0) - (b.daysUntilStockOut || 0))
                                                        .slice(0, 3)
                                                        .map((item: StockAnalysisItem, idx: number) => (
                                                            <div key={idx} className="flex justify-between text-sm">
                                                                <span className="text-purple-700">{item.name}</span>
                                                                <span className="font-bold text-purple-800">{item.daysUntilStockOut}d left</span>
                                                            </div>
                                                        ))}
                                                    {reportData.stockAnalysis.filter((item: StockAnalysisItem) => item.daysUntilStockOut && item.daysUntilStockOut <= 7).length === 0 && (
                                                        <p className="text-purple-600 text-sm">All items well stocked</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    )
}