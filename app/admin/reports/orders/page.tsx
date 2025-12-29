"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/context/auth-context"
import { ReportExporter } from "@/lib/export-utils"
import { ArrowLeft, Download, FileText, Printer } from "lucide-react"
import Link from "next/link"

export default function OrdersReportPage() {
    const [filter, setFilter] = useState("today")
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { token } = useAuth()

    useEffect(() => {
        if (token) {
            fetchReport()
        }
    }, [token, filter])

    const fetchReport = async () => {
        setLoading(true)
        setError(null)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

        try {
            const res = await fetch(`/api/reports/sales?period=${filter}`, {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (res.ok) {
                const report = await res.json()
                setData(report)
            } else {
                const errorData = await res.json().catch(() => ({}))
                setError(errorData.message || `Error: ${res.status} ${res.statusText}`)
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                setError("Request timed out. The server might be busy or offline.")
            } else {
                console.error("Fetch report error:", err)
                setError(err.message || "An unexpected error occurred")
            }
        } finally {
            setLoading(false)
        }
    }

    const exportCSV = () => {
        if (!data || !data.orders) return

        const exportData = {
            title: "Orders Report",
            period: filter,
            headers: ["Order ID", "Date", "Status", "Items", "Total", "Payment Method"],
            data: data.orders.map((o: any) => ({
                "Order ID": o.orderNumber,
                "Date": new Date(o.createdAt).toLocaleDateString(),
                "Status": o.status,
                "Items": o.items.map((i: any) => `${i.quantity}x ${i.name}`).join(", "),
                "Total": `${o.totalAmount} ብር`,
                "Payment Method": o.paymentMethod
            })),
            summary: {
                "Total Orders": data.orders.length,
                "Completed Orders": data.orders.filter((o: any) => o.status === 'completed').length,
                "Pending Orders": data.orders.filter((o: any) => o.status === 'pending').length,
                "Cancelled Orders": data.orders.filter((o: any) => o.status === 'cancelled').length
            }
        }

        ReportExporter.exportToCSV(exportData)
    }

    const exportPDF = () => {
        if (!data || !data.orders) return

        const exportData = {
            title: "Orders Report",
            period: filter,
            headers: ["Order ID", "Date", "Status", "Items", "Total", "Payment Method"],
            data: data.orders.map((o: any) => ({
                "Order ID": o.orderNumber,
                "Date": new Date(o.createdAt).toLocaleDateString(),
                "Status": o.status,
                "Items": o.items.map((i: any) => `${i.quantity}x ${i.name}`).join(", "),
                "Total": `${o.totalAmount} ብር`,
                "Payment Method": o.paymentMethod
            })),
            summary: {
                "Total Orders": data.orders.length,
                "Completed Orders": data.orders.filter((o: any) => o.status === 'completed').length
            },
            metadata: {
                companyName: "Prime Addis Coffee"
            }
        }

        ReportExporter.exportToPDF(exportData)
    }

    const exportWord = () => {
        if (!data || !data.orders) return

        const exportData = {
            title: "Orders Report",
            period: filter,
            headers: ["Order ID", "Date", "Status", "Items", "Total", "Payment Method"],
            data: data.orders.map((o: any) => ({
                "Order ID": o.orderNumber,
                "Date": new Date(o.createdAt).toLocaleDateString(),
                "Status": o.status,
                "Items": o.items.map((i: any) => `${i.quantity}x ${i.name}`).join(", "),
                "Total": `${o.totalAmount} ብር`,
                "Payment Method": o.paymentMethod
            })),
            summary: {
                "Total Orders": data.orders.length,
                "Completed Orders": data.orders.filter((o: any) => o.status === 'completed').length,
                "Pending Orders": data.orders.filter((o: any) => o.status === 'pending').length,
                "Cancelled Orders": data.orders.filter((o: any) => o.status === 'cancelled').length
            },
            metadata: {
                companyName: "Prime Addis Coffee"
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
                            <h1 className="text-4xl font-black text-slate-900">Orders Report</h1>
                            <p className="text-gray-500 font-medium mt-1">Complete order history and transaction details</p>
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

                            {/* Export Options */}
                            <div className="flex gap-2">
                                <button
                                    onClick={exportWord}
                                    className="bg-[#8B4513] text-white p-4 rounded-[20px] shadow-sm hover:scale-105 transition-transform border border-gray-100 flex items-center gap-2"
                                >
                                    <FileText size={20} />
                                    <span className="hidden md:inline font-bold">Word</span>
                                </button>

                                <button
                                    onClick={exportPDF}
                                    className="bg-[#D2691E] text-white p-4 rounded-[20px] shadow-sm hover:scale-105 transition-transform border border-gray-100 flex items-center gap-2"
                                >
                                    <FileText size={20} />
                                    <span className="hidden md:inline font-bold">PDF</span>
                                </button>

                                <button
                                    onClick={exportCSV}
                                    className="bg-white text-[#8B4513] p-4 rounded-[20px] shadow-sm hover:scale-105 transition-transform border border-gray-100 flex items-center gap-2"
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
                        <h1 className="text-2xl font-black mb-2">Orders Report</h1>
                        <p className="text-sm">Period: {filter.toUpperCase()}</p>
                        <p className="text-sm text-gray-500">Generated: {new Date().toLocaleString()}</p>
                    </div>

                    {loading ? (
                        <div className="p-20 text-center print:hidden">
                            <div className="w-10 h-10 border-4 border-[#8B4513] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="font-bold text-gray-400">Loading Orders...</p>
                        </div>
                    ) : error ? (
                        <div className="p-20 text-center bg-red-50 rounded-[40px] border border-red-100 mb-8 print:hidden">
                            <div className="text-4xl mb-4">⚠️</div>
                            <h3 className="text-xl font-bold text-red-800 mb-2">Failed to Load Report</h3>
                            <p className="text-red-600 mb-6">{error}</p>
                            <button
                                onClick={fetchReport}
                                className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Order Summary Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4">
                                    <div className="p-4 rounded-2xl bg-blue-500 bg-opacity-10">
                                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                            {data?.orders?.length || 0}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Orders</p>
                                        <p className="text-2xl font-black text-slate-800">{data?.orders?.length || 0}</p>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4">
                                    <div className="p-4 rounded-2xl bg-green-500 bg-opacity-10">
                                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                            ✓
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Completed</p>
                                        <p className="text-2xl font-black text-slate-800">
                                            {data?.orders?.filter((o: any) => o.status === 'completed').length || 0}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4">
                                    <div className="p-4 rounded-2xl bg-yellow-500 bg-opacity-10">
                                        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                            ⏳
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending</p>
                                        <p className="text-2xl font-black text-slate-800">
                                            {data?.orders?.filter((o: any) => o.status === 'pending').length || 0}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4">
                                    <div className="p-4 rounded-2xl bg-red-500 bg-opacity-10">
                                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                            ✕
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cancelled</p>
                                        <p className="text-2xl font-black text-slate-800">
                                            {data?.orders?.filter((o: any) => o.status === 'cancelled').length || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Orders Table */}
                            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 overflow-hidden">
                                <h3 className="text-xl font-black mb-6 uppercase tracking-widest text-[#8B4513]">Order Details</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">
                                                <th className="pb-4 pl-4">Order ID</th>
                                                <th className="pb-4">Date & Time</th>
                                                <th className="pb-4">Status</th>
                                                <th className="pb-4">Items Ordered</th>
                                                <th className="pb-4">Payment Method</th>
                                                <th className="pb-4 pr-4 text-right">Total Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {data?.orders?.map((order: any) => (
                                                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-4 pl-4 font-bold text-slate-800">
                                                        <div className="flex flex-col">
                                                            <span>#{order.orderNumber}</span>
                                                            <span className="text-[10px] text-gray-400 font-medium">ID: {order._id.slice(-6)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-gray-600 text-sm">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                                                            <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${order.status === 'completed' ? 'bg-green-100 text-green-600' :
                                                                order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                                                                    'bg-yellow-100 text-yellow-600'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-gray-600 text-sm">
                                                        <div className="max-w-xs">
                                                            {order.items.map((item: any, idx: number) => (
                                                                <div key={idx} className="flex justify-between text-xs mb-1">
                                                                    <span className="text-gray-700">{item.name}</span>
                                                                    <span className="font-bold text-gray-500">×{item.quantity}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="py-4">
                                                        <span className="text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                                                            {order.paymentMethod}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 pr-4 text-right font-black text-slate-800 text-lg">
                                                        {order.totalAmount} <span className="text-xs font-bold text-gray-400">ብር</span>
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
