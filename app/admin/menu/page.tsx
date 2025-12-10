"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarNav } from "@/components/sidebar-nav"
import { AuthHeader } from "@/components/auth-header"
import { useAuth } from "@/context/auth-context"

interface MenuItem {
  _id: string
  name: string
  description: string
  category: string
  price: number
  image?: string
  isAvailable: boolean
  preparationTime: number
  ingredients: string[]
}

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const { token } = useAuth()

  useEffect(() => {
    fetchMenuItems()
  }, [token])

  const fetchMenuItems = async () => {
    try {
      const response = await fetch("/api/menu", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setMenuItems(data)
      }
    } catch (err) {
      setError("Failed to load menu items")
    } finally {
      setLoading(false)
    }
  }

  const categories = [...new Set(menuItems.map((item) => item.category))]
  const filteredItems =
    categoryFilter === "all" ? menuItems : menuItems.filter((item) => item.category === categoryFilter)

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="flex">
        <SidebarNav />
        <main className="flex-1 ml-64">
          <AuthHeader title="Menu Items" description="Manage cafeteria menu and items" />

          <div className="p-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="card-base">
                <p className="text-muted-foreground text-sm">Total Items</p>
                <p className="text-3xl font-bold text-primary mt-2">{menuItems.length}</p>
              </div>
              <div className="card-base">
                <p className="text-muted-foreground text-sm">Available</p>
                <p className="text-3xl font-bold text-success mt-2">{menuItems.filter((m) => m.isAvailable).length}</p>
              </div>
              <div className="card-base">
                <p className="text-muted-foreground text-sm">Avg Price</p>
                <p className="text-3xl font-bold text-info mt-2">
                  ${(menuItems.reduce((sum, m) => sum + m.price, 0) / (menuItems.length || 1)).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Category Filter */}
            <div className="card-base mb-6 flex gap-3">
              {["all", ...categories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                    categoryFilter === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-border"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu Items Grid */}
            {loading ? (
              <div className="text-center py-8">Loading menu items...</div>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <div key={item._id} className="card-base overflow-hidden">
                    <div className="h-40 bg-muted flex items-center justify-center text-4xl rounded mb-4">🍲</div>
                    <h3 className="font-semibold text-lg text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">${item.price.toFixed(2)}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          item.isAvailable ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
                        }`}
                      >
                        {item.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Prep time: {item.preparationTime} min</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
