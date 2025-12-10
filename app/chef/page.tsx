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
  specialInstructions?: string
  status: "pending" | "preparing" | "ready" | "served"
}

interface Order {
  _id: string
  orderNumber: string
  items: OrderItem[]
  status: "pending" | "preparing" | "ready" | "completed"
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const [previousOrderCount, setPreviousOrderCount] = useState(0)
  const { token } = useAuth()

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 3000)
    return () => clearInterval(interval)
  }, [token])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        const activeOrders = data.filter((order: Order) => order.status !== "completed")

        if (previousOrderCount > 0 && activeOrders.length > previousOrderCount) {
          setNewOrderAlert(true)
          setTimeout(() => setNewOrderAlert(false), 5000)
        }

        setPreviousOrderCount(activeOrders.length)
        setOrders(activeOrders)
      }
    } catch (err) {
      console.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchOrders()
      }
    } catch (err) {
      console.error("Failed to update order status")
    }
  }

  const pendingOrders = orders.filter((o) => o.status === "pending")
  const preparingOrders = orders.filter((o) => o.status === "preparing")
  const readyOrders = orders.filter((o) => o.status === "ready")

  return (
    <ProtectedRoute requiredRoles={["chef"]}>
      <div className="flex">
        <SidebarNav />
        <main className="flex-1 ml-64">
          <AuthHeader title="Kitchen Display System" description="Monitor and manage orders" />

          {newOrderAlert && (
            <div className="mx-6 mt-6 p-4 bg-accent text-accent-foreground rounded-lg shadow-2xl animate-pulse flex items-center justify-between border-2 border-accent">
              <div className="flex items-center gap-3">
                <span className="text-4xl animate-bounce-gentle">🔔</span>
                <div>
                  <p className="font-bold text-lg">New Order Received!</p>
                  <p className="text-sm opacity-90">Check the pending orders column</p>
                </div>
              </div>
              <button onClick={() => setNewOrderAlert(false)} className="text-2xl hover:opacity-75 transition-opacity">
                ✕
              </button>
            </div>
          )}

          <div className="p-6">
            {/* Order Statistics with enhanced styling */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <StatCard label="Pending" count={pendingOrders.length} color="warning" emoji="⏳" />
              <StatCard label="Preparing" count={preparingOrders.length} color="info" emoji="👨‍🍳" />
              <StatCard label="Ready" count={readyOrders.length} color="success" emoji="✓" />
            </div>

            {/* Orders Layout */}
            {loading ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3 animate-bounce">⏳</div>
                <p className="text-muted-foreground">Loading orders...</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {/* Pending Orders */}
                <OrderColumn
                  title="Pending Orders"
                  orders={pendingOrders}
                  onStatusChange={handleStatusChange}
                  nextStatus="preparing"
                  statusColor="warning"
                />

                {/* Preparing Orders */}
                <OrderColumn
                  title="Preparing"
                  orders={preparingOrders}
                  onStatusChange={handleStatusChange}
                  nextStatus="ready"
                  statusColor="info"
                />

                {/* Ready for Pickup */}
                <OrderColumn
                  title="Ready for Pickup"
                  orders={readyOrders}
                  onStatusChange={handleStatusChange}
                  nextStatus="completed"
                  statusColor="success"
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

interface StatCardProps {
  label: string
  count: number
  color: "warning" | "info" | "success"
  emoji: string
}

function StatCard({ label, count, color, emoji }: StatCardProps) {
  const colorClass = {
    warning: "bg-warning/10 border-warning text-warning",
    info: "bg-info/10 border-info text-info",
    success: "bg-success/10 border-success text-success",
  }[color]

  return (
    <div className={`card-base border-2 ${colorClass}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold opacity-75">{label}</p>
          <p className="text-4xl font-bold mt-2">{count}</p>
        </div>
        <div className="text-4xl opacity-40">{emoji}</div>
      </div>
    </div>
  )
}

interface OrderColumnProps {
  title: string
  orders: Order[]
  onStatusChange: (orderId: string, newStatus: string) => void
  nextStatus: string
  statusColor: "warning" | "info" | "success"
}

function OrderColumn({ title, orders, onStatusChange, nextStatus, statusColor }: OrderColumnProps) {
  return (
    <div className="space-y-4">
      <h2 className={`text-lg font-bold ${getColorClass(statusColor)}`}>{title}</h2>
      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-card/50 rounded-lg border-2 border-dashed border-border">
            <div className="text-4xl mb-2 opacity-30">✓</div>
            <p className="text-muted-foreground text-sm">No orders</p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard key={order._id} order={order} onStatusChange={onStatusChange} nextStatus={nextStatus} />
          ))
        )}
      </div>
    </div>
  )
}

interface OrderCardProps {
  order: Order
  onStatusChange: (orderId: string, newStatus: string) => void
  nextStatus: string
}

function OrderCard({ order, onStatusChange, nextStatus }: OrderCardProps) {
  const createdTime = new Date(order.createdAt)
  const elapsedMinutes = Math.floor((Date.now() - createdTime.getTime()) / 60000)

  return (
    <div className="card-base border-l-4 border-accent hover:shadow-lg transition-all animate-slide-in-up">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-xl text-accent"># {order.orderNumber}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <span>⏱</span> {elapsedMinutes > 0 ? `${elapsedMinutes} min ago` : "Just now"}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusBadgeClass(order.status)}`}>
          {order.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center bg-primary/10 p-3 rounded-lg">
            <div className="flex-1">
              <p className="font-semibold text-foreground">{item.name}</p>
              {item.specialInstructions && (
                <p className="text-xs text-muted-foreground italic mt-1">{item.specialInstructions}</p>
              )}
            </div>
            <span className="ml-2 px-3 py-1 bg-accent text-accent-foreground rounded-full font-bold text-sm">
              x{item.quantity}
            </span>
          </div>
        ))}
      </div>

      {order.notes && (
        <p className="text-xs text-muted-foreground mb-4 p-3 bg-warning/10 rounded-lg border border-warning/30 italic">
          Note: {order.notes}
        </p>
      )}

      <button
        onClick={() => onStatusChange(order._id, nextStatus)}
        className="w-full bg-accent text-accent-foreground py-2 rounded-lg font-bold hover:opacity-90 transition-all transform hover:scale-105 capitalize"
      >
        Mark as {nextStatus}
      </button>
    </div>
  )
}

function getColorClass(color: string): string {
  const colors: Record<string, string> = {
    warning: "text-warning",
    info: "text-info",
    success: "text-success",
  }
  return colors[color] || "text-foreground"
}

function getStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    pending: "bg-warning/20 text-warning",
    preparing: "bg-info/20 text-info",
    ready: "bg-success/20 text-success",
    completed: "bg-success/20 text-success",
  }
  return classes[status] || "bg-muted text-muted-foreground"
}
