"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"
import Link from "next/link"

const StatCard = ({ label, value, icon, color, subtext }: { label: string, value: string, icon: string, color: string, subtext: string }) => {
  const colorClasses: { [key: string]: string } = {
    emerald: "border-[#2d5a41] text-[#2d5a41]",
    orange: "border-[#f5bc6b] text-[#1a1a1a]",
    blue: "border-[#93c5fd] text-blue-800",
    purple: "border-purple-500 text-purple-600",
    indigo: "border-indigo-400 text-indigo-600",
  };
  const subtextColorClasses: { [key: string]: string } = {
    emerald: "text-[#2d5a41]",
    orange: "text-[#f5bc6b]",
    blue: "text-blue-400",
    purple: "text-purple-400",
    indigo: "text-indigo-400",
  };
  return (
    <div className={`bg-white rounded-[40px] p-8 custom-shadow border-b-8 ${colorClasses[color]}`}>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className={`text-4xl font-black ${colorClasses[color]}`}>{value}</h3>
      <p className={`text-xs ${subtextColorClasses[color]} font-bold mt-2`}>{icon} {subtext}</p>
    </div>
  );
};

const StatusProgress = ({ label, count, total, color }: { label: string, count: number, total: number, color: string }) => {
  const percentage = ((count / (total || 1)) * 100).toFixed(0);
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-800">{count} ({percentage}%)</span>
      </div>
      <div className="h-4 bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-0.5">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("week")
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stockItems, setStockItems] = useState<any[]>([])
  const { token } = useAuth()
  const { t } = useLanguage()

  const [periodData, setPeriodData] = useState<any>(null)
  useEffect(() => {
    fetchReportData()
    fetchStockItems()
    fetchPeriodSummary()
  }, [token, timeRange])

  const fetchPeriodSummary = async () => {
    try {
      const response = await fetch(`/api/reports/sales?period=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        setPeriodData(await response.json())
      }
    } catch (err) {
      console.error("Failed to fetch summary")
    }
  }

  const fetchReportData = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
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

  const stats = {
    totalRevenue: totalRevenue,
    completedOrders: completedOrders,
    averageOrderValue: averageOrderValue,
    inventoryValue: totalNetWorth,
    totalOrders: filteredOrders.length,
    statusDistribution: {
      pending: filteredOrders.filter((o) => o.status === "pending").length,
      preparing: filteredOrders.filter((o) => o.status === "preparing").length,
      ready: filteredOrders.filter((o) => o.status === "ready").length,
      completed: filteredOrders.filter((o) => o.status === "completed").length,
    }
  }

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
              <div className="bg-white rounded-[40px] p-8 custom-shadow flex flex-col gap-4">
                <h2 className="text-2xl font-bold mb-2 bubbly-text">{t("adminReports.title")}</h2>
                <div className="flex flex-col gap-2">
                  {[
                    { id: "today", label: t("adminReports.todayView") },
                    { id: "week", label: t("adminReports.weekView") },
                    { id: "month", label: t("adminReports.monthView") },
                  ].map((range) => (
                    <button
                      key={range.id}
                      onClick={() => setTimeRange(range.id)}
                      className={`w-full py-4 rounded-[25px] font-bold transition-all duration-300 capitalize ${timeRange === range.id ? "bg-[#2d5a41] text-white shadow-lg scale-105" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                        }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#f5bc6b] rounded-[40px] p-8 custom-shadow flex flex-col gap-4">
                <h3 className="text-xl font-bold text-[#1a1a1a]">{t("adminReports.managementTools")}</h3>
                <button onClick={exportToCSV} className="w-full bg-white text-[#1a1a1a] font-bold py-4 rounded-[25px] flex items-center justify-center gap-2 hover:scale-105 transition-transform active:scale-95 custom-shadow">
                  <span>📥</span> {t("adminReports.downloadCsv")}
                </button>
                <button onClick={() => window.print()} className="w-full bg-black/10 text-black/60 font-bold py-4 rounded-[25px] flex items-center justify-center gap-2 hover:bg-black/20 transition-colors">
                  <span>🖨️</span> {t("adminReports.printPage")}
                </button>
              </div>
            </div>

            {/* Main Stats */}
            <div className="lg:col-span-9 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard label={t("adminReports.totalRevenue")} value={`${stats.totalRevenue.toFixed(0)} ${t("common.currencyBr")}`} icon="💸" color="emerald" subtext={`${stats.totalOrders} ${t("adminReports.ordersTotal")}`} />
                {(() => {
                  const oxStockValue = stockItems.filter(i => i.name.toLowerCase() === 'ox').reduce((sum, item) => sum + (item.quantity * (item.unitCost || 0)), 0);
                  const physicalStockValue = stats.inventoryValue - oxStockValue;
                  const totalInvestment = (periodData?.summary?.totalExpenses || 0) + physicalStockValue;
                  const netRecovery = stats.totalRevenue - totalInvestment;

                  return (
                    <StatCard
                      label="Inventory Net"
                      value={`${netRecovery.toLocaleString()} ${t("common.currencyBr")}`}
                      icon="💎"
                      color="purple"
                      subtext="Orders - (Diary + Assets)"
                    />
                  );
                })()}
                <StatCard label={t("chef.ready")} value={`${stats.completedOrders}`} icon="🔥" color="orange" subtext={t("adminReports.ordersServed")} />
                <Link href="/admin/reports/inventory" className="bg-white rounded-[40px] p-8 custom-shadow border-b-8 border-purple-500 hover:scale-105 transition-transform group">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t("adminReports.inventoryAssets")}</p>
                  <h3 className="text-4xl font-black text-purple-600">{stats.inventoryValue.toFixed(0)} {t("common.currencyBr")}</h3>
                  <p className="text-xs text-purple-400 font-bold mt-2 flex justify-between items-center">
                    💎 {t("adminReports.netWorth")}
                    <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">{t("adminReports.fullReport")} →</span>
                  </p>
                </Link>

                {/* New Report Links */}
                <Link href="/admin/reports/orders" className="bg-[#2d5a41] rounded-[40px] p-8 custom-shadow hover:scale-105 transition-transform group relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-xs font-bold text-[#e2e7d8] opacity-60 uppercase tracking-widest mb-1">Transaction History</p>
                    <h3 className="text-2xl font-black text-white mb-2">Orders Report</h3>
                    <p className="text-xs text-[#e2e7d8] font-medium flex items-center gap-2">
                      View Details <span className="text-white group-hover:translate-x-1 transition-transform">→</span>
                    </p>
                  </div>
                  <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12">
                    <span className="text-9xl">💸</span>
                  </div>
                </Link>

                <Link href="/admin/reports/stock" className="bg-white rounded-[40px] p-8 custom-shadow border-b-8 border-[#f5bc6b] hover:scale-105 transition-transform group relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Consumption Analysis</p>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Stock Usage</h3>
                    <p className="text-xs text-[#f5bc6b] font-bold flex items-center gap-2">
                      View Details <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </p>
                  </div>
                  <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
                    <span className="text-8xl">📦</span>
                  </div>
                </Link>
              </div>

              <div className="bg-white rounded-[40px] p-8 custom-shadow">
                <h3 className="text-2xl font-bold mb-8 bubbly-text">{t("adminReports.distribution")}</h3>
                <div className="space-y-6">
                  <StatusProgress label={t("chef.pending")} count={stats.statusDistribution.pending} total={stats.totalOrders} color="#f5bc6b" />
                  <StatusProgress label={t("chef.preparing")} count={stats.statusDistribution.preparing} total={stats.totalOrders} color="#93c5fd" />
                  <StatusProgress label={t("chef.ready")} count={stats.statusDistribution.ready} total={stats.totalOrders} color="#2d5a41" />
                  <StatusProgress label={t("chef.complete")} count={stats.statusDistribution.completed} total={stats.totalOrders} color="#e5e7eb" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-[30px] p-6 text-center">
                  <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">{t("adminReports.peakHour")}</p>
                  <p className="text-2xl font-black text-gray-800">12:30 PM</p>
                </div>
                <div className="bg-gray-50 rounded-[30px] p-6 text-center">
                  <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">{t("adminReports.waitTime")}</p>
                  <p className="text-2xl font-black text-gray-800">~8.5 min</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
