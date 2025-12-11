"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarNav } from "@/components/sidebar-nav"
import { AuthHeader } from "@/components/auth-header"
import { useAuth } from "@/context/auth-context"

interface OrderItem {
  menuItemId: string
  name: string
  quantity: number
  price: number
}

interface Order {
  _id: string
  orderNumber: string
  items: OrderItem[]
  totalAmount: number
  paymentMethod: string
  status: "pending" | "completed" | "cancelled"
  createdAt: string
  updatedAt: string
}

export default function CashierOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed" | "cancelled">("all")
  const { token } = useAuth()

  useEffect(() => {
    fetchOrders()
    // Reduced interval to 1 second for immediate updates
    const interval = setInterval(fetchOrders, 1000)
    return () => clearInterval(interval)
  }, [token])

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
      const response = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (err) {
      console.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = filterStatus === "all" ? orders : orders.filter((o) => o.status === filterStatus)

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    completed: orders.filter((o) => o.status === "completed").length,
    revenue: orders.filter((o) => o.status === "completed").reduce((sum, o) => sum + o.totalAmount, 0),
  }

  return (
    <ProtectedRoute requiredRoles={["cashier"]}>
      <div className="flex">
        <SidebarNav />
        <main className="flex-1 ml-64">
          <AuthHeader title="Order History" description="View all cashier orders" />

          <div className="p-6">
            {/* Statistics */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="card-base bg-secondary/10 border-2 border-secondary">
                <p className="text-secondary font-semibold">Total Orders</p>
                <p className="text-4xl font-bold text-secondary mt-2">{stats.total}</p>
              </div>
              <div className="card-base bg-warning/10 border-2 border-warning">
                <p className="text-warning font-semibold">Pending</p>
                <p className="text-4xl font-bold text-warning mt-2">{stats.pending}</p>
              </div>
              <div className="card-base bg-success/10 border-2 border-success">
                <p className="text-success font-semibold">Completed</p>
                <p className="text-4xl font-bold text-success mt-2">{stats.completed}</p>
              </div>
              <div className="card-base bg-primary/10 border-2 border-primary">
                <p className="text-primary font-semibold">Revenue</p>
                <p className="text-3xl font-bold text-primary mt-2">{stats.revenue.toFixed(2)} Birr</p>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-3 mb-6">
              {["all", "pending", "completed", "cancelled"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as typeof filterStatus)}
                  className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                    filterStatus === status
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border hover:border-primary"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Orders Table */}
            {loading ? (
              <div className="text-center py-8">Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border-2 border-border">
                No orders found
              </div>
            ) : (
              <div className="card-base overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left font-semibold text-foreground">Order #</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">Items</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">Amount</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">Payment</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-foreground">{order.orderNumber}</td>
                        <td className="px-4 py-3 text-foreground">
                          {order.items.map((item) => `${item.name} x${item.quantity}`).join(", ")}
                        </td>
                        <td className="px-4 py-3 font-semibold text-primary">{order.totalAmount.toFixed(2)} Birr</td>
                        <td className="px-4 py-3 capitalize text-foreground">{order.paymentMethod}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(
                              order.status,
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-sm">
                          {new Date(order.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "bg-warning/20 text-warning"
    case "completed":
      return "bg-success/20 text-success"
    case "cancelled":
      return "bg-danger/20 text-danger"
    default:
      return "bg-muted text-muted-foreground"
  }
}
