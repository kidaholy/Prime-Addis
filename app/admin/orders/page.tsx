"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"

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
  const { t } = useLanguage()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [deleting, setDeleting] = useState<string | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchOrders()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
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

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to delete Order #${orderNumber}? This action cannot be undone.`)) {
      return
    }

    setDeleting(orderId)
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        // Remove order from local state
        setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId))
        console.log(`Order #${orderNumber} deleted successfully`)
      } else {
        const error = await response.json()
        alert(`Failed to delete order: ${error.message}`)
      }
    } catch (error) {
      console.error("Failed to delete order:", error)
      alert("Failed to delete order. Please try again.")
    } finally {
      setDeleting(null)
    }
  }

  const handleBulkDeleteOrders = async () => {
    if (!confirm(`Are you sure you want to delete ALL ${orders.length} orders? This action cannot be undone and will clear your entire order history.`)) {
      return
    }

    if (!confirm("This is your final warning! All order data will be permanently lost. Are you absolutely sure?")) {
      return
    }

    setBulkDeleting(true)
    try {
      const response = await fetch("/api/orders/bulk-delete", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        setOrders([])
        alert(`Successfully deleted ${result.deletedCount} orders`)
      } else {
        const error = await response.json()
        alert(`Failed to delete orders: ${error.message}`)
      }
    } catch (error) {
      console.error("Failed to bulk delete orders:", error)
      alert("Failed to delete orders. Please try again.")
    } finally {
      setBulkDeleting(false)
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true
    return order.status === filter
  })

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return { color: "bg-[#f5bc6b]/20 text-[#1a1a1a]", label: t("adminOrders.pending"), icon: "🕒" }
      case "preparing":
        return { color: "bg-[#93c5fd]/20 text-blue-700", label: t("adminOrders.cooking"), icon: "🍳" }
      case "ready":
        return { color: "bg-[#e2e7d8] text-[#2d5a41]", label: t("adminOrders.ready"), icon: "✅" }
      case "completed":
        return { color: "bg-gray-100 text-gray-500", label: t("adminOrders.served"), icon: "🍽️" }
      case "cancelled":
        return { color: "bg-red-50 text-red-500", label: t("adminOrders.cancelled"), icon: "✕" }
      default:
        return { color: "bg-gray-100 text-gray-500", label: status, icon: "•" }
    }
  }

  const stats = {
    all: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    preparing: orders.filter(o => o.status === "preparing").length,
    ready: orders.filter(o => o.status === "ready").length
  }

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="min-h-screen bg-[#e2e7d8] p-4 font-sans text-slate-800">
        <div className="max-w-7xl mx-auto">
          <BentoNavbar />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar - Filters & Stats */}
            <div className="lg:col-span-3 flex flex-col gap-6 sticky top-4">
              <div className="bg-white rounded-[40px] p-8 custom-shadow">
                <h2 className="text-2xl font-bold mb-6 bubbly-text">{t("adminOrders.title")}</h2>
                <div className="space-y-3">
                  {[
                    { id: "all", label: t("adminOrders.allOrders"), count: stats.all, emoji: "📋" },
                    { id: "pending", label: t("adminOrders.pending"), count: stats.pending, emoji: "🕒" },
                    { id: "preparing", label: t("adminOrders.preparing"), count: stats.preparing, emoji: "🔥" },
                    { id: "ready", label: t("adminOrders.ready"), count: stats.ready, emoji: "✅" }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setFilter(item.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-[25px] font-bold transition-all duration-300 ${filter === item.id
                        ? "bg-[#2d5a41] text-white shadow-lg scale-105"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                        }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-xl">{item.emoji}</span>
                        {item.label}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs ${filter === item.id ? "bg-white/20" : "bg-gray-200 text-gray-500"}`}>
                        {item.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#f5bc6b] rounded-[40px] p-8 custom-shadow group overflow-hidden relative">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">{t("adminOrders.needInsights")}</h3>
                  <p className="text-sm font-medium text-[#1a1a1a]/70">{t("adminOrders.checkDailyReports")}</p>
                </div>
                <div className="absolute -bottom-6 -right-6 text-8xl opacity-20 transform group-hover:rotate-12 transition-transform duration-500">📊</div>
              </div>
            </div>

            {/* Main Content - Order List */}
            <div className="lg:col-span-9">
              <div className="bg-white rounded-[40px] p-8 custom-shadow min-h-[700px]">
                {/* Header with Bulk Delete Button */}
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-bold bubbly-text">{t("adminOrders.orderManagement")}</h2>
                    <p className="text-gray-500 text-sm mt-1">
                      {filteredOrders.length} {filter !== 'all' ? t(`adminOrders.${filter}`) : ''} {t("adminOrders.ordersCount")}
                    </p>
                  </div>

                  {orders.length > 0 && (
                    <button
                      onClick={handleBulkDeleteOrders}
                      disabled={bulkDeleting}
                      className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none flex items-center gap-2"
                    >
                      {bulkDeleting ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          {t("adminOrders.deleting")}
                        </>
                      ) : (
                        <>
                          <span>🗑️</span>
                          {t("adminOrders.deleteAllOrders")}
                        </>
                      )}
                    </button>
                  )}
                </div>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-32">
                    <div className="text-6xl animate-bounce mb-4">🍩</div>
                    <p className="text-gray-400 font-bold">{t("adminOrders.scanningOrders")}</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-32">
                    <div className="text-8xl mb-6 opacity-20">🍃</div>
                    <h3 className="text-2xl font-bold text-gray-400">{t("adminOrders.quietForNow")}</h3>
                    <p className="text-gray-400">{t("adminOrders.noOrdersFound")}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredOrders.map((order) => {
                      const status = getStatusConfig(order.status)
                      return (
                        <div key={order._id} className="bg-gray-50 rounded-[40px] p-6 border-2 border-transparent hover:border-[#2d5a41]/10 hover:shadow-xl transition-all flex flex-col group animate-slide-in-up">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="text-xl font-bold text-gray-800">#{order.orderNumber}</h3>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <span className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold ${status.color}`}>
                              <span>{status.icon}</span>
                              {status.label}
                            </span>
                          </div>

                          <div className="flex-1 space-y-3 mb-6 bg-white/50 rounded-[30px] p-5">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 font-bold">
                                  <span className="text-[#2d5a41]">{item.quantity}×</span> {item.name}
                                </span>
                                <span className="font-bold text-gray-400">{(item.price * item.quantity).toFixed(0)} {t("common.currencyBr")}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-between items-center pt-2">
                            <div className="text-sm font-bold text-gray-400">{t("adminOrders.totalAmount")}</div>
                            <div className="flex items-center gap-3">
                              <div className="text-3xl font-black text-[#2d5a41]">{order.totalAmount.toFixed(0)} {t("common.currencyBr")}</div>
                              <button
                                onClick={() => handleDeleteOrder(order._id, order.orderNumber)}
                                disabled={deleting === order._id}
                                className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white p-2 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none"
                                title="Delete Order"
                              >
                                {deleting === order._id ? (
                                  <span className="animate-spin text-sm">⏳</span>
                                ) : (
                                  <span className="text-sm">🗑️</span>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

