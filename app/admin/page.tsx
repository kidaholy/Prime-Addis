"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"
import Link from "next/link"

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  totalCustomers: number
  lowStockItems: number
  pendingOrders: number
  completedOrders: number
  averageOrderValue: number
  inventoryValue: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    lowStockItems: 0,
    pendingOrders: 0,
    completedOrders: 0,
    averageOrderValue: 0,
    inventoryValue: 0,
  })
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()
  const { t } = useLanguage()

  useEffect(() => {
    fetchDashboardStats()
    const interval = setInterval(fetchDashboardStats, 30000)
    return () => clearInterval(interval)
  }, [token])

  const fetchDashboardStats = async () => {
    try {
      const [ordersRes, stockRes] = await Promise.all([
        fetch("/api/orders", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/stock", { headers: { Authorization: `Bearer ${token}` } })
      ])

      if (ordersRes.ok && stockRes.ok) {
        const orders = await ordersRes.json()
        const stockItems = await stockRes.json()

        const totalRevenue = orders.reduce((sum: number, o: any) => sum + o.totalAmount, 0)
        const completedCount = orders.filter((o: any) => o.status === "completed").length
        const pendingCount = orders.filter((o: any) => o.status === "pending").length
        const lowStockCount = stockItems.filter((item: any) => item.quantity <= item.minLimit).length
        const netWorth = stockItems.reduce((sum: number, item: any) => sum + (item.quantity * (item.unitCost || 0)), 0)

        setStats({
          totalOrders: orders.length,
          totalRevenue,
          totalCustomers: orders.length,
          lowStockItems: lowStockCount,
          pendingOrders: pendingCount,
          completedOrders: completedCount,
          averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
          inventoryValue: netWorth,
        })
      }
    } catch (err) {
      console.error("Failed to load dashboard stats")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={["admin"]}>
        <div className="min-h-screen bg-[#e2e7d8] p-4 flex items-center justify-center">
          <div className="text-4xl animate-bounce">☕</div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="min-h-screen bg-[#e2e7d8] p-4 font-sans text-slate-800">
        <div className="max-w-7xl mx-auto">
          <BentoNavbar />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

            {/* Left Column: Welcome + Stats */}
            <div className="md:col-span-12 lg:col-span-8">
              {/* Welcome Card */}
              <div className="bg-[#2d5a41] rounded-[40px] p-8 mb-6 custom-shadow relative overflow-hidden group text-[#e2e7d8]">
                <div className="relative z-10">
                  <h1 className="text-4xl font-bold mb-2 bubbly-text">{t("adminDashboard.title")}</h1>
                  <p className="opacity-90 font-medium">{t("adminDashboard.subtitle")}</p>
                </div>
                <div className="absolute right-[-20px] bottom-[-20px] w-48 h-48 bg-[#f5bc6b] rounded-full opacity-20 group-hover:scale-125 transition-transform duration-500"></div>
              </div>

              {/* Primary Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <StatCard label={t("adminDashboard.orders")} value={stats.totalOrders} icon="📋" color="white" />
                <StatCard label={t("adminDashboard.revenue")} value={`${stats.totalRevenue.toFixed(0)} ${t("common.currencyBr")}`} icon="💰" color="blue" />
                <StatCard label={t("adminDashboard.avgOrder")} value={`${stats.averageOrderValue.toFixed(0)} ${t("common.currencyBr")}`} icon="🧮" color="orange" />
                <StatCard label={t("adminDashboard.netWorth")} value={`${stats.inventoryValue.toFixed(0)} ${t("common.currencyBr")}`} icon="💎" color="white" href="/admin/reports/inventory" />
                <StatCard label={t("adminDashboard.customers")} value={stats.totalCustomers} icon="👥" color="white" />
              </div>

              {/* Detailed Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-[40px] p-6 custom-shadow">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-2xl">⚠️</span> {t("adminDashboard.alerts")}
                  </h2>
                  <div className="space-y-3">
                    {stats.lowStockItems > 0 ? (
                      <AlertItem type="warning" text={`${stats.lowStockItems} ${t("adminDashboard.itemsLowStock")}`} subtext={t("adminDashboard.restockRequired")} />
                    ) : (
                      <AlertItem type="success" text={t("adminDashboard.stockHealthy")} subtext={t("adminDashboard.noImmediateAction")} />
                    )}
                    {stats.pendingOrders > 5 ? (
                      <AlertItem type="info" text={`${stats.pendingOrders} ${t("adminDashboard.pendingOrders")}`} subtext={t("adminDashboard.kitchenBusy")} />
                    ) : (
                      <AlertItem type="success" text={t("adminDashboard.orderQueueOptimal")} subtext={t("adminDashboard.kitchenRunningSmooth")} />
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-[40px] p-6 custom-shadow">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-2xl">⚡</span> {t("adminDashboard.systemStatus")}
                  </h2>
                  <div className="space-y-3">
                    <StatusItem label={t("adminDashboard.database")} status={t("adminDashboard.connected")} />
                    <StatusItem label={t("adminDashboard.apiGateway")} status={t("adminDashboard.online")} />
                    <StatusItem label={t("adminDashboard.realtimeSync")} status={t("adminDashboard.active")} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Secondary Stats */}
            <div className="md:col-span-12 lg:col-span-4 space-y-6">
              <div className="bg-white rounded-[40px] p-6 custom-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-100 rounded-bl-[40px] -mr-4 -mt-4 opacity-50"></div>
                <h2 className="text-xl font-bold mb-4">{t("adminDashboard.pending")}</h2>
                <div className="text-5xl font-bold text-[#f5bc6b] mb-2">{stats.pendingOrders}</div>
                <p className="text-gray-500">{t("adminDashboard.ordersToBeServed")}</p>
              </div>

              <div className="bg-white rounded-[40px] p-6 custom-shadow">
                <h2 className="text-xl font-bold mb-4">{t("adminDashboard.completed")}</h2>
                <div className="text-5xl font-bold text-[#2d5a41] mb-2">{stats.completedOrders}</div>
                <p className="text-gray-500">{t("adminDashboard.ordersServedToday")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

function AlertItem({ type, text, subtext }: { type: 'warning' | 'info' | 'success', text: string, subtext: string }) {
  const colors = {
    warning: "bg-orange-100 text-orange-700 border-orange-200",
    info: "bg-blue-100 text-blue-700 border-blue-200",
    success: "bg-green-100 text-green-700 border-green-200"
  }

  return (
    <div className={`p-4 rounded-2xl border ${colors[type]} flex justify-between items-center`}>
      <div>
        <p className="font-bold text-sm">{text}</p>
        <p className="text-xs opacity-80">{subtext}</p>
      </div>
    </div>
  )
}

function StatusItem({ label, status }: { label: string, status: string }) {
  return (
    <div className="flex justify-between items-center p-3 rounded-2xl bg-gray-50">
      <span className="font-medium text-gray-600">{label}</span>
      <span className="px-3 py-1 bg-[#2d5a41] text-[#e2e7d8] text-xs font-bold rounded-full">{status}</span>
    </div>
  )
}

function StatCard({ label, value, icon, color, href }: { label: string, value: string | number, icon: string, color: 'white' | 'blue' | 'orange', href?: string }) {
  const styles = {
    white: "bg-white text-[#1a1a1a]",
    blue: "bg-[#93c5fd] text-[#1a1a1a]",
    orange: "bg-[#f5bc6b] text-[#1a1a1a]"
  }

  const content = (
    <div className={`rounded-[30px] p-5 custom-shadow flex flex-col justify-between h-32 ${styles[color]} transition-transform hover:scale-105 cursor-pointer`}>
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-2xl font-bold leading-none mb-1">{value}</p>
        <p className="text-xs uppercase font-bold tracking-wider opacity-70 flex justify-between items-center">
          {label}
          {href && <span className="text-[10px] bg-[#2d5a41] text-white px-2 py-0.5 rounded-full ml-auto">Report</span>}
        </p>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
