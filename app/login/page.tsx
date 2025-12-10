"use client"

import { useState, useCallback } from "react"
import { useAuth } from "@/context/auth-context"
import Link from "next/link"
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

  const handleDemoLogin = useCallback(
    async (demoEmail: string, demoPassword: string) => {
      setError("")
      setLoading(true)

      try {
        await login(demoEmail, demoPassword)
      } catch (err: any) {
        setError(err.message || "Login failed")
        setLoading(false)
      }
    },
    [login],
  )

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-accent rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-foreground">
          <div className="text-9xl mb-8 animate-bounce-gentle">☕</div>
          <h1 className="text-6xl font-bold mb-4 brand-font text-center">Prime Addis Coffee</h1>
          <p className="text-xl text-muted-foreground text-center max-w-md">
            Your complete coffee shop management solution
          </p>

          <div className="mt-16 space-y-6 w-full max-w-md">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Real-time Management</h3>
                <p className="text-muted-foreground text-sm">Track orders, inventory, and sales in real-time</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Easy to Use</h3>
                <p className="text-muted-foreground text-sm">Intuitive interface for all team members</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Secure & Reliable</h3>
                <p className="text-muted-foreground text-sm">Enterprise-grade security for your business</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="text-5xl">☕</div>
              <span className="text-3xl font-bold text-foreground brand-font">Prime Addis</span>
            </div>
          </div>

          <div className="bg-card rounded-3xl shadow-2xl p-8 md:p-10 border border-border">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Welcome</h2>
              <p className="text-muted-foreground">Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
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

            <form onSubmit={handleSubmit} className="space-y-5 mb-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-accent-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground font-medium">Or continue with</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleDemoLogin("kidayos2014@gmail.com", "123456")}
                disabled={loading}
                className="w-full px-4 py-3 bg-gradient-to-r from-primary/70 to-primary text-foreground rounded-xl hover:from-primary hover:to-primary/70 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2 border border-border"
              >
                <span className="text-xl">👤</span>
                {loading ? "..." : "Admin Account"}
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("cashier@cafeteria.com", "password")}
                disabled={loading}
                className="w-full px-4 py-3 bg-success/10 text-success rounded-xl hover:bg-success/20 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2 border-2 border-success/30"
              >
                <span className="text-xl">💳</span>
                {loading ? "..." : "Cashier Account"}
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("chef@cafeteria.com", "password")}
                disabled={loading}
                className="w-full px-4 py-3 bg-warning/10 text-warning rounded-xl hover:bg-warning/20 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2 border-2 border-warning/30"
              >
                <span className="text-xl">👨‍🍳</span>
                {loading ? "..." : "Chef Account"}
              </button>
            </div>

            <div className="mt-8 text-center">
              <Link href="/" className="text-accent hover:opacity-80 font-medium text-sm">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
