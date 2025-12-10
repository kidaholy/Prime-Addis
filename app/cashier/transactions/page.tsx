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
      <div className="flex">
        <SidebarNav />
        <main className="flex-1 ml-64">
          <AuthHeader title="Transactions" description="View all orders and transactions" />

          <div className="p-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="card-base">
                <p className="text-muted-foreground text-sm">Total Orders</p>
                <p className="text-3xl font-bold text-primary mt-2">{orders.length}</p>
              </div>
              <div className="card-base">
                <p className="text-muted-foreground text-sm">Total Revenue</p>
                <p className="text-3xl font-bold text-success mt-2">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="card-base">
                <p className="text-muted-foreground text-sm">Avg Transaction</p>
                <p className="text-3xl font-bold text-info mt-2">${(totalRevenue / (orders.length || 1)).toFixed(2)}</p>
              </div>
            </div>

            {/* Orders Table */}
            {loading ? (
              <div className="text-center py-8">Loading transactions...</div>
            ) : (
              <div className="card-base overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold">Order #</th>
                      <th className="text-left py-3 px-4 font-semibold">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Payment</th>
                      <th className="text-left py-3 px-4 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id} className="border-b border-border hover:bg-muted">
                        <td className="py-3 px-4 font-mono">{order.orderNumber}</td>
                        <td className="py-3 px-4 font-semibold text-lg">${order.totalAmount.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              order.status === "completed" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              order.paymentStatus === "paid"
                                ? "bg-success/20 text-success"
                                : "bg-warning/20 text-warning"
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </td>
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
