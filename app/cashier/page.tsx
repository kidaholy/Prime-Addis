"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
import { CartSidebar } from "@/components/cart-sidebar"
import { MenuItemCard } from "@/components/menu-item-card"
import { OrderAnimation } from "@/components/order-animation"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"
import { ConfirmationCard, NotificationCard } from "@/components/confirmation-card"
import { useConfirmation } from "@/hooks/use-confirmation"
import { ShoppingCart, RefreshCw, X } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"

interface MenuItem {
  _id: string
  menuId?: string
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
  const [menuLoading, setMenuLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState("")
  const [showOrderAnimation, setShowOrderAnimation] = useState(false)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [waiterBatchNumber, setWaiterBatchNumber] = useState("")
  const [tableNumber, setTableNumber] = useState("")
  const [showMobileCart, setShowMobileCart] = useState(false)
  const { token, user } = useAuth()
  const { t } = useLanguage()
  const { confirmationState, confirm, closeConfirmation, notificationState, notify, closeNotification } = useConfirmation()

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

    if (!waiterBatchNumber || !tableNumber) {
      notify({
        title: "Missing Information",
        message: "Please enter both Waiter Batch Number and Table Number.",
        type: "info"
      })
      return
    }

    setIsCheckoutLoading(true)
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
          waiterBatchNumber,
          tableNumber
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setOrderNumber(data.orderNumber)
        setShowOrderAnimation(true)

        localStorage.setItem('newOrderCreated', Date.now().toString())

        setTimeout(() => {
          setCartItems([])
          setTableNumber("")
          setShowOrderAnimation(false)
        }, 4000)
      } else {
        const errorData = await response.json()
        notify({
          title: "Order Failed",
          message: errorData.message || "Failed to create the order. Please try again.",
          type: "error"
        })
      }
    } catch (err) {
      notify({
        title: "Error",
        message: "Failed to create order. Please check your connection and try again.",
        type: "error"
      })
    } finally {
      setIsCheckoutLoading(false)
    }
  }

  const categories = ["all", ...new Set(menuItems.map((item) => item.category))]
  const filteredItems =
    categoryFilter === "all" ? menuItems : menuItems.filter((item) => item.category === categoryFilter)

  return (
    <ProtectedRoute requiredRoles={["cashier"]}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <BentoNavbar />

          {/* Header */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <ShoppingCart className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">POS System</h1>
                  <p className="text-sm text-gray-600 mt-1">Welcome, {user?.name}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Cart Items</div>
                <div className="text-2xl font-bold text-blue-600">{cartItems.length}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Menu Area */}
            <div className="lg:col-span-8 space-y-6">
              {/* Category Filter */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${categoryFilter === cat
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                      {cat === "all" ? "All Items" : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Grid */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 min-h-[600px]">
                {menuLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <RefreshCw className="h-12 w-12 animate-spin text-gray-400 mb-4" />
                    <p className="text-gray-600">Loading menu...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-red-600 mb-2">Failed to Load Menu</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4 opacity-30">🍽️</div>
                    <h2 className="text-xl font-medium text-gray-400">No items found</h2>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredItems.map((item, idx) => (
                      <div key={item._id} className="transform transition-transform hover:scale-[1.02]">
                        <MenuItemCard
                          name={item.name}
                          price={item.price}
                          description={item.description}
                          image={item.image}
                          category={item.category}
                          preparationTime={item.preparationTime}
                          menuId={item.menuId}
                          onAddToCart={() => handleAddToCart(item)}
                          index={idx}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cart Sidebar - Desktop */}
            <div className="hidden lg:block lg:col-span-4 sticky top-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 min-h-[600px]">
                <div className="flex items-center gap-3 mb-6">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Active Cart</h2>
                </div>
                <CartSidebar
                  items={cartItems}
                  onRemove={handleRemoveFromCart}
                  onQuantityChange={handleQuantityChange}
                  onCheckout={handleCheckout}
                  isLoading={isCheckoutLoading}
                  isEmbedded={true}
                  waiterBatchNumber={waiterBatchNumber}
                  setWaiterBatchNumber={setWaiterBatchNumber}
                  tableNumber={tableNumber}
                  setTableNumber={setTableNumber}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Floating Cart Button - Mobile Only */}
        <div className="lg:hidden fixed bottom-6 right-6 z-40">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowMobileCart(true)}
            className="bg-[#2d5a41] text-white p-4 rounded-full shadow-2xl relative flex items-center justify-center"
          >
            <ShoppingCart size={24} />
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white">
                {cartItems.length}
              </span>
            )}
          </motion.button>
        </div>

        {/* Mobile Cart Drawer */}
        <AnimatePresence>
          {showMobileCart && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMobileCart(false)}
                className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="lg:hidden fixed inset-y-0 right-0 w-full md:w-[400px] bg-white z-[101] shadow-2xl flex flex-col"
              >
                <div className="p-6 border-b flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="text-[#2d5a41]" />
                    <h2 className="text-xl font-bold">Your Order</h2>
                  </div>
                  <button
                    onClick={() => setShowMobileCart(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden p-6">
                  <CartSidebar
                    items={cartItems}
                    onRemove={handleRemoveFromCart}
                    onQuantityChange={handleQuantityChange}
                    onCheckout={handleCheckout}
                    onClose={() => setShowMobileCart(false)}
                    isLoading={isCheckoutLoading}
                    isEmbedded={true}
                    waiterBatchNumber={waiterBatchNumber}
                    setWaiterBatchNumber={setWaiterBatchNumber}
                    tableNumber={tableNumber}
                    setTableNumber={setTableNumber}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Order Animation */}
        {showOrderAnimation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-10 shadow-2xl max-w-md w-full">
              <OrderAnimation orderNumber={orderNumber} totalItems={cartItems.length} isVisible={showOrderAnimation} />
            </div>
          </div>
        )}

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
