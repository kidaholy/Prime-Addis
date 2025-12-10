"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"

export function SidebarNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const menuItems = {
    admin: [
      { label: "Dashboard", href: "/admin", icon: "📊" },
      { label: "Inventory", href: "/admin/inventory", icon: "📦" },
      { label: "Menu Items", href: "/admin/menu", icon: "🍽️" },
      { label: "Orders", href: "/admin/orders", icon: "📋" },
      { label: "Users", href: "/admin/users", icon: "👥" },
      { label: "Reports", href: "/admin/reports", icon: "📈" },
    ],
    cashier: [
      { label: "POS System", href: "/cashier", icon: "💳" },
      { label: "Menu", href: "/menu", icon: "🍴" },
      { label: "Orders", href: "/cashier/orders", icon: "📋" },
      { label: "Transactions", href: "/cashier/transactions", icon: "💰" },
    ],
    chef: [
      { label: "Kitchen Display", href: "/chef", icon: "👨‍🍳" },
      { label: "Order Queue", href: "/chef/orders", icon: "📋" },
    ],
  }

  const items = user ? menuItems[user.role as keyof typeof menuItems] : []

  return (
    <nav className="w-full md:w-64 bg-gradient-to-b from-primary via-primary/95 to-primary text-foreground md:min-h-screen md:fixed md:left-0 md:top-0 border-r border-border md:shadow-xl">
      <div className="p-6 border-b border-border/50 flex items-center justify-between md:flex-col md:gap-6">
        <Link
          href={user?.role === "admin" ? "/admin" : user?.role === "cashier" ? "/cashier" : "/chef"}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="text-2xl">☕</span>
          <div>
            <h1 className="text-lg font-bold brand-font text-foreground">Prime Addis</h1>
            <p className="text-xs text-muted-foreground">Coffee Management</p>
          </div>
        </Link>

        <button
          onClick={() => logout()}
          className="text-xs px-2 py-1 rounded bg-danger/20 text-danger hover:bg-danger/30 transition-colors md:hidden"
        >
          Logout
        </button>
      </div>

      <div className="p-4 hidden md:block">
        <ul className="space-y-2">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-accent text-accent-foreground shadow-lg font-semibold"
                      : "text-foreground hover:bg-primary/50"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Logout Button */}
        <button
          onClick={() => logout()}
          className="w-full mt-8 px-4 py-3 bg-danger/20 text-danger rounded-lg hover:bg-danger/30 transition-all font-semibold flex items-center justify-center gap-2"
        >
          <span>🚪</span>
          Logout
        </button>
      </div>
    </nav>
  )
}
