import type React from "react"
import type { Metadata } from "next"
import { Fredoka } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/context/auth-context"
import { ThemeProvider } from "@/context/theme-context"
import { SettingsProvider } from "@/context/settings-context"
import { NotificationCenter } from "@/components/notification-center"

const fredoka = Fredoka({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Prime Addis Coffee - Management System",
  description: "Coffee Shop Management System - Inventory, POS, and Kitchen Management",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fredoka.className} antialiased bg-[#e2e7d8] overflow-x-hidden`} suppressHydrationWarning>
        <ThemeProvider>
          <SettingsProvider>
            <AuthProvider>
              <NotificationCenter />
              {children}
            </AuthProvider>
          </SettingsProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
