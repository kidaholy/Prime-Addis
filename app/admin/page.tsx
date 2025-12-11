"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarNav } from "@/components/sidebar-nav"
import { AuthHeader } from "@/components/auth-header"
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
      <div className="min-h-screen bg-background">
        <SidebarNav />
        <main className="md:ml-64">
          <AuthHeader title="Dashboard" description="System overview and analytics" />

          <div className="p-2.5 sm:p-4 lg:p-6 space-y-3 sm:space-y-6">
            {/* Key Metrics - Optimized for 412px */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <StatCard label="Total Orders" value={stats.totalOrders} icon="📋" color="primary" />
              <StatCard label="Revenue" value={`${stats.totalRevenue.toFixed(2)} Br`} icon="💰" color="success" />
              <StatCard label="Avg Order" value={`${stats.averageOrderValue.toFixed(2)} Br`} icon="🧮" color="info" />
              <StatCard label="Low Stock" value={stats.lowStockItems} icon="⚠️" color="warning" />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <StatCard label="Pending" value={stats.pendingOrders} icon="⏳" color="warning" />
              <StatCard label="Completed" value={stats.completedOrders} icon="✅" color="success" />
              <StatCard
                label="Inventory Value"
                value={`${stats.inventoryValue.toFixed(2)} Br`}
                icon="📦"
                color="info"
              />
              <StatCard label="Customers" value={stats.totalCustomers} icon="👥" color="primary" />
            </div>

            {/* Overview Sections */}
            <div className="space-y-3 sm:space-y-4">
              <div className="card-base">
                <h2 className="text-lg font-bold text-foreground mb-4">Quick Stats</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded border border-border">
                    <span className="text-muted-foreground">System Status</span>
                    <span className="px-3 py-1 bg-success/20 text-success rounded text-sm font-semibold">Active</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded border border-border">
                    <span className="text-muted-foreground">Database</span>
                    <span className="px-3 py-1 bg-success/20 text-success rounded text-sm font-semibold">
                      Connected
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded border border-border">
                    <span className="text-muted-foreground">API Status</span>
                    <span className="px-3 py-1 bg-success/20 text-success rounded text-sm font-semibold">Online</span>
                  </div>
                </div>
              </div>

              <div className="card-base">
                <h2 className="text-lg font-bold text-foreground mb-4">Alerts</h2>
                <div className="space-y-3">
                  {stats.lowStockItems > 0 && (
                    <div className="flex gap-3 p-3 bg-warning/10 border border-warning/30 rounded">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <p className="text-sm font-semibold text-warning">{stats.lowStockItems} items low on stock</p>
                        <p className="text-xs text-muted-foreground">Restock soon</p>
                      </div>
                    </div>
                  )}
                  {stats.pendingOrders > 5 && (
                    <div className="flex gap-3 p-3 bg-info/10 border border-info/30 rounded">
                      <span className="text-xl">ℹ️</span>
                      <div>
                        <p className="text-sm font-semibold text-info">{stats.pendingOrders} pending orders</p>
                        <p className="text-xs text-muted-foreground">Kitchen working on them</p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 p-3 bg-success/10 border border-success/30 rounded">
                    <span className="text-xl">✅</span>
                    <div>
                      <p className="text-sm font-semibold text-success">All systems operational</p>
                      <p className="text-xs text-muted-foreground">No critical issues</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  icon: string
  color: "primary" | "success" | "warning" | "info"
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorClass = {
    primary: "text-foreground bg-primary/10 border-primary/30",
    success: "text-success bg-success/10 border-success/30",
    warning: "text-warning bg-warning/10 border-warning/30",
    info: "text-info bg-info/10 border-info/30",
  }[color]

  return (
    <div
      className={`card-base border ${colorClass} hover:shadow-lg transition-all transform hover:-translate-y-1 animate-slide-in-up`}
      style={{ animationDelay: `${Math.random() * 200}ms` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-4xl opacity-40">{icon}</div>
      </div>
    </div>
  )
}
