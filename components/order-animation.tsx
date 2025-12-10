"use client"

import { useState, useEffect } from "react"

interface OrderAnimationProps {
  orderNumber: string
  totalItems: number
  isVisible: boolean
}

export function OrderAnimation({ orderNumber, totalItems, isVisible }: OrderAnimationProps) {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    if (!isVisible) {
      setStage(0)
      return
    }

    const timings = [0, 800, 1600, 2400]
    const timers = timings.map((delay, index) => setTimeout(() => setStage(index + 1), delay))

    return () => timers.forEach(clearTimeout)
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-slide-in-down" />

      <div className="relative bg-card border-2 border-accent rounded-2xl p-8 text-center shadow-2xl animate-slide-in-down max-w-md mx-4">
        {/* Stage 1: Order Confirmation */}
        {stage >= 1 && (
          <div className="animate-slide-in-up">
            <div className="text-7xl mb-4 animate-bounce-gentle">✓</div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Order Confirmed!</h2>
            <p className="text-2xl text-accent font-bold">Order #{orderNumber}</p>
          </div>
        )}

        {/* Stage 2: Items Count */}
        {stage >= 2 && (
          <div className="mt-6 p-4 bg-accent/10 rounded-lg animate-slide-in-up border border-accent/30">
            <p className="text-lg font-semibold text-foreground">
              {totalItems} {totalItems === 1 ? "item" : "items"} in your order
            </p>
          </div>
        )}

        {/* Stage 3: Chef Animation */}
        {stage >= 3 && (
          <div className="mt-6 animate-slide-in-up">
            <div className="text-6xl animate-bounce-gentle mb-3">👨‍🍳</div>
            <p className="text-foreground font-semibold text-lg">Chef is preparing</p>
            <p className="text-sm text-muted-foreground mt-2">Your items will be ready soon</p>
          </div>
        )}

        {/* Stage 4: Completion */}
        {stage >= 4 && (
          <div className="mt-6 animate-slide-in-up">
            <div className="inline-block px-4 py-2 bg-success/20 text-success rounded-full font-bold text-sm border border-success/50">
              Check the kitchen display
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
