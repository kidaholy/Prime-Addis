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
      <div className="flex">
        <SidebarNav />
        <main className="flex-1 ml-64">
          <AuthHeader title="Orders" description="View and manage all orders" />

          <div className="p-6">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg ${filter === "all" ? "bg-primary text-white" : "bg-card"}`}
              >
                All ({orders.length})
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-4 py-2 rounded-lg ${filter === "pending" ? "bg-warning text-white" : "bg-card"}`}
              >
                Pending ({orders.filter((o) => o.status === "pending").length})
              </button>
              <button
                onClick={() => setFilter("preparing")}
                className={`px-4 py-2 rounded-lg ${filter === "preparing" ? "bg-info text-white" : "bg-card"}`}
              >
                Preparing ({orders.filter((o) => o.status === "preparing").length})
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={`px-4 py-2 rounded-lg ${filter === "completed" ? "bg-success text-white" : "bg-card"}`}
              >
                Completed ({orders.filter((o) => o.status === "completed").length})
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="card-base text-center py-12">
                <p className="text-muted-foreground">No orders found</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredOrders.map((order) => (
                  <div key={order._id} className="card-base">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold">Order #{order.orderNumber}</h3>
                        {order.customerName && <p className="text-sm text-muted-foreground">{order.customerName}</p>}
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-semibold">{item.price.toFixed(2)} Birr</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="font-bold text-lg">Total: {order.totalAmount.toFixed(2)} Birr</span>
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
