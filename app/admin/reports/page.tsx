"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
import { useAuth } from "@/context/auth-context"
import Link from "next/link"
import { TrendingUp, Package, DollarSign, Activity } from "lucide-react"

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("week")
  const [orders, setOrders] = useState<any[]>([])
  const [stockItems, setStockItems] = useState<any[]>([])
  const { token } = useAuth()

  useEffect(() => {
    fetchReportData()
    fetchStockItems()
  }, [token, timeRange])

  const fetchReportData = async () => {
    try {
      const response = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (err) {
      console.error("Failed to load report data")
    }
  }

  const fetchStockItems = async () => {
    try {
      const response = await fetch("/api/stock", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setStockItems(data)
      }
    } catch (err) {
      console.error("Failed to load stock data")
    }
  }

  const getFilteredOrders = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    return orders.filter(order => {
      const orderDate = new Date(order.createdAt)
      switch (timeRange) {
        case "today":
          const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate())
          return orderDay.getTime() === today.getTime()
        case "week":
          const startOfWeek = new Date(today)
          const dayOfWeek = today.getDay()
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
          startOfWeek.setDate(today.getDate() + mondayOffset)
          const endOfWeek = new Date(startOfWeek)
          endOfWeek.setDate(startOfWeek.getDate() + 6)
          endOfWeek.setHours(23, 59, 59, 999)
          return orderDate >= startOfWeek && orderDate <= endOfWeek
        case "month":
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
          return orderDate >= startOfMonth && orderDate <= endOfMonth
        default:
          return true
      }
    })
  }

  const filteredOrders = getFilteredOrders()
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0)
  const completedOrders = filteredOrders.filter((o) => o.status === "completed").length
  const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0

  const totalNetWorth = stockItems.reduce((sum, item) => sum + (item.quantity * (item.unitCost || 0)), 0)

  const exportToCSV = () => {
    const csvHeaders = ['Order Number', 'Date', 'Status', 'Total Amount', 'Payment Method', 'Items Count']
    const csvData = filteredOrders.map(order => [
      order.orderNumber,
      new Date(order.createdAt).toLocaleDateString(),
      order.status,
      order.totalAmount.toFixed(2),
      order.paymentMethod || 'cash',
      order.items?.length || 0
    ])
    const csvContent = [csvHeaders.join(','), ...csvData.map(row => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `prime-addis-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="min-h-screen bg-[#e2e7d8] p-4 font-sans text-slate-800">
        <div className="max-w-7xl mx-auto">
          <BentoNavbar />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Controls Sidebar */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-[40px] p-8 custom-shadow">
                <h2 className="text-2xl font-bold mb-6 bubbly-text">Analytics</h2>
                <div className="flex flex-col gap-2">
                  {["today", "week", "month"].map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`w-full py-4 rounded-[25px] font-bold transition-all duration-300 capitalize ${timeRange === range ? "bg-[#2d5a41] text-white shadow-lg scale-105" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                        }`}
                    >
                      {range} View
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#f5bc6b] rounded-[40px] p-8 custom-shadow flex flex-col gap-4">
                <h3 className="text-xl font-bold text-[#1a1a1a]">Management Tools</h3>
                <button onClick={exportToCSV} className="w-full bg-white text-[#1a1a1a] font-bold py-4 rounded-[25px] flex items-center justify-center gap-2 hover:scale-105 transition-transform active:scale-95 custom-shadow">
                  <span>📊</span> Download CSV
                </button>
                <button onClick={() => window.print()} className="w-full bg-black/10 text-black/60 font-bold py-4 rounded-[25px] flex items-center justify-center gap-2 hover:bg-black/20 transition-colors">
                  <span>🖨️</span> Print Page
                </button>
              </div>
            </div>

            {/* Main Stats */}
            <div className="lg:col-span-9 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-[40px] p-8 custom-shadow border-b-8 border-[#2d5a41]">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Revenue</p>
                  <h3 className="text-4xl font-black text-[#2d5a41]">{totalRevenue.toFixed(0)} Br</h3>
                  <p className="text-xs text-[#2d5a41] font-bold mt-2">✨ {filteredOrders.length} orders total</p>
                </div>
                <div className="bg-white rounded-[40px] p-8 custom-shadow border-b-8 border-[#f5bc6b]">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Completed</p>
                  <h3 className="text-4xl font-black text-[#1a1a1a]">{completedOrders}</h3>
                  <p className="text-xs text-[#f5bc6b] font-bold mt-2">🔥 Orders Served</p>
                </div>
                <div className="bg-white rounded-[40px] p-8 custom-shadow border-b-8 border-[#93c5fd]">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Average Value</p>
                  <h3 className="text-4xl font-black text-blue-800">{averageOrderValue.toFixed(0)} Br</h3>
                  <p className="text-xs text-blue-400 font-bold mt-2">☕ per customer</p>
                </div>
                <Link href="/admin/reports/inventory" className="bg-white rounded-[40px] p-8 custom-shadow border-b-8 border-purple-500 hover:scale-105 transition-transform group">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Inventory Assets</p>
                  <h3 className="text-4xl font-black text-purple-600">{totalNetWorth.toFixed(0)} Br</h3>
                  <p className="text-xs text-purple-400 font-bold mt-2 flex justify-between items-center">
                    💎 Net Worth
                    <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">Full Report →</span>
                  </p>
                </Link>
                <div className="bg-white rounded-[40px] p-8 custom-shadow border-b-8 border-indigo-400">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Items</p>
                  <h3 className="text-4xl font-black text-indigo-600">{stockItems.length}</h3>
                  <p className="text-xs text-indigo-400 font-bold mt-2">📦 SKUs in Stock</p>
                </div>
              </div>

              <div className="bg-white rounded-[40px] p-8 custom-shadow min-h-[400px]">
                <h3 className="text-2xl font-bold mb-8 bubbly-text">Order Status Distribution</h3>
                <div className="space-y-6">
                  {["pending", "preparing", "ready", "completed"].map((status) => {
                    const count = filteredOrders.filter((o) => o.status === status).length
                    const percentage = ((count / (filteredOrders.length || 1)) * 100).toFixed(0)
                    const colors = {
                      pending: "bg-[#f5bc6b]",
                      preparing: "bg-[#93c5fd]",
                      ready: "bg-[#e2e7d8]",
                      completed: "bg-[#2d5a41]"
                    }
                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest">
                          <span className="text-gray-400">{status}</span>
                          <span className="text-gray-800">{count} ({percentage}%)</span>
                        </div>
                        <div className="h-4 bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-0.5">
                          <div
                            className={`${colors[status as keyof typeof colors]} h-full rounded-full transition-all duration-1000`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-12 grid grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-[30px] p-6 text-center">
                    <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Peak Hour</p>
                    <p className="text-2xl font-black text-gray-800">12:30 PM</p>
                  </div>
                  <div className="bg-gray-50 rounded-[30px] p-6 text-center">
                    <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Wait Time</p>
                    <p className="text-2xl font-black text-gray-800">~8.5 min</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

