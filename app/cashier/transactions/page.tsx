"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
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
        setOrders(await response.json())
      }
    } catch (err) {
      console.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
  const avgTransaction = totalRevenue / (orders.length || 1)

  return (
    <ProtectedRoute requiredRoles={["cashier"]}>
      <div className="min-h-screen bg-[#e2e7d8] p-4 font-sans text-slate-800">
        <div className="max-w-7xl mx-auto">
          <BentoNavbar />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-[40px] p-8 custom-shadow border-b-8 border-[#2d5a41]">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Sales</p>
              <h3 className="text-3xl font-black text-[#2d5a41]">{totalRevenue.toFixed(0)} Br</h3>
            </div>
            <div className="bg-white rounded-[40px] p-8 custom-shadow border-b-8 border-[#f5bc6b]">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Volume</p>
              <h3 className="text-3xl font-black text-[#1a1a1a]">{orders.length}</h3>
            </div>
            <div className="bg-white rounded-[40px] p-8 custom-shadow border-b-8 border-[#93c5fd]">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Average Ticket</p>
              <h3 className="text-3xl font-black text-blue-800">{avgTransaction.toFixed(0)} Br</h3>
            </div>
          </div>

          <div className="bg-white rounded-[40px] p-8 custom-shadow min-h-[500px]">
            <h3 className="text-2xl font-bold mb-8 bubbly-text">Transaction Log</h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="text-6xl animate-bounce mb-4">💳</div>
                <p className="text-gray-400 font-bold">Syncing Ledger...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <div key={o._id} className="bg-gray-50 rounded-[30px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#e2e7d8]/20 transition-colors border border-transparent hover:border-[#2d5a41]/10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl custom-shadow">🧾</div>
                      <div>
                        <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">#{o.orderNumber}</div>
                        <div className="text-lg font-bold text-gray-800">{o.totalAmount.toFixed(2)} Br</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${o.status === 'completed' ? 'bg-[#e2e7d8] text-[#2d5a41]' : 'bg-[#f5bc6b] text-white'
                        }`}>
                        {o.status}
                      </span>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${o.paymentStatus === 'paid' ? 'bg-[#93c5fd] text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                        {o.paymentStatus || 'pending'}
                      </span>
                    </div>

                    <div className="text-[10px] font-bold text-gray-400 text-right">
                      <div>{new Date(o.createdAt).toLocaleDateString()}</div>
                      <div className="opacity-60">{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
