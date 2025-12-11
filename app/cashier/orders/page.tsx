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
      <div className="min-h-screen bg-background">
        <SidebarNav />
        <main className="md:ml-64">
          <AuthHeader title="Order History" description="View all cashier orders" />

          <div className="p-2.5 sm:p-4 lg:p-6">
            {/* Statistics - Mobile Optimized */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4">
              <div className="card-base bg-secondary/10 border-2 border-secondary p-2 sm:p-3">
                <p className="text-secondary font-semibold text-xs sm:text-sm">Total Orders</p>
                <p className="text-xl sm:text-3xl font-bold text-secondary mt-1">{stats.total}</p>
              </div>
              <div className="card-base bg-warning/10 border-2 border-warning p-2 sm:p-3">
                <p className="text-warning font-semibold text-xs sm:text-sm">Pending</p>
                <p className="text-xl sm:text-3xl font-bold text-warning mt-1">{stats.pending}</p>
              </div>
              <div className="card-base bg-success/10 border-2 border-success p-2 sm:p-3">
                <p className="text-success font-semibold text-xs sm:text-sm">Completed</p>
                <p className="text-xl sm:text-3xl font-bold text-success mt-1">{stats.completed}</p>
              </div>
              <div className="card-base bg-primary/10 border-2 border-primary p-2 sm:p-3">
                <p className="text-primary font-semibold text-xs sm:text-sm">Revenue</p>
                <p className="text-lg sm:text-2xl font-bold text-primary mt-1">{stats.revenue.toFixed(2)} Br</p>
              </div>
            </div>

            {/* Filter Buttons - Mobile Optimized */}
            <div className="grid grid-cols-2 sm:flex gap-2 mb-4">
              {["all", "pending", "completed", "cancelled"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as typeof filterStatus)}
                  className={`px-2 sm:px-4 py-2 rounded-lg transition-colors capitalize text-xs sm:text-sm font-medium ${
                    filterStatus === status
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border hover:border-primary"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Orders List - Mobile Optimized */}
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
                  {filterStatus === "all" ? "No orders have been placed yet" : `No ${filterStatus} orders found`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <div key={order._id} className="card-base hover-lift p-3">
                    {/* Mobile-Optimized Order Card */}
                    <div className="flex flex-col gap-3">
                      {/* Header Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-mono text-sm sm:text-base font-bold text-foreground">
                            #{order.orderNumber}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold capitalize ${getStatusColor(order.status)}`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                      
                      {/* Items Row */}
                      <div className="border-t pt-2">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {order.items.slice(0, 3).map((item, idx) => (
                            <span key={idx} className="text-xs bg-muted px-2 py-1 rounded">
                              {item.quantity}x {item.name}
                            </span>
                          ))}
                          {order.items.length > 3 && (
                            <span className="text-xs text-muted-foreground px-2 py-1">
                              +{order.items.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Details Row */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-accent text-base">
                            {order.totalAmount.toFixed(2)} Br
                          </span>
                          <span className="text-muted-foreground capitalize">
                            {order.paymentMethod}
                          </span>
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {new Date(order.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
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
