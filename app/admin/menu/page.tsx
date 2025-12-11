"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarNav } from "@/components/sidebar-nav"
import { AuthHeader } from "@/components/auth-header"
import { AnimatedButton } from "@/components/animated-button"
import { useAuth } from "@/context/auth-context"

interface MenuItem {
  _id: string
  name: string
  category: string
  price: number
  description?: string
  image?: string
  preparationTime?: number
  available: boolean
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
}

export default function AdminMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
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
  })
  const { token } = useAuth()

  const categories = [
    "Hot Coffee", "Iced & Cold Coffee", "Tea & Infusions", "Hot Specialties",
    "Drinks", "Juice", "Mojito", "Breakfast", "Salad", "Burrito", "Burgers",
    "Wraps", "Sandwich", "Pasta", "Chicken", "Ethiopian Taste"
  ]

  useEffect(() => {
    if (token) {
      fetchMenuItems()
    }
  }, [token])

  useEffect(() => {
    filterItems()
  }, [menuItems, searchTerm, categoryFilter])

  const fetchMenuItems = async () => {
    try {
      setLoading(true)
      console.log("🔄 Fetching menu items...")
      
      const response = await fetch(`/api/admin/menu?t=${Date.now()}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      })

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Menu items fetched:", data.length)
        console.log("🔍 Sample menu item:", data[0])
        console.log("🆔 Sample ID type:", typeof data[0]?._id)
        setMenuItems(data)
      } else {
        const errorData = await response.json()
        console.error("❌ Failed to fetch menu items:", errorData)
        alert(`Failed to fetch menu items: ${errorData.message}`)
      }
    } catch (error) {
      console.error("❌ Error fetching menu items:", error)
      alert(`Error fetching menu items: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const filterItems = () => {
    let filtered = menuItems

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category
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
      
      console.log(`🔄 ${editingItem ? 'Updating' : 'Creating'} menu item:`, formData)
      console.log(`🖼️ Image URL being sent:`, formData.image)
      console.log(`🔗 URL: ${url}`)
      console.log(`🆔 Item ID: ${editingItem?._id}`)
      console.log(`🔑 Token: ${token ? 'Present' : 'Missing'}`)
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const responseData = await response.json()
      console.log(`📥 Response:`, responseData)

      if (response.ok) {
        console.log("✅ Menu item operation successful:", responseData)
        console.log("🖼️ Updated item image:", responseData.menuItem?.image)
        
        // Optimistic update: immediately update the local state
        if (editingItem && responseData.menuItem) {
          setMenuItems(prevItems => 
            prevItems.map(item => 
              item._id === editingItem._id 
                ? { ...responseData.menuItem, _id: responseData.menuItem._id }
                : item
            )
          )
          console.log("🔄 Optimistic update applied to local state")
        }
        
        alert(`✅ Menu item ${editingItem ? 'updated' : 'created'} successfully!`)
        
        // Reset form and close modal
        setFormData({
          name: "", category: "", price: "", description: "",
          image: "", preparationTime: "10", available: true
        })
        setShowCreateForm(false)
        setEditingItem(null)
        // Refresh menu items to show updated data (with delay to ensure DB consistency)
        setTimeout(async () => {
          await fetchMenuItems()
        }, 500)
        
        // Trigger immediate refresh on other pages
        localStorage.setItem('menuUpdated', Date.now().toString())
      } else {
        console.error(`❌ API Error - Status: ${response.status}, Message: ${responseData.message}`)
        alert(`❌ Failed to ${editingItem ? 'update' : 'create'} menu item: ${responseData.message}`)
      }
    } catch (error) {
      console.error(`❌ ${editingItem ? 'Update' : 'Create'} menu item error:`, error)
      alert(`❌ Error ${editingItem ? 'updating' : 'creating'} menu item: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleEdit = (item: MenuItem) => {
    console.log("🔧 Editing menu item:", item)
    console.log("🆔 Item ID:", item._id)
    console.log("🔍 ID type:", typeof item._id)
    console.log("🔍 ID length:", item._id?.length)
    
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      description: item.description || "",
      image: item.image || "",
      preparationTime: item.preparationTime?.toString() || "10",
      available: item.available,
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return
    }

    try {
      console.log("🗑️ Deleting menu item:", item.name)
      
      const response = await fetch(`/api/admin/menu/${item._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        alert("✅ Menu item deleted successfully!")
        fetchMenuItems()
        
        // Trigger immediate refresh on other pages
        localStorage.setItem('menuUpdated', Date.now().toString())
      } else {
        const errorData = await response.json()
        alert(`❌ Failed to delete menu item: ${errorData.message}`)
      }
    } catch (error) {
      console.error("❌ Delete menu item error:", error)
      alert(`❌ Error deleting menu item: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "", category: "", price: "", description: "",
      image: "", preparationTime: "10", available: true
    })
    setEditingItem(null)
    setShowCreateForm(false)
  }

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="min-h-screen bg-background">
        <SidebarNav />
        <main className="md:ml-64">
          <AuthHeader title="Menu Management" description="Manage menu items, prices, and availability" />

          <div className="p-2.5 sm:p-4 lg:p-6">
            {/* Header with Controls - Optimized for 412px */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex flex-col gap-2">
                <div>
                  <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground">Menu Items ({filteredItems.length})</h2>
                  <p className="text-xs sm:text-base text-muted-foreground">Total: {menuItems.length} items</p>
                </div>
                
                <div className="flex gap-2 w-full">
                  <AnimatedButton
                    onClick={fetchMenuItems}
                    variant="secondary"
                    disabled={loading}
                    className="text-xs px-2.5 py-1.5 flex-1"
                  >
                    🔄 Refresh
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={() => setShowCreateForm(true)}
                    variant="glow"
                    className="text-xs px-2.5 py-1.5 flex-1"
                  >
                    ➕ Add Item
                  </AnimatedButton>
                </div>
              </div>
            </div>

            {/* Search and Filter - Optimized for 412px */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-base w-full text-sm"
                  placeholder="Search by name or category..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="input-base w-full text-sm"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Menu Items List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading menu items...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <div key={item._id} className="card-base hover-lift p-3">
                    {/* Compact layout for 412px */}
                    <div className="flex items-start gap-2.5">
                      {/* Image */}
                      <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm">🍽️</span>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-foreground text-sm truncate">{item.name}</h3>
                          <span className={`px-1.5 py-0.5 rounded text-xs flex-shrink-0 ${item.available ? "bg-success/20 text-success" : "bg-danger/20 text-danger"}`}>
                            {item.available ? "✓" : "✗"}
                          </span>
                        </div>
                        
                        {item.description && (
                          <p className="text-xs text-muted-foreground mb-1.5 line-clamp-1">{item.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-accent font-semibold">{item.price} Br</span>
                            {item.preparationTime && (
                              <span className="text-muted-foreground">⏱{item.preparationTime}m</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <AnimatedButton
                              onClick={() => handleEdit(item)}
                              variant="secondary"
                              size="sm"
                              className="text-xs px-2 py-1"
                            >
                              ✏️
                            </AnimatedButton>
                            <AnimatedButton
                              onClick={() => handleDelete(item)}
                              variant="secondary"
                              size="sm"
                              className="text-xs px-2 py-1 text-danger hover:bg-danger/20"
                            >
                              🗑️
                            </AnimatedButton>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground mt-1 truncate">{item.category}</div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredItems.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <div className="text-4xl sm:text-6xl mb-4">🍽️</div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">No Menu Items Found</h3>
                    <p className="text-sm sm:text-base text-muted-foreground px-4">
                      {searchTerm || categoryFilter !== "all" 
                        ? "Try adjusting your search or filter" 
                        : "Create your first menu item to get started"
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Create/Edit Menu Item Modal - Optimized for 412px */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-2">
              <div className="bg-card rounded-xl p-3 w-full max-w-sm border border-border max-h-[98vh] overflow-y-auto mt-2">
                <h3 className="text-base font-bold text-foreground mb-3">
                  {editingItem ? "Edit Item" : "New Item"}
                </h3>
                
                <form onSubmit={handleCreateOrUpdate} className="space-y-3">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input-base text-sm"
                        placeholder="Item name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Category *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="input-base text-sm"
                        required
                      >
                        <option value="">Select category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Price (Br) *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="input-base text-sm"
                          placeholder="0.00"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Time (min)</label>
                        <input
                          type="number"
                          value={formData.preparationTime}
                          onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                          className="input-base text-sm"
                          placeholder="10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="input-base text-sm"
                        rows={2}
                        placeholder="Item description"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">Image URL</label>
                      <input
                        type="url"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        className="input-base text-sm"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="available"
                        checked={formData.available}
                        onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                        className="w-4 h-4 text-accent"
                      />
                      <label htmlFor="available" className="text-xs font-medium text-foreground">
                        Available for ordering
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <AnimatedButton
                      type="submit"
                      disabled={createLoading}
                      variant="glow"
                      className="flex-1 text-xs py-2"
                    >
                      {createLoading ? "Saving..." : editingItem ? "Update" : "Create"}
                    </AnimatedButton>
                    <AnimatedButton
                      type="button"
                      onClick={resetForm}
                      variant="secondary"
                      className="px-4 text-xs py-2"
                    >
                      Cancel
                    </AnimatedButton>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}