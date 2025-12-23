"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Logo } from "@/components/logo"

export function BentoNavbar() {
    const pathname = usePathname()
    const { user, logout } = useAuth()

    const getLinkClass = (path: string) => {
        const base = "hover:text-black hover:scale-105 transition-all"
        return pathname === path ? `${base} text-black font-bold` : `${base} text-[#4a4a4a]`
    }

    // Role-specific links
    const adminLinks = [
        { label: "Overview", href: "/admin" },
        { label: "Menu", href: "/admin/menu" },
        { label: "Orders", href: "/admin/orders" },
        { label: "Users", href: "/admin/users" },
        { label: "Stock", href: "/admin/stock" },
        { label: "Reports", href: "/admin/reports" },
        { label: "Settings", href: "/admin/settings" }
    ]

    const cashierLinks = [
        { label: "POS", href: "/cashier" },
        { label: "Recent Orders", href: "/cashier/orders" },
        { label: "Summary", href: "/cashier/transactions" }
    ]

    const guestLinks = [
        { label: "Home", href: "/" },
        { label: "Browse Menu", href: "/menu" }
    ]

    const links = user?.role === "admin" ? adminLinks :
        user?.role === "cashier" ? cashierLinks :
            user?.role === "chef" ? [{ label: "Kitchen", href: "/chef" }] : guestLinks

    return (
        <nav className="flex justify-between items-center mb-10 px-6 py-3 bg-white/70 backdrop-blur-xl rounded-full custom-shadow border border-white/50">
            <Link href="/" className="flex items-center gap-3 group">
                <Logo size="md" showText={true} />
            </Link>

            <div className="hidden lg:flex gap-8 font-bold text-sm uppercase tracking-wider">
                {links.map(link => (
                    <Link key={link.href} href={link.href} className={getLinkClass(link.href)}>{link.label}</Link>
                ))}
            </div>

            <div className="flex items-center gap-4">
                {user ? (
                    <div className="flex items-center gap-4">
                        <span className="hidden md:block text-sm font-bold text-[#2d5a41]">Hi, {user.name}! ✨</span>
                        <button onClick={logout} className="bg-red-50 text-red-500 px-5 py-2.5 rounded-full text-xs font-bold hover:bg-red-500 hover:text-white transition-all transform active:scale-95">
                            LOGOUT
                        </button>
                    </div>
                ) : (
                    <Link href="/login" className="bg-[#2d5a41] text-[#e2e7d8] px-7 py-3 rounded-full flex items-center gap-3 font-bold cursor-pointer hover:bg-black transition-colors bubbly-button">
                        LOGIN
                    </Link>
                )}
            </div>
        </nav>
    )
}

export default BentoNavbar;
