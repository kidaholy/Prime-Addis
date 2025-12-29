"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
import { AnimatedButton } from "@/components/animated-button"
import { useAuth } from "@/context/auth-context"

import { useLanguage } from "@/context/language-context"
import { compressImage, validateImageFile } from "@/lib/utils/image-utils"
import { ConfirmationCard, NotificationCard } from "@/components/confirmation-card"
import { useConfirmation } from "@/hooks/use-confirmation"

interface MenuItem {
  _id: string
  name: string
  category: string
  price: number
  description?: string
  image?: string
  preparationTime?: number
  available: boolean
  reportUnit?: 'kg' | 'liter' | 'piece'
  reportQuantity?: number
  stockItemId?: string | any
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
  reportUnit: 'kg' | 'liter' | 'piece'
  reportQuantity: string
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
  const [imageProcessing, setImageProcessing] = useState(false)
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
    reportUnit: 'piece',
    reportQuantity: '1',
    stockItemId: "",
    stockConsumption: "0"
  })
  const [imageInputType, setImageInputType] = useState<'file' | 'url'>('file')
  const { token } = useAuth()
  const { t } = useLanguage()
  const { confirmationState, confirm, closeConfirmation, notificationState, notify, closeNotification } = useConfirmation()
  const [categories, setCategories] = useState<any[]>([])
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [categoryLoading, setCategoryLoading] = useState(false)

  useEffect(() => {
    if (token) {
      fetchMenuItems()
      fetchCategories()
      fetchStockItems()
    }
  }, [token])

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
    const confirmed = await confirm({
      title: "Delete Category",
      message: "Are you sure you want to delete this category?\n\nMenu items in this category will still exist but the category filter will be gone.",
      type: "warning",
      confirmText: "Delete Category",
      cancelText: "Cancel"
    })
    
    if (!confirmed) return
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

  // Filters and search logic

  useEffect(() => {
    filterItems()
  }, [menuItems, searchTerm, categoryFilter])



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
      notify({
        title: "Missing Information",
        message: "Please fill in all required fields (Name, Category, and Price).",
        type: "error"
      })
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
        notify({
          title: editingItem ? "Menu Item Updated" : "Menu Item Created",
          message: editingItem ? "Menu item has been updated successfully." : "New menu item has been added successfully.",
          type: "success"
        })
        resetForm()
        setTimeout(() => fetchMenuItems(), 500)
        localStorage.setItem('menuUpdated', Date.now().toString())
      } else {
        const errorData = await response.json()
        notify({
          title: "Save Failed",
          message: errorData.message || "Failed to save menu item",
          type: "error"
        })
      }
    } catch (error) {
      console.error("Error saving menu item:", error)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate
    const { valid, error } = validateImageFile(file)
    if (!valid) {
      notify({
        title: "Invalid Image",
        message: error || "Please select a valid image file",
        type: "error"
      })
      return
    }

    try {
      setImageProcessing(true)
      const compressedImage = await compressImage(file, {
        maxWidth: 800, // Larger for menu items
        maxHeight: 800,
        quality: 0.8
      })
      setFormData(prev => ({ ...prev, image: compressedImage }))
    } catch (err) {
      console.error("Image processing failed:", err)
      notify({
        title: "Image Processing Failed",
        message: "Failed to process the selected image. Please try again.",
        type: "error"
      })
    } finally {
      setImageProcessing(false)
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
      reportUnit: item.reportUnit || 'piece',
      reportQuantity: item.reportQuantity?.toString() || "0",
      stockItemId: item.stockItemId?._id || item.stockItemId || "",
      stockConsumption: item.stockConsumption?.toString() || "0",
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (item: MenuItem) => {
    const confirmed = await confirm({
      title: "Delete Menu Item",
      message: `Are you sure you want to delete "${item.name}"?\n\nThis action cannot be undone.`,
      type: "danger",
      confirmText: "Delete Item",
      cancelText: "Cancel"
    })
    
    if (!confirmed) return

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
      reportUnit: 'piece', reportQuantity: '1',
      stockItemId: "", stockConsumption: "0"
    })
    setEditingItem(null)
    setShowCreateForm(false)
  }

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="min-h-screen bg-white p-4 font-sans text-slate-800">
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
                  className="w-full bg-[#D2691E] text-white font-bold py-4 rounded-full custom-shadow transform transition-transform hover:scale-105 active:scale-95 bubbly-button mb-3"
                >
                  ➕ {t("adminMenu.addNewItem")}
                </button>
                <button
                  onClick={() => setShowCategoryManager(true)}
                  className="w-full bg-[#8B4513] text-white font-bold py-3 rounded-full custom-shadow transform transition-transform hover:scale-105 active:scale-95 text-sm"
                >
                  📁 {t("adminMenu.manageCategories")}
                </button>
              </div>

              {/* Filters Card */}
              <div className="bg-[#8B4513] rounded-[40px] p-6 custom-shadow text-white">
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
                      className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D2691E] placeholder:text-white/30"
                      placeholder={t("adminMenu.searchPlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-80">{t("adminMenu.category")}</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D2691E] appearance-none cursor-pointer"
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
                  <div className="bg-white px-4 py-2 rounded-full font-bold text-[#8B4513] text-sm">
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
                    {filteredItems.map((item) => (
                      <div key={item._id} className="bg-gray-50 rounded-[35px] overflow-hidden border border-gray-100 hover:shadow-xl transition-all group flex flex-col">
                        {/* Item Image */}
                        <div className="h-40 bg-gray-200 relative overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">☕</div>
                          )}
                          <div className="absolute top-4 left-4 flex flex-col gap-2">
                          </div>
                          <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${item.available ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                            {item.available ? t("adminMenu.active") : t("adminMenu.hidden")}
                          </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col">
                          <h3 className="font-bold text-lg mb-1 truncate">{item.name}</h3>
                          <p className="text-xs font-bold text-[#8B4513] uppercase tracking-wider mb-3">{item.category}</p>
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
                    ))}
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
                  {/* Image Upload Section */}
                  <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-gray-700">{t("adminMenu.itemImage") || "Item Image"}</label>
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setImageInputType('file')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${imageInputType === 'file' ? 'bg-white shadow text-[#2d5a41]' : 'text-gray-500'}`}
                        >
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageInputType('url')}
                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${imageInputType === 'url' ? 'bg-white shadow text-[#2d5a41]' : 'text-gray-500'}`}
                        >
                          Image URL
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-24 h-24 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-200">
                        {formData.image ? (
                          <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📷</div>
                        )}
                      </div>

                      <div className="flex-1 space-y-3">
                        {imageInputType === 'file' ? (
                          <>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={imageProcessing}
                              className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-[#2d5a41] file:text-white
                                hover:file:bg-[#1a3828] cursor-pointer"
                            />
                            <p className="text-xs text-gray-500">{imageProcessing ? "⏳ Processing..." : "Supports JPG, PNG, WebP. Max 5MB."}</p>
                          </>
                        ) : (
                          <div>
                            <input
                              type="url"
                              value={formData.image}
                              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                              placeholder="https://example.com/image.jpg"
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a41]"
                            />
                            <p className="mt-2 text-xs text-gray-500">Enter a direct link to an image.</p>
                          </div>
                        )}

                        {formData.image && (
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, image: "" }))}
                            className="text-xs text-red-500 font-bold hover:underline"
                          >
                            Remove Image
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
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
                    <label className="block text-sm font-bold text-gray-700 mb-2">{t("adminMenu.description")}</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm h-[80px]"
                      placeholder={t("adminMenu.descPlaceholder")}
                    />
                  </div>

                  {/* Reporting Configuration */}
                  <div className="bg-[#2d5a41]/5 p-6 rounded-[30px] border border-[#2d5a41]/10">
                    <h3 className="text-sm font-black text-[#2d5a41] uppercase tracking-widest mb-4">Reporting Configuration</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Reporting Unit</label>
                        <select
                          value={formData.reportUnit}
                          onChange={(e) => setFormData({ ...formData, reportUnit: e.target.value as any })}
                          className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2d5a41]"
                        >
                          <option value="kg">kg (Beef)</option>
                          <option value="liter">liter (Drinks/Milk)</option>
                          <option value="piece">piece (Soft Drinks)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Amount per Sale</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            value={formData.reportQuantity}
                            onChange={(e) => setFormData({ ...formData, reportQuantity: e.target.value })}
                            className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm"
                            placeholder="0.00"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2d5a41] text-xs font-bold uppercase">
                            {formData.reportUnit}
                          </span>
                        </div>
                        <p className="mt-2 text-[10px] text-gray-400 font-medium">Used for calculating total consumption in reports.</p>
                      </div>
                    </div>
                  </div>

                  {/* Stock Linkage Configuration */}
                  <div className="bg-[#f5bc6b]/10 p-6 rounded-[30px] border border-[#f5bc6b]/20">
                    <h3 className="text-sm font-black text-[#8b6e3f] uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span>📦</span> Stock Linkage (Optional)
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Link to Stock Item</label>
                        <select
                          value={formData.stockItemId}
                          onChange={(e) => setFormData({ ...formData, stockItemId: e.target.value })}
                          className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#f5bc6b]"
                        >
                          <option value="">No Stock Linked</option>
                          {stockItems.map((stock: any) => (
                            <option key={stock._id} value={stock._id}>
                              {stock.name} ({stock.unit})
                            </option>
                          ))}
                        </select>
                        <p className="mt-2 text-[10px] text-gray-400 font-medium italic">Select a stock item to auto-track inventory on every sale.</p>
                      </div>

                      {formData.stockItemId && (
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Stock Used Per Sale</label>
                          <div className="relative">
                            <input
                              type="number"
                              step="any"
                              value={formData.stockConsumption}
                              onChange={(e) => setFormData({ ...formData, stockConsumption: e.target.value })}
                              className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm"
                              placeholder="1.0"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#f5bc6b] text-xs font-black">
                              {stockItems.find(s => s._id === formData.stockItemId)?.unit || 'units'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
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
