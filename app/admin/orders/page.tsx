"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarNav } from "@/components/sidebar-nav"
import { AuthHeader } from "@/components/auth-header"
import { useAuth } from "@/context/auth-context"

interface Order {
  _id: string
  orderNumber: string
  items: Array<{ name: string; quantity: number; price: number }>
  totalAmount: number
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled"
  createdAt: string
  customerName?: string
}

export default function AdminOrdersPage() {
  const { token } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    fetchOrders()
    // Reduced interval to 1 second for immediate updates
    const interval = setInterval(fetchOrders, 1000)
    return () => clearInterval(interval)
  }, [])

  // Add visibility change listener for immediate refresh when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchOrders()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Add focus listener for immediate refresh when window gets focus
  useEffect(() => {
    const handleFocus = () => {
      fetchOrders()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Add localStorage listener for cross-page updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'orderUpdated' || e.key === 'newOrderCreated') {
        fetchOrders()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true
    return order.status === filter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning/20 text-warning"
      case "preparing":
        return "bg-info/20 text-info"
      case "ready":
        return "bg-success/20 text-success"
      case "completed":
        return "bg-muted text-muted-foreground"
      case "cancelled":
        return "bg-danger/20 text-danger"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="min-h-screen bg-background">
        <SidebarNav />
        <main className="md:ml-64">
          <AuthHeader title="Orders" description="View and manage all orders" />

          <div className="p-2.5 sm:p-4 lg:p-6">
            {/* Filter Buttons - Optimized for Mobile */}
            <div className="grid grid-cols-2 sm:flex gap-2 mb-4">
              <button
                onClick={() => setFilter("all")}
                className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  filter === "all" ? "bg-primary text-white" : "bg-card hover:bg-muted"
                }`}
              >
                All ({orders.length})
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  filter === "pending" ? "bg-warning text-white" : "bg-card hover:bg-muted"
                }`}
              >
                Pending ({orders.filter((o) => o.status === "pending").length})
              </button>
              <button
                onClick={() => setFilter("preparing")}
                className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  filter === "preparing" ? "bg-info text-white" : "bg-card hover:bg-muted"
                }`}
              >
                Preparing ({orders.filter((o) => o.status === "preparing").length})
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  filter === "completed" ? "bg-success text-white" : "bg-card hover:bg-muted"
                }`}
              >
                Completed ({orders.filter((o) => o.status === "completed").length})
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8 sm:py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-accent mx-auto mb-3"></div>
                  <p className="text-sm sm:text-base text-muted-foreground">Loading orders...</p>
                </div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="card-base text-center py-8 sm:py-12">
                <div className="text-4xl sm:text-6xl mb-3">📋</div>
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">No Orders Found</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {filter === "all" ? "No orders have been placed yet" : `No ${filter} orders found`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <div key={order._id} className="card-base p-3 sm:p-4">
                    {/* Header - Mobile Optimized */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold truncate">Order #{order.orderNumber}</h3>
                        {order.customerName && (
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{order.customerName}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs sm:text-sm font-semibold self-start ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Items - Mobile Optimized */}
                    <div className="space-y-1.5 mb-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start text-xs sm:text-sm gap-2">
                          <span className="flex-1 min-w-0">
                            <span className="font-medium">{item.quantity}x</span>{" "}
                            <span className="truncate">{item.name}</span>
                          </span>
                          <span className="font-semibold text-accent flex-shrink-0">
                            {item.price.toFixed(2)} Br
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Total - Mobile Optimized */}
                    <div className="border-t pt-2 flex justify-between items-center">
                      <span className="font-bold text-sm sm:text-lg text-foreground">
                        Total: <span className="text-accent">{order.totalAmount.toFixed(2)} Br</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
