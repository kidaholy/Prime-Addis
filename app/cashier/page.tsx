"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarNav } from "@/components/sidebar-nav"
import { AuthHeader } from "@/components/auth-header"
import { CartSidebar } from "@/components/cart-sidebar"
import { MenuItemCard } from "@/components/menu-item-card"
import { OrderAnimation } from "@/components/order-animation"
import { ParticleSystem } from "@/components/particle-system"
import { AnimatedLoading } from "@/components/animated-loading"
import { AnimatedButton } from "@/components/animated-button"

import { useAuth } from "@/context/auth-context"

interface MenuItem {
  _id: string
  name: string
  description?: string
  category: string
  price: number
  image?: string
  available?: boolean
  preparationTime?: number
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}



export default function CashierPOSPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [loading, setLoading] = useState(false)
  const [menuLoading, setMenuLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState("")
  const [showOrderAnimation, setShowOrderAnimation] = useState(false)
  const { token } = useAuth()

  // Fetch menu items from API
  useEffect(() => {
    const fetchMenuItems = async () => {
      if (!token) return

      try {
        setMenuLoading(true)
        const response = await fetch("/api/menu", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setMenuItems(data)
        } else {
          setError("Failed to load menu items")
        }
      } catch (err) {
        setError("Failed to load menu items")
      } finally {
        setMenuLoading(false)
      }
    }

    fetchMenuItems()
    
    // Add automatic refresh every 5 seconds for menu items
    const interval = setInterval(fetchMenuItems, 5000)
    return () => clearInterval(interval)
  }, [token])

  // Add localStorage listener for menu updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'menuUpdated') {
        // Refetch menu items when menu is updated
        const fetchMenuItems = async () => {
          if (!token) return
          try {
            const response = await fetch("/api/menu", {
              headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
              const data = await response.json()
              setMenuItems(data)
            }
          } catch (err) {
            console.error("Failed to refresh menu items")
          }
        }
        fetchMenuItems()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [token])

  const handleAddToCart = (item: MenuItem) => {
    const existingItem = cartItems.find((ci) => ci.id === item._id)
    if (existingItem) {
      setCartItems(cartItems.map((ci) => (ci.id === item._id ? { ...ci, quantity: ci.quantity + 1 } : ci)))
    } else {
      setCartItems([...cartItems, { id: item._id, name: item.name, price: item.price, quantity: 1 }])
    }
  }

  const handleRemoveFromCart = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id))
  }

  const handleQuantityChange = (id: string, quantity: number) => {
    if (quantity === 0) {
      handleRemoveFromCart(id)
    } else {
      setCartItems(cartItems.map((item) => (item.id === id ? { ...item, quantity } : item)))
    }
  }

  const handleCheckout = async () => {
    if (cartItems.length === 0) return

    setLoading(true)
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            menuItemId: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          totalAmount: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
          paymentMethod: "cash",
          status: "pending",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setOrderNumber(data.orderNumber)
        setShowOrderAnimation(true)

        // Trigger immediate refresh on other pages
        localStorage.setItem('newOrderCreated', Date.now().toString())

        // Clear cart after animation
        setTimeout(() => {
          setCartItems([])
          setShowOrderAnimation(false)
        }, 4000)
      }
    } catch (err) {
      alert("Failed to create order")
    } finally {
      setLoading(false)
    }
  }

  const categories = ["all", ...new Set(menuItems.map((item) => item.category))]
  const filteredItems =
    categoryFilter === "all" ? menuItems : menuItems.filter((item) => item.category === categoryFilter)

  return (
    <ProtectedRoute requiredRoles={["cashier"]}>
      <div className="flex flex-col md:flex-row">
        <SidebarNav />
        <main className="flex-1 md:ml-64 md:mr-80">
          <AuthHeader title="POS System" description="Browse menu and take orders" />
          


          <div className="p-6">
            {/* Loading State */}
            {menuLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading menu items...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Failed to Load Menu</h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Menu Content */}
            {!menuLoading && !error && (
              <>
                {/* Category Filter */}
                <div className="flex gap-3 mb-8 flex-wrap sticky top-0 bg-background/80 backdrop-blur-sm py-4 z-20">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-6 py-2 rounded-full transition-all capitalize font-semibold ${
                        categoryFilter === cat
                          ? "bg-accent text-accent-foreground shadow-lg scale-105"
                          : "bg-card border-2 border-border hover:border-accent text-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Empty State */}
                {filteredItems.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🍽️</div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">No Menu Items</h2>
                    <p className="text-muted-foreground">No items available in this category</p>
                  </div>
                )}

                {/* Menu Grid */}
                {filteredItems.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item, idx) => (
                      <MenuItemCard
                        key={item._id}
                        name={item.name}
                        price={item.price}
                        description={item.description}
                        category={item.category}
                        preparationTime={item.preparationTime}
                        onAddToCart={() => handleAddToCart(item)}
                        index={idx}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
        <CartSidebar
          items={cartItems}
          onRemove={handleRemoveFromCart}
          onQuantityChange={handleQuantityChange}
          onCheckout={handleCheckout}
          isLoading={loading}
        />

        {/* Order Animation */}
        <OrderAnimation orderNumber={orderNumber} totalItems={cartItems.length} isVisible={showOrderAnimation} />

      </div>
    </ProtectedRoute>
  )
}
