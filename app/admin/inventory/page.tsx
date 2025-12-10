"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarNav } from "@/components/sidebar-nav"
import { AuthHeader } from "@/components/auth-header"
import { useAuth } from "@/context/auth-context"

interface InventoryItem {
  _id: string
  name: string
  quantity: number
  unit: string
  minStock: number
  maxStock: number
  category: string
  supplier: string
  cost: number
  isLowStock: boolean
  expiryDate?: string
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const { token } = useAuth()

  useEffect(() => {
    fetchInventory()
  }, [token])

  const fetchInventory = async () => {
    try {
      const response = await fetch("/api/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setInventory(data)
      }
    } catch (err) {
      setError("Failed to load inventory")
    } finally {
      setLoading(false)
    }
  }

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = [...new Set(inventory.map((item) => item.category))]
  const lowStockCount = inventory.filter((item) => item.isLowStock).length
  const totalValue = inventory.reduce((sum, item) => sum + item.quantity * (item.cost || 0), 0)

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="flex">
        <SidebarNav />
        <main className="flex-1 ml-64">
          <AuthHeader title="Inventory Management" description="Track and manage cafeteria inventory" />

          <div className="p-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="card-base">
                <p className="text-muted-foreground text-sm">Total Items</p>
                <p className="text-3xl font-bold text-primary mt-2">{inventory.length}</p>
              </div>
              <div className="card-base">
                <p className="text-muted-foreground text-sm">Low Stock</p>
                <p className="text-3xl font-bold text-warning mt-2">{lowStockCount}</p>
              </div>
              <div className="card-base">
                <p className="text-muted-foreground text-sm">Total Value</p>
                <p className="text-3xl font-bold text-success mt-2">${totalValue.toFixed(2)}</p>
              </div>
              <div className="card-base">
                <p className="text-muted-foreground text-sm">Categories</p>
                <p className="text-3xl font-bold text-info mt-2">{categories.length}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="card-base mb-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-2">Search Items</label>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="input-base"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <button onClick={() => setShowForm(true)} className="btn-primary">
                  Add Item
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            {loading ? (
              <div className="text-center py-8">Loading inventory...</div>
            ) : error ? (
              <div className="text-center py-8 text-danger">{error}</div>
            ) : (
              <div className="card-base overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Category</th>
                      <th className="text-left py-3 px-4 font-semibold">Quantity</th>
                      <th className="text-left py-3 px-4 font-semibold">Unit</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Cost</th>
                      <th className="text-left py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => (
                      <tr key={item._id} className="border-b border-border hover:bg-muted transition-colors">
                        <td className="py-3 px-4">{item.name}</td>
                        <td className="py-3 px-4">{item.category}</td>
                        <td className="py-3 px-4 font-mono">{item.quantity}</td>
                        <td className="py-3 px-4">{item.unit}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              item.isLowStock ? "bg-warning/20 text-warning" : "bg-success/20 text-success"
                            }`}
                          >
                            {item.isLowStock ? "Low Stock" : "In Stock"}
                          </span>
                        </td>
                        <td className="py-3 px-4">${item.cost?.toFixed(2) || "0.00"}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="text-xs text-primary hover:underline"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
