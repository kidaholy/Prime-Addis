"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"
import { Plus, Search, Trash2, Edit2, AlertTriangle, Package, ChevronRight, ArrowUpDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface StockItem {
    _id: string
    name: string
    category: string
    quantity: number
    unit: string
    minLimit: number
    unitCost: number
    updatedAt: string
}

interface StockForm {
    name: string
    category: string
    quantity: string
    unit: string
    minLimit: string
    unitCost: string
}

export default function AdminStockPage() {
    const [stockItems, setStockItems] = useState<StockItem[]>([])
    const [filteredItems, setFilteredItems] = useState<StockItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [editingItem, setEditingItem] = useState<StockItem | null>(null)
    const [createLoading, setCreateLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [lowStockFilter, setLowStockFilter] = useState(false)

    const [formData, setFormData] = useState<StockForm>({
        name: "",
        category: "",
        quantity: "",
        unit: "kg",
        minLimit: "5",
        unitCost: "0",
    })

    const { token } = useAuth()
    const { t } = useLanguage()

    const units = ["kg", "g", "l", "ml", "pcs", "box", "can"]
    const [categories, setCategories] = useState<any[]>([])
    const [showCategoryManager, setShowCategoryManager] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [categoryLoading, setCategoryLoading] = useState(false)

    useEffect(() => {
        if (token) {
            fetchStockItems()
            fetchCategories()
        }
    }, [token])

    const fetchCategories = async () => {
        try {
            const response = await fetch("/api/categories?type=stock")
            if (response.ok) {
                const data = await response.json()
                setCategories(data)
            }
        } catch (error) {
            console.error("Error fetching categories:", error)
        }
    }

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCategoryName.trim()) return
        setCategoryLoading(true)
        try {
            const response = await fetch("/api/categories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: newCategoryName, type: "stock" }),
            })
            if (response.ok) {
                setNewCategoryName("")
                fetchCategories()
            }
        } catch (error) {
            console.error("Error adding category:", error)
        } finally {
            setCategoryLoading(false)
        }
    }

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("Are you sure? Stock items in this category will still exist but the category filter will be gone.")) return
        try {
            const response = await fetch(`/api/categories/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                fetchCategories()
            }
        } catch (error) {
            console.error("Error deleting category:", error)
        }
    }

    useEffect(() => {
        filterItems()
    }, [stockItems, searchTerm, lowStockFilter])

    const fetchStockItems = async () => {
        try {
            setLoading(true)
            const response = await fetch("/api/stock", {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                const data = await response.json()
                setStockItems(data)
            }
        } catch (error) {
            console.error("Error fetching stock:", error)
        } finally {
            setLoading(false)
        }
    }

    const filterItems = () => {
        let filtered = stockItems
        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.category.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }
        if (lowStockFilter) {
            filtered = filtered.filter(item => item.quantity <= item.minLimit)
        }
        setFilteredItems(filtered)
    }

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreateLoading(true)
        try {
            const url = editingItem ? `/api/stock/${editingItem._id}` : "/api/stock"
            const method = editingItem ? "PUT" : "POST"

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                fetchStockItems()
                resetForm()
            }
        } catch (error) {
            console.error("Error saving stock item:", error)
        } finally {
            setCreateLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to remove this item?")) return
        try {
            await fetch(`/api/stock/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })
            fetchStockItems()
        } catch (error) {
            console.error("Error deleting item:", error)
        }
    }

    const handleEdit = (item: StockItem) => {
        setEditingItem(item)
        setFormData({
            name: item.name,
            category: item.category,
            quantity: item.quantity.toString(),
            unit: item.unit,
            minLimit: item.minLimit.toString(),
            unitCost: item.unitCost?.toString() || "0",
        })
        setShowCreateForm(true)
    }

    const resetForm = () => {
        setFormData({ name: "", category: "", quantity: "", unit: "kg", minLimit: "5", unitCost: "0" })
        setEditingItem(null)
        setShowCreateForm(false)
    }

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    }

    return (
        <ProtectedRoute requiredRoles={["admin"]}>
            <div className="min-h-screen bg-[#e2e7d8] p-4 md:p-8 font-sans text-slate-800 selection:bg-[#f5bc6b]/30">
                <div className="max-w-7xl mx-auto">
                    <BentoNavbar />

                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className="space-y-8 mt-4"
                    >
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <motion.div variants={itemVariants}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 bg-[#2d5a41] rounded-2xl shadow-lg shadow-[#2d5a41]/20">
                                        <Package className="w-6 h-6 text-[#e2e7d8]" />
                                    </div>
                                    <span className="text-sm font-bold uppercase tracking-[0.2em] text-[#2d5a41]/60">{t("adminStock.system")}</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight bubbly-text">
                                    {t("adminStock.title")}
                                </h1>
                                <p className="text-gray-500 font-medium mt-2 max-w-md">{t("adminStock.managePrecision")}</p>
                            </motion.div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <motion.button
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { resetForm(); setShowCreateForm(true); }}
                                    className="group relative overflow-hidden bg-[#2d5a41] text-[#e2e7d8] px-8 py-4 rounded-[2rem] font-bold flex items-center justify-center gap-3 shadow-xl hover:shadow-[#2d5a41]/30 transition-shadow"
                                >
                                    <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
                                    <span>{t("adminStock.registerNew")}</span>
                                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                </motion.button>

                                <motion.button
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowCategoryManager(true)}
                                    className="group relative overflow-hidden bg-white text-[#2d5a41] px-8 py-4 rounded-[2rem] font-bold flex items-center justify-center gap-3 shadow-xl hover:shadow-white/20 transition-shadow border-2 border-[#2d5a41]/10"
                                >
                                    <Package className="w-5 h-5" />
                                    <span>{t("adminStock.manageCategories")}</span>
                                </motion.button>
                            </div>
                        </div>

                        {/* Search & Filters */}
                        <motion.div
                            variants={itemVariants}
                            className="flex flex-col md:flex-row gap-4 items-center bg-white/50 backdrop-blur-md p-3 rounded-[2.5rem] border border-white/50 shadow-sm"
                        >
                            <div className="relative flex-1 w-full group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#2d5a41] transition-colors" />
                                <input
                                    type="text"
                                    placeholder={t("adminStock.searchPlaceholder")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-white rounded-[2rem] border-none focus:ring-2 focus:ring-[#2d5a41]/20 outline-none shadow-sm placeholder:text-gray-400 font-medium"
                                />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => setLowStockFilter(!lowStockFilter)}
                                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-[2rem] font-bold transition-all border-2 ${lowStockFilter
                                        ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20'
                                        : 'bg-white/80 border-transparent text-gray-600 hover:bg-white hover:shadow-md'
                                        }`}
                                >
                                    <AlertTriangle className={`w-4 h-4 ${lowStockFilter ? 'animate-pulse' : ''}`} />
                                    <span>{lowStockFilter ? t("adminStock.viewingLowStock") : t("adminStock.lowStockOnly")}</span>
                                </button>
                            </div>
                        </motion.div>

                        {/* Main Content Table */}
                        <motion.div
                            variants={itemVariants}
                            className="bg-white rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/50 border border-white"
                        >
                            {loading ? (
                                <div className="p-32 flex flex-col items-center justify-center text-gray-400 gap-4">
                                    <div className="w-12 h-12 border-4 border-[#2d5a41]/20 border-t-[#2d5a41] rounded-full animate-spin" />
                                    <p className="font-bold tracking-widest uppercase text-xs">Synchronizing Database...</p>
                                </div>
                            ) : filteredItems.length === 0 ? (
                                <div className="p-32 text-center">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Package className="w-10 h-10 text-gray-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800">No stock items found</h3>
                                    <p className="text-gray-500">Try adjusting your filters or add a new item.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50/50 text-left border-b border-gray-100">
                                                <th className="py-6 px-8 font-black text-gray-400 text-[10px] uppercase tracking-[0.2em]">{t("adminStock.itemDetails")}</th>
                                                <th className="py-6 px-8 font-black text-gray-400 text-[10px] uppercase tracking-[0.2em]">{t("adminStock.category")}</th>
                                                <th className="py-6 px-8 font-black text-gray-400 text-[10px] uppercase tracking-[0.2em] text-center">{t("adminStock.currentQuantity")}</th>
                                                <th className="py-6 px-8 font-black text-gray-400 text-[10px] uppercase tracking-[0.2em]">{t("adminStock.status")}</th>
                                                <th className="py-6 px-8 font-black text-gray-400 text-[10px] uppercase tracking-[0.2em] text-right">{t("adminStock.actions")}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredItems.map((item, index) => {
                                                const isLow = item.quantity <= item.minLimit
                                                const isHigh = item.quantity >= item.minLimit * 10
                                                return (
                                                    <motion.tr
                                                        key={item._id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className="group hover:bg-[#2d5a41]/[0.02] transition-all"
                                                    >
                                                        <td className="py-6 px-8">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg shadow-inner group-hover:bg-white transition-colors">
                                                                    {item.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-800 text-lg">{item.name}</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-xs text-gray-400 mt-0.5 capitalize">{t("adminStock.lastUpdate")}: {new Date(item.updatedAt).toLocaleDateString()}</p>
                                                                        <span className="text-[10px] font-bold text-[#2d5a41] bg-[#2d5a41]/5 px-2 py-0.5 rounded-full">{item.unitCost || 0} {t("adminStock.etbPerUnit")}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-6 px-8">
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 group-hover:bg-[#2d5a41]/10 group-hover:text-[#2d5a41] transition-colors">
                                                                {item.category}
                                                            </span>
                                                        </td>
                                                        <td className="py-6 px-8 text-center">
                                                            <div className="inline-flex flex-col items-center">
                                                                <span className={`text-2xl font-black ${isLow ? 'text-red-500' : isHigh ? 'text-blue-600' : 'text-slate-800'}`}>
                                                                    {item.quantity}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.unit}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-6 px-8">
                                                            <div className="flex items-center">
                                                                {isLow ? (
                                                                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-100 shadow-sm shadow-red-100">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest">{t("adminStock.lowStockAlert")}</span>
                                                                    </div>
                                                                ) : isHigh ? (
                                                                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 shadow-sm shadow-blue-100">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest">{t("adminStock.abundantStock")}</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest">{t("adminStock.healthyLevels")}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-6 px-8 text-right">
                                                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => handleEdit(item)}
                                                                    className="p-3 bg-white hover:bg-[#2d5a41] text-[#2d5a41] hover:text-white rounded-2xl shadow-sm border border-gray-100 transition-all active:scale-90"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(item._id)}
                                                                    className="p-3 bg-white hover:bg-red-500 text-red-500 hover:text-white rounded-2xl shadow-sm border border-gray-100 transition-all active:scale-90"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                </div>

                {/* Refined Modal */}
                <AnimatePresence>
                    {showCreateForm && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={resetForm}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative bg-white rounded-[3rem] shadow-2xl p-8 md:p-12 max-w-xl w-full border border-white"
                            >
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight bubbly-text">
                                            {editingItem ? t("adminStock.update") : t("adminStock.register")} <span className="text-[#2d5a41]">{t("nav.stock")}</span>
                                        </h2>
                                        <p className="text-gray-500 mt-2 font-medium">{t("adminStock.managePrecision")}</p>
                                    </div>
                                    <button onClick={resetForm} className="p-3 hover:bg-gray-100 rounded-full transition-colors">
                                        <ChevronRight className="w-6 h-6 rotate-45 text-gray-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateOrUpdate} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{t("adminStock.infoPlaceholder")}</label>
                                        <input
                                            required
                                            placeholder={t("adminStock.namePlaceholder")}
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-gray-50 border-none rounded-2xl p-5 outline-none focus:ring-4 focus:ring-[#2d5a41]/10 font-bold placeholder:text-gray-300"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{t("adminStock.category")}</label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2d5a41]"
                                                required
                                            >
                                                <option value="">{t("adminStock.selectCategory")}</option>
                                                {categories.map((cat: any) => (
                                                    <option key={cat._id || cat.name} value={cat.name}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{t("adminStock.unit")}</label>
                                            <select
                                                required
                                                value={formData.unit}
                                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                                className="w-full bg-gray-50 border-none rounded-2xl p-5 outline-none focus:ring-4 focus:ring-[#2d5a41]/10 font-bold appearance-none cursor-pointer"
                                            >
                                                {units.map(u => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{t("adminStock.currentQuantity")}</label>
                                            <input
                                                type="number"
                                                required
                                                placeholder="0.00"
                                                value={formData.quantity}
                                                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                                className="w-full bg-gray-50 border-none rounded-2xl p-5 outline-none focus:ring-4 focus:ring-[#2d5a41]/10 font-bold placeholder:text-gray-300"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{t("adminStock.minLimit")}</label>
                                            <input
                                                type="number"
                                                required
                                                placeholder={t("adminStock.alertAt")}
                                                value={formData.minLimit}
                                                onChange={e => setFormData({ ...formData, minLimit: e.target.value })}
                                                className="w-full bg-gray-50 border-none rounded-2xl p-5 outline-none focus:ring-4 focus:ring-[#2d5a41]/10 font-bold placeholder:text-gray-300"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{t("adminStock.unitCost")}</label>
                                        <input
                                            type="number"
                                            required
                                            placeholder={t("adminStock.costPlaceholder")}
                                            value={formData.unitCost}
                                            onChange={e => setFormData({ ...formData, unitCost: e.target.value })}
                                            className="w-full bg-gray-50 border-none rounded-2xl p-5 outline-none focus:ring-4 focus:ring-[#2d5a41]/10 font-bold placeholder:text-gray-300"
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="flex-1 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest text-gray-400 hover:bg-gray-100 transition-colors"
                                        >
                                            {t("adminStock.discardChanges")}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={createLoading}
                                            className="flex-[1.5] py-5 bg-[#2d5a41] text-[#e2e7d8] rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-[#2d5a41]/20 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50"
                                        >
                                            {createLoading ? t("adminStock.syncing") : (editingItem ? t("adminStock.publishUpdates") : t("adminStock.confirmRegistration"))}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
            <CategoryManager
                show={showCategoryManager}
                onClose={() => setShowCategoryManager(false)}
                categories={categories}
                onAdd={handleAddCategory}
                onDelete={handleDeleteCategory}
                loading={categoryLoading}
                title={t("adminStock.manageCategories")}
                value={newCategoryName}
                onChange={setNewCategoryName}
                t={t}
            />
        </ProtectedRoute>
    )
}

function CategoryManager({ show, onClose, categories, onAdd, onDelete, loading, title, value, onChange, t }: any) {
    if (!show) return null

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[40px] p-8 max-w-md w-full custom-shadow">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold font-sans text-slate-800">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500">✕</button>
                </div>

                <form onSubmit={onAdd} className="mb-6">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={t("adminDashboard.newCatPlaceholder")}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a41]"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-[#2d5a41] text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
                        >
                            {t("adminDashboard.add")}
                        </button>
                    </div>
                </form>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {categories.map((cat: any) => (
                        <div key={cat._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl font-sans">
                            <span className="font-medium text-gray-700">{cat.name}</span>
                            <button
                                onClick={() => onDelete(cat._id)}
                                className="text-red-400 hover:text-red-600 p-1"
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                    {categories.length === 0 && <p className="text-center text-gray-400 py-4 font-sans">{t("adminDashboard.noCats")}</p>}
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 font-sans"
                >
                    {t("common.close")}
                </button>
            </div>
        </div>
    )
}
