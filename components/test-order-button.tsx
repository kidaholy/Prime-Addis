"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { AnimatedButton } from "./animated-button"

export function TestOrderButton() {
  const [loading, setLoading] = useState(false)
  const { token } = useAuth()

  const createTestOrder = async () => {
    if (!token) {
      alert("❌ No authentication token found")
      return
    }

    setLoading(true)
    console.log("🧪 Creating test order...")
    
    try {
      const orderData = {
        items: [
          {
            menuItemId: "test-item-1",
            name: "Test Cappuccino",
            quantity: 2,
            price: 110,
          },
          {
            menuItemId: "test-item-2", 
            name: "Test Burger",
            quantity: 1,
            price: 450,
          }
        ],
        totalAmount: 670,
        paymentMethod: "cash",
        customerName: "Test Customer",
      }

      console.log("📤 Sending order data:", orderData)

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      })

      console.log("📥 Response status:", response.status)

      if (response.ok) {
        const order = await response.json()
        console.log("✅ Order created successfully:", order)
        alert(`✅ Test order created successfully!\n\nOrder #${order.orderNumber}\nTotal: ${order.totalAmount} Br\nStatus: ${order.status}`)
      } else {
        const errorData = await response.json()
        console.error("❌ Order creation failed:", errorData)
        alert(`❌ Failed to create test order\n\nError: ${errorData.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error("❌ Test order error:", error)
      alert(`❌ Error creating test order\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatedButton
      onClick={createTestOrder}
      disabled={loading}
      variant="rainbow"
      size="sm"
    >
      {loading ? "Creating..." : "🧪 Test Order"}
    </AnimatedButton>
  )
}