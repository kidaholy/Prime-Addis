"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/context/auth-context"
import { useSettings } from "@/context/settings-context"
import { ReportExporter } from "@/lib/export-utils"
import { ArrowLeft, Printer, Package, TrendingDown, TrendingUp, Download, FileText } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function StockUsageReportPage() {
    const [filter, setFilter] = useState("today")
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const { token } = useAuth()
    const { settings } = useSettings()

    useEffect(() => {
        if (token) fetchReport()
    }, [token, filter])

    const fetchReport = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/reports/stock-usage?period=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const report = await res.json()
                setData(report)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const exportStockCSV = () => {
        if (!data) return

        const exportData = {
            title: "Comprehensive Stock Usage Report",
            period: filter,
            headers: ["Stock Item", "Category", "Supplier", "Unit Cost", "Purchased", "Consumed", "Remaining", "Net Stock", "Stock Value", "Unit", "Status"],
            data: data.stockAnalysis.map((item: any) => ({
                "Stock Item": item.name,
                "Category": item.category,
                "Supplier": item.supplier,
                "Unit Cost": item.unitCost.toFixed(2),
                "Purchased": item.purchased.toString(),
                "Consumed": item.consumed.toString(),
                "Remaining": item.remaining.toString(),
                "Net Stock": item.netStock.toString(),
                "Stock Value": item.stockValue.toFixed(2),
                "Unit": item.unit,
                "Status": item.status || 'active'
            })),
            summary: {
                "Total Revenue": `ብር${data.summary.totalRevenue.toLocaleString()}`,
                "Total Stock Value": `ብር${data.summary.totalStockValue.toLocaleString()}`,
                "Total Purchase Value": `ብር${data.summary.totalPurchaseValue.toLocaleString()}`,
                "Total Consumed Value": `ብር${data.summary.totalConsumedValue.toLocaleString()}`,
                "Average Order Value": `ብር${data.revenue.averageOrderValue.toFixed(2)}`,
                "Total Beef Consumed": `${data.summary.totalBeef.toFixed(1)} kg`,
                "Total Milk Consumed": `${data.summary.totalMilk.toFixed(1)} liters`,
                "Total Drinks Consumed": `${data.summary.totalDrinks} pieces`,
                "Total Orders": data.summary.totalOrders
            }
        }

        ReportExporter.exportToCSV(exportData)
    }

    const exportStockPDF = () => {
        if (!data) return

        const exportData = {
            title: "Comprehensive Stock Usage Report",
            period: filter,
            headers: ["Stock Item", "Category", "Supplier", "Unit Cost", "Purchased", "Consumed", "Remaining", "Net Stock", "Stock Value"],
            data: data.stockAnalysis.map((item: any) => ({
                "Stock Item": item.name,
                "Category": item.category,
                "Supplier": item.supplier,
                "Unit Cost": `ብር${item.unitCost.toFixed(2)}`,
                "Purchased": `${item.purchased} ${item.unit}`,
                "Consumed": `${item.consumed} ${item.unit}`,
                "Remaining": `${item.remaining} ${item.unit}`,
                "Net Stock": `${item.netStock} ${item.unit}`,
                "Stock Value": `ብር${item.stockValue.toFixed(2)}`
            })),
            summary: {
                "Total Revenue": `ብር${data.summary.totalRevenue.toLocaleString()}`,
                "Total Stock Value": `ብር${data.summary.totalStockValue.toLocaleString()}`,
                "Average Order Value": `ብር${data.revenue.averageOrderValue.toFixed(2)}`,
                "Total Beef Consumed": `${data.summary.totalBeef.toFixed(1)} kg`,
                "Total Milk Consumed": `${data.summary.totalMilk.toFixed(1)} liters`,
                "Total Drinks Consumed": `${data.summary.totalDrinks} pieces`
            },
            metadata: {
                companyName: settings.app_name || "Prime Addis"
            }
        }

        ReportExporter.exportToPDF(exportData)
    }

    const exportStockWord = () => {
        if (!data) return

        const exportData = {
            title: "Comprehensive Stock Usage Report",
            period: filter,
            headers: ["Stock Item", "Category", "Supplier", "Unit Cost", "Purchased", "Consumed", "Remaining", "Net Stock", "Stock Value", "Unit", "Status"],
            data: data.stockAnalysis.map((item: any) => ({
                "Stock Item": item.name,
                "Category": item.category,
                "Supplier": item.supplier,
                "Unit Cost": item.unitCost.toFixed(2),
                "Purchased": item.purchased.toString(),
                "Consumed": item.consumed.toString(),
                "Remaining": item.remaining.toString(),
                "Net Stock": item.netStock.toString(),
                "Stock Value": item.stockValue.toFixed(2),
                "Unit": item.unit,
                "Status": item.status || 'active'
            })),
            summary: {
                "Total Revenue": `ብር${data.summary.totalRevenue.toLocaleString()}`,
                "Total Stock Value": `ብር${data.summary.totalStockValue.toLocaleString()}`,
                "Total Purchase Value": `ብር${data.summary.totalPurchaseValue.toLocaleString()}`,
                "Total Consumed Value": `ብር${data.summary.totalConsumedValue.toLocaleString()}`,
                "Average Order Value": `ብር${data.revenue.averageOrderValue.toFixed(2)}`,
                "Total Beef Consumed": `${data.summary.totalBeef.toFixed(1)} kg`,
                "Total Milk Consumed": `${data.summary.totalMilk.toFixed(1)} liters`,
                "Total Drinks Consumed": `${data.summary.totalDrinks} pieces`,
                "Total Orders": data.summary.totalOrders
            },
            metadata: {
                companyName: settings.app_name || "Prime Addis"
            }
        }

        ReportExporter.exportToWord(exportData)
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
                            <h1 className="text-4xl font-black text-slate-900">Stock Usage Report</h1>
                            <p className="text-gray-500 font-medium mt-1">Ingredient consumption analysis based on orders</p>
                        </div>

                        <div className="flex gap-4 items-center">
                            <div className="flex gap-2 bg-white p-1.5 rounded-[20px] shadow-sm">
                                {["today", "week", "month", "year"].map((f) => (
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

                            {/* Enhanced Export Options */}
                            <div className="flex gap-2">
                                <button
                                    onClick={exportStockWord}
                                    className="bg-[#1a1a1a] text-white p-4 rounded-[20px] shadow-sm hover:scale-105 transition-transform border border-gray-100 flex items-center gap-2"
                                >
                                    <FileText size={20} />
                                    <span className="hidden md:inline font-bold">DOC</span>
                                </button>

                                <button
                                    onClick={exportStockPDF}
                                    className="bg-[#8B4513] text-white p-4 rounded-[20px] shadow-sm hover:scale-105 transition-transform border border-gray-100 flex items-center gap-2"
                                >
                                    <FileText size={20} />
                                    <span className="hidden md:inline font-bold">PDF</span>
                                </button>

                                <button
                                    onClick={exportStockCSV}
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
                        <h1 className="text-2xl font-black mb-2">Stock Consumption Report</h1>
                        <p className="text-sm">Period: {filter.toUpperCase()}</p>
                        <p className="text-sm text-gray-500">Generated: {new Date().toLocaleString()}</p>
                    </div>

                    {loading ? (
                        <div className="p-20 text-center print:hidden">
                            <div className="w-10 h-10 border-4 border-[#8B4513] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="font-bold text-gray-400">Loading Data...</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                                <StatCard
                                    icon={TrendingDown}
                                    label="Total Revenue"
                                    value={`ብር${(data?.summary?.totalRevenue || 0).toLocaleString()}`}
                                    color="bg-green-500 text-green-600"
                                />
                                <StatCard
                                    icon={TrendingDown}
                                    label="Total Consumption"
                                    value={`${((data?.summary?.totalBeef || 0) + (data?.summary?.totalMilk || 0) + (data?.summary?.totalDrinks || 0)).toLocaleString()} Units`}
                                    color="bg-[#8B4513] text-white"
                                />
                                <StatCard
                                    icon={TrendingUp}
                                    label="Total Purchases"
                                    value={`${data?.stockAnalysis?.reduce((sum: number, s: any) => sum + s.purchased, 0).toLocaleString()} Units`}
                                    color="bg-emerald-500 text-emerald-600"
                                />
                                <StatCard
                                    icon={Package}
                                    label="Stock Value"
                                    value={`ብር${(data?.summary?.totalStockValue || 0).toLocaleString()}`}
                                    color="bg-blue-500 text-blue-600"
                                />
                                <StatCard
                                    icon={TrendingDown}
                                    label="Net Stock Total"
                                    value={`${data?.stockAnalysis?.reduce((sum: number, s: any) => sum + s.netStock, 0).toLocaleString()} Units`}
                                    color="bg-purple-500 text-purple-600"
                                />
                                <StatCard
                                    icon={TrendingDown}
                                    label="Restock Required"
                                    value={`${data?.stockAnalysis?.filter((s: any) => (s.remaining <= s.minLimit)).length} SKUs`}
                                    color="bg-red-500 text-red-600"
                                />
                            </div>

                            {/* Revenue Analysis */}
                            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 overflow-hidden mt-8">
                                <h3 className="text-xl font-black mb-6 uppercase tracking-widest text-green-600">Revenue Analysis</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-3xl">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-green-600 mb-2">Total Revenue</h4>
                                        <p className="text-3xl font-black text-slate-900">ብር{(data?.summary?.totalRevenue || 0).toLocaleString()}</p>
                                        <p className="text-xs text-gray-500 mt-2">{filter.toUpperCase()} period</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-blue-600 mb-2">Avg Order Value</h4>
                                        <p className="text-3xl font-black text-slate-900">ብር{(data?.revenue?.averageOrderValue || 0).toFixed(2)}</p>
                                        <p className="text-xs text-gray-500 mt-2">Per order</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-3xl">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 mb-2">Stock Investment</h4>
                                        <p className="text-3xl font-black text-slate-900">${(data?.summary?.totalStockValue || 0).toLocaleString()}</p>
                                        <p className="text-xs text-gray-500 mt-2">Current value</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-3xl">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-orange-600 mb-2">Consumed Value</h4>
                                        <p className="text-3xl font-black text-slate-900">${(data?.summary?.totalConsumedValue || 0).toLocaleString()}</p>
                                        <p className="text-xs text-gray-500 mt-2">Cost of goods sold</p>
                                    </div>
                                </div>
                            </div>

                            {/* Consumption Highlights */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                                        <span className="text-8xl leading-none">🥩</span>
                                    </div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#8B4513] mb-2">Beef Consumption</h3>
                                    <p className="text-4xl font-black text-slate-900">{data?.summary?.totalBeef?.toFixed(1) || 0} <span className="text-sm font-bold uppercase">kg</span></p>
                                    <div className="mt-6 space-y-2">
                                        {data?.usage?.find((u: any) => u.unit === 'kg')?.items.slice(0, 3).map((item: any, i: number) => (
                                            <div key={i} className="flex justify-between text-xs font-medium">
                                                <span className="text-gray-400">{item.name}</span>
                                                <span className="text-gray-600 font-bold">{item.quantity.toFixed(1)} kg</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                                        <span className="text-8xl leading-none">🥛</span>
                                    </div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 mb-2">Liquid Consumption</h3>
                                    <p className="text-4xl font-black text-slate-900">{data?.summary?.totalMilk?.toFixed(1) || 0} <span className="text-sm font-bold uppercase">Liters</span></p>
                                    <div className="mt-6 space-y-2">
                                        {data?.usage?.find((u: any) => u.unit === 'liter')?.items.slice(0, 3).map((item: any, i: number) => (
                                            <div key={i} className="flex justify-between text-xs font-medium">
                                                <span className="text-gray-400">{item.name}</span>
                                                <span className="text-gray-600 font-bold">{item.quantity.toFixed(1)} L</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                                        <span className="text-8xl leading-none">🥤</span>
                                    </div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-orange-500 mb-2">Botled Consumption</h3>
                                    <p className="text-4xl font-black text-slate-900">{data?.summary?.totalDrinks?.toLocaleString() || 0} <span className="text-sm font-bold uppercase">Pieces</span></p>
                                    <div className="mt-6 space-y-2">
                                        {data?.usage?.find((u: any) => u.unit === 'piece')?.items.slice(0, 3).map((item: any, i: number) => (
                                            <div key={i} className="flex justify-between text-xs font-medium">
                                                <span className="text-gray-400">{item.name}</span>
                                                <span className="text-gray-600 font-bold">{item.quantity} pcs</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>

                            {/* Comprehensive Stock Analysis */}
                            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 overflow-hidden mt-8">
                                <h3 className="text-xl font-black mb-6">Comprehensive Stock Analysis</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">
                                                <th className="pb-4 pl-4">Stock Item</th>
                                                <th className="pb-4">Category</th>
                                                <th className="pb-4">Supplier</th>
                                                <th className="pb-4 text-right">Unit Cost</th>
                                                <th className="pb-4 text-right">Purchased ({filter})</th>
                                                <th className="pb-4 text-right">Consumed ({filter})</th>
                                                <th className="pb-4 text-right">Remaining</th>
                                                <th className="pb-4 text-right">Net Stock</th>
                                                <th className="pb-4 text-right">Stock Value</th>
                                                <th className="pb-4 text-right pr-4">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {data?.stockAnalysis?.map((item: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-4 pl-4 font-bold text-slate-800">
                                                        <div className="flex flex-col">
                                                            <span>{item.name}</span>
                                                            <span className="text-[10px] text-gray-400 font-medium">ID: {item.id.slice(-6)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4">
                                                        <span className="text-[9px] font-black uppercase tracking-wider bg-gray-100 text-gray-400 px-3 py-1 rounded-full">
                                                            {item.category}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-sm text-gray-600">
                                                        {item.supplier}
                                                    </td>
                                                    <td className="py-4 text-right font-bold text-gray-700">
                                                        ${item.unitCost.toFixed(2)}
                                                    </td>
                                                    <td className="py-4 text-right font-black text-emerald-500 text-lg">
                                                        {item.purchased.toLocaleString()} <span className="text-xs font-bold">{item.unit}</span>
                                                    </td>
                                                    <td className="py-4 text-right font-black text-red-400 text-lg">
                                                        {item.consumed.toLocaleString()} <span className="text-xs font-bold">{item.unit}</span>
                                                    </td>
                                                    <td className={`py-4 text-right font-black text-lg ${item.remaining <= (item.minLimit || 0) || item.status === 'finished' ? 'text-red-600' : 'text-slate-800'}`}>
                                                        {item.status === 'finished' ? (
                                                            <span className="text-sm bg-gray-100 text-gray-500 px-3 py-1 rounded-full border border-gray-200 uppercase tracking-tighter">🏁 Finished</span>
                                                        ) : (
                                                            <>
                                                                {item.remaining.toLocaleString()} <span className="text-xs font-bold">{item.unit}</span>
                                                                {item.remaining <= (item.minLimit || 0) && (
                                                                    <div className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">Low Stock</div>
                                                                )}
                                                            </>
                                                        )}
                                                    </td>
                                                    <td className={`py-4 text-right font-black text-lg ${item.netStock < 0 ? 'text-red-600' : item.netStock === 0 ? 'text-yellow-600' : 'text-blue-600'}`}>
                                                        {item.netStock.toLocaleString()} <span className="text-xs font-bold">{item.unit}</span>
                                                        {item.netStock < 0 && (
                                                            <div className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">Overconsumed</div>
                                                        )}
                                                        {item.netStock === 0 && (
                                                            <div className="text-[10px] font-bold text-yellow-500 uppercase tracking-tighter">Exact Match</div>
                                                        )}
                                                    </td>
                                                    <td className="py-4 text-right font-bold text-green-600">
                                                        ${item.stockValue.toLocaleString()}
                                                    </td>
                                                    <td className="py-4 text-right pr-4">
                                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.status === 'active' ? 'bg-green-100 text-green-600' :
                                                                item.status === 'finished' ? 'bg-gray-100 text-gray-600' :
                                                                    'bg-yellow-100 text-yellow-600'
                                                            }`}>
                                                            {item.status || 'active'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Detailed Stock Inventory List */}
                            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 overflow-hidden mt-8">
                                <h3 className="text-xl font-black mb-6 uppercase tracking-widest text-[#8B4513]">Complete Stock Inventory</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {data?.stockAnalysis?.map((item: any, idx: number) => (
                                        <div key={idx} className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-3xl border border-gray-100 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-black text-slate-800 text-lg">{item.name}</h4>
                                                    <p className="text-xs text-gray-500 uppercase tracking-wider">{item.category}</p>
                                                </div>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.status === 'active' ? 'bg-green-100 text-green-600' :
                                                        item.status === 'finished' ? 'bg-gray-100 text-gray-600' :
                                                            'bg-yellow-100 text-yellow-600'
                                                    }`}>
                                                    {item.status || 'active'}
                                                </span>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-gray-500">Current Stock:</span>
                                                    <span className="text-sm font-bold">{item.remaining} {item.unit}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-gray-500">Net Stock:</span>
                                                    <span className={`text-sm font-bold ${item.netStock < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                                        {item.netStock} {item.unit}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-gray-500">Unit Cost:</span>
                                                    <span className="text-sm font-bold">${item.unitCost.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-gray-500">Stock Value:</span>
                                                    <span className="text-sm font-bold text-green-600">${item.stockValue.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-gray-500">Consumed ({filter}):</span>
                                                    <span className="text-sm font-bold text-red-500">{item.consumed} {item.unit}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-gray-500">Supplier:</span>
                                                    <span className="text-xs text-gray-700">{item.supplier}</span>
                                                </div>

                                                {item.remaining <= (item.minLimit || 0) && item.status !== 'finished' && (
                                                    <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mt-3">
                                                        <p className="text-xs font-bold text-red-600 uppercase tracking-wider">⚠️ Low Stock Alert</p>
                                                        <p className="text-xs text-red-500">Min limit: {item.minLimit || 0} {item.unit}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Full Itemized Table */}
                            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 overflow-hidden mt-8">
                                <h3 className="text-xl font-black mb-6 uppercase tracking-widest text-[#8B4513]">Menu Item Consumption</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">
                                                <th className="pb-4 pl-4">Menu Item</th>
                                                <th className="pb-4">Category</th>
                                                <th className="pb-4 text-right pr-4">Total Sold Consumption</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {data?.usage?.flatMap((u: any) => u.items).map((item: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-4 pl-4 font-bold text-slate-800">{item.name}</td>
                                                    <td className="py-4">
                                                        <span className="text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                                                            {item.unit} based
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-right pr-4 font-black text-slate-800 text-lg">
                                                        {item.quantity.toLocaleString()} <span className="text-xs text-gray-400 uppercase font-bold">{item.unit}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
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

const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className={`bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4`}>
        <div className={`p-4 rounded-2xl ${color} bg-opacity-10 text-opacity-100`}>
            <Icon className={`w-6 h-6 ${color.includes('bg-[#8B4513]') ? 'text-white' : color.replace('bg-', 'text-')}`} />
        </div>
        <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="text-2xl font-black text-slate-800">{value}</p>
        </div>
    </div>
)
