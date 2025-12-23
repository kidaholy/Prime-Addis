"use client"

import Link from "next/link"
import Image from "next/image"
import { Fredoka } from "next/font/google"
import { ShoppingCart, ArrowRight, Star, TrendingUp, Clock } from "lucide-react"
import { Logo } from "@/components/logo"
import { useSettings } from "@/context/settings-context"

const fredoka = Fredoka({ subsets: ["latin"] })

import { useLanguage } from "@/context/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"

export default function WelcomePage() {
    const { settings } = useSettings()
    const { t } = useLanguage()

    return (
        <div className={`min-h-screen bg-[#e2e7d8] p-4 md:p-10 overflow-x-hidden ${fredoka.className}`}>
            <div className="max-w-7xl mx-auto">
                {/* Navbar */}
                <nav className="flex justify-between items-center mb-10 px-4 py-2 bg-white/50 backdrop-blur-md rounded-full custom-shadow">
                    <Link href="/" className="flex items-center gap-3 group">
                        <Logo size="md" showText={true} textColor="text-[#1a1a1a]" />
                    </Link>
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <Link href="/login" className="bg-[#2d5a41] text-[#e2e7d8] px-7 py-3 rounded-full flex items-center gap-3 font-bold cursor-pointer hover:bg-black transition-colors bubbly-button">
                            {t("common.login")}
                        </Link>
                    </div>
                </nav>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* Hero Card */}
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
                                    <span className="text-sm uppercase font-semibold">{t("common.start")}</span>
                                    <span className="text-3xl font-bold">{t("common.free")}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-end gap-5 relative z-50">
                            <p className="text-[#4a3a2a] max-w-[200px] leading-tight text-base font-semibold bg-white/20 backdrop-blur-sm p-3 rounded-2xl border border-white/20">
                                {t("hero.tagline")}
                            </p>
                        </div>
                    </div>

                    <div className="md:col-span-4 flex flex-col gap-6">

                        {/* System Card */}
                        <div className="bg-[#93c5fd] rounded-[60px] p-10 relative overflow-hidden min-h-[300px] flex flex-col justify-between custom-shadow card-hover-effect transition-all duration-300 group school-card">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-5xl font-bold bubbly-text text-[#1e3a8a] mb-2">{t("hero.system")}</h2>
                                    <p className="text-[#1e3a8a]/80 text-base font-medium">{t("hero.manageSmart")}</p>
                                </div>
                                <div className="relative w-28 h-28 hidden sm:block group-hover:scale-110 transition-transform duration-500">
                                    <Image src="/cup.png" alt="System Icon" fill className="object-contain drop-shadow-xl" />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 relative z-10">
                                <Link href="/features" className="bg-black text-[#f5bc6b] px-9 py-3.5 rounded-full font-bold uppercase text-sm tracking-widest bubbly-button">
                                    {t("common.explore")}
                                </Link>
                            </div>
                        </div>

                        {/* Daily Brew Card */}
                        <div className="bg-[#f28e50] rounded-[60px] p-10 relative flex flex-col justify-between min-h-[340px] overflow-hidden custom-shadow card-hover-effect transition-all duration-300 group everyday-card">
                            <h2 className="text-5xl font-bold bubbly-text text-[#2d1a12] uppercase leading-none relative z-10">
                                {t("hero.dailyBrew").split(' ').map((word, i) => (
                                    <span key={i}>{word}{i === 0 && <br />}</span>
                                ))}
                            </h2>

                            <div className="flex justify-center relative my-4">
                                <div className="w-52 h-52 bg-white/20 blur-3xl absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                                <div className="relative z-10 w-40 h-40">
                                    <Image src="/coffee.png" alt="Coffee" fill className="object-contain drop-shadow-xl" />
                                    <div className="absolute -top-3 -right-8 bg-[#2d5a41] text-white px-5 py-2 rounded-full font-bold border-4 border-[#f28e50] shadow-xl bubbly-button">
                                        {t("common.hot")}
                                    </div>
                                </div>
                            </div>

                            <p className="text-[#2d1a12] text-base text-center font-medium leading-relaxed mt-auto relative z-10">
                                {t("hero.servePerfection")}<br />{t("hero.consistentQuality")}
                            </p>
                        </div>
                    </div>

                    {/* Welcome Message */}
                    <div className="md:col-span-12 bg-white rounded-[60px] p-12 flex flex-col items-center gap-8 custom-shadow card-hover-effect transition-all duration-300">
                        <div className="text-center">
                            <h2 className="text-4xl md:text-6xl font-bold bubbly-text text-[#1a1a1a] mb-4">
                                {t("common.welcome")} {settings.app_name} {t("common.welcomeSuffix")}
                            </h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                {t("hero.description")}
                            </p>
                        </div>
                        <Link href="/login" className="bg-[#2d5a41] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-black transition-colors bubbly-button">
                            {t("common.getStarted")}
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    )
}
