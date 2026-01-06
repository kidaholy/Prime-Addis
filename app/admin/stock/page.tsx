"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"
import { ConfirmationCard, NotificationCard } from "@/components/confirmation-card"
import { useConfirmation } from "@/hooks/use-confirmation"
import {
    Plus, Search, Trash2, Edit2, Calendar,
    DollarSign, PenTool, TrendingUp, History,
    ChevronRight, Package, List, BarChart3,
    AlertCircle, CheckCircle2, ChevronDown
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { PlusCircle } from "lucide-react"

interface DailyExpense {
    _id: string
    date: string
    otherExpenses: number
    items: Array<{ name: string; amount: number; quantity: number; unit: string }>
    description?: string
    createdAt: string
    updatedAt: string
}

interface StockItem {
    _id: string
    name: string
    category: string
    quantity?: number
    unit: string
    minLimit?: number
    unitCost?: number
    trackQuantity: boolean
    showStatus: boolean
    status: 'active' | 'finished'
}

export default function StockAndExpensesPage() {
    const [activeTab, setActiveTab] = useState<"expenses" | "inventory">("expenses")
    const [expenses, setExpenses] = useState<DailyExpense[]>([])
    const [stockItems, setStockItems] = useState<StockItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [showStockForm, setShowStockForm] = useState(false)
    const [editingExpense, setEditingExpense] = useState<DailyExpense | null>(null)
    const [editingStock, setEditingStock] = useState<StockItem | null>(null)
    const [saveLoading, setSaveLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [expensePeriod, setExpensePeriod] = useState<"today" | "week" | "month" | "year" | "all">("month")

    const [showRestockModal, setShowRestockModal] = useState(false)
    const [restockingItem, setRestockingItem] = useState<StockItem | null>(null)
    const [restockAmount, setRestockAmount] = useState("")
    const [newUnitCost, setNewUnitCost] = useState("")

    const [expenseFormData, setExpenseFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        items: [] as Array<{ name: string; amount: number; quantity: number; unit: string }>,
        otherExpenses: "", // Kept for aggregate view
        description: ""
    })

    const [stockFormData, setStockFormData] = useState({
        name: "",
        category: "meat",
        quantity: "",
        unit: "kg",
        minLimit: "",
        unitCost: "",
        trackQuantity: true,
        showStatus: true
    })

    const { token } = useAuth()
    const { t } = useLanguage()
    const { confirmationState, confirm, closeConfirmation, notificationState, notify, closeNotification } = useConfirmation()

    useEffect(() => {
        if (token) {
            fetchExpenses()
            fetchStockItems()
        }
    }, [token, expensePeriod])

    const fetchExpenses = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/admin/expenses?period=${expensePeriod}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                const data = await response.json()
                setExpenses(data)
            }
        } catch (error) {
            console.error("Error fetching expenses:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchStockItems = async () => {
        try {
            const response = await fetch("/api/stock", {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                const data = await response.json()
                setStockItems(data)
            }
        } catch (error) {
            console.error("Error fetching stock:", error)
        }
    }

    const handleSaveExpense = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaveLoading(true)
        try {
            const response = await fetch("/api/admin/expenses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...expenseFormData,
                    items: expenseFormData.items.map(i => ({
                        ...i,
                        amount: Number(i.amount) || 0,
                        quantity: Number(i.quantity) || 0
                    }))
                }),
            })

            if (response.ok) {
                fetchExpenses()
                fetchStockItems()
                resetExpenseForm()
                notify({
                    title: "Expense Saved",
                    message: "Daily expense record has been saved successfully.",
                    type: "success"
                })
            } else {
                const data = await response.json()
                notify({
                    title: "Save Failed",
                    message: data.error || "Failed to save expense",
                    type: "error"
                })
            }
        } catch (error) {
            console.error("Error saving expense:", error)
        } finally {
            setSaveLoading(false)
        }
    }

    const handleSaveStock = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaveLoading(true)
        try {
            const url = editingStock ? `/api/stock/${editingStock._id}` : "/api/stock"
            const method = editingStock ? "PUT" : "POST"

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...stockFormData,
                    quantity: stockFormData.quantity === "" ? undefined : Number(stockFormData.quantity),
                    minLimit: stockFormData.minLimit === "" ? undefined : Number(stockFormData.minLimit),
                    unitCost: stockFormData.unitCost === "" ? undefined : Number(stockFormData.unitCost),
                }),
            })

            if (response.ok) {
                fetchStockItems()
                resetStockForm()
                notify({
                    title: editingStock ? "Stock Updated" : "Stock Added",
                    message: editingStock ? "Stock item has been updated successfully." : "New stock item has been added to inventory.",
                    type: "success"
                })
            } else {
                const data = await response.json()
                notify({
                    title: "Save Failed",
                    message: data.message || "Failed to save stock item",
                    type: "error"
                })
            }
        } catch (error) {
            console.error("Error saving stock:", error)
        } finally {
            setSaveLoading(false)
        }
    }

    const deleteStockItem = async (id: string) => {
        const confirmed = await confirm({
            title: "Delete Stock Item",
            message: "Are you sure you want to delete this stock item?\n\nThis action cannot be undone.",
            type: "danger",
            confirmText: "Delete Item",
            cancelText: "Cancel"
        })

        if (!confirmed) return
        try {
            const response = await fetch(`/api/stock/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                fetchStockItems()
            }
        } catch (error) {
            console.error("Error deleting stock:", error)
        }
    }

    const handleRestockSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!restockingItem) return

        setSaveLoading(true)
        try {
            const addedAmount = Number(restockAmount)
            const currentQuantity = restockingItem.quantity || 0
            const newQuantity = currentQuantity + addedAmount

            // If user provides a new unit cost, update it. Otherwise keep the old one.
            // You might want to do a weighted average, but for simplicity we'll just update the current cost
            // or keep existing if blank.
            const updatedUnitCost = newUnitCost ? Number(newUnitCost) : restockingItem.unitCost

            const response = await fetch(`/api/stock/${restockingItem._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    quantity: newQuantity,
                    unitCost: updatedUnitCost,
                    status: 'active' // Reactivate if it was finished
                }),
            })

            if (response.ok) {
                fetchStockItems()
                setShowRestockModal(false)
                setRestockingItem(null)
                setRestockAmount("")
                setNewUnitCost("")
                notify({
                    title: "Stock Updated",
                    message: `Added ${addedAmount} ${restockingItem.unit} to ${restockingItem.name}. New total: ${newQuantity} ${restockingItem.unit}.`,
                    type: "success"
                })
            } else {
                notify({
                    title: "Update Failed",
                    message: "Failed to update stock quantity.",
                    type: "error"
                })
            }
        } catch (error) {
            console.error(error)
        } finally {
            setSaveLoading(false)
        }
    }

    const openRestockModal = (item: StockItem) => {
        setRestockingItem(item)
        setRestockAmount("")
        setNewUnitCost(item.unitCost?.toString() || "")
        setShowRestockModal(true)
    }

    const deleteExpense = async (id: string) => {
        const confirmed = await confirm({
            title: "Delete Expense Record",
            message: "Are you sure you want to delete this expense record?\n\nThis action cannot be undone.",
            type: "danger",
            confirmText: "Delete Record",
            cancelText: "Cancel"
        })

        if (!confirmed) return
        try {
            const response = await fetch(`/api/admin/expenses?id=${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                fetchExpenses()
                fetchStockItems()
                notify({
                    title: "Expense Deleted",
                    message: "Expense record has been deleted successfully.",
                    type: "success"
                })
            } else {
                const data = await response.json()
                notify({
                    title: "Delete Failed",
                    message: data.error || "Failed to delete expense",
                    type: "error"
                })
            }
        } catch (error) {
            console.error("Error deleting expense:", error)
        }
    }

    const handleEditExpense = (expense: DailyExpense) => {
        setEditingExpense(expense)
        setExpenseFormData({
            date: new Date(expense.date).toISOString().split('T')[0],
            items: expense.items || [],
            otherExpenses: expense.otherExpenses.toString(),
            description: expense.description || ""
        })
        setShowForm(true)
    }

    const handleEditStock = (item: StockItem) => {
        setEditingStock(item)
        setStockFormData({
            name: item.name,
            category: item.category,
            quantity: item.quantity?.toString() || "",
            unit: item.unit,
            minLimit: item.minLimit?.toString() || "",
            unitCost: item.unitCost?.toString() || "",
            trackQuantity: item.trackQuantity,
            showStatus: item.showStatus
        })
        setShowStockForm(true)
    }

    const handleMarkFinished = async (item: StockItem) => {
        const confirmed = await confirm({
            title: "Mark Stock as Finished",
            message: `Are you sure you want to mark ${item.name} as Finished?\n\nThis will set its quantity to 0 and block related orders.`,
            type: "warning",
            confirmText: "Mark Finished",
            cancelText: "Cancel"
        })

        if (!confirmed) return

        const shouldArchive = await confirm({
            title: "Archive This Record?",
            message: `Do you want to ARCHIVE this record?\n\nArchiving renames it to "${item.name} (Finished)" which preserves its history in your reports and allows you to start a fresh batch next time.`,
            type: "info",
            confirmText: "Yes, Archive",
            cancelText: "No, Just Mark Finished"
        })

        try {
            const updateData: any = {
                quantity: 0,
                status: 'finished'
            }

            if (shouldArchive) {
                const dateStr = new Date().toISOString().split('T')[0]
                updateData.name = `${item.name} (Finished ${dateStr})`
            }

            const response = await fetch(`/api/stock/${item._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updateData),
            })
            if (response.ok) {
                fetchStockItems()
            }
        } catch (error) {
            console.error("Error marking stock as finished:", error)
        }
    }

    const resetExpenseForm = () => {
        setExpenseFormData({
            date: new Date().toISOString().split('T')[0],
            items: [],
            otherExpenses: "",
            description: ""
        })
        setEditingExpense(null)
        setShowForm(false)
    }

    const resetStockForm = () => {
        setStockFormData({
            name: "",
            category: "meat",
            quantity: "",
            unit: "kg",
            minLimit: "",
            unitCost: "",
            trackQuantity: true,
            showStatus: true
        })
        setEditingStock(null)
        setShowStockForm(false)
    }

    const filteredExpenses = expenses.filter(exp =>
        new Date(exp.date).toLocaleDateString().includes(searchTerm) ||
        exp.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredStock = stockItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalStats = {
        totalOther: expenses.reduce((sum, e) => sum + e.otherExpenses, 0),
        count: expenses.length,
        inventoryValue: stockItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitCost || 0)), 0),
        lowStockItems: stockItems.filter(item => item.trackQuantity && (item.quantity || 0) <= (item.minLimit || 0)).length
    }

    return (
        <ProtectedRoute requiredRoles={["admin"]}>
            <div className="min-h-screen bg-white p-4 md:p-8 font-sans text-slate-800">
                <div className="max-w-7xl mx-auto">
                    <BentoNavbar />

                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Summary & Controls Sidebar */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Overview Card */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-[#8B4513] rounded-[40px] p-8 text-white custom-shadow overflow-hidden relative"
                            >
                                <div className="absolute -right-10 -bottom-10 opacity-10">
                                    {activeTab === 'expenses' ? <TrendingUp className="w-48 h-48" /> : <Package className="w-48 h-48" />}
                                </div>
                                <h2 className="text-sm font-black uppercase tracking-widest mb-6 opacity-60">
                                    {activeTab === 'expenses' ? 'Expense Summary' : 'Inventory Value'}
                                </h2>
                                <div className="space-y-6 relative z-10">
                                    <div>
                                        {activeTab === 'expenses' ? (
                                            <>
                                                <p className="text-4xl font-black">{totalStats.totalOther.toLocaleString()} <span className="text-xs">ETB</span></p>
                                                <p className="text-xs font-bold uppercase tracking-widest opacity-60 mt-1">Total Operational Investment</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-4xl font-black">{totalStats.inventoryValue.toLocaleString()} <span className="text-xs">ETB</span></p>
                                                <p className="text-xs font-bold uppercase tracking-widest opacity-60 mt-1">Assets On Hand</p>
                                            </>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                                        {activeTab === 'expenses' ? (
                                            <>
                                                <div>
                                                    <p className="text-xl font-bold">{totalStats.count}</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Days Recorded</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div>
                                                    <p className="text-xl font-bold">{totalStats.lowStockItems}</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Low Stock SKUs</p>
                                                </div>
                                                <div>
                                                    <p className="text-xl font-bold">{stockItems.length}</p>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Total Items</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Action Card */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white rounded-[40px] p-8 custom-shadow flex flex-col gap-6"
                            >
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight">
                                        {activeTab === 'expenses' ? 'Record Operational Cost' : 'Physical Operations'}
                                    </h2>
                                    <div className="p-2 bg-[#8B4513]/10 rounded-xl">
                                        {activeTab === 'expenses' ? <TrendingUp className="w-5 h-5 text-[#8B4513]" /> : <Plus className="w-5 h-5 text-[#8B4513]" />}
                                    </div>
                                </div>
                                <p className="text-gray-500 text-sm font-medium">
                                    {activeTab === 'expenses'
                                        ? 'Record the daily livestock purchase price.'
                                        : 'Manage your physical items and specific operational costs like charcoal & gas.'}
                                </p>
                                <button
                                    onClick={() => {
                                        if (activeTab === 'expenses') { resetExpenseForm(); setShowForm(true); }
                                        else { resetStockForm(); setShowStockForm(true); }
                                    }}
                                    className="w-full bg-[#D2691E] text-slate-900 py-4 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-[#D2691E]/20 hover:scale-[1.02] active:scale-98 transition-all"
                                >
                                    {activeTab === 'expenses' ? 'Log Expense' : 'Add Physical Item'}
                                </button>
                            </motion.div>
                        </div>

                        {/* Main Feed Area */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Tab Switcher */}
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="bg-white p-2 rounded-full inline-flex gap-2 custom-shadow">
                                    <button
                                        onClick={() => setActiveTab("expenses")}
                                        className={`px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'expenses' ? 'bg-[#8B4513] text-white shadow-lg' : 'text-gray-400 hover:text-slate-800'}`}
                                    >
                                        💸 Expenses Diary
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("inventory")}
                                        className={`px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-[#8B4513] text-white shadow-lg' : 'text-gray-400 hover:text-slate-800'}`}
                                    >
                                        📦 Physical Stock & Expenses
                                    </button>
                                </div>

                                {activeTab === 'expenses' && (
                                    <div className="bg-white p-2 rounded-full inline-flex gap-2 custom-shadow">
                                        {(["today", "week", "month", "year", "all"] as const).map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => setExpensePeriod(p)}
                                                className={`px-4 py-3 rounded-full font-black uppercase text-[9px] tracking-widest transition-all ${expensePeriod === p ? 'bg-[#D2691E] text-white shadow-md' : 'text-gray-400 hover:text-[#8B4513]'}`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-[40px] p-8 custom-shadow min-h-[600px]"
                            >
                                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                                    <div>
                                        <h1 className="text-3xl font-black text-slate-900 tracking-tight bubbly-text">
                                            {activeTab === 'expenses' ? <>Daily <span className="text-[#8B4513]">Expenses</span></> : <>Physical <span className="text-[#8B4513]">Stock</span></>}
                                        </h1>
                                        <p className="text-gray-500 font-medium mt-1">
                                            {activeTab === 'expenses' ? 'Observational financial record of operations.' : 'Itemized list of all physical assets and quantities.'}
                                        </p>
                                    </div>
                                    <div className="relative group w-full md:w-64">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#8B4513] transition-colors" />
                                        <input
                                            type="text"
                                            placeholder={activeTab === 'expenses' ? "Search by date..." : "Search items..."}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#8B4513]/10 outline-none font-bold text-sm"
                                        />
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-32 opacity-20">
                                        <History className="w-16 h-16 animate-spin-slow mb-4" />
                                        <p className="font-black uppercase tracking-widest text-xs">Syncing Balance Sheet...</p>
                                    </div>
                                ) : activeTab === 'expenses' ? (
                                    /* EXPENSES FEED */
                                    filteredExpenses.length === 0 ? (
                                        <div className="text-center py-32">
                                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Calendar className="w-8 h-8 text-gray-200" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-400">No expenses recorded yet.</h3>
                                            <button onClick={() => setShowForm(true)} className="mt-4 text-[#2d5a41] font-bold text-sm hover:underline">Start Recording Today</button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {filteredExpenses.map((expense, idx) => (
                                                <motion.div
                                                    key={expense._id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="group relative flex items-center justify-between p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100 hover:bg-white hover:shadow-xl transition-all"
                                                >
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex flex-col items-center justify-center group-hover:bg-[#8B4513]/5 transition-colors">
                                                            <span className="text-[10px] font-black uppercase text-[#8B4513]/40">{new Date(expense.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                                            <span className="text-xl font-black text-[#8B4513] leading-none">{new Date(expense.date).getDate()}</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">{new Date(expense.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                                                            <div className="flex items-center gap-6">
                                                                <p className="font-black text-2xl text-[#8B4513]">
                                                                    {expense.otherExpenses.toLocaleString()} <span className="text-[10px] font-medium">ETB</span>
                                                                </p>
                                                            </div>
                                                            {expense.items && expense.items.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 mt-2">
                                                                    {expense.items.map((item, i) => (
                                                                        <span key={i} className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full border border-gray-100 text-gray-500">
                                                                            {item.name}: {item.amount.toLocaleString()}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {expense.description && <p className="text-xs text-gray-400 mt-2 font-medium italic">"{expense.description}"</p>}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditExpense(expense)}
                                                            className="p-3 bg-white hover:bg-[#8B4513] text-[#8B4513] hover:text-white rounded-2xl shadow-sm border border-gray-100 transition-all active:scale-90"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteExpense(expense._id)}
                                                            className="p-3 bg-white hover:bg-red-500 text-red-500 hover:text-white rounded-2xl shadow-sm border border-gray-100 transition-all active:scale-90"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )
                                ) : (
                                    /* INVENTORY FEED */
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">📋 Inventory List</h3>
                                            <button
                                                onClick={() => { resetExpenseForm(); setShowForm(true); }}
                                                className="px-4 py-2 bg-[#8B4513]/5 hover:bg-[#8B4513]/10 text-[#8B4513] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                            >
                                                + Record Operational Costs (Charcoal, Gas...)
                                            </button>
                                        </div>

                                        {filteredStock.length === 0 ? (
                                            <div className="text-center py-32 bg-white rounded-[2.5rem] border border-dashed border-gray-100">
                                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Package className="w-8 h-8 text-gray-200" />
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-400">Inventory is empty.</h3>
                                                <button onClick={() => setShowStockForm(true)} className="mt-4 text-[#2d5a41] font-bold text-sm hover:underline">Add Your First Item</button>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto bg-white rounded-[2.5rem] custom-shadow p-4">
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                                            <th className="pb-4 pl-4">Item Details</th>
                                                            <th className="pb-4">Quantity</th>
                                                            <th className="pb-4">Valuation</th>
                                                            <th className="pb-4">Status</th>
                                                            <th className="pb-4 text-right pr-4">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {filteredStock.map((item, idx) => {
                                                            const isLow = item.trackQuantity && (item.quantity || 0) <= (item.minLimit || 0);
                                                            return (
                                                                <motion.tr
                                                                    key={item._id}
                                                                    initial={{ opacity: 0, x: -10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{ delay: idx * 0.02 }}
                                                                    className="group hover:bg-gray-50/50 transition-colors"
                                                                >
                                                                    <td className="py-6 pl-4">
                                                                        <p className="font-black text-slate-800 text-lg leading-tight">{item.name}</p>
                                                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">{item.category}</p>
                                                                    </td>
                                                                    <td className="py-6">
                                                                        <p className="text-xl font-black text-slate-800">
                                                                            {item.trackQuantity ? item.quantity : '-'}
                                                                            <span className="text-xs font-bold text-gray-400 ml-1 uppercase">{item.unit}</span>
                                                                        </p>
                                                                    </td>
                                                                    <td className="py-6">
                                                                        <p className="font-bold text-slate-600">{(item.unitCost || 0).toLocaleString()} <span className="text-[10px]">Br</span></p>
                                                                        <p className="text-[10px] font-medium text-gray-400">per {item.unit}</p>
                                                                    </td>
                                                                    <td className="py-6">
                                                                        {item.showStatus ? (
                                                                            item.status === 'finished' ? (
                                                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                                                                                    🏁 Finished
                                                                                </span>
                                                                            ) : isLow ? (
                                                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                                                                                    <AlertCircle size={10} /> Low Stock
                                                                                </span>
                                                                            ) : (
                                                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                                                                    <CheckCircle2 size={10} /> Healthy
                                                                                </span>
                                                                            )
                                                                        ) : (
                                                                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Hidden</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-6 text-right pr-4">
                                                                        <div className="flex justify-end gap-2 items-center">
                                                                            <button
                                                                                onClick={() => openRestockModal(item)}
                                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8B4513]/5 hover:bg-[#8B4513] text-[#8B4513] hover:text-white rounded-lg transition-all font-black text-[9px] uppercase tracking-wider border border-[#8B4513]/20 hover:border-[#8B4513]"
                                                                                title="Add Stock"
                                                                            >
                                                                                <PlusCircle size={12} />
                                                                                Restock
                                                                            </button>
                                                                            {item.status !== 'finished' && (
                                                                                <button
                                                                                    onClick={() => handleMarkFinished(item)}
                                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 rounded-lg transition-all font-black text-[9px] uppercase tracking-wider border border-slate-200 hover:border-emerald-200"
                                                                                    title="Finish and Archive"
                                                                                >
                                                                                    <CheckCircle2 size={12} />
                                                                                    Finish Stock
                                                                                </button>
                                                                            )}
                                                                            <button onClick={() => handleEditStock(item)} className="p-2 hover:bg-[#8B4513]/10 text-[#8B4513] rounded-xl transition-colors">
                                                                                <Edit2 size={16} />
                                                                            </button>
                                                                            <button onClick={() => deleteStockItem(item._id)} className="p-2 hover:bg-red-50 text-red-400 rounded-xl transition-colors">
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </motion.tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Expense Modal */}
                <AnimatePresence>
                    {showForm && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetExpenseForm} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative bg-white rounded-[3.5rem] shadow-2xl p-10 md:p-14 max-w-xl w-full border border-white"
                            >
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <h2 className="text-4xl font-black text-slate-900 tracking-tight bubbly-text">{activeTab === 'expenses' ? 'Expense' : 'Physical'} <span className="text-[#2d5a41]">{activeTab === 'expenses' ? 'Entry' : 'Expenses'}</span></h2>
                                        <p className="text-gray-500 mt-2 font-medium">{activeTab === 'expenses' ? 'Log operational expenses like Charcoal/Gas.' : 'Log operational costs like Charcoal/Gas.'}</p>
                                    </div>
                                    <button onClick={resetExpenseForm} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors">
                                        <ChevronRight className="w-6 h-6 rotate-45 text-gray-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleSaveExpense} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B4513]" />
                                                <input
                                                    type="date"
                                                    value={expenseFormData.date}
                                                    onChange={e => setExpenseFormData({ ...expenseFormData, date: e.target.value })}
                                                    className="w-full bg-gray-50 border-none rounded-[1.5rem] pl-16 pr-6 py-5 outline-none focus:ring-4 focus:ring-[#8B4513]/10 font-black text-lg"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 flex justify-between items-center pr-2">
                                                <span>🛠️ Operational Expenses</span>
                                                <span className="text-[#2d5a41]">{expenseFormData.items.reduce((s, i) => s + (Number(i.amount) || 0), 0).toLocaleString()} Br Total</span>
                                            </label>

                                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                                                {expenseFormData.items.map((item, index) => (
                                                    <div key={index} className="flex flex-col gap-2 p-4 bg-gray-50 rounded-3xl border border-gray-100 group">
                                                        <div className="flex gap-2">
                                                            <input type="text" placeholder="Item (e.g. Milk)" value={item.name} onChange={e => {
                                                                const newItems = [...expenseFormData.items]; newItems[index].name = e.target.value; setExpenseFormData({ ...expenseFormData, items: newItems });
                                                            }} className="flex-[2] bg-white border-none rounded-xl p-3 outline-none font-bold text-sm" />
                                                            <button type="button" onClick={() => setExpenseFormData({ ...expenseFormData, items: expenseFormData.items.filter((_, i) => i !== index) })} className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={14} /></button>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <div className="flex-1">
                                                                <input type="number" placeholder="Qty" value={item.quantity} onChange={e => {
                                                                    const newItems = [...expenseFormData.items]; newItems[index].quantity = Number(e.target.value); setExpenseFormData({ ...expenseFormData, items: newItems });
                                                                }} className="w-full bg-white border-none rounded-xl p-3 outline-none font-bold text-sm" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <input type="text" placeholder="Unit" value={item.unit} onChange={e => {
                                                                    const newItems = [...expenseFormData.items]; newItems[index].unit = e.target.value; setExpenseFormData({ ...expenseFormData, items: newItems });
                                                                }} className="w-full bg-white border-none rounded-xl p-3 outline-none font-bold text-sm uppercase text-[10px]" />
                                                            </div>
                                                            <div className="flex-[1.5]">
                                                                <input type="number" placeholder="Br" value={item.amount} onChange={e => {
                                                                    const newItems = [...expenseFormData.items]; newItems[index].amount = Number(e.target.value); setExpenseFormData({ ...expenseFormData, items: newItems });
                                                                }} className="w-full bg-white border-none rounded-xl p-3 outline-none font-bold text-sm text-right" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => setExpenseFormData({ ...expenseFormData, items: [...expenseFormData.items, { name: "", amount: 0, quantity: 1, unit: "" }] })} className="w-full p-3 border-2 border-dashed border-gray-100 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:text-[#2d5a41] transition-all">+ Add Item</button>
                                            </div>
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {['Milk', 'Charcoal', 'Gas', 'Spices'].map(s => <button key={s} type="button" onClick={() => setExpenseFormData({ ...expenseFormData, items: [...expenseFormData.items, { name: s, amount: 0, quantity: 1, unit: s === 'Milk' ? 'L' : 'pcs' }] })} className="text-[9px] font-black uppercase bg-gray-50 px-3 py-1 rounded-full text-gray-400">+ {s}</button>)}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Quick Note</label>
                                            <input
                                                type="text"
                                                placeholder="Optional details..."
                                                value={expenseFormData.description}
                                                onChange={e => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                                                className="w-full bg-gray-50 border-none rounded-[1.5rem] p-6 outline-none focus:ring-4 focus:ring-[#2d5a41]/10 font-bold"
                                            />
                                        </div>

                                        <div className="flex gap-4 pt-6">
                                            <button type="button" onClick={resetExpenseForm} className="flex-1 py-6 rounded-3xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:bg-gray-100 transition-colors">Discard</button>
                                            <button type="submit" disabled={saveLoading} className="flex-[1.5] py-6 bg-[#8B4513] text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-[#8B4513]/20 hover:scale-[1.02] active:scale-95 transition-all">
                                                {saveLoading ? "Saving..." : (editingExpense ? "Update Entry" : "Commit Record")}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Stock Modal */}
                <AnimatePresence>
                    {showStockForm && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetStockForm} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative bg-white rounded-[3.5rem] shadow-2xl p-10 md:p-14 max-w-2xl w-full border border-white"
                            >
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <h2 className="text-4xl font-black text-slate-900 tracking-tight bubbly-text">Stock <span className="text-[#2d5a41]">Detail</span></h2>
                                        <p className="text-gray-500 mt-2 font-medium">Manage physical inventory items.</p>
                                    </div>
                                    <button onClick={resetStockForm} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors">
                                        <ChevronRight className="w-6 h-6 rotate-45 text-gray-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleSaveStock} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Item Name</label>
                                            <input
                                                type="text"
                                                placeholder="Coke 500ml"
                                                value={stockFormData.name}
                                                onChange={e => setStockFormData({ ...stockFormData, name: e.target.value })}
                                                className="w-full bg-gray-50 border-none rounded-[1.5rem] p-6 outline-none focus:ring-4 focus:ring-[#2d5a41]/10 font-black text-xl"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Category</label>
                                            <select
                                                value={stockFormData.category}
                                                onChange={e => setStockFormData({ ...stockFormData, category: e.target.value })}
                                                className="w-full bg-gray-50 border-none rounded-[1.5rem] px-6 py-[22px] outline-none focus:ring-4 focus:ring-[#2d5a41]/10 font-black text-lg appearance-none"
                                            >
                                                <option value="meat">Meat & Livestock</option>
                                                <option value="drinks">Soft Drinks</option>
                                                <option value="dairy">Dairy & Milk</option>
                                                <option value="supplies">General Supplies</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Quantity</label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={stockFormData.quantity}
                                                onChange={e => setStockFormData({ ...stockFormData, quantity: e.target.value })}
                                                className="w-full bg-gray-50 border-none rounded-[1.5rem] p-6 outline-none focus:ring-4 focus:ring-[#2d5a41]/10 font-black text-xl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Unit</label>
                                            <input
                                                type="text"
                                                placeholder="pcs / kg / L"
                                                value={stockFormData.unit}
                                                onChange={e => setStockFormData({ ...stockFormData, unit: e.target.value })}
                                                className="w-full bg-gray-50 border-none rounded-[1.5rem] p-6 outline-none focus:ring-4 focus:ring-[#2d5a41]/10 font-black text-xl"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Unit Cost (Br)</label>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={stockFormData.unitCost}
                                                onChange={e => setStockFormData({ ...stockFormData, unitCost: e.target.value })}
                                                className="w-full bg-gray-50 border-none rounded-[1.5rem] p-6 outline-none focus:ring-4 focus:ring-[#2d5a41]/10 font-black text-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-8 items-center py-4">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={stockFormData.trackQuantity}
                                                onChange={e => setStockFormData({ ...stockFormData, trackQuantity: e.target.checked })}
                                                className="w-5 h-5 rounded-lg border-2 border-gray-200 text-[#2d5a41] focus:ring-[#2d5a41] transition-all"
                                            />
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-800">Track Quantities</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={stockFormData.showStatus}
                                                onChange={e => setStockFormData({ ...stockFormData, showStatus: e.target.checked })}
                                                className="w-5 h-5 rounded-lg border-2 border-gray-200 text-[#2d5a41] focus:ring-[#2d5a41] transition-all"
                                            />
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-800">Public Status</span>
                                        </label>
                                    </div>

                                    <div className="flex gap-4 pt-6">
                                        <button type="button" onClick={resetStockForm} className="flex-1 py-6 rounded-3xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:bg-gray-100 transition-colors">Discard</button>
                                        <button type="submit" disabled={saveLoading} className="flex-[1.5] py-6 bg-[#8B4513] text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-[#8B4513]/20 hover:scale-[1.02] active:scale-95 transition-all">
                                            {saveLoading ? "Saving..." : (editingStock ? "Update Stock" : "Add to Inventory")}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Restock Modal */}
                <AnimatePresence>
                    {showRestockModal && restockingItem && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRestockModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-sm w-full border border-white"
                            >
                                <h2 className="text-2xl font-black text-slate-900 mb-1">Restock {restockingItem.name}</h2>
                                <p className="text-sm text-gray-500 mb-6">Current Stock: {restockingItem.quantity} {restockingItem.unit}</p>

                                <form onSubmit={handleRestockSubmit} className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Add Quantity ({restockingItem.unit})</label>
                                        <input
                                            type="number"
                                            autoFocus
                                            placeholder="e.g. 50"
                                            value={restockAmount}
                                            onChange={e => setRestockAmount(e.target.value)}
                                            className="w-full bg-gray-50 border-none rounded-[1.5rem] p-4 outline-none focus:ring-4 focus:ring-[#8B4513]/10 font-black text-xl"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">New Unit Cost (Optional)</label>
                                        <input
                                            type="number"
                                            placeholder={restockingItem.unitCost?.toString()}
                                            value={newUnitCost}
                                            onChange={e => setNewUnitCost(e.target.value)}
                                            className="w-full bg-gray-50 border-none rounded-[1.5rem] p-4 outline-none focus:ring-4 focus:ring-[#8B4513]/10 font-bold text-lg"
                                        />
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowRestockModal(false)}
                                            className="flex-1 py-3 rounded-2xl font-bold bg-gray-100 text-gray-500"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saveLoading}
                                            className="flex-1 py-3 rounded-2xl font-bold bg-[#8B4513] text-white shadow-lg shadow-[#8B4513]/20"
                                        >
                                            {saveLoading ? 'Saving...' : 'Confirm Restock'}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

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
