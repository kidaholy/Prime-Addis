"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarNav } from "@/components/sidebar-nav"
import { AuthHeader } from "@/components/auth-header"
import { useAuth } from "@/context/auth-context"

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("week")
  const [orders, setOrders] = useState<any[]>([])
  const { token } = useAuth()

  useEffect(() => {
    fetchReportData()
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

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0)
  const completedOrders = orders.filter((o) => o.status === "completed").length
  const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="min-h-screen bg-background">
        <SidebarNav />
        <main className="md:ml-64">
          <AuthHeader title="Reports & Analytics" description="Sales and operational reports" />

          <div className="p-2.5 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Time Range Selector - Mobile Optimized */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {["today", "week", "month"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2 sm:px-4 py-2 rounded-lg transition-colors capitalize text-xs sm:text-sm font-medium ${
                    timeRange === range ? "bg-primary text-primary-foreground" : "bg-card border border-border"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Revenue Analytics - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="card-base bg-success/10 border border-success/30 p-3 sm:p-4">
                <p className="text-muted-foreground text-xs sm:text-sm">Total Revenue</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-success mt-1 sm:mt-2">{totalRevenue.toFixed(2)} Br</p>
                <p className="text-xs text-muted-foreground mt-1 sm:mt-2">+12% from last period</p>
              </div>
              <div className="card-base bg-info/10 border border-info/30 p-3 sm:p-4">
                <p className="text-muted-foreground text-xs sm:text-sm">Orders Completed</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-info mt-1 sm:mt-2">{completedOrders}</p>
                <p className="text-xs text-muted-foreground mt-1 sm:mt-2">Avg: {averageOrderValue.toFixed(2)} Br per order</p>
              </div>
              <div className="card-base bg-primary/10 border border-primary/30 p-3 sm:p-4">
                <p className="text-muted-foreground text-xs sm:text-sm">Total Orders</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mt-1 sm:mt-2">{orders.length}</p>
                <p className="text-xs text-muted-foreground mt-1 sm:mt-2">
                  Completion: {Math.round((completedOrders / (orders.length || 1)) * 100)}%
                </p>
              </div>
            </div>

            {/* Order Status Distribution - Mobile Optimized */}
            <div className="card-base p-3 sm:p-4">
              <h2 className="text-base sm:text-xl font-bold text-foreground mb-3 sm:mb-4">Order Status Distribution</h2>
              <div className="space-y-2 sm:space-y-3">
                {["pending", "preparing", "ready", "completed"].map((status) => {
                  const count = orders.filter((o) => o.status === status).length
                  const percentage = ((count / (orders.length || 1)) * 100).toFixed(0)
                  const statusColors = {
                    pending: "bg-warning",
                    preparing: "bg-info", 
                    ready: "bg-success",
                    completed: "bg-primary"
                  }
                  return (
                    <div key={status} className="flex items-center gap-2 sm:gap-4">
                      <span className="capitalize text-xs sm:text-sm font-medium min-w-16 sm:min-w-24">{status}</span>
                      <div className="flex-1 bg-muted rounded-full h-2 sm:h-3 overflow-hidden">
                        <div 
                          className={`${statusColors[status as keyof typeof statusColors]} h-full transition-all duration-300`} 
                          style={{ width: `${percentage}%` }} 
                        />
                      </div>
                      <div className="flex items-center gap-1 min-w-12 sm:min-w-16">
                        <span className="text-xs sm:text-sm font-semibold">{count}</span>
                        <span className="text-xs text-muted-foreground">({percentage}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Quick Insights - Mobile Optimized */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="card-base p-3 bg-accent/10 border border-accent/30">
                <p className="text-accent text-xs font-medium">Peak Hours</p>
                <p className="text-sm sm:text-base font-bold text-accent mt-1">12-2 PM</p>
                <p className="text-xs text-muted-foreground">Busiest period</p>
              </div>
              <div className="card-base p-3 bg-warning/10 border border-warning/30">
                <p className="text-warning text-xs font-medium">Avg Wait Time</p>
                <p className="text-sm sm:text-base font-bold text-warning mt-1">8 mins</p>
                <p className="text-xs text-muted-foreground">Order to ready</p>
              </div>
            </div>

            {/* Export Section - Mobile Optimized */}
            <div className="card-base p-3 sm:p-4">
              <h2 className="text-base sm:text-xl font-bold text-foreground mb-3 sm:mb-4">Export Data</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <button className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary-dark transition-colors text-xs sm:text-sm font-medium">
                  📊 Export CSV
                </button>
                <button className="px-3 sm:px-4 py-2 bg-card border border-border rounded hover:bg-muted transition-colors text-xs sm:text-sm font-medium">
                  📄 Export PDF
                </button>
                <button className="px-3 sm:px-4 py-2 bg-card border border-border rounded hover:bg-muted transition-colors text-xs sm:text-sm font-medium">
                  🖨️ Print Report
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
