"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"
import { useSettings } from "@/context/settings-context"
import { ReportExporter, ProfitCalculator, ComprehensiveExportData } from "@/lib/export-utils"
import { Download, FileText, Printer, Calendar, TrendingUp, Package, DollarSign } from "lucide-react"
import Link from "next/link"

const StatCard = ({ label, value, icon, color, subtext }: { label: string, value: string, icon: string, color: string, subtext: string }) => {
  const colorClasses: { [key: string]: string } = {
    emerald: "border-[#8B4513] text-[#8B4513]",
    orange: "border-[#D2691E] text-[#1a1a1a]",
    blue: "border-[#CD853F] text-blue-800",
    purple: "border-purple-500 text-purple-600",
    indigo: "border-indigo-400 text-indigo-600",
  };
  const subtextColorClasses: { [key: string]: string } = {
    emerald: "text-[#8B4513]",
    orange: "text-[#D2691E]",
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
  const [timeRange, setTimeRange] = useState("month")
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stockItems, setStockItems] = useState<any[]>([])
  const [periodData, setPeriodData] = useState<any>(null)
  const [stockUsageData, setStockUsageData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()
  const { t } = useLanguage()
  const { settings } = useSettings()

  useEffect(() => {
    fetchReportData()
    fetchStockItems()
    fetchPeriodSummary()
    fetchStockUsage()
  }, [token, timeRange])

  const fetchWithTimeout = async (url: string, options: any = {}, timeout = 10000) => {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort("Request timed out"), timeout)
    try {
      const response = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(id)
      return response
    } catch (err) {
      clearTimeout(id)
      throw err
    }
  }

  const fetchPeriodSummary = async () => {
    try {
      const response = await fetchWithTimeout(`/api/reports/sales?period=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        setPeriodData(await response.json())
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      console.error("Failed to fetch summary:", err)
    }
  }

  const fetchStockUsage = async () => {
    try {
      const response = await fetchWithTimeout(`/api/reports/stock-usage?period=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        setStockUsageData(await response.json())
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      console.error("Failed to fetch stock usage:", err)
    }
  }

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithTimeout("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setOrders(await response.json());
      } else {
        setError("Failed to load orders");
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Failed to load orders:", err);
      }
      setError(err.name === 'AbortError' ? "Request timed out" : "Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

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
          const lastWeek = new Date(today);
          lastWeek.setDate(today.getDate() - 7);
          lastWeek.setHours(0, 0, 0, 0);
          return orderDate >= lastWeek && orderDate <= now
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
  const completedOrders = filteredOrders.filter((o) => o.status === "completed")
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0)
  const completedOrdersCount = completedOrders.length
  const averageOrderValue = completedOrdersCount > 0 ? totalRevenue / completedOrdersCount : 0
  const totalNetWorth = stockItems.reduce((sum, item) => sum + (item.quantity * (item.unitCost || 0)), 0)

  // Calculate comprehensive profit using the business logic
  const profitData = periodData ? ProfitCalculator.calculateNetProfit(
    periodData.summary.totalRevenue,
    periodData.summary,
    stockItems
  ) : null

  const stats = {
    totalRevenue: totalRevenue,
    completedOrders: completedOrdersCount,
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

  // Enhanced export functions
  const exportSummaryCSV = () => {
    if (!periodData || !profitData) return

    const exportData = {
      title: "Business Summary Report",
      period: timeRange,
      headers: ["Metric", "Value", "Unit"],
      data: [
        { Metric: "Total Revenue", Value: profitData.revenue.toFixed(2), Unit: "ETB" },
        { Metric: "Ox Costs", Value: profitData.oxCost.toFixed(2), Unit: "ETB" },
        { Metric: "Other Expenses", Value: profitData.otherExpenses.toFixed(2), Unit: "ETB" },
        { Metric: "Total Stock Assets", Value: profitData.totalStockValue.toFixed(2), Unit: "ETB" },
        { Metric: "Total Investment", Value: profitData.totalInvestment.toFixed(2), Unit: "ETB" },
        { Metric: "Net Worth", Value: profitData.netProfit.toFixed(2), Unit: "ETB" },
        { Metric: "Profit Margin", Value: profitData.profitMargin.toFixed(2), Unit: "%" },
        { Metric: "Total Orders", Value: stats.totalOrders.toString(), Unit: "Count" },
        { Metric: "Completed Orders", Value: stats.completedOrders.toString(), Unit: "Count" },
        { Metric: "Average Order Value", Value: stats.averageOrderValue.toFixed(2), Unit: "ETB" }
      ],
      summary: {
        "Report Period": timeRange.toUpperCase(),
        "Generated Date": new Date().toLocaleDateString(),
        "Net Worth": `${profitData.netProfit.toFixed(2)} ETB`,
        "Formula": "Orders - (Assets + Ox)",
        "Profit Margin": `${profitData.profitMargin.toFixed(1)}%`
      }
    }

    ReportExporter.exportToCSV(exportData)
  }

  const exportSummaryPDF = () => {
    if (!periodData || !profitData) return

    const exportData = {
      title: "Business Summary Report",
      period: timeRange,
      headers: ["Metric", "Value", "Unit"],
      data: [
        { Metric: "Total Revenue", Value: profitData.revenue.toFixed(2), Unit: "ETB" },
        { Metric: "Ox Costs", Value: profitData.oxCost.toFixed(2), Unit: "ETB" },
        { Metric: "Other Expenses", Value: profitData.otherExpenses.toFixed(2), Unit: "ETB" },
        { Metric: "Total Stock Assets", Value: profitData.totalStockValue.toFixed(2), Unit: "ETB" },
        { Metric: "Total Investment", Value: profitData.totalInvestment.toFixed(2), Unit: "ETB" },
        { Metric: "Net Worth", Value: profitData.netProfit.toFixed(2), Unit: "ETB" },
        { Metric: "Profit Margin", Value: profitData.profitMargin.toFixed(2), Unit: "%" }
      ],
      summary: {
        "Report Period": timeRange.toUpperCase(),
        "Generated Date": new Date().toLocaleDateString(),
        "Net Worth": `${profitData.netProfit.toFixed(2)} ETB`,
        "Formula": "Orders - (Assets + Ox)",
        "Profit Margin": `${profitData.profitMargin.toFixed(1)}%`
      },
      metadata: {
        companyName: settings.app_name || "Prime Addis"
      }
    }

    ReportExporter.exportToPDF(exportData)
  }

  const exportSummaryWord = () => {
    if (!periodData || !profitData) return

    // Prepare detailed expense data
    const expenseDetails = periodData.dailyExpenses?.flatMap((exp: any) =>
      exp.items.map((item: any) => ({
        Date: new Date(exp.date).toLocaleDateString(),
        Item: item.name,
        Quantity: `${item.quantity} ${item.unit}`,
        Cost: `${item.amount.toLocaleString()} ETB`
      }))
    ) || []

    const exportData: ComprehensiveExportData = {
      title: "Business Summary Report",
      period: timeRange,
      sections: [
        {
          title: "Financial Overview",
          summary: {
            "Report Period": timeRange.toUpperCase(),
            "Generated Date": new Date().toLocaleDateString(),
            "Net Worth": `${profitData.netProfit.toLocaleString()} ETB`,
            "Profit Margin": `${profitData.profitMargin.toFixed(1)}%`
          },
          headers: ["Metric", "Value", "Unit"],
          data: [
            // 1. Inflow
            { Metric: "Total Revenue", Value: profitData.revenue.toLocaleString(), Unit: "ETB" },
            { Metric: "Total Orders", Value: stats.totalOrders.toString(), Unit: "Count" },
            { Metric: "Completed Orders", Value: stats.completedOrders.toString(), Unit: "Count" },
            { Metric: "Average Order Value", Value: stats.averageOrderValue.toFixed(2), Unit: "ETB" },

            // 2. Outflow
            { Metric: "Ox Costs", Value: profitData.oxCost.toLocaleString(), Unit: "ETB" },
            { Metric: "Other Expenses", Value: profitData.otherExpenses.toLocaleString(), Unit: "ETB" },

            // 3. Assets
            { Metric: "Total Stock Assets", Value: profitData.totalStockValue.toLocaleString(), Unit: "ETB" },
            { Metric: "Total Investment", Value: profitData.totalInvestment.toLocaleString(), Unit: "ETB" },

            // 4. Profitability
            { Metric: "Net Worth", Value: profitData.netProfit.toLocaleString(), Unit: "ETB" },
            { Metric: "Profit Margin", Value: profitData.profitMargin.toFixed(2), Unit: "%" }
          ]
        },
        // Add Detailed Breakdown if data exists
        ...(expenseDetails.length > 0 ? [{
          title: "Expense Details",
          headers: ["Date", "Item", "Quantity", "Cost"],
          data: expenseDetails
        }] : [])
      ],
      metadata: {
        companyName: settings.app_name || "Prime Addis"
      }
    }

    ReportExporter.exportComprehensiveToWord(exportData)
  }




  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="min-h-screen bg-white p-4 font-sans text-slate-800">
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
                      className={`w-full py-4 rounded-[25px] font-bold transition-all duration-300 capitalize ${timeRange === range.id ? "bg-[#8B4513] text-white shadow-lg scale-105" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                        }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#D2691E] rounded-[40px] p-8 custom-shadow flex flex-col gap-4">
                <h3 className="text-xl font-bold text-[#1a1a1a]">{t("adminReports.managementTools")}</h3>

                {/* Enhanced Export Options */}
                <div className="grid grid-cols-1 gap-3">

                  <button
                    onClick={exportSummaryWord}
                    className="w-full bg-white text-[#1a1a1a] font-bold py-4 rounded-[25px] flex items-center justify-center gap-2 hover:scale-105 transition-transform active:scale-95 custom-shadow"
                  >
                    <Download size={20} /> Export Summary Word
                  </button>

                  <button
                    onClick={exportSummaryPDF}
                    className="w-full bg-white text-[#1a1a1a] font-bold py-4 rounded-[25px] flex items-center justify-center gap-2 hover:scale-105 transition-transform active:scale-95 custom-shadow"
                  >
                    <FileText size={20} /> Export Summary PDF
                  </button>

                  <button
                    onClick={exportSummaryCSV}
                    className="w-full bg-white text-[#1a1a1a] font-bold py-4 rounded-[25px] flex items-center justify-center gap-2 hover:scale-105 transition-transform active:scale-95 custom-shadow"
                  >
                    <Download size={20} /> Export Summary CSV
                  </button>



                </div>
              </div>
            </div>

            {/* Main Stats */}
            <div className="lg:col-span-9 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard label={t("adminReports.totalRevenue")} value={`${stats.totalRevenue.toFixed(0)} ${t("common.currencyBr")}`} icon="💸" color="emerald" subtext={`${stats.completedOrders} ${t("adminReports.ordersTotal")}`} />

                {/* Net Worth Summary using formula: Revenue - Ox - Other */}
                {(() => {
                  if (!profitData) {
                    return <StatCard label={t("adminReports.netWorth")} value="Loading..." icon="💎" color="purple" subtext="Calculating..." />
                  }

                  return (
                    <StatCard
                      label={t("adminReports.netWorth")}
                      value={`${profitData.netProfit.toLocaleString()} ${t("common.currencyBr")}`}
                      icon="💎"
                      color={profitData.netProfit >= 0 ? "purple" : "orange"}
                      subtext={`Orders - Ox Cost - Physical Expense`}
                    />
                  );
                })()}
                <StatCard label={t("chef.ready")} value={`${stats.completedOrders}`} icon="🔥" color="orange" subtext={t("adminReports.ordersServed")} />

                <Link href="/admin/reports/inventory" className="bg-white rounded-[40px] p-8 custom-shadow border-b-8 border-purple-500 hover:scale-105 transition-transform group">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t("adminReports.netWorth")}</p>
                  <h3 className="text-4xl font-black text-purple-600">
                    {profitData ? profitData.netProfit.toLocaleString() : stats.totalRevenue.toFixed(0)} {t("common.currencyBr")}
                  </h3>
                  <p className="text-xs text-purple-400 font-bold mt-2 flex justify-between items-center">
                    💎 Orders - Ox - Physical Expense
                    <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">Detailed Analysis →</span>
                  </p>
                </Link>

                {/* New Report Links */}
                <Link href="/admin/reports/orders" className="bg-[#8B4513] rounded-[40px] p-8 custom-shadow hover:scale-105 transition-transform group relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-xs font-bold text-white opacity-60 uppercase tracking-widest mb-1">Transaction History</p>
                    <h3 className="text-2xl font-black text-white mb-2">Orders Report</h3>
                    <p className="text-xs text-white font-medium flex items-center gap-2">
                      View Details <span className="text-white group-hover:translate-x-1 transition-transform">→</span>
                    </p>
                  </div>
                  <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12">
                    <span className="text-9xl">💸</span>
                  </div>
                </Link>

                <Link href="/admin/reports/stock" className="bg-white rounded-[40px] p-8 custom-shadow border-b-8 border-[#D2691E] hover:scale-105 transition-transform group relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Consumption Analysis</p>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Stock Usage</h3>
                    <p className="text-xs text-[#D2691E] font-bold flex items-center gap-2">
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
                  <StatusProgress label={t("chef.pending")} count={stats.statusDistribution.pending} total={stats.totalOrders} color="#D2691E" />
                  <StatusProgress label={t("chef.preparing")} count={stats.statusDistribution.preparing} total={stats.totalOrders} color="#CD853F" />
                  <StatusProgress label={t("chef.ready")} count={stats.statusDistribution.ready} total={stats.totalOrders} color="#8B4513" />
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
