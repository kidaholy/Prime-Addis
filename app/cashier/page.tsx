"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
import { CartSidebar } from "@/components/cart-sidebar"
import { MenuItemCard } from "@/components/menu-item-card"
import { OrderAnimation } from "@/components/order-animation"


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
  }, [token])

  // Add localStorage listener for menu updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'menuUpdated') {
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

        localStorage.setItem('newOrderCreated', Date.now().toString())

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
      <div className="min-h-screen bg-[#e2e7d8] p-4 font-sans text-slate-800">
        <div className="max-w-7xl mx-auto">
          <BentoNavbar />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2">
            {/* POS Main Area */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Category Bar Card */}
              <div className="bg-white rounded-[40px] p-6 custom-shadow overflow-hidden">
                <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition-all duration-300 ${categoryFilter === cat
                        ? "bg-[#2d5a41] text-white shadow-lg scale-105"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                    >
                      {cat === "all" ? "All Items" : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Grid Card */}
              <div className="bg-white rounded-[40px] p-8 custom-shadow min-h-[600px]">
                {menuLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="text-5xl animate-bounce mb-4">🥐</div>
                    <p className="text-gray-400 font-bold">Loading Menu...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-red-500 mb-2">Ops! Failed to Load</h2>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button onClick={() => window.location.reload()} className="bg-[#2d5a41] text-white px-8 py-3 rounded-full font-bold bubbly-button">
                      Retry
                    </button>
                  </div>
                ) : (
                  <>
                    {filteredItems.length === 0 ? (
                      <div className="text-center py-20">
                        <div className="text-6xl mb-4 opacity-30">🍽️</div>
                        <h2 className="text-2xl font-bold text-gray-400 border-none outline-none">No Items Found</h2>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredItems.map((item, idx) => (
                          <div key={item._id} className="transform transition-transform hover:scale-[1.02]">
                            <MenuItemCard
                              name={item.name}
                              price={item.price}
                              description={item.description}
                              category={item.category}
                              preparationTime={item.preparationTime}
                              onAddToCart={() => handleAddToCart(item)}
                              index={idx}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Cart Section - Styled as Side Bento Card */}
            <div className="lg:col-span-4 sticky top-4">
              <div className="bg-white rounded-[40px] p-6 custom-shadow border-4 border-[#2d5a41]/5 min-h-[600px] flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">🛒</span>
                  <h2 className="text-2xl font-bold text-gray-800 bubbly-text">Active Cart</h2>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <CartSidebar
                    items={cartItems}
                    onRemove={handleRemoveFromCart}
                    onQuantityChange={handleQuantityChange}
                    onCheckout={handleCheckout}
                    isLoading={loading}
                    isEmbedded={true} // New prop to handle embedding styling
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Animation Layer */}
        {showOrderAnimation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[50px] p-10 custom-shadow max-w-md w-full text-center transform animate-bounce-custom">
              <OrderAnimation orderNumber={orderNumber} totalItems={cartItems.length} isVisible={showOrderAnimation} />
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

