"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/context/auth-context"
import { useSettings } from "@/context/settings-context"
import { ReportExporter } from "@/lib/export-utils"
import { OrderDetailsModal } from "@/components/order-details-modal"
import { ArrowLeft, Download, FileText, Printer, Eye } from "lucide-react"
import Link from "next/link"

export default function OrdersReportPage() {
    const [filter, setFilter] = useState("today")
    const [statusFilter, setStatusFilter] = useState("all")
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [showOrderDetails, setShowOrderDetails] = useState(false)
    const { token } = useAuth()
    const { settings } = useSettings()

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

        const ordersToExport = statusFilter === "all" ? data.orders : filteredOrders

        const exportData = {
            title: `Orders Report${statusFilter !== "all" ? ` - ${statusFilter.toUpperCase()} Orders` : ""}`,
            period: filter,
            headers: ["Order ID", "Date", "Status", "Menu Items", "Quantities", "Item Prices", "Total", "Payment Method"],
            data: ordersToExport.map((o: any) => ({
                "Order ID": o.orderNumber,
                "Date": new Date(o.createdAt).toLocaleDateString(),
                "Status": o.status,
                "Menu Items": o.items.map((i: any) => i.name).join(" | "),
                "Quantities": o.items.map((i: any) => `${i.name}: ${i.quantity}`).join(" | "),
                "Item Prices": o.items.map((i: any) => `${i.name}: ${i.price} ብር`).join(" | "),
                "Total": `${o.totalAmount} ብር`,
                "Payment Method": o.paymentMethod
            })),
            summary: {
                "Total Orders": data.orders.length,
                "Completed Orders": data.orders.filter((o: any) => o.status === 'completed').length,
                "Pending Orders": data.orders.filter((o: any) => o.status === 'pending').length,
                "Cancelled Orders": data.orders.filter((o: any) => o.status === 'cancelled').length,
                "Filtered Results": statusFilter !== "all" ? `${ordersToExport.length} ${statusFilter} orders` : "All orders shown"
            }
        }

        ReportExporter.exportToCSV(exportData)
    }

    const exportPDF = () => {
        if (!data || !data.orders) return

        const ordersToExport = statusFilter === "all" ? data.orders : filteredOrders

        const exportData = {
            title: `Orders Report${statusFilter !== "all" ? ` - ${statusFilter.toUpperCase()} Orders` : ""}`,
            period: filter,
            headers: ["Order ID", "Date", "Status", "Menu Items", "Quantities", "Total", "Payment Method"],
            data: ordersToExport.map((o: any) => ({
                "Order ID": o.orderNumber,
                "Date": new Date(o.createdAt).toLocaleDateString(),
                "Status": o.status,
                "Menu Items": o.items.map((i: any) => i.name).join(", "),
                "Quantities": o.items.map((i: any) => `${i.quantity}x ${i.name}`).join(", "),
                "Total": `${o.totalAmount} ብር`,
                "Payment Method": o.paymentMethod
            })),
            summary: {
                "Total Orders": data.orders.length,
                "Completed Orders": data.orders.filter((o: any) => o.status === 'completed').length,
                "Filtered Results": statusFilter !== "all" ? `${ordersToExport.length} ${statusFilter} orders` : "All orders shown"
            },
            metadata: {
                companyName: settings.app_name || "Prime Addis"
            }
        }

        ReportExporter.exportToPDF(exportData)
    }

    const exportWord = () => {
        if (!data || !data.orders) return

        const ordersToExport = statusFilter === "all" ? data.orders : filteredOrders

        const exportData = {
            title: `Orders Report${statusFilter !== "all" ? ` - ${statusFilter.toUpperCase()} Orders` : ""}`,
            period: filter,
            headers: ["Order ID", "Date", "Status", "Menu Items", "Quantities", "Total", "Payment Method"],
            data: ordersToExport.map((o: any) => ({
                "Order ID": o.orderNumber,
                "Date": new Date(o.createdAt).toLocaleDateString(),
                "Status": o.status,
                "Menu Items": o.items.map((i: any) => i.name).join(", "),
                "Quantities": o.items.map((i: any) => `${i.quantity}x ${i.name}`).join(", "),
                "Total": `${o.totalAmount} ብር`,
                "Payment Method": o.paymentMethod
            })),
            summary: {
                "Total Orders": data.orders.length,
                "Completed Orders": data.orders.filter((o: any) => o.status === 'completed').length,
                "Pending Orders": data.orders.filter((o: any) => o.status === 'pending').length,
                "Cancelled Orders": data.orders.filter((o: any) => o.status === 'cancelled').length,
                "Filtered Results": statusFilter !== "all" ? `${ordersToExport.length} ${statusFilter} orders` : "All orders shown"
            },
            metadata: {
                companyName: settings.app_name || "Prime Addis"
            }
        }

        ReportExporter.exportToWord(exportData)
    }

    const handleViewOrder = (order: any) => {
        setSelectedOrder(order)
        setShowOrderDetails(true)
    }

    // Filter orders based on status filter
    const filteredOrders = data?.orders?.filter((order: any) => {
        if (statusFilter === "all") return true
        return order.status === statusFilter
    }) || []

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

                            {/* Status Filter */}
                            <div className="flex gap-2 bg-white p-1.5 rounded-[20px] shadow-sm">
                                {[
                                    { key: "all", label: "All", icon: "📋" },
                                    { key: "completed", label: "Completed", icon: "✅" },
                                    { key: "pending", label: "Pending", icon: "⏳" },
                                    { key: "cancelled", label: "Cancelled", icon: "❌" }
                                ].map((status) => (
                                    <button
                                        key={status.key}
                                        onClick={() => setStatusFilter(status.key)}
                                        className={`px-3 py-2 rounded-[15px] text-xs font-bold transition-all flex items-center space-x-1 ${statusFilter === status.key ? "bg-[#D2691E] text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                                            }`}
                                    >
                                        <span>{status.icon}</span>
                                        <span>{status.label}</span>
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
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black uppercase tracking-widest text-[#8B4513]">Order Details</h3>
                                    {statusFilter !== "all" && (
                                        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                            Showing: {statusFilter} orders ({filteredOrders.length})
                                        </div>
                                    )}
                                </div>
                                
                                {/* Menu Items Summary */}
                                {data?.orders && data.orders.length > 0 && (
                                    <div className="mb-8 p-6 bg-gradient-to-r from-[#8B4513]/10 to-[#D2691E]/10 rounded-2xl border border-[#8B4513]/20">
                                        <h4 className="text-lg font-bold text-[#8B4513] mb-4">Popular Menu Items</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {(() => {
                                                // Calculate menu item popularity (excluding cancelled orders)
                                                const itemStats: { [key: string]: { count: number, revenue: number } } = {}
                                                
                                                data.orders
                                                    .filter((order: any) => order.status !== 'cancelled') // Exclude cancelled orders
                                                    .forEach((order: any) => {
                                                        order.items?.forEach((item: any) => {
                                                            if (!itemStats[item.name]) {
                                                                itemStats[item.name] = { count: 0, revenue: 0 }
                                                            }
                                                            itemStats[item.name].count += item.quantity
                                                            itemStats[item.name].revenue += item.price * item.quantity
                                                        })
                                                    })
                                                
                                                const sortedItems = Object.entries(itemStats)
                                                    .sort(([,a], [,b]) => b.count - a.count)
                                                    .slice(0, 3)
                                                
                                                return sortedItems.map(([itemName, stats], index) => (
                                                    <div key={itemName} className="bg-white rounded-xl p-4 border border-[#8B4513]/20">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-2xl">
                                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                                            </span>
                                                            <span className="text-xs font-bold text-[#8B4513] bg-[#8B4513]/10 px-2 py-1 rounded-full">
                                                                #{index + 1}
                                                            </span>
                                                        </div>
                                                        <h5 className="font-bold text-gray-800 mb-1">{itemName}</h5>
                                                        <p className="text-sm text-gray-600">
                                                            {stats.count} orders • {stats.revenue.toFixed(2)} ብር
                                                        </p>
                                                    </div>
                                                ))
                                            })()}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="overflow-x-auto">
                                    {filteredOrders.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="text-6xl mb-4">
                                                {statusFilter === "cancelled" ? "❌" : 
                                                 statusFilter === "completed" ? "✅" : 
                                                 statusFilter === "pending" ? "⏳" : "📋"}
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-600 mb-2">
                                                No {statusFilter === "all" ? "" : statusFilter} orders found
                                            </h3>
                                            <p className="text-gray-500">
                                                {statusFilter === "all" 
                                                    ? `No orders found for ${filter} period.`
                                                    : `No ${statusFilter} orders found for ${filter} period.`
                                                }
                                            </p>
                                            {statusFilter !== "all" && (
                                                <button
                                                    onClick={() => setStatusFilter("all")}
                                                    className="mt-4 bg-[#8B4513] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#D2691E] transition-colors"
                                                >
                                                    Show All Orders
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-xs font-black text-gray-400 uppercase tracking-widest">
                                                <th className="pb-4 pl-4">Order ID</th>
                                                <th className="pb-4">Date & Time</th>
                                                <th className="pb-4">Status</th>
                                                <th className="pb-4">Menu Items & Details</th>
                                                <th className="pb-4">Payment Method</th>
                                                <th className="pb-4 pr-4 text-right">Total Amount</th>
                                                <th className="pb-4 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredOrders.map((order: any) => (
                                                <tr key={order._id} className={`hover:bg-gray-50 transition-colors ${order.status === 'cancelled' ? 'bg-red-50/30' : ''}`}>
                                                    <td className="py-4 pl-4 font-bold text-slate-800">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center space-x-2">
                                                                <span>#{order.orderNumber}</span>
                                                                {order.status === 'cancelled' && (
                                                                    <span className="text-red-500 text-xs">❌</span>
                                                                )}
                                                            </div>
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
                                                        <div className="max-w-sm">
                                                            <div className="space-y-2">
                                                                {order.items.map((item: any, idx: number) => (
                                                                    <div key={idx} className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                                                                        <div className="flex justify-between items-start">
                                                                            <div className="flex-1">
                                                                                <div className="font-medium text-gray-800">{item.name}</div>
                                                                                {item.category && (
                                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                                        <span className="bg-gray-200 px-2 py-0.5 rounded-full">
                                                                                            {item.category}
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                                {item.notes && (
                                                                                    <div className="text-xs text-blue-600 mt-1 italic">
                                                                                        Note: {item.notes}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="text-right ml-3">
                                                                                <div className="font-bold text-[#8B4513]">×{item.quantity}</div>
                                                                                <div className="text-xs text-gray-500">
                                                                                    {item.price} ብር each
                                                                                </div>
                                                                                <div className="text-xs font-medium text-gray-700">
                                                                                    = {(item.price * item.quantity).toFixed(2)} ብር
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                <div className="mt-2 pt-2 border-t border-gray-200">
                                                                    <div className="text-xs text-gray-500">
                                                                        Total Items: {order.items.reduce((sum: number, item: any) => sum + item.quantity, 0)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4">
                                                        <span className="text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                                                            {order.paymentMethod}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 pr-4 text-right font-black text-slate-800 text-lg">
                                                        <div className="flex flex-col items-end">
                                                            <span className={order.status === 'cancelled' ? 'line-through text-gray-400' : ''}>
                                                                {order.totalAmount} <span className="text-xs font-bold text-gray-400">ብር</span>
                                                            </span>
                                                            {order.status === 'cancelled' && (
                                                                <span className="text-xs text-red-500 font-medium">Not collected</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-center">
                                                        <button
                                                            onClick={() => handleViewOrder(order)}
                                                            className="bg-[#8B4513] hover:bg-[#D2691E] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 mx-auto transition-colors"
                                                        >
                                                            <Eye className="h-3 w-3" />
                                                            <span>View</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Order Details Modal */}
                <OrderDetailsModal 
                    order={selectedOrder}
                    isOpen={showOrderDetails}
                    onClose={() => {
                        setShowOrderDetails(false)
                        setSelectedOrder(null)
                    }}
                />
            </div>
        </ProtectedRoute>
    )
}
