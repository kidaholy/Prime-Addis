"use client"

import Link from "next/link"
import Image from "next/image"
import { Fredoka } from "next/font/google"
import { ShoppingCart, ArrowRight, Star, TrendingUp, Clock } from "lucide-react"

const fredoka = Fredoka({ subsets: ["latin"] })

export default function WelcomePage() {
    return (
        <div className={`min-h-screen bg-[#e2e7d8] p-4 md:p-10 overflow-x-hidden ${fredoka.className}`}>
            <div className="max-w-7xl mx-auto">
                {/* Navbar */}
                <nav className="flex justify-between items-center mb-10 px-4 py-2 bg-white/50 backdrop-blur-md rounded-full custom-shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#f4a261] rounded-full flex items-center justify-center font-bold text-white text-2xl transition-transform duration-300 swirl-s select-none">P</div>
                        <span className="font-bold text-2xl tracking-tight text-[#1a1a1a]">PRIME ADDIS</span>
                    </div>
                    <div className="hidden md:flex gap-12 text-[#4a4a4a] font-medium text-lg">
                        <Link href="/dashboard" className="hover:text-black hover:scale-105 transition-all">Dashboard</Link>
                        <Link href="/menu" className="hover:text-black hover:scale-105 transition-all">Menu</Link>
                        <Link href="/inventory" className="hover:text-black hover:scale-105 transition-all">Inventory</Link>
                        <Link href="/staff" className="hover:text-black hover:scale-105 transition-all">Staff</Link>
                    </div>
                    <Link href="/login" className="bg-[#2d5a41] text-[#e2e7d8] px-7 py-3 rounded-full flex items-center gap-3 font-bold cursor-pointer relative hover:bg-black transition-colors bubbly-button">
                        LOGIN
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[11px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#e2e7d8] pulsate">!</span>
                    </Link>
                </nav>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* Hero Card - Replaced Cookie Stack with Coffee Stack Idea or just text */}
                    <div className="md:col-span-8 bg-[#f5bc6b] rounded-[60px] p-12 relative overflow-hidden flex flex-col justify-between min-h-[550px] custom-shadow card-hover-effect transition-all duration-300 group">
                        <h1 className="text-white text-[80px] md:text-[150px] lg:text-[180px] leading-[0.8] bubbly-text opacity-90 pointer-events-none uppercase absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sweet-bg-gradient select-none">
                            Coffee!
                        </h1>

                        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                            <div className="relative w-full h-full flex items-center justify-center">
                                <div className="relative w-[300px] md:w-[450px] h-[300px] md:h-[450px] group-hover:scale-110 transition-transform duration-700 ease-out">
                                    <Image
                                        src="/coffee.png"
                                        alt="Prime Coffee"
                                        fill
                                        className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                                        priority
                                    />
                                </div>

                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-[#2d5a41] text-white p-5 rounded-full border-[8px] border-[#f5bc6b] flex flex-col items-center custom-shadow bubbly-button pointer-events-auto scale-75 md:scale-100 hover:rotate-12 transition-transform">
                                    <span className="text-sm uppercase font-semibold">Start</span>
                                    <span className="text-3xl font-bold">Free</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-end gap-5 relative z-50">
                            <p className="text-[#4a3a2a] max-w-[200px] leading-tight text-base font-semibold bg-white/20 backdrop-blur-sm p-3 rounded-2xl border border-white/20">
                                Freshly roasted tech for your cafeteria.
                            </p>
                            <div className="flex items-center gap-4 bg-white/30 backdrop-blur-sm rounded-full px-6 py-3 border border-white/40 custom-shadow hover:scale-105 transition-transform duration-300 cursor-pointer">
                                <span className="text-white font-bold text-2xl tracking-tighter">4.9 ⭐</span>
                                <div className="flex -space-x-3">
                                    <div className="w-12 h-12 rounded-full bg-white/60 border-2 border-white shadow-sm hover:scale-110 transition-transform duration-200"></div>
                                    <div className="w-12 h-12 rounded-full bg-white/40 border-2 border-white shadow-sm hover:scale-110 transition-transform duration-200"></div>
                                    <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white shadow-sm hover:scale-110 transition-transform duration-200"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-4 flex flex-col gap-6">

                        {/* School -> System Card */}
                        <div className="bg-[#93c5fd] rounded-[60px] p-10 relative overflow-hidden min-h-[300px] flex flex-col justify-between custom-shadow card-hover-effect transition-all duration-300 group school-card">
                            <div>
                                <h2 className="text-5xl font-bold bubbly-text text-[#1e3a8a] mb-2">SYSTEM</h2>
                                <p className="text-[#1e3a8a]/80 text-base font-medium">Manage smart & deliciously</p>
                            </div>

                            <div className="flex items-center gap-4 relative z-10">
                                <Link href="/features" className="bg-black text-[#f5bc6b] px-9 py-3.5 rounded-full font-bold uppercase text-sm tracking-widest bubbly-button">
                                    Explore
                                </Link>
                                <div className="w-12 h-12 bg-[#f5bc6b] rounded-full flex items-center justify-center border-2 border-white text-3xl icon-bounce transition-transform duration-300 cursor-pointer">
                                    <span className="text-white">📊</span>
                                </div>
                            </div>

                            <div className="absolute -bottom-6 -right-6 w-48 h-56 bg-[#1e3a8a]/10 rounded-t-full flex items-end justify-center perspective-1000">
                                <span className="text-9xl mb-4 transform translateZ(0) chef-image grayscale opacity-50">👨‍💻</span>
                            </div>
                        </div>

                        {/* Everyday -> Daily Brew Card */}
                        <div className="bg-[#f28e50] rounded-[60px] p-10 relative flex flex-col justify-between min-h-[340px] overflow-hidden custom-shadow card-hover-effect transition-all duration-300 group everyday-card">
                            <h2 className="text-5xl font-bold bubbly-text text-[#2d1a12] uppercase leading-none relative z-10">Daily<br />Brew</h2>

                            <div className="flex justify-center relative my-4">
                                <div className="w-52 h-52 bg-white/20 blur-3xl absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                                <div className="relative z-10 w-40 h-40">
                                    <Image src="/coffee.png" alt="Coffee" fill className="object-contain drop-shadow-xl" />
                                    <div className="absolute -top-3 -right-8 bg-[#2d5a41] text-white px-5 py-2 rounded-full font-bold border-4 border-[#f28e50] shadow-xl bubbly-button">HOT</div>
                                </div>
                            </div>

                            <p className="text-[#2d1a12] text-base text-center font-medium leading-relaxed mt-auto relative z-10">
                                Serve perfection in every cup.<br />Consistent quality.
                            </p>
                        </div>
                    </div>

                    {/* Top Picks */}
                    <div className="md:col-span-12 bg-white rounded-[60px] p-12 flex flex-col md:flex-row items-center gap-16 custom-shadow card-hover-effect transition-all duration-300">
                        <div className="text-[64px] font-bold bubbly-text leading-[0.8] text-center md:text-left text-[#1a1a1a] flex-shrink-0">
                            TOP-5<br />SELLERS
                        </div>

                        <div className="flex-1 w-full space-y-7">
                            <div className="flex flex-col sm:flex-row items-center justify-between group cursor-pointer border-b border-gray-100 pb-5 hover:bg-gray-50 rounded-lg px-4 -mx-4 transition-all duration-200">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 icon-bounce overflow-hidden relative border-2 border-white shadow-sm">
                                        <Image src="https://images.unsplash.com/photo-1579306194872-64d3b7bac4c2?w=200&q=80" alt="Cake" fill className="object-cover" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xl text-[#1a1a1a]">Caramel Slice</h4>
                                        <p className="text-sm text-gray-500 font-medium">Sweet caramel with a chocolate top</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-10 mt-4 sm:mt-0">
                                    <span className="font-bold text-2xl text-[#1a1a1a]">ETB 120 <span className="text-[11px] text-gray-400 font-normal ml-1">each</span></span>
                                    <div className="bg-[#2d5a41] text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl hover:bg-black transition-colors bubbly-button">+</div>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center justify-between group cursor-pointer border-b border-gray-100 pb-5 hover:bg-gray-50 rounded-lg px-4 -mx-4 transition-all duration-200">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 icon-bounce overflow-hidden relative border-2 border-white shadow-sm">
                                        <Image src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&q=80" alt="Beans" fill className="object-cover" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xl text-[#1a1a1a]">Yirgacheffe Roast</h4>
                                        <p className="text-sm text-gray-500 font-medium">Light bun with smooth floral filling</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-10 mt-4 sm:mt-0">
                                    <span className="font-bold text-2xl text-[#1a1a1a]">ETB 85 <span className="text-[11px] text-gray-400 font-normal ml-1">each</span></span>
                                    <div className="bg-[#2d5a41] text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl hover:bg-black transition-colors bubbly-button">+</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
