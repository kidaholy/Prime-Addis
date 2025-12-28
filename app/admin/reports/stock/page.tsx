"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/context/auth-context"
import { ArrowLeft, Printer, Package, TrendingDown, TrendingUp } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function StockUsageReportPage() {
    const [filter, setFilter] = useState("today")
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const { token } = useAuth()

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

    return (
        <ProtectedRoute requiredRoles={["admin"]}>
            <div className="min-h-screen bg-[#f8faf7] p-8 font-sans print:bg-white print:p-0">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header - Hidden on Print */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                        <div>
                            <Link href="/admin/reports" className="flex items-center gap-2 text-gray-400 hover:text-[#2d5a41] font-bold mb-2 transition-colors">
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
                                        className={`px-4 py-2 rounded-[15px] text-sm font-bold capitalize transition-all ${filter === f ? "bg-[#2d5a41] text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                                            }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => window.print()}
                                className="bg-white text-[#2d5a41] p-4 rounded-[20px] shadow-sm hover:scale-105 transition-transform border border-gray-100"
                            >
                                <Printer size={20} />
                            </button>
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
                            <div className="w-10 h-10 border-4 border-[#2d5a41] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="font-bold text-gray-400">Loading Data...</p>
                        </div>
                    ) : (
                        <>
                            <StatCard
                                icon={TrendingDown}
                                label="Total Consumption"
                                value={`${((data?.summary?.totalBeef || 0) + (data?.summary?.totalMilk || 0) + (data?.summary?.totalDrinks || 0)).toLocaleString()} Units`}
                                color="bg-[#2d5a41] text-white"
                            />

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
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#2d5a41] mb-2">Beef Consumption</h3>
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

                            {/* Full Itemized Table */}
                            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 overflow-hidden mt-8">
                                <h3 className="text-xl font-black mb-6">Full Consumption Breakdown</h3>
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
            <Icon className={`w-6 h-6 ${color.includes('bg-[#2d5a41]') ? 'text-white' : color.replace('bg-', 'text-')}`} />
        </div>
        <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="text-2xl font-black text-slate-800">{value}</p>
        </div>
    </div>
)
