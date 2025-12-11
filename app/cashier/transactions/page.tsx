"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarNav } from "@/components/sidebar-nav"
import { AuthHeader } from "@/components/auth-header"
import { useAuth } from "@/context/auth-context"

interface Order {
  _id: string
  orderNumber: string
  totalAmount: number
  paymentStatus: string
  status: string
  createdAt: string
}

export default function TransactionsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()

  useEffect(() => {
    fetchOrders()
  }, [token])

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

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)

  return (
    <ProtectedRoute requiredRoles={["cashier"]}>
      <div className="min-h-screen bg-background">
        <SidebarNav />
        <main className="md:ml-64">
          <AuthHeader title="Transactions" description="View all orders and transactions" />

          <div className="p-2.5 sm:p-4 lg:p-6">
            {/* Stats - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
              <div className="card-base p-3">
                <p className="text-muted-foreground text-xs sm:text-sm">Total Orders</p>
                <p className="text-2xl sm:text-3xl font-bold text-primary mt-1">{orders.length}</p>
              </div>
              <div className="card-base p-3">
                <p className="text-muted-foreground text-xs sm:text-sm">Total Revenue</p>
                <p className="text-2xl sm:text-3xl font-bold text-success mt-1">{totalRevenue.toFixed(2)} Br</p>
              </div>
              <div className="card-base p-3">
                <p className="text-muted-foreground text-xs sm:text-sm">Avg Transaction</p>
                <p className="text-2xl sm:text-3xl font-bold text-info mt-1">{(totalRevenue / (orders.length || 1)).toFixed(2)} Br</p>
              </div>
            </div>

            {/* Transactions List - Mobile Optimized */}
            {loading ? (
              <div className="flex items-center justify-center py-8 sm:py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-accent mx-auto mb-3"></div>
                  <p className="text-sm sm:text-base text-muted-foreground">Loading transactions...</p>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="card-base text-center py-8 sm:py-12">
                <div className="text-4xl sm:text-6xl mb-3">💳</div>
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">No Transactions Found</h3>
                <p className="text-sm sm:text-base text-muted-foreground">No transactions have been processed yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order._id} className="card-base hover-lift p-3">
                    {/* Mobile-Optimized Transaction Card */}
                    <div className="flex flex-col gap-2">
                      {/* Header Row */}
                      <div className="flex items-center justify-between">
                        <h3 className="font-mono text-sm sm:text-base font-bold text-foreground">
                          #{order.orderNumber}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              order.status === "completed" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                            }`}
                          >
                            {order.status}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              order.paymentStatus === "paid"
                                ? "bg-success/20 text-success"
                                : "bg-warning/20 text-warning"
                            }`}
                          >
                            {order.paymentStatus || "pending"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Details Row */}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-accent text-lg sm:text-xl">
                          {order.totalAmount.toFixed(2)} Br
                        </span>
                        <span className="text-muted-foreground text-xs sm:text-sm">
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
