"use client"

import { useState, useCallback } from "react"
import { useAuth } from "@/context/auth-context"
import { HeaderThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import Image from "next/image"
import type React from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError("")
      setLoading(true)

      try {
        await login(email, password)
      } catch (err: any) {
        setError(err.message || "Login failed")
        setLoading(false)
      }
    },
    [email, password, login],
  )



  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <HeaderThemeToggle />
      </div>

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1920&h=1080&fit=crop&crop=center')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-amber-900/60"></div>
      </div>

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10">
        <div className="flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
            <div>
              <h1 className="text-5xl font-bold brand-font">Prime Addis</h1>
              <p className="text-amber-300 text-lg">Coffee Management System</p>
            </div>
          </div>

          <div className="max-w-md text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Welcome Back</h2>
            <p className="text-gray-300 text-lg">
              Sign in to access your coffee shop management dashboard
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
            <div className="relative overflow-hidden rounded-2xl">
              <Image
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop"
                alt="Coffee Shop Management"
                width={400}
                height={300}
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-3 left-3">
                <p className="text-white text-sm font-semibold">Management System</p>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl">
              <Image
                src="https://i.pinimg.com/736x/aa/0d/fc/aa0dfc30734c2833c12974ab8cab3347.jpg"
                alt="Coffee Shop Operations"
                width={400}
                height={300}
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-3 left-3">
                <p className="text-white text-sm font-semibold">Operations Dashboard</p>
              </div>
            </div>
          </div>

          <div className="mt-12 space-y-4 w-full max-w-md">
            <FeatureItem text="Order Management" />
            <FeatureItem text="Menu & Pricing Control" />
            <FeatureItem text="Business Analytics" />
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-base sm:text-lg">P</span>
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-white brand-font">Prime Addis</span>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 border border-white/20" style={{ color: '#1f2937' }}>
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-sm sm:text-base text-gray-600">Sign in to access your dashboard</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm sm:text-base"
                  style={{ 
                    color: '#111827', 
                    backgroundColor: '#ffffff',
                    border: '1px solid #d1d5db',
                    outline: 'none'
                  }}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm sm:text-base"
                  style={{ 
                    color: '#111827', 
                    backgroundColor: '#ffffff',
                    border: '1px solid #d1d5db',
                    outline: 'none'
                  }}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:from-amber-600 hover:to-orange-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg text-sm sm:text-base"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>



            <div className="mt-8 text-center">
              <Link href="/" className="text-amber-600 hover:text-amber-700 font-medium text-sm transition-colors">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
      <span className="text-gray-200">{text}</span>
    </div>
  )
}
