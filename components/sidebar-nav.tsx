"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { SidebarThemeToggle } from "@/components/theme-toggle"

export function SidebarNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const menuItems = {
    admin: [
      { label: "Dashboard", href: "/admin", icon: "📊" },
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
    <nav className="w-full md:w-64 bg-sidebar text-sidebar-foreground md:min-h-screen md:fixed md:left-0 md:top-0 border-r border-sidebar-border md:shadow-xl">
      <div className="p-6 border-b border-sidebar-border/50 flex items-center justify-between md:flex-col md:gap-6">
        <Link
          href={user?.role === "admin" ? "/admin" : user?.role === "cashier" ? "/cashier" : "/chef"}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="text-2xl">☕</span>
          <div>
            <h1 className="text-lg font-bold brand-font text-sidebar-foreground">Prime Addis</h1>
            <p className="text-xs text-sidebar-foreground/70">Coffee Management</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <SidebarThemeToggle />
          <button
            onClick={() => logout()}
            className="text-xs px-2 py-1 rounded bg-danger/20 text-danger hover:bg-danger/30 transition-colors md:hidden"
          >
            Logout
          </button>
        </div>
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
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg font-semibold"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Theme Toggle & Logout */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-sm text-sidebar-foreground/70">Theme</span>
            <SidebarThemeToggle />
          </div>
          
          <button
            onClick={() => logout()}
            className="w-full px-4 py-3 bg-danger/20 text-danger rounded-lg hover:bg-danger/30 transition-all font-semibold flex items-center justify-center gap-2"
          >
            <span>🚪</span>
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
