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
      <div className="flex">
        <SidebarNav />
        <main className="flex-1 ml-64">
          <AuthHeader title="Reports & Analytics" description="Sales and operational reports" />

          <div className="p-6 space-y-6">
            {/* Time Range Selector */}
            <div className="flex gap-2 mb-6">
              {["today", "week", "month"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                    timeRange === range ? "bg-primary text-primary-foreground" : "bg-card border border-border"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Revenue Analytics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="card-base bg-success/10 border border-success/30">
                <p className="text-muted-foreground text-sm">Total Revenue</p>
                <p className="text-4xl font-bold text-success mt-2">${totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-2">+12% from last period</p>
              </div>
              <div className="card-base bg-info/10 border border-info/30">
                <p className="text-muted-foreground text-sm">Orders Completed</p>
                <p className="text-4xl font-bold text-info mt-2">{completedOrders}</p>
                <p className="text-xs text-muted-foreground mt-2">Average: {averageOrderValue.toFixed(2)} per order</p>
              </div>
              <div className="card-base bg-primary/10 border border-primary/30">
                <p className="text-muted-foreground text-sm">Total Orders</p>
                <p className="text-4xl font-bold text-primary mt-2">{orders.length}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Completion rate: {Math.round((completedOrders / (orders.length || 1)) * 100)}%
                </p>
              </div>
            </div>

            {/* Top Performing Items */}
            <div className="card-base">
              <h2 className="text-xl font-bold text-foreground mb-4">Order Status Distribution</h2>
              <div className="space-y-3">
                {["pending", "preparing", "ready", "completed"].map((status) => {
                  const count = orders.filter((o) => o.status === status).length
                  const percentage = ((count / (orders.length || 1)) * 100).toFixed(0)
                  return (
                    <div key={status} className="flex items-center gap-4">
                      <span className="capitalize text-sm font-medium min-w-24">{status}</span>
                      <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: `${percentage}%` }} />
                      </div>
                      <span className="text-sm font-semibold">{percentage}%</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Export Section */}
            <div className="card-base">
              <h2 className="text-xl font-bold text-foreground mb-4">Export Data</h2>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary-dark transition-colors">
                  Export CSV
                </button>
                <button className="px-4 py-2 bg-card border border-border rounded hover:bg-muted transition-colors">
                  Export PDF
                </button>
                <button className="px-4 py-2 bg-card border border-border rounded hover:bg-muted transition-colors">
                  Print Report
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
