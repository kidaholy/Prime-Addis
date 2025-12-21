"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
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
      // Optimistic update - immediately update the UI
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId
            ? { ...order, status: newStatus as any }
            : order
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
        // Immediate refresh to ensure data consistency
        fetchOrders()

        // Trigger refresh on other pages by setting a flag in localStorage
        localStorage.setItem('orderUpdated', Date.now().toString())
      } else {
        // Revert optimistic update on failure
        fetchOrders()
      }
    } catch (err) {
      console.error("Failed to update order status")
      // Revert optimistic update on error
      fetchOrders()
    }
  }

  const pendingOrders = orders.filter((o) => o.status === "pending")
  const preparingOrders = orders.filter((o) => o.status === "preparing")
  const readyOrders = orders.filter((o) => o.status === "ready")

  return (
    <ProtectedRoute requiredRoles={["chef"]}>
      <div className="min-h-screen bg-[#e2e7d8] p-4 font-sans text-slate-800">
        <div className="max-w-7xl mx-auto">
          <BentoNavbar />

          <div className="mb-6 flex justify-between items-center text-[#2d5a41]">
            <h1 className="text-3xl font-bold bubbly-text">Kitchen Display 👨‍🍳</h1>
            <div className="flex gap-4">
              <Badge count={pendingOrders.length} label="Pending" color="warning" />
              <Badge count={preparingOrders.length} label="Prep" color="info" />
              <Badge count={readyOrders.length} label="Ready" color="success" />
            </div>
          </div>

          {newOrderAlert && (
            <div className="mb-6 p-4 bg-[#f5bc6b] text-white rounded-[20px] shadow-2xl animate-pulse flex items-center justify-between border-4 border-white custom-shadow transform scale-105 transition-transform">
              <div className="flex items-center gap-3">
                <span className="text-3xl animate-bounce">🔔</span>
                <div>
                  <p className="font-bold text-lg">New Order Incoming!</p>
                  <p className="text-sm opacity-90">Check your queue immediately</p>
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
              <h2 className="text-2xl font-bold text-gray-400">Loading Kitchen Data...</h2>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pending Column */}
              <BentoColumn
                title="Pending"
                icon="⏳"
                color="bg-orange-50 border-orange-100"
                headerColor="text-orange-600"
              >
                {pendingOrders.map(order => (
                  <OrderCard key={order._id} order={order} onStatusChange={handleStatusChange} nextStatus="preparing" accentColor="orange" />
                ))}
              </BentoColumn>

              {/* Preparing Column */}
              <BentoColumn
                title="Preparing"
                icon="🔥"
                color="bg-blue-50 border-blue-100"
                headerColor="text-blue-600"
              >
                {preparingOrders.map(order => (
                  <OrderCard key={order._id} order={order} onStatusChange={handleStatusChange} nextStatus="ready" accentColor="blue" />
                ))}
              </BentoColumn>

              {/* Ready Column */}
              <BentoColumn
                title="Ready for Pickup"
                icon="✅"
                color="bg-green-50 border-green-100"
                headerColor="text-green-600"
              >
                {readyOrders.map(order => (
                  <OrderCard key={order._id} order={order} onStatusChange={handleStatusChange} nextStatus="completed" accentColor="green" />
                ))}
              </BentoColumn>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

function Badge({ count, label, color }: { count: number, label: string, color: 'warning' | 'info' | 'success' }) {
  const colors = {
    warning: "bg-orange-100 text-orange-700",
    info: "bg-blue-100 text-blue-700",
    success: "bg-green-100 text-green-700"
  }
  return (
    <div className={`px-4 py-2 rounded-full font-bold text-sm ${colors[color]} border-2 border-white shadow-sm`}>
      {label}: {count}
    </div>
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
  nextStatus: string
  accentColor: "orange" | "blue" | "green"
}

function OrderCard({ order, onStatusChange, nextStatus, accentColor }: OrderCardProps) {
  const createdTime = new Date(order.createdAt)
  const elapsedMinutes = Math.floor((Date.now() - createdTime.getTime()) / 60000)

  const accents = {
    orange: "border-l-orange-500 hover:shadow-orange-100",
    blue: "border-l-blue-500 hover:shadow-blue-100",
    green: "border-l-green-500 hover:shadow-green-100"
  }

  const btnInfo = {
    pending: { text: "Start Prep", bg: "bg-blue-500 hover:bg-blue-600" },
    preparing: { text: "Mark Ready", bg: "bg-green-500 hover:bg-green-600" },
    ready: { text: "Complete", bg: "bg-gray-800 hover:bg-black" }
  }

  // Determine button style based on current status (which implies next action)
  // Logic: if current is pending -> action is Start (blue)
  // if current is preparing -> action is Ready (green)
  // if current is ready -> action is Complete (dark)
  const btnStyle = order.status === 'pending' ? btnInfo.pending :
    order.status === 'preparing' ? btnInfo.preparing : btnInfo.ready

  return (
    <div className={`bg-white rounded-[25px] p-5 border-l-[6px] shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1 ${accents[accentColor]}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-800">#{order.orderNumber}</h3>
          <p className="text-xs text-gray-500 font-medium">
            ⏱ {elapsedMinutes > 0 ? `${elapsedMinutes}m ago` : "Just now"}
          </p>
        </div>
        {order.notes && (
          <span className="text-xl animate-pulse" title={order.notes}>📝</span>
        )}
      </div>

      <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-2xl">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-100 last:border-0 pb-1 last:pb-0">
            <span className="font-medium text-gray-700">{item.name}</span>
            <span className="font-bold bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">
              {item.quantity}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={() => onStatusChange(order._id, nextStatus)}
        className={`w-full text-white py-3 rounded-xl font-bold transition-colors shadow-md ${btnStyle.bg}`}
      >
        {btnStyle.text}
      </button>
    </div>
  )
}
