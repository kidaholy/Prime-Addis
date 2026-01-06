"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"
import { ConfirmationCard, NotificationCard } from "@/components/confirmation-card"
import { useConfirmation } from "@/hooks/use-confirmation"

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
      message: "Are you sure you want to cancel this order?\n\nThis action cannot be undone.",
      type: "warning",
      confirmText: "Cancel Order",
      cancelText: "Keep Order"
    })

    if (!confirmed) return

    try {
      // Optimistic update
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
      // Optimistic update
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
      <div className="min-h-screen bg-white p-4 font-sans text-slate-800">
        <div className="max-w-7xl mx-auto">
          <BentoNavbar />

          <div className="mb-6">
            <div className="bg-[#8B4513] rounded-[40px] p-8 custom-shadow flex flex-col md:flex-row justify-between items-center gap-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-4xl">🍳</div>
                <div>
                  <h1 className="text-4xl font-bold bubbly-text">{t("chef.kitchenDisplay")}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">
                      {t("adminDashboard.kitchenRunningSmooth")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex bg-white/10 p-2 rounded-[30px] backdrop-blur-md">
                {["pending", "preparing", "ready"].map((s) => (
                  <div key={s} className="px-6 py-2 text-center">
                    <div className="text-2xl font-black">{orders.filter(o => o.status === s).length}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60">{t(`chef.${s}`)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {newOrderAlert && (
            <div className="mb-6 p-4 bg-[#D2691E] text-white rounded-[20px] shadow-2xl animate-pulse flex items-center justify-between border-4 border-white custom-shadow transform scale-105 transition-transform">
              <div className="flex items-center gap-3">
                <span className="text-3xl animate-bounce">🔔</span>
                <div>
                  <p className="font-bold text-lg">{t("chef.newOrderIncoming")}</p>
                  <p className="text-sm opacity-90">{t("chef.checkQueueImmediately")}</p>
                </div>
              </div>
              <button onClick={() => setNewOrderAlert(false)} className="text-2xl font-bold hover:opacity-75">
                ✕
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <div className="text-6xl animate-bounce mb-4">🍳</div>
              <h2 className="text-2xl font-bold text-gray-400">{t("chef.loadingKitchenData")}</h2>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pending Column */}
              <BentoColumn
                title={t("chef.pending")}
                icon="⏳"
                color="bg-orange-50 border-orange-100"
                headerColor="text-orange-600"
              >
                {pendingOrders.map(order => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    onCancelOrder={handleCancelOrder}
                    nextStatus="preparing"
                    accentColor="orange"
                    t={t}
                  />
                ))}
              </BentoColumn>

              {/* Preparing Column */}
              <BentoColumn
                title={t("chef.preparing")}
                icon="🔥"
                color="bg-blue-50 border-blue-100"
                headerColor="text-blue-600"
              >
                {preparingOrders.map(order => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    onCancelOrder={handleCancelOrder}
                    nextStatus="ready"
                    accentColor="blue"
                    t={t}
                  />
                ))}
              </BentoColumn>

              {/* Ready Column */}
              <BentoColumn
                title={t("chef.readyForPickup")}
                icon="✅"
                color="bg-green-50 border-green-100"
                headerColor="text-green-600"
              >
                {readyOrders.map(order => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    onCancelOrder={handleCancelOrder}
                    nextStatus="completed"
                    accentColor="green"
                    t={t}
                  />
                ))}
              </BentoColumn>
            </div>
          )}
        </div>

        {/* Confirmation and Notification Cards */}
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

function BentoColumn({ title, icon, children, color, headerColor }: { title: string, icon: string, children: React.ReactNode, color: string, headerColor: string }) {
  return (
    <div className={`rounded-[35px] custom-shadow p-5 min-h-[600px] flex flex-col ${color} border-2`}>
      <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${headerColor} pl-2`}>
        <span>{icon}</span> {title}
      </h2>
      <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {children}
      </div>
    </div>
  )
}

interface OrderCardProps {
  order: Order
  onStatusChange: (orderId: string, newStatus: string) => void
  onCancelOrder: (orderId: string) => void
  nextStatus: string
  accentColor: "orange" | "blue" | "green"
  t: (key: string) => string
}

function OrderCard({ order, onStatusChange, onCancelOrder, nextStatus, accentColor, t }: OrderCardProps) {
  const createdTime = new Date(order.createdAt)
  const elapsedMinutes = Math.floor((Date.now() - createdTime.getTime()) / 60000)

  const accents = {
    orange: "border-l-orange-500 hover:shadow-orange-100",
    blue: "border-l-blue-500 hover:shadow-blue-100",
    green: "border-l-green-500 hover:shadow-green-100"
  }

  return (
    <div className={`bg-white rounded-[25px] p-5 border-l-[6px] shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1 ${accents[accentColor]}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-800">#{order.orderNumber}</h3>
          <p className="text-xs text-gray-500 font-medium">
            ⏱ {elapsedMinutes > 0 ? `${elapsedMinutes}m ago` : t("chef.justNow")}
          </p>
        </div>
        {order.notes && (
          <span className="text-xl animate-pulse" title={order.notes}>📝</span>
        )}
      </div>

      <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-2xl">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-100 last:border-0 pb-1 last:pb-0">
            <span className="font-medium text-gray-700">
              {item.name}
              {item.menuId && <span className="text-xs text-gray-400 font-mono ml-2">({item.menuId})</span>}
            </span>
            <span className="font-bold bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">
              {item.quantity}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <div className="flex gap-2">
          {order.status === "pending" && (
            <button
              onClick={() => onStatusChange(order._id, "preparing")}
              className="flex-1 bg-blue-100 text-blue-600 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all transform active:scale-95"
            >
              {t("chef.startPrep")}
            </button>
          )}
          {order.status === "preparing" && (
            <button
              onClick={() => onStatusChange(order._id, "ready")}
              className="flex-1 bg-[#8B4513] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-[#8B4513]/20 transform hover:scale-105 active:scale-95"
            >
              {t("chef.markReady")}
            </button>
          )}
          {order.status === "ready" && (
            <button
              onClick={() => onStatusChange(order._id, "completed")}
              className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all transform active:scale-95"
            >
              {t("chef.complete")}
            </button>
          )}
          {order.status === "pending" && (
            <button
              onClick={() => onCancelOrder(order._id)}
              className="px-4 py-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold transition-all"
              title={t("common.delete")}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
