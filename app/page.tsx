"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import Image from "next/image"

export default function WelcomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Images */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-orange-800/10 to-yellow-900/20"></div>
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1920&h=1080&fit=crop&crop=center')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/40"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-2xl font-bold text-white brand-font">Prime Addis</span>
          </div>
          <Link
            href="/login"
            className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-3 rounded-full font-semibold hover:from-amber-600 hover:to-orange-700 transition-all transform hover:scale-105 shadow-lg"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-left">
            <div className="inline-block bg-gradient-to-r from-amber-500/20 to-orange-600/20 backdrop-blur-sm border border-amber-500/30 rounded-full px-6 py-2 mb-6">
              <span className="text-amber-300 text-sm font-semibold tracking-widest uppercase">
                Premium Ethiopian Coffee Experience
              </span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight brand-font">
              Exceptional Coffee,
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500"> Perfectly Managed</span>
            </h1>
            <p className="text-gray-200 text-xl mb-8 leading-relaxed max-w-lg">
              Experience the finest Ethiopian coffee culture with our comprehensive management system. 
              From menu to kitchen operations—everything seamlessly integrated.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/login"
                className="inline-block bg-gradient-to-r from-amber-500 to-orange-600 text-white px-10 py-4 rounded-full text-lg font-bold hover:from-amber-600 hover:to-orange-700 transition-all transform hover:scale-105 shadow-2xl text-center"
              >
                Explore Our System
              </Link>
              <Link
                href="/menu"
                className="inline-block bg-white/10 backdrop-blur-sm text-white border border-white/20 px-10 py-4 rounded-full text-lg font-semibold hover:bg-white/20 transition-all text-center"
              >
                View Menu
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-orange-600/20 rounded-3xl blur-2xl"></div>
              <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop&crop=faces"
                  alt="Ethiopian Coffee Ceremony"
                  width={600}
                  height={400}
                  className="w-full h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="text-white text-2xl font-bold mb-2">Authentic Ethiopian Coffee</h3>
                  <p className="text-gray-200">Traditional ceremony meets modern management</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
              <FeatureCard title="Fresh Roasted" subtitle="Daily" />
              <FeatureCard title="100% Organic" subtitle="Certified" />
              <FeatureCard title="Fast Service" subtitle="< 5 mins" />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="relative py-20 bg-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-4 brand-font">Our Management System</h2>
            <p className="text-xl text-gray-300">Complete coffee shop solution in one platform</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <ServiceCard
              title="Point of Sale"
              description="Lightning-fast checkout system with real-time order processing"
              image="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop"
            />
            <ServiceCard
              title="Chef Dashboard"
              description="Streamlined order flow from counter to kitchen with live updates"
              image="https://i.pinimg.com/736x/aa/0d/fc/aa0dfc30734c2833c12974ab8cab3347.jpg"
            />
            <ServiceCard
              title="Menu Control"
              description="Dynamic menu management with pricing and availability controls"
              image="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop"
            />
          </div>
        </div>
      </section>

      {/* Coffee Gallery Section */}
      <section className="relative py-20">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920&h=1080&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/80"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl font-bold text-white mb-6 brand-font">Ethiopian Coffee Heritage</h2>
              <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                Prime Addis brings you authentic Ethiopian coffee culture with modern management technology. 
                Experience the birthplace of coffee through our carefully curated menu and efficient operations.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <Feature text="Traditional Recipes" />
                <Feature text="Modern Technology" />
                <Feature text="Expert Baristas" />
                <Feature text="Premium Beans" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=400&fit=crop&crop=faces"
                    alt="Ethiopian Coffee Ceremony"
                    width={300}
                    height={400}
                    className="w-full h-48 object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="relative overflow-hidden rounded-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop&crop=faces"
                    alt="Ethiopian Coffee Culture"
                    width={300}
                    height={300}
                    className="w-full h-32 object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="relative overflow-hidden rounded-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=300&h=300&fit=crop"
                    alt="Ethiopian Coffee Beans"
                    width={300}
                    height={300}
                    className="w-full h-32 object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="relative overflow-hidden rounded-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=400&fit=crop"
                    alt="Traditional Coffee Preparation"
                    width={300}
                    height={400}
                    className="w-full h-48 object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative py-20 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold text-white mb-6 brand-font">Ready to Experience Prime Addis?</h2>
          <p className="text-xl text-white/90 mb-8">
            Join us in revolutionizing coffee shop management with Ethiopian authenticity
          </p>
          <Link
            href="/login"
            className="inline-block bg-white text-orange-600 px-12 py-4 rounded-full text-xl font-bold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl"
          >
            Start Your Journey
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-black/60 backdrop-blur-sm border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-2xl font-bold text-white brand-font">Prime Addis</span>
            </div>
            <p className="text-gray-400">© 2025 Prime Addis Coffee. Authentic Ethiopian Coffee Experience.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ServiceCard({ title, description, image }: { title: string; description: string; image: string }) {
  return (
    <div className="group cursor-pointer">
      <div className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:border-amber-500/50 transition-all duration-300 hover:transform hover:scale-105">
        <div className="relative h-48 overflow-hidden">
          <Image
            src={image}
            alt={title}
            width={400}
            height={300}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>
        <div className="p-6">
          <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-amber-300 transition-colors">{title}</h3>
          <p className="text-gray-300 group-hover:text-white transition-colors">{description}</p>
        </div>
      </div>
    </div>
  )
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 group">
      <div className="w-3 h-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform"></div>
      <span className="text-gray-200 group-hover:text-white transition-colors">{text}</span>
    </div>
  )
}

function FeatureCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-amber-500/50 transition-all hover:transform hover:scale-105">
      <div className="text-center">
        <div className="text-2xl font-bold text-white mb-1">{title}</div>
        <div className="text-sm text-amber-300">{subtitle}</div>
      </div>
    </div>
  )
}
