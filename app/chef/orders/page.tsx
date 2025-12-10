"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarNav } from "@/components/sidebar-nav"
import { AuthHeader } from "@/components/auth-header"
import { useAuth } from "@/context/auth-context"

interface Order {
  _id: string
  orderNumber: string
  status: string
  totalAmount: number
  createdAt: string
  items: any[]
}

export default function ChefOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("all")
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

  const statuses = ["all", "pending", "preparing", "ready", "completed"]
  const filteredOrders = filterStatus === "all" ? orders : orders.filter((o) => o.status === filterStatus)

  return (
    <ProtectedRoute requiredRoles={["chef"]}>
      <div className="flex">
        <SidebarNav />
        <main className="flex-1 ml-64">
          <AuthHeader title="Order History" description="View all orders" />

          <div className="p-6">
            {/* Filters */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
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
            ) : (
              <div className="card-base overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold">Order #</th>
                      <th className="text-left py-3 px-4 font-semibold">Items</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order._id} className="border-b border-border hover:bg-muted">
                        <td className="py-3 px-4 font-mono">{order.orderNumber}</td>
                        <td className="py-3 px-4 text-sm">{order.items.length} items</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
                              order.status === "ready"
                                ? "bg-success/20 text-success"
                                : order.status === "preparing"
                                  ? "bg-info/20 text-info"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold">${order.totalAmount.toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm">{new Date(order.createdAt).toLocaleString()}</td>
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
