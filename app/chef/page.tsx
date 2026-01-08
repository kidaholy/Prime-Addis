"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"
import { ConfirmationCard, NotificationCard } from "@/components/confirmation-card"
import { useConfirmation } from "@/hooks/use-confirmation"
import { RefreshCw, Clock, ChefHat } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"

interface OrderItem {
  menuItemId: string
  menuId?: string
  name: string
  quantity: number
  specialInstructions?: string
  status: "pending" | "preparing" | "ready" | "served"
}

interface Order {
  _id: string
  orderNumber: string
  items: OrderItem[]
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled"
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
  const { t } = useLanguage()
  const { confirmationState, confirm, closeConfirmation, notificationState, notify, closeNotification } = useConfirmation()

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 1000)
    return () => clearInterval(interval)
  }, [token])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchOrders()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    const handleFocus = () => fetchOrders()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'orderUpdated' || e.key === 'newOrderCreated') fetchOrders()
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
        const activeOrders = data.filter((order: Order) =>
          order.status !== "completed" && order.status !== "cancelled"
        )

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

  const handleCancelOrder = async (orderId: string) => {
    const confirmed = await confirm({
      title: "Cancel Order",
      message: "Are you sure you want to cancel this order?\\n\\nThis action cannot be undone.",
      type: "warning",
      confirmText: "Cancel Order",
      cancelText: "Keep Order"
    })

    if (!confirmed) return

    try {
      setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId))

      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "cancelled" }),
      })

      if (response.ok) {
        fetchOrders()
        localStorage.setItem('orderUpdated', Date.now().toString())
      } else {
        fetchOrders()
        notify({
          title: "Error",
          message: "Failed to cancel the order. Please try again.",
          type: "error"
        })
      }
    } catch (err) {
      fetchOrders()
      notify({
        title: "Error",
        message: "An error occurred while cancelling the order.",
        type: "error"
      })
    }
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId ? { ...order, status: newStatus as any } : order
        )
      )

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
        localStorage.setItem('orderUpdated', Date.now().toString())
      } else {
        fetchOrders()
      }
    } catch (err) {
      fetchOrders()
    }
  }

  const pendingOrders = orders.filter((o) => o.status === "pending")
  const preparingOrders = orders.filter((o) => o.status === "preparing")
  const readyOrders = orders.filter((o) => o.status === "ready")

  return (
    <ProtectedRoute requiredRoles={["chef"]}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <BentoNavbar />

          {/* Clean Header */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-50 rounded-lg">
                  <ChefHat className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Kitchen Display</h1>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span>System Active</span>
                  </div>
                </div>
              </div>
              <button
                onClick={fetchOrders}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-3xl font-bold text-orange-600">{pendingOrders.length}</div>
                <div className="text-sm text-gray-600 mt-1">Pending</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{preparingOrders.length}</div>
                <div className="text-sm text-gray-600 mt-1">Preparing</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-3xl font-bold text-green-600">{readyOrders.length}</div>
                <div className="text-sm text-gray-600 mt-1">Ready</div>
              </div>
            </div>
          </div>

          {/* New Order Alert */}
          {newOrderAlert && (
            <div className="p-4 bg-orange-500 text-white rounded-xl shadow-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔔</span>
                <div>
                  <p className="font-bold">New Order Incoming!</p>
                  <p className="text-sm opacity-90">Check the pending queue</p>
                </div>
              </div>
              <button onClick={() => setNewOrderAlert(false)} className="text-xl hover:opacity-75">
                ✕
              </button>
            </div>
          )}

          {/* Orders Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <RefreshCw className="h-12 w-12 animate-spin text-gray-400 mb-4" />
              <p className="text-gray-600">Loading kitchen orders...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <OrderColumn
                title="Pending"
                color="orange"
                orders={pendingOrders}
                onStatusChange={handleStatusChange}
                onCancelOrder={handleCancelOrder}
                nextStatus="preparing"
                t={t}
              />
              <OrderColumn
                title="Preparing"
                color="blue"
                orders={preparingOrders}
                onStatusChange={handleStatusChange}
                onCancelOrder={handleCancelOrder}
                nextStatus="ready"
                t={t}
              />
              <OrderColumn
                title="Ready"
                color="green"
                orders={readyOrders}
                onStatusChange={handleStatusChange}
                onCancelOrder={handleCancelOrder}
                nextStatus="completed"
                t={t}
              />
            </div>
          )}
        </div>

        <ConfirmationCard
          isOpen={confirmationState.isOpen}
          onClose={closeConfirmation}
          onConfirm={confirmationState.onConfirm}
          title={confirmationState.options.title}
          message={confirmationState.options.message}
          type={confirmationState.options.type}
          confirmText={confirmationState.options.confirmText}
          cancelText={confirmationState.options.cancelText}
          icon={confirmationState.options.icon}
        />

        <NotificationCard
          isOpen={notificationState.isOpen}
          onClose={closeNotification}
          title={notificationState.options.title}
          message={notificationState.options.message}
          type={notificationState.options.type}
          autoClose={notificationState.options.autoClose}
          duration={notificationState.options.duration}
        />
      </div>
    </ProtectedRoute>
  )
}

function OrderColumn({
  title,
  color,
  orders,
  onStatusChange,
  onCancelOrder,
  nextStatus,
  t
}: {
  title: string
  color: "orange" | "blue" | "green"
  orders: Order[]
  onStatusChange: (orderId: string, newStatus: string) => void
  onCancelOrder: (orderId: string) => void
  nextStatus: string
  t: (key: string) => string
}) {
  const colorClasses = {
    orange: "bg-orange-50 border-orange-200",
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200"
  }

  return (
    <div className={`rounded-xl p-4 border ${colorClasses[color]} min-h-[500px]`}>
      <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
        {orders.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No orders</p>
        ) : (
          orders.map(order => (
            <OrderCard
              key={order._id}
              order={order}
              onStatusChange={onStatusChange}
              onCancelOrder={onCancelOrder}
              nextStatus={nextStatus}
              color={color}
              t={t}
            />
          ))
        )}
      </div>
    </div>
  )
}

function OrderCard({
  order,
  onStatusChange,
  onCancelOrder,
  nextStatus,
  color,
  t
}: {
  order: Order
  onStatusChange: (orderId: string, newStatus: string) => void
  onCancelOrder: (orderId: string) => void
  nextStatus: string
  color: "orange" | "blue" | "green"
  t: (key: string) => string
}) {
  const createdTime = new Date(order.createdAt)
  const elapsedMinutes = Math.floor((Date.now() - createdTime.getTime()) / 60000)

  const borderColors = {
    orange: "border-l-orange-500",
    blue: "border-l-blue-500",
    green: "border-l-green-500"
  }

  return (
    <Card className={`border-l-4 ${borderColors[color]} hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-lg text-gray-900">#{order.orderNumber}</h3>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              {elapsedMinutes > 0 ? `${elapsedMinutes}m ago` : "Just now"}
            </p>
          </div>
          {order.notes && (
            <span className="text-lg" title={order.notes}>📝</span>
          )}
        </div>

        <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm">
              <span className="font-medium text-gray-700">{item.name}</span>
              <span className="font-bold bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                {item.quantity}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {order.status === "pending" && (
            <>
              <button
                onClick={() => onStatusChange(order._id, "preparing")}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
              >
                Start Prep
              </button>
              <button
                onClick={() => onCancelOrder(order._id)}
                className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
              >
                ✕
              </button>
            </>
          )}
          {order.status === "preparing" && (
            <button
              onClick={() => onStatusChange(order._id, "ready")}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors"
            >
              Mark Ready
            </button>
          )}
          {order.status === "ready" && (
            <button
              onClick={() => onStatusChange(order._id, "completed")}
              className="flex-1 bg-gray-800 text-white py-2 px-4 rounded-lg font-medium text-sm hover:bg-gray-900 transition-colors"
            >
              Complete
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
