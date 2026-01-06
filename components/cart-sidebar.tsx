"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/context/language-context"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface CartSidebarProps {
  items: CartItem[]
  onRemove: (id: string) => void
  onQuantityChange: (id: string, quantity: number) => void
  onCheckout: () => void
  isLoading?: boolean
  isEmbedded?: boolean
  waiterBatchNumber: string
  setWaiterBatchNumber: (val: string) => void
  tableNumber: string
  setTableNumber: (val: string) => void
}

export function CartSidebar({
  items,
  onRemove,
  onQuantityChange,
  onCheckout,
  isLoading = false,
  isEmbedded = false,
  waiterBatchNumber,
  setWaiterBatchNumber,
  tableNumber,
  setTableNumber,
}: CartSidebarProps) {
  const { t } = useLanguage()
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  // Settings State for Tables/Waiters
  const [tables, setTables] = useState<any[]>([])
  const [waiters, setWaiters] = useState<any[]>([])

  useEffect(() => {
    // Fetch tables and waiters
    const fetchData = async () => {
      try {
        const [tablesRes, waitersRes] = await Promise.all([
          fetch("/api/tables"),
          fetch("/api/waiters")
        ])
        if (tablesRes.ok) setTables(await tablesRes.json())
        if (waitersRes.ok) setWaiters(await waitersRes.json())
      } catch (err) { console.error("Failed to load tables/waiters", err) }
    }
    fetchData()
  }, [])

  // Filter tables based on selected waiter
  const filteredTables = waiterBatchNumber
    ? tables.filter(t => {
      const selectedWaiter = waiters.find(w => w.waiterId === waiterBatchNumber)
      return selectedWaiter?.tables?.includes(t.tableNumber)
    })
    : tables

  const containerClasses = isEmbedded
    ? "w-full flex flex-col h-full bg-transparent"
    : "w-full md:w-80 bg-card border-l border-border flex flex-col md:h-screen md:sticky md:right-0 md:top-0 shadow-lg"

  return (
    <div className={containerClasses}>
      {/* Header - Only show if not embedded (POS handles its own header) */}
      {!isEmbedded && (
        <div className="p-4 border-b border-border bg-primary/10">
          <h2 className="text-xl font-bold text-foreground">{t("cashier.orderCart")}</h2>
          <p className="text-sm text-muted-foreground">{items.length} {t("cashier.items")}</p>
        </div>
      )}

      {/* Order Metadata */}
      <div className={`${isEmbedded ? 'pb-4' : 'px-4 pb-4'} space-y-3`}>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Batch #</label>
            <select
              value={waiterBatchNumber}
              onChange={(e) => {
                setWaiterBatchNumber(e.target.value)
                setTableNumber("") // Reset table selection when waiter changes
              }}
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:border-[#2d5a41] focus:ring-0 transition-all outline-none appearance-none"
            >
              <option value="">Select Waiter</option>
              {waiters.map((waiter: any) => (
                <option key={waiter._id} value={waiter.waiterId}>
                  {waiter.waiterId} - {waiter.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Table #</label>
            <select
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              disabled={!waiterBatchNumber && waiters.some(w => w.tables?.length > 0)} // Disable if strict mode is needed, but for now just filter
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:border-[#2d5a41] focus:ring-0 transition-all outline-none appearance-none disabled:opacity-50 disabled:bg-gray-100"
            >
              <option value="">Select Table</option>
              {filteredTables.map((table: any) => (
                <option key={table._id} value={table.tableNumber}>
                  {table.tableNumber} {table.capacity ? `(${table.capacity})` : ""}
                </option>
              ))}
            </select>
            {waiterBatchNumber && filteredTables.length === 0 && (
              <p className="text-[10px] text-red-500 font-bold mt-1">No tables assigned to this waiter.</p>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className={`flex-1 overflow-y-auto ${isEmbedded ? 'py-2' : 'p-4'} space-y-3 custom-scrollbar`}>
        {items.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-6xl mb-4 opacity-20">🛒</div>
            <p className="font-bold">{t("cashier.cartEmpty")}</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id}
              className="bg-gray-50 rounded-[25px] p-4 flex gap-3 border border-gray-100 hover:border-[#2d5a41]/30 transition-all animate-slide-in-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex-1">
                <h3 className="font-bold text-sm text-gray-800">{item.name}</h3>
                <p className="text-xs text-gray-500 font-bold">{item.price} {t("common.currencyBr")}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onQuantityChange(item.id, Math.max(1, item.quantity - 1))}
                  className="w-8 h-8 bg-white shadow-sm border border-gray-200 rounded-full flex items-center justify-center text-sm hover:bg-gray-100 transition-all font-bold"
                >
                  −
                </button>
                <span className="w-6 text-center font-bold text-gray-800">{item.quantity}</span>
                <button
                  onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                  className="w-8 h-8 bg-[#2d5a41] text-white shadow-md rounded-full flex items-center justify-center text-sm hover:bg-black transition-all font-bold"
                >
                  +
                </button>
                <button
                  onClick={() => onRemove(item.id)}
                  className="ml-2 w-8 h-8 text-red-400 hover:text-red-500 transition-colors flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className={`${isEmbedded ? 'mt-auto pt-6' : 'p-4 border-t border-border bg-primary/5'} space-y-3`}>
        <div className="space-y-2 bg-gray-50 p-4 rounded-[30px] border border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">{t("cashier.subtotal")}</span>
            <span className="font-bold text-gray-800">{subtotal.toFixed(0)} {t("common.currencyBr")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">{t("cashier.tax")} (8%)</span>
            <span className="font-bold text-gray-800">{tax.toFixed(0)} {t("common.currencyBr")}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
            <span className="font-bold text-gray-800">{t("cashier.total")}</span>
            <span className="text-2xl font-bold text-[#2d5a41]">{total.toFixed(0)} {t("common.currencyBr")}</span>
          </div>
        </div>

        <button
          onClick={onCheckout}
          disabled={items.length === 0 || isLoading}
          className="w-full bg-[#f5bc6b] text-[#1a1a1a] font-bold py-4 rounded-full hover:shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 custom-shadow bubbly-button mb-2"
        >
          {isLoading ? (
            <>
              <span className="animate-spin text-xl">⏳</span>
              {t("cashier.processing")}
            </>
          ) : (
            <>
              <span className="text-xl">🚀</span>
              {t("cashier.sendToKitchen")}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
