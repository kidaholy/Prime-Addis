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
    averagePurchasePrice?: number
    unitCost?: number
    trackQuantity: boolean
    showStatus: boolean
    status: 'active' | 'out_of_stock'
    totalInvestment?: number
    totalPurchased?: number
    totalConsumed?: number
}

export default function StockAndExpensesPage() {
    const [activeTab, setActiveTab] = useState<"inventory" | "expenses">("inventory")
    const [expenses, setExpenses] = useState<DailyExpense[]>([])
    const [stockItems, setStockItems] = useState<StockItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [showStockForm, setShowStockForm] = useState(false)
    const [editingExpense, setEditingExpense] = useState<DailyExpense | null>(null)
    const [editingStock, setEditingStock] = useState<StockItem | null>(null)
    const [saveLoading, setSaveLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    const [showRestockModal, setShowRestockModal] = useState(false)
    const [restockingItem, setRestockingItem] = useState<StockItem | null>(null)
    const [restockAmount, setRestockAmount] = useState("")
    const [newTotalCost, setNewTotalCost] = useState("")
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
        totalPurchaseCost: "",
        unitCost: "",
        trackQuantity: true,
        showStatus: true
    })

    const { token } = useAuth()
    const { t } = useLanguage()
    const { confirmationState, confirm, closeConfirmation, notificationState, notify, closeNotification } = useConfirmation()

    useEffect(() => {
        if (token) {
            fetchStockItems()
            fetchExpenses()
        }

        // Fallback: if loading takes too long, stop loading state
        const timeout = setTimeout(() => {
            if (loading) {
                console.warn("⚠️ Stock loading timeout - stopping loading state")
                setLoading(false)
            }
        }, 10000) // 10 second timeout

        return () => clearTimeout(timeout)
    }, [token])

    const fetchStockItems = async () => {
        try {
            setLoading(true)
            console.log("🔄 Fetching stock items...")

            const response = await fetch("/api/stock", {
                headers: { Authorization: `Bearer ${token}` },
            })

            console.log("📡 Stock API response status:", response.status)

            if (response.ok) {
                const data = await response.json()
                console.log("📦 Fetched stock items:", data)
                console.log("📊 Number of items:", data.length)
                setStockItems(data)

                if (data.length === 0) {
                    console.log("ℹ️ No stock items found in database")
                }
            } else {
                console.error("❌ Failed to fetch stock items:", response.status, response.statusText)
                const errorText = await response.text()
                console.error("❌ Error details:", errorText)

                notify({
                    title: "Failed to Load Stock",
                    message: `Error ${response.status}: ${response.statusText}`,
                    type: "error"
                })
            }
        } catch (error) {
            console.error("❌ Error fetching stock:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchExpenses = async () => {
        try {
            const response = await fetch("/api/admin/expenses", {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                const data = await response.json()
                setExpenses(data)
            }
        } catch (error) {
            console.error("Error fetching expenses:", error)
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
                fetchStockItems()
                fetchExpenses()
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
            const totalCost = Number(newTotalCost)
            const sellingPrice = newUnitCost ? Number(newUnitCost) : restockingItem.unitCost

            const response = await fetch(`/api/stock/${restockingItem._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action: 'restock',
                    quantityAdded: addedAmount,
                    totalPurchaseCost: totalCost,
                    newUnitCost: sellingPrice,
                    notes: `Restocked ${addedAmount} ${restockingItem.unit} for total cost ${totalCost} Br`
                }),
            })

            if (response.ok) {
                const data = await response.json()
                fetchStockItems()
                setShowRestockModal(false)
                setRestockingItem(null)
                setRestockAmount("")
                setNewTotalCost("")
                setNewUnitCost("")
                notify({
                    title: "Stock Restocked",
                    message: data.message || `Successfully restocked ${addedAmount} ${restockingItem.unit}`,
                    type: "success"
                })
            } else {
                const errorData = await response.json()
                notify({
                    title: "Restock Failed",
                    message: errorData.message || "Failed to restock item.",
                    type: "error"
                })
            }
        } catch (error) {
            console.error(error)
            notify({
                title: "Error",
                message: "An error occurred while restocking.",
                type: "error"
            })
        } finally {
            setSaveLoading(false)
        }
    }

    const openRestockModal = (item: StockItem) => {
        setRestockingItem(item)
        setRestockAmount("")
        setNewTotalCost("")
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
            totalPurchaseCost: item.totalInvestment?.toString() || "",
            unitCost: item.unitCost?.toString() || "",
            trackQuantity: item.trackQuantity,
            showStatus: item.showStatus
        })
        setShowStockForm(true)
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
            totalPurchaseCost: "",
            unitCost: "",
            trackQuantity: true,
            showStatus: true
        })
        setEditingStock(null)
        setShowStockForm(false)
    }

    const filteredStock = stockItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredExpenses = expenses.filter(e =>
        (e.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.items.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const totalStats = {
        // Expense metrics
        totalOther: expenses.reduce((sum, e) => sum + e.otherExpenses, 0),
        count: expenses.length,

        // Enhanced inventory metrics
        inventoryValue: (stockItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.averagePurchasePrice || 0)), 0)) +
            (expenses.reduce((sum, e) => sum + (e.otherExpenses || 0), 0)), // Combined Investment value
        potentialRevenue: stockItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitCost || 0)), 0), // Potential revenue
        totalItems: stockItems.length,
        activeItems: stockItems.filter(item => item.status === 'active').length,
        lowStockItems: stockItems.filter(item => item.trackQuantity && (item.quantity || 0) <= (item.minLimit || 0)).length,
        outOfStockItems: stockItems.filter(item => item.trackQuantity && (item.quantity || 0) <= 0).length,

        // Stock health metrics
        healthyItems: stockItems.filter(item =>
            !item.trackQuantity ||
            (item.status === 'active' && (item.quantity || 0) > (item.minLimit || 0))
        ).length,

        // Category breakdown
        categories: [...new Set(stockItems.map(item => item.category))].length,

        // Unit type breakdown
        weightItems: stockItems.filter(item => ['kg', 'g', 'gram', 'kilogram'].includes(item.unit?.toLowerCase())).length,
        volumeItems: stockItems.filter(item => ['l', 'ml', 'liter', 'litre', 'milliliter'].includes(item.unit?.toLowerCase())).length,
        countItems: stockItems.filter(item => !['kg', 'g', 'gram', 'kilogram', 'l', 'ml', 'liter', 'litre', 'milliliter'].includes(item.unit?.toLowerCase())).length
    }

    return (
        <ProtectedRoute requiredRoles={["admin"]}>
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <BentoNavbar />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-4 space-y-4">
                            {/* Overview Card */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-[#8B4513] rounded-xl p-6 text-white shadow-sm overflow-hidden relative"
                            >
                                <div className="absolute -right-10 -bottom-10 opacity-10">
                                    {activeTab === 'expenses' ? <TrendingUp className="w-48 h-48" /> : <Package className="w-48 h-48" />}
                                </div>
                                <h2 className="text-sm font-black uppercase tracking-widest mb-6 opacity-60">
                                    Investment Value
                                </h2>
                                <div className="space-y-6 relative z-10">
                                    <div>
                                        <p className="text-4xl font-black">{totalStats.inventoryValue.toLocaleString()} <span className="text-xs">ETB</span></p>
                                        <p className="text-xs font-bold uppercase tracking-widest opacity-60 mt-1">Total Money Invested (Inventory + Ops)</p>
                                        <p className="text-2xl font-bold text-green-300 mt-2">{totalStats.potentialRevenue.toLocaleString()} <span className="text-xs">ETB</span></p>
                                        <p className="text-xs font-bold uppercase tracking-widest opacity-60">Potential Revenue</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                                        <div>
                                            <p className="text-xl font-bold text-red-300">{totalStats.outOfStockItems}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Out of Stock</p>
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold text-yellow-300">{totalStats.lowStockItems}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Low Stock</p>
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold text-green-300">{totalStats.healthyItems}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Healthy Stock</p>
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold">{totalStats.totalItems}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Total Items</p>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-white/10">
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div>
                                                <p className="text-sm font-bold">{totalStats.weightItems}</p>
                                                <p className="text-[8px] font-bold uppercase tracking-widest opacity-60">Weight</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{totalStats.volumeItems}</p>
                                                <p className="text-[8px] font-bold uppercase tracking-widest opacity-60">Volume</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{totalStats.countItems}</p>
                                                <p className="text-[8px] font-bold uppercase tracking-widest opacity-60">Count</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col gap-4"
                            >
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-bold text-gray-900">
                                        Physical Operations
                                    </h2>
                                    <div className="p-2 bg-[#8B4513]/10 rounded-xl">
                                        <Plus className="w-5 h-5 text-[#8B4513]" />
                                    </div>
                                </div>
                                <p className="text-gray-500 text-sm font-medium">
                                    Manage your physical items and specific operational costs like charcoal & gas.
                                </p>
                                <button
                                    onClick={() => { resetStockForm(); setShowStockForm(true); }}
                                    className="w-full bg-[#D2691E] text-white py-3 rounded-lg font-medium shadow-sm hover:bg-[#8B4513] transition-colors"
                                >
                                    Add Physical Item
                                </button>
                            </motion.div>
                        </div>

                        <div className="lg:col-span-8 space-y-4">
                            {/* Header */}
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-gray-900">
                                        📦 Physical Stock & Expenses Management
                                    </h2>
                                    <p className="text-gray-600 text-sm mt-1">
                                        Manage inventory items and operational costs
                                    </p>
                                </div>
                                <div className="flex p-1 bg-gray-200/50 rounded-xl w-fit self-start">
                                    <button
                                        onClick={() => setActiveTab('inventory')}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'inventory' ? 'bg-white text-[#8B4513] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Inventory
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('expenses')}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'expenses' ? 'bg-white text-[#8B4513] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Expenses
                                    </button>
                                </div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 min-h-[600px]"
                            >
                                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">
                                            {activeTab === 'inventory' ? 'Physical' : 'Daily'} <span className="text-[#8B4513]">{activeTab === 'inventory' ? 'Stock' : 'Expenses'}</span>
                                        </h1>
                                        <p className="text-gray-600 text-sm mt-1">
                                            {activeTab === 'inventory' ? 'Itemized list of all physical assets and quantities.' : 'Log of daily operational purchases and costs.'}
                                        </p>
                                    </div>
                                    <div className="relative group w-full md:w-64">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#8B4513] transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Search items..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#8B4513]/10 outline-none font-bold text-sm"
                                        />
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-32 opacity-20">
                                        <History className="w-16 h-16 animate-spin-slow mb-4" />
                                        <p className="font-black uppercase tracking-widest text-xs">Loading Inventory...</p>
                                    </div>
                                ) : (
                                    /* INVENTORY SECTION */
                                    <>
                                        {activeTab === 'inventory' && (
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
                                                    <div className="bg-white rounded-[2.5rem] custom-shadow p-4 overflow-hidden">
                                                        {/* Desktop Table */}
                                                        <div className="hidden md:block overflow-x-auto">
                                                            <table className="w-full text-left">
                                                                <thead>
                                                                    <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                                                        <th className="pb-4 pl-4">Item Details</th>
                                                                        <th className="pb-4">Quantity</th>
                                                                        <th className="pb-4 text-right pr-4">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50">
                                                                    {filteredStock.map((item, idx) => {
                                                                        const isLow = item.trackQuantity && (item.quantity || 0) <= (item.minLimit || 0) && (item.quantity || 0) > 0;
                                                                        const isOutOfStock = item.trackQuantity && (item.quantity || 0) <= 0;
                                                                        return (
                                                                            <motion.tr
                                                                                key={item._id}
                                                                                initial={{ opacity: 0, x: -10 }}
                                                                                animate={{ opacity: 1, x: 0 }}
                                                                                transition={{ delay: idx * 0.02 }}
                                                                                className={`group hover:bg-gray-50/50 transition-colors ${isOutOfStock ? 'bg-red-50/30' : isLow ? 'bg-yellow-50/30' : ''}`}
                                                                            >
                                                                                <td className="py-6 pl-4">
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div>
                                                                                            <p className="font-black text-slate-800 text-lg leading-tight">{item.name}</p>
                                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{item.category}</p>
                                                                                                <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase">
                                                                                                    {item.unit}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-6">
                                                                                    <div className="flex flex-col gap-1">
                                                                                        <p className={`text-xl font-black ${isOutOfStock ? 'text-red-500' : isLow ? 'text-yellow-600' : 'text-slate-800'}`}>
                                                                                            {item.trackQuantity ? (item.quantity || 0).toLocaleString() : '-'}
                                                                                            <span className="text-xs font-bold text-gray-400 ml-1 uppercase">{item.unit}</span>
                                                                                        </p>
                                                                                        <div className="flex flex-wrap gap-2">
                                                                                            {item.showStatus && (
                                                                                                isOutOfStock ? (
                                                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-red-600">Out of Stock</span>
                                                                                                ) : isLow ? (
                                                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-yellow-600">Low Stock</span>
                                                                                                ) : (
                                                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Healthy</span>
                                                                                                )
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-6 text-right pr-4">
                                                                                    <div className="flex justify-end gap-2 items-center">
                                                                                        <button
                                                                                            onClick={() => openRestockModal(item)}
                                                                                            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#8B4513]/5 hover:bg-[#8B4513] text-[#8B4513] hover:text-white rounded-lg transition-all font-black text-[9px] uppercase tracking-wider border border-[#8B4513]/20 hover:border-[#8B4513]"
                                                                                        >
                                                                                            <PlusCircle size={12} />
                                                                                            Restock
                                                                                        </button>
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

                                                        {/* Mobile Card View */}
                                                        <div className="md:hidden space-y-4">
                                                            {filteredStock.map((item, idx) => {
                                                                const isLow = item.trackQuantity && (item.quantity || 0) <= (item.minLimit || 0) && (item.quantity || 0) > 0;
                                                                const isOutOfStock = item.trackQuantity && (item.quantity || 0) <= 0;
                                                                return (
                                                                    <motion.div
                                                                        key={item._id}
                                                                        initial={{ opacity: 0, y: 10 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        transition={{ delay: idx * 0.02 }}
                                                                        className={`p-4 rounded-3xl border ${isOutOfStock ? 'bg-red-50 border-red-100' : isLow ? 'bg-yellow-50 border-yellow-100' : 'bg-gray-50 border-gray-100'}`}
                                                                    >
                                                                        <div className="flex justify-between items-start mb-3">
                                                                            <div>
                                                                                <p className="font-black text-slate-800 text-lg leading-tight">{item.name}</p>
                                                                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">{item.category}</p>
                                                                            </div>
                                                                            <div className="flex gap-1">
                                                                                <button
                                                                                    onClick={() => openRestockModal(item)}
                                                                                    className="p-2 bg-[#8B4513] text-white rounded-xl shadow-lg"
                                                                                >
                                                                                    <PlusCircle size={14} />
                                                                                </button>
                                                                                <button onClick={() => handleEditStock(item)} className="p-2 bg-white text-[#8B4513] rounded-xl border border-gray-100">
                                                                                    <Edit2 size={14} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex justify-between items-end mt-4">
                                                                            <div>
                                                                                <p className={`text-2xl font-black ${isOutOfStock ? 'text-red-500' : isLow ? 'text-yellow-600' : 'text-slate-800'}`}>
                                                                                    {item.trackQuantity ? (item.quantity || 0).toLocaleString() : '-'}
                                                                                    <span className="text-sm font-bold text-gray-400 ml-1 uppercase">{item.unit}</span>
                                                                                </p>
                                                                                {item.showStatus && (
                                                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isOutOfStock ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-emerald-600'}`}>
                                                                                        • {isOutOfStock ? 'Out of Stock' : isLow ? 'Low Stock' : 'Healthy'}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Avg Cost</p>
                                                                                <p className="font-bold text-[#8B4513]">{item.averagePurchasePrice?.toLocaleString()} Br</p>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'expenses' && (
                                            <div className="space-y-6">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">🧾 Expenses Log</h3>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={fetchExpenses}
                                                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                                            title="Refresh"
                                                        >
                                                            <History size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => { resetExpenseForm(); setShowForm(true); }}
                                                            className="px-4 py-2 bg-[#8B4513] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#8B4513]/20 hover:scale-[1.02] active:scale-95 transition-all"
                                                        >
                                                            + Add Daily Expense
                                                        </button>
                                                    </div>
                                                </div>

                                                {filteredExpenses.length === 0 ? (
                                                    <div className="text-center py-32 bg-white rounded-[2.5rem] border border-dashed border-gray-100">
                                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                            <DollarSign className="w-8 h-8 text-gray-200" />
                                                        </div>
                                                        <h3 className="text-lg font-bold text-gray-400">No expenses found for this period.</h3>
                                                        <p className="text-xs text-gray-300 mt-2">Try adjusting the filters or add a new record.</p>
                                                    </div>
                                                ) : (
                                                    <div className="bg-white rounded-[2.5rem] custom-shadow p-4 overflow-hidden">
                                                        {/* Desktop Table */}
                                                        <div className="hidden md:block overflow-x-auto">
                                                            <table className="w-full text-left">
                                                                <thead>
                                                                    <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                                                        <th className="pb-4 pl-4">Date</th>
                                                                        <th className="pb-4">Items Summary</th>
                                                                        <th className="pb-4">Total Cost</th>
                                                                        <th className="pb-4 text-right pr-4">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50">
                                                                    {filteredExpenses.map((expense, idx) => (
                                                                        <motion.tr
                                                                            key={expense._id}
                                                                            initial={{ opacity: 0, x: -10 }}
                                                                            animate={{ opacity: 1, x: 0 }}
                                                                            transition={{ delay: idx * 0.02 }}
                                                                            className="group hover:bg-gray-50/50 transition-colors"
                                                                        >
                                                                            <td className="py-6 pl-4 align-top">
                                                                                <div className="flex flex-col">
                                                                                    <span className="font-black text-slate-800 text-lg">
                                                                                        {new Date(expense.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                                                    </span>
                                                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                                                                                        {new Date(expense.date).getFullYear()}
                                                                                    </span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-6 align-top">
                                                                                <div className="space-y-1">
                                                                                    {expense.items.map((item, i) => (
                                                                                        <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                                                                            <span className="w-1.5 h-1.5 rounded-full bg-[#8B4513]/40"></span>
                                                                                            <span className="font-bold">{item.name}</span>
                                                                                            <span className="text-xs text-gray-400">({item.quantity} {item.unit})</span>
                                                                                            <span className="text-xs font-mono text-gray-400">- {item.amount.toLocaleString()} Br</span>
                                                                                        </div>
                                                                                    ))}
                                                                                    {expense.description && (
                                                                                        <p className="text-xs text-gray-400 italic mt-2">"{expense.description}"</p>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-6 align-top">
                                                                                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl w-fit">
                                                                                    <p className="font-black text-lg">{expense.otherExpenses.toLocaleString()} <span className="text-xs">Br</span></p>
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-6 text-right pr-4 align-top">
                                                                                <div className="flex justify-end gap-2">
                                                                                    <button onClick={() => handleEditExpense(expense)} className="p-2 hover:bg-[#8B4513]/10 text-[#8B4513] rounded-xl transition-colors">
                                                                                        <Edit2 size={16} />
                                                                                    </button>
                                                                                    <button onClick={() => deleteExpense(expense._id)} className="p-2 hover:bg-red-50 text-red-400 rounded-xl transition-colors">
                                                                                        <Trash2 size={16} />
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                        </motion.tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>

                                                        {/* Mobile Card View */}
                                                        <div className="md:hidden space-y-4">
                                                            {filteredExpenses.map((expense, idx) => (
                                                                <motion.div
                                                                    key={expense._id}
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ delay: idx * 0.02 }}
                                                                    className="p-4 rounded-3xl bg-gray-50 border border-gray-100"
                                                                >
                                                                    <div className="flex justify-between items-start mb-4">
                                                                        <div className="flex flex-col">
                                                                            <span className="font-black text-slate-800 text-lg leading-none">
                                                                                {new Date(expense.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                                            </span>
                                                                            <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                                                                                {new Date(expense.date).getFullYear()}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <button onClick={() => handleEditExpense(expense)} className="p-2 bg-white text-[#8B4513] rounded-xl border border-gray-100 shadow-sm">
                                                                                <Edit2 size={14} />
                                                                            </button>
                                                                            <button onClick={() => deleteExpense(expense._id)} className="p-2 bg-white text-red-400 rounded-xl border border-gray-100 shadow-sm">
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2 mb-4">
                                                                        {expense.items.map((item, i) => (
                                                                            <div key={i} className="flex justify-between items-center text-sm font-bold text-gray-600">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B4513]/40"></span>
                                                                                    {item.name} <span className="text-gray-400 text-[10px]">({item.quantity}{item.unit})</span>
                                                                                </div>
                                                                                <span className="font-mono">{item.amount.toLocaleString()} Br</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Spent</span>
                                                                        <span className="font-black text-red-600 text-lg">{expense.otherExpenses.toLocaleString()} Br</span>
                                                                    </div>
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
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
                                className="relative bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl p-6 md:p-14 max-w-xl w-full border border-white max-h-[95vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-start mb-6 md:mb-10">
                                    <div>
                                        <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight bubbly-text">Physical <span className="text-[#2d5a41]">Expenses</span></h2>
                                        <p className="text-gray-500 mt-2 font-medium">Log operational costs like Charcoal/Gas.</p>
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
                        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetStockForm} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl max-w-2xl w-full border border-white flex flex-col max-h-[95vh]"
                            >
                                <div className="flex justify-between items-start p-6 md:p-14 pb-4 md:pb-6">
                                    <div>
                                        <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight bubbly-text">Stock <span className="text-[#2d5a41]">Detail</span></h2>
                                        <p className="text-gray-500 mt-2 font-medium">Manage physical inventory items.</p>
                                    </div>
                                    <button onClick={resetStockForm} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors">
                                        <ChevronRight className="w-6 h-6 rotate-45 text-gray-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleSaveStock} className="flex flex-col flex-1 overflow-hidden">
                                    {/* Scrollable Content Area */}
                                    <div className="flex-1 overflow-y-auto px-10 md:px-14 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Item Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="Coke 500ml"
                                                    value={stockFormData.name}
                                                    onChange={e => setStockFormData({ ...stockFormData, name: e.target.value })}
                                                    className="w-full bg-gray-50 border-none rounded-[1.5rem] p-5 outline-none focus:ring-4 focus:ring-[#2d5a41]/10 font-black text-lg"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Category</label>
                                                <select
                                                    value={stockFormData.category}
                                                    onChange={e => setStockFormData({ ...stockFormData, category: e.target.value })}
                                                    className="w-full bg-gray-50 border-none rounded-[1.5rem] px-5 py-[18px] outline-none focus:ring-4 focus:ring-[#2d5a41]/10 font-black text-lg appearance-none"
                                                >
                                                    <option value="meat">Meat & Livestock</option>
                                                    <option value="drinks">Soft Drinks</option>
                                                    <option value="dairy">Dairy & Milk</option>
                                                    <option value="supplies">General Supplies</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Quantity</label>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    min="0"
                                                    step="0.01"
                                                    value={stockFormData.quantity}
                                                    onChange={e => setStockFormData({ ...stockFormData, quantity: e.target.value })}
                                                    className="w-full bg-gray-50 border-none rounded-[1.5rem] p-5 outline-none focus:ring-4 focus:ring-[#2d5a41]/10 font-black text-lg"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Unit</label>
                                                <select
                                                    value={stockFormData.unit}
                                                    onChange={e => setStockFormData({ ...stockFormData, unit: e.target.value })}
                                                    className="w-full bg-gray-50 border-none rounded-[1.5rem] px-5 py-[18px] outline-none focus:ring-4 focus:ring-[#2d5a41]/10 font-black text-lg appearance-none"
                                                    required
                                                >
                                                    <optgroup label="🏋️ Weight">
                                                        <option value="kg">Kilogram</option>
                                                        <option value="g">Gram</option>
                                                    </optgroup>
                                                    <optgroup label="🥤 Volume">
                                                        <option value="L">Liter</option>
                                                        <option value="ml">Milliliter</option>
                                                    </optgroup>
                                                    <optgroup label="🔢 Count">
                                                        <option value="pcs">Pieces</option>
                                                        <option value="bottles">Bottles</option>
                                                        <option value="cans">Cans</option>
                                                        <option value="boxes">Boxes</option>
                                                        <option value="bags">Bags</option>
                                                    </optgroup>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">💰 Purchase Cost</label>
                                                <input
                                                    type="number"
                                                    placeholder="Total paid"
                                                    min="0"
                                                    step="0.01"
                                                    value={stockFormData.totalPurchaseCost}
                                                    onChange={e => setStockFormData({ ...stockFormData, totalPurchaseCost: e.target.value })}
                                                    className="w-full bg-gray-50 border-none rounded-[1.5rem] p-5 outline-none focus:ring-4 focus:ring-[#2d5a41]/10 font-black text-lg"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">💵 Selling Price</label>
                                                <input
                                                    type="number"
                                                    placeholder="Per unit"
                                                    min="0"
                                                    step="0.01"
                                                    value={stockFormData.unitCost}
                                                    onChange={e => setStockFormData({ ...stockFormData, unitCost: e.target.value })}
                                                    className="w-full bg-gray-50 border-none rounded-[1.5rem] p-5 outline-none focus:ring-4 focus:ring-[#2d5a41]/10 font-black text-lg"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Min Alert</label>
                                                <input
                                                    type="number"
                                                    placeholder="Low stock"
                                                    min="0"
                                                    step="0.01"
                                                    value={stockFormData.minLimit}
                                                    onChange={e => setStockFormData({ ...stockFormData, minLimit: e.target.value })}
                                                    className="w-full bg-gray-50 border-none rounded-[1.5rem] p-5 outline-none focus:ring-4 focus:ring-[#2d5a41]/10 font-black text-lg"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">💸 Investment</label>
                                                <div className="w-full bg-red-50 border-none rounded-[1.5rem] p-5 font-black text-lg text-red-600">
                                                    {(Number(stockFormData.totalPurchaseCost) || 0).toLocaleString()} Br
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">💰 Revenue</label>
                                                <div className="w-full bg-green-50 border-none rounded-[1.5rem] p-5 font-black text-lg text-green-600">
                                                    {((Number(stockFormData.quantity) || 0) * (Number(stockFormData.unitCost) || 0)).toLocaleString()} Br
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">📊 Avg/Unit</label>
                                                <div className="w-full bg-blue-50 border-none rounded-[1.5rem] p-5 font-black text-lg text-blue-600">
                                                    {Number(stockFormData.quantity) > 0 ?
                                                        ((Number(stockFormData.totalPurchaseCost) || 0) / Number(stockFormData.quantity)).toFixed(2)
                                                        : '0.00'} Br
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-6 items-center py-2">
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
                                    </div>

                                    {/* Fixed Footer with Buttons */}
                                    <div className="flex gap-4 px-6 md:px-14 py-4 md:py-6 border-t border-gray-100 bg-white rounded-b-[2.5rem] md:rounded-b-[3.5rem]">
                                        <button type="button" onClick={resetStockForm} className="flex-1 py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:bg-gray-100 transition-colors">Discard</button>
                                        <button type="submit" disabled={saveLoading} className="flex-[1.5] py-5 bg-[#8B4513] text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-[#8B4513]/20 hover:scale-[1.02] active:scale-95 transition-all">
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
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">💰 Total Purchase Cost (Br)</label>
                                            <input
                                                type="number"
                                                placeholder="Total amount paid"
                                                value={newTotalCost}
                                                onChange={e => setNewTotalCost(e.target.value)}
                                                className="w-full bg-gray-50 border-none rounded-[1.5rem] p-4 outline-none focus:ring-4 focus:ring-[#8B4513]/10 font-bold text-lg"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">💵 Selling Price (Br)</label>
                                            <input
                                                type="number"
                                                placeholder={restockingItem.unitCost?.toString() || "What you charge"}
                                                value={newUnitCost}
                                                onChange={e => setNewUnitCost(e.target.value)}
                                                className="w-full bg-gray-50 border-none rounded-[1.5rem] p-4 outline-none focus:ring-4 focus:ring-[#8B4513]/10 font-bold text-lg"
                                            />
                                        </div>
                                    </div>

                                    {/* Investment Calculation */}
                                    {Number(restockAmount) > 0 && Number(newTotalCost) > 0 && (
                                        <div className="bg-blue-50 rounded-[1.5rem] p-4 border border-blue-100">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="font-bold text-blue-800">Total Investment:</span>
                                                <span className="font-black text-blue-800">
                                                    {Number(newTotalCost).toLocaleString()} Br
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm mt-1">
                                                <span className="font-bold text-gray-600">Avg Cost per {restockingItem.unit}:</span>
                                                <span className="font-black text-gray-600">
                                                    {(Number(newTotalCost) / Number(restockAmount)).toFixed(2)} Br
                                                </span>
                                            </div>
                                            {Number(newUnitCost) > 0 && (
                                                <div className="flex justify-between items-center text-sm mt-2">
                                                    <span className="font-bold text-green-800">Potential Revenue:</span>
                                                    <span className="font-black text-green-800">
                                                        {(Number(restockAmount) * Number(newUnitCost)).toLocaleString()} Br
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

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
