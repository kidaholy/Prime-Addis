"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ParticleSystem } from "@/components/particle-system"
import { AnimatedWelcome } from "@/components/animated-welcome"

export default function WelcomePage() {
  const [mounted, setMounted] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  if (showWelcome) {
    return (
      <AnimatedWelcome
        title="☕ Prime Addis"
        subtitle="Premium Coffee Management System"
        onComplete={() => setShowWelcome(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleSystem />
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">☕</span>
            <span className="text-2xl font-bold text-accent brand-font">Prime Addis</span>
          </div>
          <Link
            href="/login"
            className="bg-accent text-accent-foreground px-6 py-2 rounded-full font-semibold hover:opacity-90 transition-all"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-primary via-primary/80 to-primary flex items-center overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-96 h-96 bg-accent rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/50 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-16 max-w-7xl w-full mx-auto px-6 items-center">
          <div className="text-left">
            <span className="text-accent text-sm font-semibold tracking-widest uppercase">
              Premium Ethiopian Coffee
            </span>
            <h1 className="text-6xl md:text-7xl font-bold text-foreground mt-4 mb-6 leading-tight brand-font">
              Exceptional coffee, perfectly managed
            </h1>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed max-w-md">
              Experience the finest Ethiopian coffee with our complete management system for coffee shops. From
              inventory to kitchen operations—everything in one place.
            </p>
            <Link
              href="/login"
              className="inline-block bg-accent text-accent-foreground px-8 py-3 rounded-full text-lg font-bold hover:opacity-90 transition-all transform hover:scale-105 shadow-2xl"
            >
              Get Started
            </Link>
          </div>

          <div className="relative">
            <div className="relative h-96 bg-gradient-to-br from-primary/50 to-primary/30 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
              <img
                src="/premium-coffee-cup-latte-cappuccino.jpg"
                alt="Premium coffee"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
              <FeatureIcon icon="☕" label="Fresh Brew" />
              <FeatureIcon icon="🌱" label="Organic" />
              <FeatureIcon icon="⚡" label="Fast Service" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-foreground mb-4 brand-font">Our Services</h2>
            <p className="text-xl text-muted-foreground">Complete coffee shop management solution</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <ServiceCard
              icon="💳"
              title="POS System"
              description="Fast and efficient point of sale for seamless transactions"
            />
            <ServiceCard
              icon="👨‍🍳"
              title="Kitchen Display"
              description="Real-time order management for your kitchen staff"
            />
            <ServiceCard
              icon="📊"
              title="Admin Dashboard"
              description="Complete control over inventory, menu, and operations"
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl font-bold text-foreground mb-6 brand-font">Premium Coffee Management</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Prime Addis Coffee brings you a comprehensive management system designed specifically for coffee shops.
                From inventory tracking to kitchen operations, we've got everything you need.
              </p>
              <div className="space-y-4">
                <Feature text="Real-time inventory tracking" />
                <Feature text="Advanced order management" />
                <Feature text="User role management" />
                <Feature text="Kitchen order automation" />
              </div>
            </div>
            <div className="relative h-96 bg-gradient-to-br from-accent/20 to-primary/20 rounded-3xl shadow-2xl flex items-center justify-center border border-accent/30">
              <div className="text-9xl animate-bounce-gentle">☕</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-primary border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <StatCard number="🚀" label="Fast & Reliable" />
            <StatCard number="📊" label="Real-time Analytics" />
            <StatCard number="🔒" label="Secure & Private" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-card border-t border-border">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold text-foreground mb-6 brand-font">Ready to Transform Your Coffee Shop?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Experience the future of coffee shop management with Prime Addis
          </p>
          <Link
            href="/login"
            className="inline-block bg-accent text-accent-foreground px-12 py-4 rounded-full text-xl font-bold hover:opacity-90 transition-all transform hover:scale-105 shadow-2xl"
          >
            Start Now →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-muted-foreground">© 2025 Prime Addis Coffee. Premium Management System.</p>
        </div>
      </footer>
    </div>
  )
}

function ServiceCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="card-base hover-lift hover-glow animate-slide-in-up group cursor-pointer">
      <div className="text-6xl mb-4 animate-float group-hover:animate-wiggle">{icon}</div>
      <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:animate-neon-flicker">{title}</h3>
      <p className="text-muted-foreground group-hover:text-accent transition-colors">{description}</p>
    </div>
  )
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="text-foreground">{text}</span>
    </div>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="animate-bounce-in hover-lift">
      <div className="text-5xl font-bold mb-2 text-accent animate-heartbeat">{number}</div>
      <div className="text-xl text-foreground">{label}</div>
    </div>
  )
}

function FeatureIcon({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="bg-primary/50 rounded-lg p-4 border border-accent/20 hover:border-accent transition-all hover-lift hover-glow animate-zoom-in-out">
      <div className="text-3xl mb-2 animate-float">{icon}</div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
