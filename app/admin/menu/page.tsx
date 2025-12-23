"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
import { AnimatedButton } from "@/components/animated-button"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"

interface MenuItem {
  _id: string
  name: string
  category: string
  price: number
  description?: string
  image?: string
  preparationTime?: number
  available: boolean
  stockItemId?: {
    _id: string
    name: string
    quantity: number
    minLimit: number
    unit: string
  }
  stockConsumption?: number
  createdAt: string
  updatedAt: string
}

interface MenuItemForm {
  name: string
  category: string
  price: string
  description: string
  image: string
  preparationTime: string
  available: boolean
  stockItemId: string
  stockConsumption: string
}

export default function AdminMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [stockItems, setStockItems] = useState<any[]>([])
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [createLoading, setCreateLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [formData, setFormData] = useState<MenuItemForm>({
    name: "",
    category: "",
    price: "",
    description: "",
    image: "",
    preparationTime: "10",
    available: true,
    stockItemId: "",
    stockConsumption: "0",
  })
  const { token } = useAuth()
  const { t } = useLanguage()
  const [categories, setCategories] = useState<any[]>([])
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [categoryLoading, setCategoryLoading] = useState(false)

  useEffect(() => {
    if (token) {
      fetchMenuItems()
      fetchStockItems()
      fetchCategories()
    }
  }, [token])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories?type=menu")
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
        body: JSON.stringify({ name: newCategoryName, type: "menu" }),
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
    if (!confirm("Are you sure? Menu items in this category will still exist but the category filter will be gone.")) return
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
  }, [menuItems, searchTerm, categoryFilter])

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

  const fetchMenuItems = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/menu?t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMenuItems(data)
        setError(null)
      } else {
        const errData = await response.json().catch(() => ({}))
        setError(errData.message || `Error ${response.status}: Failed to load menu`)
      }
    } catch (error: any) {
      console.error("Error fetching menu items:", error)
      setError(error.message || "Network error: Failed to fetch menu")
    } finally {
      setLoading(false)
    }
  }

  const filterItems = () => {
    let filtered = menuItems
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (categoryFilter !== "all") {
      filtered = filtered.filter(item => item.category === categoryFilter)
    }
    setFilteredItems(filtered)
  }

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.category || !formData.price) {
      alert("Please fill in all required fields")
      return
    }

    setCreateLoading(true)
    try {
      const url = editingItem
        ? `/api/admin/menu/${editingItem._id}`
        : "/api/admin/menu"

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
        const responseData = await response.json()

        resetForm()
        setTimeout(() => fetchMenuItems(), 500)
        localStorage.setItem('menuUpdated', Date.now().toString())
      }
    } catch (error) {
      console.error("Error saving menu item:", error)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      description: item.description || "",
      image: item.image || "",
      preparationTime: item.preparationTime?.toString() || "10",
      available: item.available,
      stockItemId: item.stockItemId?._id || "",
      stockConsumption: item.stockConsumption?.toString() || "0",
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return

    try {
      const response = await fetch(`/api/admin/menu/${item._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        fetchMenuItems()
        localStorage.setItem('menuUpdated', Date.now().toString())
      }
    } catch (error) {
      console.error("Error deleting menu item:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "", category: "", price: "", description: "",
      image: "", preparationTime: "10", available: true,
      stockItemId: "", stockConsumption: "0"
    })
    setEditingItem(null)
    setShowCreateForm(false)
  }

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="min-h-screen bg-[#e2e7d8] p-4 font-sans text-slate-800">
        <div className="max-w-7xl mx-auto">
          <BentoNavbar />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Control Sidebar */}
            <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-6 sticky top-4">
              {/* Add New Button Card */}
              <div className="bg-white rounded-[40px] p-6 custom-shadow">
                <h2 className="text-2xl font-bold mb-4 bubbly-text">{t("adminMenu.actions")}</h2>
                <button
                  onClick={() => { resetForm(); setShowCreateForm(true); }}
                  className="w-full bg-[#f5bc6b] text-[#1a1a1a] font-bold py-4 rounded-full custom-shadow transform transition-transform hover:scale-105 active:scale-95 bubbly-button mb-3"
                >
                  ➕ {t("adminMenu.addNewItem")}
                </button>
                <button
                  onClick={() => setShowCategoryManager(true)}
                  className="w-full bg-[#2d5a41] text-white font-bold py-3 rounded-full custom-shadow transform transition-transform hover:scale-105 active:scale-95 text-sm"
                >
                  📁 {t("adminMenu.manageCategories")}
                </button>
              </div>

              {/* Filters Card */}
              <div className="bg-[#2d5a41] rounded-[40px] p-6 custom-shadow text-[#e2e7d8]">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span>🔍</span> {t("adminMenu.filters")}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80">{t("adminMenu.searchName")}</label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f5bc6b] placeholder:text-white/30"
                      placeholder={t("adminMenu.searchPlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80">{t("adminMenu.category")}</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f5bc6b] appearance-none cursor-pointer"
                    >
                      <option value="all" className="bg-[#2d5a41]">{t("adminMenu.allCategories")}</option>
                      {categories.map((cat: any) => (
                        <option key={cat._id || cat.name} value={cat.name} className="bg-[#2d5a41]">{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu List Area */}
            <div className="md:col-span-8 lg:col-span-9">
              <div className="bg-white rounded-[40px] p-6 md:p-8 custom-shadow min-h-[600px]">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h1 className="text-3xl font-bold bubbly-text">{t("adminMenu.title")}</h1>
                    <p className="text-gray-500 font-medium">{t("adminMenu.subtitle")}</p>
                  </div>
                  <div className="bg-[#e2e7d8] px-4 py-2 rounded-full font-bold text-[#2d5a41] text-sm">
                    {filteredItems.length} {t("adminMenu.itemsFound")}
                  </div>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl font-bold flex items-center gap-3">
                    <span>⚠️</span> {error}
                  </div>
                )}

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="text-6xl animate-bounce mb-4">🍩</div>
                    <p className="text-gray-400 font-bold">{t("adminMenu.loading")}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item) => {
                      const stock = item.stockItemId
                      const isLow = stock && stock.quantity <= stock.minLimit
                      const isOutOfStock = stock && stock.quantity <= 0

                      return (
                        <div key={item._id} className="bg-gray-50 rounded-[35px] overflow-hidden border border-gray-100 hover:shadow-xl transition-all group flex flex-col">
                          {/* Item Image */}
                          <div className="h-40 bg-gray-200 relative overflow-hidden">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">☕</div>
                            )}
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                              {stock && (
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${isOutOfStock ? "bg-red-500 text-white" :
                                  isLow ? "bg-orange-400 text-white" :
                                    "bg-[#2d5a41] text-[#e2e7d8]"
                                  }`}>
                                  {isOutOfStock ? t("adminMenu.outOfStock") : isLow ? t("adminMenu.lowStock") : t("adminMenu.inStock")}
                                </div>
                              )}
                            </div>
                            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${item.available ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                              {item.available ? t("adminMenu.active") : t("adminMenu.hidden")}
                            </div>
                          </div>

                          <div className="p-5 flex-1 flex flex-col">
                            <h3 className="font-bold text-lg mb-1 truncate">{item.name}</h3>
                            <p className="text-xs font-bold text-[#2d5a41] uppercase tracking-wider mb-3">{item.category}</p>
                            <p className="text-2xl font-black text-gray-800 mb-4">{item.price} {t("common.currencyBr")}</p>

                            <div className="flex gap-2 mt-auto">
                              <button
                                onClick={() => handleEdit(item)}
                                className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-2.5 rounded-2xl hover:bg-gray-50 transition-colors text-sm"
                              >
                                {t("adminMenu.edit")}
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="px-4 bg-red-50 text-red-500 font-bold py-2.5 rounded-2xl hover:bg-red-100 transition-colors text-sm"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {!loading && filteredItems.length === 0 && (
                  <div className="text-center py-32">
                    <div className="text-7xl mb-6 opacity-20">🍃</div>
                    <h2 className="text-2xl font-bold text-gray-400">{t("adminMenu.empty")}</h2>
                    <p className="text-gray-400">{t("adminMenu.emptyDesc")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Create/Edit Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[50px] p-8 md:p-10 custom-shadow max-w-2xl w-full max-h-[90vh] overflow-y-auto transform animate-bounce-custom relative">
              <button onClick={resetForm} className="absolute top-8 right-8 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">✕</button>

              <h2 className="text-3xl font-bold mb-8 bubbly-text">{editingItem ? t("adminMenu.updateItem") : t("adminMenu.newItem")}</h2>

              <form onSubmit={handleCreateOrUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t("adminMenu.itemName")} *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a41]"
                      placeholder="Flat White"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t("adminMenu.category")} *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2d5a41]"
                      required
                    >
                      <option value="">{t("adminMenu.category")}</option>
                      {categories.map((cat: any) => <option key={cat._id || cat.name} value={cat.name}>{cat.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">{t("adminMenu.priceBr")} *</label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm"
                        placeholder="120"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">{t("adminMenu.prepTime")}</label>
                      <input
                        type="number"
                        value={formData.preparationTime}
                        onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm"
                        placeholder="10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t("adminMenu.stockLink")}</label>
                    <select
                      value={formData.stockItemId}
                      onChange={(e) => setFormData({ ...formData, stockItemId: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2d5a41]"
                    >
                      <option value="">{t("adminMenu.stockNoLink")}</option>
                      {stockItems.map(item => (
                        <option key={item._id} value={item._id}>{item.name} ({item.quantity} {item.unit} left)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t("adminMenu.stockCons")}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.stockConsumption}
                      onChange={(e) => setFormData({ ...formData, stockConsumption: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm"
                      placeholder="e.g. 0.05"
                    />
                    <p className="text-[10px] text-gray-400 mt-1 pl-2 font-bold uppercase tracking-wider">{t("adminMenu.amountUsed")}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t("adminMenu.description")}</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm h-[80px]"
                      placeholder={t("adminMenu.descPlaceholder")}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-12 h-6 rounded-full transition-colors relative ${formData.available ? 'bg-[#2d5a41]' : 'bg-gray-300'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.available ? 'left-7' : 'left-1'}`}></div>
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={formData.available}
                        onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                      />
                      <span className="font-bold text-gray-700 group-hover:text-black">{t("adminMenu.available")}</span>
                    </label>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-8 py-3.5 rounded-2xl font-bold text-gray-500 hover:bg-gray-50"
                      >
                        {t("adminMenu.cancel")}
                      </button>
                      <button
                        type="submit"
                        disabled={createLoading}
                        className="px-10 py-3.5 bg-[#2d5a41] text-white rounded-2xl font-bold custom-shadow hover:scale-105 transition-transform disabled:opacity-50"
                      >
                        {createLoading ? t("adminMenu.save") : (editingItem ? t("adminMenu.updateItem") : t("adminMenu.add"))}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <CategoryManager
        show={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        categories={categories}
        onAdd={handleAddCategory}
        onDelete={handleDeleteCategory}
        loading={categoryLoading}
        title={t("adminMenu.manageCategories")}
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
          <h2 className="text-2xl font-bold bubbly-text">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500">✕</button>
        </div>

        <form onSubmit={onAdd} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={t("adminMenu.newCatPlaceholder")}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a41]"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#2d5a41] text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
            >
              {t("adminMenu.add")}
            </button>
          </div>
        </form>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {categories.map((cat: any) => (
            <div key={cat._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
              <span className="font-medium text-gray-700">{cat.name}</span>
              <button
                onClick={() => onDelete(cat._id)}
                className="text-red-400 hover:text-red-600 p-1"
              >
                🗑️
              </button>
            </div>
          ))}
          {categories.length === 0 && <p className="text-center text-gray-400 py-4">{t("adminMenu.noCats")}</p>}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200"
        >
          {t("adminMenu.close")}
        </button>
      </div>
    </div>
  )
}
