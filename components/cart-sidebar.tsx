"use client"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface CartSidebarProps {
  items: CartItem[]
  onRemove: (id: string) => void
  onQuantityChange: (id: string, quantity: number) => void
  onCheckout: () => void
  isLoading?: boolean
}

export function CartSidebar({ items, onRemove, onQuantityChange, onCheckout, isLoading = false }: CartSidebarProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.08
  const total = subtotal + tax

  return (
    <div className="w-full md:w-80 bg-card border-l border-border flex flex-col md:h-screen md:sticky md:right-0 md:top-0 shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-border bg-primary/10">
        <h2 className="text-xl font-bold text-foreground">Order Cart</h2>
        <p className="text-sm text-muted-foreground">{items.length} items</p>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2">🛒</div>
            <p>No items in cart</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id}
              className="bg-primary/10 rounded-lg p-3 flex gap-3 border border-border/50 hover:border-accent/50 transition-all animate-slide-in-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-foreground">{item.name}</h3>
                <p className="text-xs text-muted-foreground">{item.price} Br</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onQuantityChange(item.id, Math.max(1, item.quantity - 1))}
                  className="w-6 h-6 bg-primary/20 rounded text-center text-sm hover:bg-accent text-foreground hover:text-accent-foreground transition-all"
                >
                  −
                </button>
                <span className="w-6 text-center font-semibold text-foreground">{item.quantity}</span>
                <button
                  onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                  className="w-6 h-6 bg-primary/20 rounded text-center text-sm hover:bg-accent text-foreground hover:text-accent-foreground transition-all"
                >
                  +
                </button>
                <button
                  onClick={() => onRemove(item.id)}
                  className="ml-2 text-xs text-danger hover:opacity-70 transition-opacity"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="p-4 border-t border-border space-y-3 bg-primary/5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal:</span>
          <span className="font-semibold text-foreground">{subtotal.toFixed(2)} Br</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax (8%):</span>
          <span className="font-semibold text-foreground">{tax.toFixed(2)} Br</span>
        </div>
        <div className="border-t border-border pt-3 flex justify-between">
          <span className="font-bold text-foreground">Total:</span>
          <span className="text-2xl font-bold text-accent">{total.toFixed(2)} Br</span>
        </div>
        <button
          onClick={onCheckout}
          disabled={items.length === 0 || isLoading}
          className="w-full bg-accent text-accent-foreground font-bold py-3 rounded-lg hover:opacity-90 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⏳</span>
              Processing...
            </>
          ) : (
            <>
              <span>🚀</span>
              Send to Kitchen
            </>
          )}
        </button>
      </div>
    </div>
  )
}
