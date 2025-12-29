"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"

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
  const { t } = useLanguage()

  useEffect(() => {
    fetchOrders()
    const handleRefresh = () => fetchOrders()
    window.addEventListener('focus', handleRefresh)
    window.addEventListener('storage', (e) => {
      if (e.key === 'orderUpdated' || e.key === 'newOrderCreated') handleRefresh()
    })
    return () => {
      window.removeEventListener('focus', handleRefresh)
    }
  }, [token])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) setOrders(await response.json())
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-white text-[#8B4513]'
      case 'pending': return 'bg-[#D2691E] text-white'
      case 'cancelled': return 'bg-red-50 text-red-500'
      default: return 'bg-gray-100 text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    return t(`cashier.${status}`) || status
  }

  return (
    <ProtectedRoute requiredRoles={["cashier"]}>
      <div className="min-h-screen bg-white p-4 font-sans text-slate-800">
        <div className="max-w-7xl mx-auto">
          <BentoNavbar />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Sidebar Stats */}
            <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-4">
              <div className="bg-white rounded-[40px] p-8 custom-shadow">
                <h2 className="text-2xl font-bold mb-6 bubbly-text">{t("cashier.orders")}</h2>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-[30px] p-5 text-center">
                    <div className="text-4xl font-black text-[#8B4513] mb-1">{stats.total}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("cashier.totalManaged")}</div>
                  </div>
                  <div className="bg-[#D2691E] rounded-[30px] p-5 text-center">
                    <div className="text-4xl font-black text-white mb-1">{stats.pending}</div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{t("cashier.awaitingPrep")}</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#8B4513] rounded-[40px] p-8 custom-shadow text-white overflow-hidden relative group">
                <div className="relative z-10">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-60">{t("cashier.dailyRevenue")}</p>
                  <h3 className="text-3xl font-black">{stats.revenue.toFixed(0)} {t("common.currencyBr")}</h3>
                </div>
                <div className="absolute -bottom-4 -right-4 text-7xl opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500">💰</div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-9 space-y-6">
              <div className="bg-white rounded-[40px] p-8 custom-shadow min-h-[600px]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <h3 className="text-2xl font-bold bubbly-text">{t("cashier.salesHistory")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {["all", "pending", "completed", "cancelled"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilterStatus(s as any)}
                        className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all ${filterStatus === s
                          ? "bg-[#8B4513] text-white border-[#8B4513] shadow-lg"
                          : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                          }`}
                      >
                        {t(`cashier.${s}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-32">
                    <div className="text-6xl animate-pulse mb-4">🥐</div>
                    <p className="text-gray-400 font-bold">{t("cashier.unboxingOrders")}</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-32">
                    <div className="text-6xl mb-4 opacity-20">📥</div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest">{t("cashier.noMatchingOrders")}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredOrders.map((o) => (
                      <div key={o._id} className="bg-gray-50 rounded-[35px] p-6 hover:shadow-xl transition-all group border-2 border-transparent hover:border-[#8B4513]/5">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="text-[10px] font-black text-gray-300 uppercase tracking-[3px] mb-1">{t("cashier.orderIdPrefix")}{o.orderNumber.slice(-5)}</div>
                            <div className="text-lg font-black text-gray-800">{o.totalAmount.toFixed(0)} {t("common.currencyBr")}</div>
                          </div>
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(o.status)} shadow-sm`}>
                            {getStatusLabel(o.status)}
                          </span>
                        </div>

                        <div className="space-y-1.5 mb-6">
                          {o.items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white/50 rounded-xl px-3 py-1.5">
                              <span className="text-xs font-bold text-gray-600 truncate max-w-[140px]">{item.name}</span>
                              <span className="text-[10px] font-black text-[#8B4513]">x{item.quantity}</span>
                            </div>
                          ))}
                          {o.items.length > 2 && (
                            <div className="text-[10px] font-bold text-gray-300 pl-2">+{o.items.length - 2} {t("cashier.moreSnacks")}</div>
                          )}
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                          <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                            <span>🕒</span> {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-[10px] font-black text-[#8B4513] uppercase tracking-widest bg-white/30 px-3 py-1 rounded-lg">
                            {o.paymentMethod === 'cash' ? t("cashier.cash") : (o.paymentMethod || t("cashier.cash"))}
                          </div>
                        </div>
                      </div>
                    ))}
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
