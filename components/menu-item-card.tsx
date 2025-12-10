"use client"

interface MenuItemCardProps {
  name: string
  price: number
  description?: string
  image?: string
  category: string
  preparationTime?: number
  onAddToCart: () => void
  isSelected?: boolean
  index?: number
}

export function MenuItemCard({
  name,
  price,
  description,
  category,
  preparationTime,
  onAddToCart,
  isSelected = false,
  index = 0,
}: MenuItemCardProps) {
  const getCategoryEmoji = (cat: string) => {
    const emojiMap: Record<string, string> = {
      "Hot Coffee": "☕",
      "Iced & Cold Coffee": "🧊",
      Breakfast: "🥞",
      Salad: "🥗",
      Burgers: "🍔",
      Wraps: "🌯",
      Sandwiches: "🥪",
      "Ethiopian Taste": "🍽️",
    }
    return emojiMap[cat] || "🍴"
  }

  return (
    <div
      className={`group card-base hover:shadow-2xl transition-all transform hover:-translate-y-2 cursor-pointer animate-slide-in-up overflow-hidden border-2 ${
        isSelected ? "border-accent shadow-lg shadow-accent/50" : "border-border"
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Item Image Placeholder */}
      <div className="relative w-full h-40 bg-gradient-to-br from-accent/20 to-primary/20 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
        <div className="text-6xl">{getCategoryEmoji(category)}</div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="mb-3">
        <div className="inline-block px-2 py-1 bg-accent/20 text-accent text-xs rounded font-semibold mb-2">
          {category}
        </div>
        <h3 className="text-lg font-bold text-foreground">{name}</h3>
      </div>

      {description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{description}</p>}

      <div className="flex justify-between items-center mb-4">
        <div className="text-2xl font-bold text-accent">{price} Br</div>
        {preparationTime && (
          <div className="flex items-center gap-1 text-xs bg-primary/20 text-foreground px-2 py-1 rounded-full">
            <span>⏱</span> {preparationTime}m
          </div>
        )}
      </div>

      <button
        onClick={onAddToCart}
        className={`w-full py-3 rounded-lg font-bold transition-all ${
          isSelected
            ? "bg-accent/30 text-accent border-2 border-accent animate-pulse-glow"
            : "bg-accent text-accent-foreground hover:opacity-90 transform hover:scale-105"
        }`}
      >
        {isSelected ? "✓ Added to Order!" : "Add to Order"}
      </button>
    </div>
  )
}
