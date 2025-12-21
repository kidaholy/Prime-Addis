"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
import { useAuth } from "@/context/auth-context"

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

  useEffect(() => {
    fetchDashboardStats()
    const interval = setInterval(fetchDashboardStats, 30000)
    return () => clearInterval(interval)
  }, [token])

  const fetchDashboardStats = async () => {
    try {
      const ordersRes = await fetch("/api/orders", { headers: { Authorization: `Bearer ${token}` } })

      if (ordersRes.ok) {
        const orders = await ordersRes.json()

        const totalRevenue = orders.reduce((sum: number, o: any) => sum + o.totalAmount, 0)
        const completedCount = orders.filter((o: any) => o.status === "completed").length
        const pendingCount = orders.filter((o: any) => o.status === "pending").length

        setStats({
          totalOrders: orders.length,
          totalRevenue,
          totalCustomers: orders.length,
          lowStockItems: 0,
          pendingOrders: pendingCount,
          completedOrders: completedCount,
          averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
          inventoryValue: 0,
        })
      }
    } catch (err) {
      console.error("Failed to load dashboard stats")
    } finally {
      setLoading(false)
    }
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
                  <h1 className="text-4xl font-bold mb-2 bubbly-text">Admin HQ 🚀</h1>
                  <p className="opacity-90 font-medium">System overview and analytics.</p>
                </div>
                <div className="absolute right-[-20px] bottom-[-20px] w-48 h-48 bg-[#f5bc6b] rounded-full opacity-20 group-hover:scale-125 transition-transform duration-500"></div>
              </div>

              {/* Primary Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Orders" value={stats.totalOrders} icon="📋" color="white" />
                <StatCard label="Revenue" value={`${stats.totalRevenue.toFixed(0)} Br`} icon="💰" color="blue" />
                <StatCard label="Avg Order" value={`${stats.averageOrderValue.toFixed(0)} Br`} icon="🧮" color="orange" />
                <StatCard label="Customers" value={stats.totalCustomers} icon="👥" color="white" />
              </div>

              {/* Detailed Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-[40px] p-6 custom-shadow">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-2xl">⚠️</span> Alerts
                  </h2>
                  <div className="space-y-3">
                    {stats.lowStockItems > 0 ? (
                      <AlertItem type="warning" text={`${stats.lowStockItems} items low stock`} subtext="Restock required" />
                    ) : (
                      <AlertItem type="success" text="Stock levels healthy" subtext="No immediate action" />
                    )}
                    {stats.pendingOrders > 5 ? (
                      <AlertItem type="info" text={`${stats.pendingOrders} pending orders`} subtext="Kitchen busy" />
                    ) : (
                      <AlertItem type="success" text="Order queue optimal" subtext="Kitchen running smooth" />
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-[40px] p-6 custom-shadow">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-2xl">⚡</span> System Status
                  </h2>
                  <div className="space-y-3">
                    <StatusItem label="Database" status="Connected" />
                    <StatusItem label="API Gateway" status="Online" />
                    <StatusItem label="Realtime Sync" status="Active" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Secondary Stats */}
            <div className="md:col-span-12 lg:col-span-4 space-y-6">
              <div className="bg-white rounded-[40px] p-6 custom-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-100 rounded-bl-[40px] -mr-4 -mt-4 opacity-50"></div>
                <h2 className="text-xl font-bold mb-4">Pending</h2>
                <div className="text-5xl font-bold text-[#f5bc6b] mb-2">{stats.pendingOrders}</div>
                <p className="text-gray-500">Orders to be served</p>
              </div>

              <div className="bg-white rounded-[40px] p-6 custom-shadow">
                <h2 className="text-xl font-bold mb-4">Completed</h2>
                <div className="text-5xl font-bold text-[#2d5a41] mb-2">{stats.completedOrders}</div>
                <p className="text-gray-500">Orders served today</p>
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

function StatCard({ label, value, icon, color }: { label: string, value: string | number, icon: string, color: 'white' | 'blue' | 'orange' }) {
  const styles = {
    white: "bg-white text-[#1a1a1a]",
    blue: "bg-[#93c5fd] text-[#1a1a1a]",
    orange: "bg-[#f5bc6b] text-[#1a1a1a]"
  }

  return (
    <div className={`rounded-[30px] p-5 custom-shadow flex flex-col justify-between h-32 ${styles[color]} transition-transform hover:scale-105`}>
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-2xl font-bold leading-none mb-1">{value}</p>
        <p className="text-xs uppercase font-bold tracking-wider opacity-70">{label}</p>
      </div>
    </div>
  )
}
