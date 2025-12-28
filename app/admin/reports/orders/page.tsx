"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"
import { ArrowLeft, Download, Calendar, DollarSign, ShoppingBag, CreditCard, TrendingUp } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function OrdersReportPage() {
    const [filter, setFilter] = useState("today") // today, week, month, year
    const [data, setData] = useState<any>(null)
    const [stockItems, setStockItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { token } = useAuth()
    const { t } = useLanguage()

    useEffect(() => {
        if (token) {
            fetchReport()
        }
    }, [token, filter])

    const fetchReport = async () => {
        setLoading(true)
        try {
            // Fetch Report Data
            const res = await fetch(`/api/reports/sales?period=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            // Fetch Stock for Asset Valuation
            const stockRes = await fetch("/api/stock", {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.ok && stockRes.ok) {
                const report = await res.json()
                const stock = await stockRes.json()
                setData(report)
                setStockItems(stock)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const exportCSV = () => {
        if (!data || !data.orders) return
        const headers = ["Order ID", "Date", "Status", "Items", "Total", "Payment"]
        const rows = data.orders.map((o: any) => [
            o.orderNumber,
            new Date(o.createdAt).toLocaleDateString(),
            o.status,
            o.items.length,
            o.totalAmount,
            o.paymentMethod
        ])

        const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n")
        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `orders-report-${filter}.csv`
        a.click()
    }

    const StatCard = ({ icon: Icon, label, value, color }: any) => (
        <div className={`bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4`}>
            <div className={`p-4 rounded-2xl ${color} bg-opacity-10 text-opacity-100`}>
                <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
            </div>
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black text-slate-800">{value}</p>
            </div>
        </div>
    )

    return (
        <ProtectedRoute requiredRoles={["admin"]}>
            <div className="min-h-screen bg-[#f8faf7] p-8 font-sans">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <Link href="/admin/reports" className="flex items-center gap-2 text-gray-400 hover:text-[#2d5a41] font-bold mb-2 transition-colors">
                                <ArrowLeft size={16} /> Back to Reports
                            </Link>
                            <h1 className="text-4xl font-black text-slate-900">Orders Report</h1>
                            <p className="text-gray-500 font-medium mt-1">Detailed transaction history and sales analysis</p>
                        </div>
                        <div className="flex gap-2 bg-white p-2 rounded-[25px] shadow-sm">
                            {["today", "week", "month", "year"].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-6 py-3 rounded-[20px] font-bold capitalize transition-all ${filter === f ? "bg-[#2d5a41] text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-20 text-center">
                            <div className="w-10 h-10 border-4 border-[#2d5a41] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="font-bold text-gray-400">Loading Report...</p>
                        </div>
                    ) : (
                        <>
                            {(() => {
                                const oxStockValue = stockItems.filter(i => i.name.toLowerCase() === 'ox').reduce((sum, item) => sum + (item.quantity * (item.unitCost || 0)), 0);
                                const physicalStockValue = stockItems.reduce((sum, item) => sum + (item.quantity * (item.unitCost || 0)), 0) - oxStockValue;
                                const totalInvestment = (data?.summary.totalOxCost || 0) + (data?.summary.totalOtherExpenses || 0) + physicalStockValue;
                                const netRecovery = (data?.summary.totalRevenue || 0) - totalInvestment;

                                return (
                                    <>
                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                            <StatCard icon={DollarSign} label="Total Revenue" value={`${data?.summary.totalRevenue.toLocaleString()} ETB`} color="bg-emerald-500 text-emerald-600" />
                                            <StatCard icon={DollarSign} label="Total Expenses" value={`${totalInvestment.toLocaleString()} ETB`} color="bg-red-500 text-red-600" />
                                            <StatCard
                                                icon={TrendingUp}
                                                label="Net Profit"
                                                value={`${netRecovery.toLocaleString()} ETB`}
                                                color={netRecovery >= 0 ? "bg-emerald-500 text-emerald-600" : "bg-red-500 text-red-600"}
                                            />
                                            <StatCard icon={ShoppingBag} label="Orders" value={data?.summary.totalOrders} color="bg-blue-500 text-blue-600" />
                                            <button onClick={exportCSV} className="bg-[#2d5a41] text-white rounded-[2rem] p-6 flex flex-col items-center justify-center gap-2 hover:scale-105 transition-transform shadow-xl shadow-[#2d5a41]/20">
                                                <Download size={24} />
                                                <span className="font-bold">Export CSV</span>
                                            </button>
                                        </div>

                                        {/* Expense Breakdown */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Investment Analysis</h3>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-gray-500 font-medium">🐄 Total Ox Cost</span>
                                                        <span className="font-black text-xl">{data?.summary.totalOxCost.toLocaleString()} ETB</span>
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-gray-500 font-medium">📦 Physical Stock</span>
                                                        <span className="font-black text-xl">{physicalStockValue.toLocaleString()} ETB</span>
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-gray-500 font-medium">🛠️ Total Other Expenses</span>
                                                        <span className="font-black text-xl">{data?.summary.totalOtherExpenses.toLocaleString()} ETB</span>
                                                    </div>
                                                    <div className="pt-4 border-t border-gray-50 flex justify-between items-end">
                                                        <span className="text-gray-900 font-bold uppercase text-[10px] tracking-widest">Gross Expenses</span>
                                                        <span className="font-black text-2xl text-red-600">{totalInvestment.toLocaleString()} ETB</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-[#2d5a41] p-8 rounded-[40px] shadow-xl text-[#e2e7d8] relative overflow-hidden">
                                                <div className="absolute -right-10 -bottom-10 opacity-10">
                                                    <TrendingUp className="w-48 h-48" />
                                                </div>
                                                <h3 className="text-sm font-black uppercase tracking-widest opacity-60 mb-4">Performance Scorecard</h3>
                                                <div className="space-y-4 relative z-10">
                                                    <div className="flex justify-between items-end">
                                                        <span className="opacity-80 font-medium">Profit Margin</span>
                                                        <span className="font-black text-3xl">
                                                            {data?.summary.totalRevenue > 0
                                                                ? ((netRecovery / data.summary.totalRevenue) * 100).toFixed(1)
                                                                : 0}%
                                                        </span>
                                                    </div>
                                                    <p className="text-xs opacity-60">Calculated based on total revenue vs (Ox + Physical Stock + Others).</p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}

                            {/* Detailed Table */}
                            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 overflow-hidden">
                                <h3 className="text-xl font-bold mb-6">Transaction List</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">
                                                <th className="pb-4 pl-4">Order ID</th>
                                                <th className="pb-4">Date</th>
                                                <th className="pb-4">Status</th>
                                                <th className="pb-4">Items</th>
                                                <th className="pb-4">Payment</th>
                                                <th className="pb-4 pr-4 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {data?.orders.map((order: any) => (
                                                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-4 pl-4 font-bold text-slate-800">#{order.orderNumber}</td>
                                                    <td className="py-4 text-gray-500 text-sm">{new Date(order.createdAt).toLocaleString()}</td>
                                                    <td className="py-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === 'completed' ? 'bg-green-100 text-green-600' :
                                                            order.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-gray-600 text-sm max-w-xs truncate">
                                                        {order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(", ")}
                                                    </td>
                                                    <td className="py-4 capitalize font-medium text-gray-500">{order.paymentMethod}</td>
                                                    <td className="py-4 pr-4 text-right font-black text-slate-800">{order.totalAmount} ETB</td>
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
