"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarNav } from "@/components/sidebar-nav"
import { AuthHeader } from "@/components/auth-header"
import { CartSidebar } from "@/components/cart-sidebar"
import { ParticleSystem } from "@/components/particle-system"
import { AnimatedLoading } from "@/components/animated-loading"
import { AnimatedButton } from "@/components/animated-button"
import { useAuth } from "@/context/auth-context"

// Category icon mapping function
const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    "Hot Coffee": "☕",
    "Iced & Cold Coffee": "🧊",
    "Tea & Infusions": "🍵",
    "Hot Specialties": "🔥",
    "Drinks": "🥤",
    "Juice": "🧃",
    "Mojito": "🍹",
    "Breakfast": "🍳",
    "Salad": "🥗",
    "Burrito": "🌯",
    "Burgers": "🍔",
    "Wraps": "🌯",
    "Sandwich": "🥪",
    "Pasta": "🍝",
    "Chicken": "🍗",
    "Ethiopian Taste": "🇪🇹",
  }
  return icons[category] || "🍽️"
}

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



export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [menuLoading, setMenuLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { token, user } = useAuth()

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
  }, [token])

  const handleAddToCart = (item: MenuItem) => {
    const existingItem = cartItems.find((ci) => ci.id === item._id)
    if (existingItem) {
      setCartItems(cartItems.map((ci) => (ci.id === item._id ? { ...ci, quantity: ci.quantity + 1 } : ci)))
    } else {
      setCartItems([...cartItems, { id: item._id, name: item.name, price: item.price, quantity: 1 }])
    }

    // Show success feedback
    setSelectedItem(item)
    setTimeout(() => setSelectedItem(null), 1500)
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
        alert(`Order #${data.orderNumber} sent to kitchen! Preparing your items...`)
        setCartItems([])
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

  if (user?.role === "cashier") {
    return (
      <ProtectedRoute requiredRoles={["cashier"]}>
        <ParticleSystem />
        <div className="flex flex-col md:flex-row relative z-10">
          <SidebarNav />
          <main className="flex-1 md:ml-64 md:mr-80">
            <AuthHeader title="Menu" description="Browse and order items" />
            
            {/* Welcome banner with animations */}
            <div className="mx-6 mt-6 p-6 bg-gradient-to-r from-accent/10 via-secondary/10 to-accent/10 rounded-xl border border-accent/20 animate-gradient-shift">
              <h1 className="text-3xl font-bold text-center animate-typewriter mb-2">
                ☕ Welcome to Prime Addis Coffee ☕
              </h1>
              <p className="text-center text-muted-foreground animate-slide-in-up">
                Discover our amazing selection of premium coffee and delicious food!
              </p>
            </div>

            <div className="p-6">
              {/* Loading State */}
              {menuLoading && (
                <AnimatedLoading message="Loading delicious menu items..." type="food" />
              )}

              {/* Error State */}
              {error && (
                <div className="text-center py-12 animate-bounce-in">
                  <div className="text-6xl mb-4 animate-wiggle">⚠️</div>
                  <h2 className="text-2xl font-bold text-foreground mb-2 animate-neon-flicker">Failed to Load Menu</h2>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <AnimatedButton
                    onClick={() => window.location.reload()}
                    variant="glow"
                    size="lg"
                  >
                    🔄 Try Again
                  </AnimatedButton>
                </div>
              )}

              {/* Menu Content */}
              {!menuLoading && !error && (
                <>
                  {/* Category Filter */}
                  <div className="flex gap-3 mb-8 flex-wrap sticky top-0 bg-background/80 backdrop-blur-sm py-4 z-20">
                    {categories.map((cat, index) => (
                      <AnimatedButton
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        variant={categoryFilter === cat ? "glow" : "secondary"}
                        className={`capitalize animate-slide-in-down stagger-${Math.min(index + 1, 6)} ${
                          categoryFilter === cat ? "animate-pulse-glow" : ""
                        }`}
                      >
                        {cat === "all" ? "🌟 All" : `${getCategoryIcon(cat)} ${cat}`}
                      </AnimatedButton>
                    ))}
                  </div>

                  {/* Empty State */}
                  {filteredItems.length === 0 && (
                    <div className="text-center py-12 animate-bounce-in">
                      <div className="text-6xl mb-4 animate-float">🍽️</div>
                      <h2 className="text-2xl font-bold text-foreground mb-2 animate-typewriter">No Menu Items</h2>
                      <p className="text-muted-foreground animate-slide-in-up">No items available in this category</p>
                    </div>
                  )}

                  {/* Menu Grid */}
                  {filteredItems.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredItems.map((item, idx) => (
                        <MenuItemCard
                          key={item._id}
                          item={item}
                          onAddToCart={handleAddToCart}
                          isSelected={selectedItem?._id === item._id}
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
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🍽️</div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Menu Access Restricted</h1>
        <p className="text-muted-foreground mb-6">This page is only available for cashiers</p>
        <Link href="/cashier" className="btn-primary">
          Go to POS System
        </Link>
      </div>
    </div>
  )
}

function MenuItemCard({
  item,
  onAddToCart,
  isSelected,
  index,
}: { item: MenuItem; onAddToCart: (item: MenuItem) => void; isSelected: boolean; index: number }) {
  return (
    <div
      className={`group card-base hover-lift cursor-pointer animate-bounce-in overflow-hidden relative ${
        isSelected ? "animate-rainbow-glow" : ""
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={() => onAddToCart(item)}
    >
      {/* Floating particles for selected item */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-accent rounded-full animate-particle-float"
              style={{
                left: `${20 + i * 15}%`,
                top: `${20 + (i % 2) * 60}%`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Item Image */}
      <div className="relative w-full h-40 bg-gradient-to-br from-accent/20 to-primary/20 rounded-lg overflow-hidden mb-4">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover transition-all duration-500 group-hover:scale-125 group-hover:rotate-2"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-5xl opacity-50 animate-float">🍰</div>
          </div>
        )}
        
        {/* Animated overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-accent/20 opacity-0 group-hover:opacity-100 transition-all duration-300" />
        
        {/* Price badge with animation */}
        <div className="absolute top-2 right-2 bg-accent text-accent-foreground px-2 py-1 rounded-full text-sm font-bold animate-heartbeat">
          {item.price} Br
        </div>

        {/* Category icon */}
        <div className="absolute top-2 left-2 text-2xl animate-wiggle">
          {getCategoryIcon(item.category)}
        </div>
      </div>

      <h3 className="text-lg font-bold text-foreground mb-2 group-hover:animate-neon-flicker">
        {item.name}
      </h3>

      {item.description && (
        <p className="text-sm text-muted-foreground mb-3 group-hover:text-accent transition-colors">
          {item.description}
        </p>
      )}

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          {item.preparationTime && (
            <div className="flex items-center gap-1 text-xs bg-primary/20 text-foreground px-2 py-1 rounded animate-zoom-in-out">
              <span className="animate-rotate-360">⏱</span> {item.preparationTime}m
            </div>
          )}
        </div>
        
        {/* Availability indicator */}
        <div className="flex items-center gap-1 text-xs">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          <span className="text-success">Available</span>
        </div>
      </div>

      {/* Add to Cart Button */}
      <AnimatedButton
        onClick={(e) => {
          e?.stopPropagation?.()
          onAddToCart(item)
        }}
        variant={isSelected ? "rainbow" : "glow"}
        className={`w-full ${isSelected ? "animate-heartbeat" : ""}`}
      >
        {isSelected ? (
          <>
            <span className="animate-bounce">✓</span> Added to Cart!
          </>
        ) : (
          <>
            <span className="group-hover:animate-wiggle">🛒</span> Add to Order
          </>
        )}
      </AnimatedButton>
    </div>
  )
}
