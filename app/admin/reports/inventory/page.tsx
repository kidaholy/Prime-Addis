"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"
import { useSettings } from "@/context/settings-context"
import { Printer, Download, ArrowLeft, Package, TrendingUp, DollarSign } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

interface StockItem {
    _id: string
    name: string
    category: string
    quantity: number
    unit: string
    unitCost: number
}

export default function InventoryReportPage() {
    const [stockItems, setStockItems] = useState<StockItem[]>([])
    const [loading, setLoading] = useState(true)
    const { token } = useAuth()
    const { t } = useLanguage()
    const { settings } = useSettings()

    useEffect(() => {
        if (token) {
            fetchStockData()
        }
    }, [token])

    const fetchStockData = async () => {
        try {
            const response = await fetch("/api/stock", {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setStockItems(data)
            }
        } catch (error) {
            console.error("Failed to fetch stock data", error)
        } finally {
            setLoading(false)
        }
    }

    const totalNetWorth = stockItems.reduce((acc, item) => acc + ((item.quantity ?? 0) * (item.unitCost ?? 0)), 0)

    const categories = Array.from(new Set(stockItems.map(item => item.category)))
    const categorySummary = categories.map(cat => {
        const items = stockItems.filter(i => i.category === cat)
        const value = items.reduce((acc, item) => acc + ((item.quantity ?? 0) * (item.unitCost ?? 0)), 0)
        return { name: cat, value, count: items.length }
    }).sort((a, b) => b.value - a.value)

    const handlePrint = () => {
        window.print()
    }

    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    return (
        <ProtectedRoute requiredRoles={["admin"]}>
            <div className="min-h-screen bg-[#f8faf7] p-4 md:p-8 font-sans text-slate-800 print:bg-white print:p-0">
                <div className="max-w-6xl mx-auto">
                    {/* Header - Hidden on Print */}
                    <div className="flex justify-between items-center mb-8 print:hidden">
                        <Link
                            href="/admin"
                            className="flex items-center gap-2 text-[#2d5a41] font-bold hover:scale-105 transition-transform"
                        >
                            <ArrowLeft size={20} /> {t("adminReports.backToDashboard")}
                        </Link>

                        <div className="flex gap-4">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 bg-white text-[#2d5a41] border-2 border-[#2d5a41]/10 px-6 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                <Printer size={20} /> {t("adminReports.printReport")}
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 bg-[#2d5a41] text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-transform shadow-lg shadow-[#2d5a41]/20"
                            >
                                <Download size={20} /> {t("adminReports.saveAsPdf")}
                            </button>
                        </div>
                    </div>

                    {/* Report Paper */}
                    <div id="report-content" className="bg-white rounded-[40px] p-8 md:p-12 shadow-xl border border-gray-100 print:shadow-none print:border-none print:p-0">
                        {/* Report Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-gray-100 pb-8 mb-8">
                            <div>
                                <div className="flex items-center gap-2 text-[#2d5a41] mb-2">
                                    <Package className="w-8 h-8" />
                                    <span className="text-xl font-black uppercase tracking-widest bubbly-text">{settings.app_name}</span>
                                </div>
                                <h1 className="text-4xl font-black text-slate-900">{t("adminReports.inventoryNetWorth")}</h1>
                                <p className="text-gray-500 font-medium mt-1 uppercase tracking-wider text-sm">{t("adminReports.financialValuationReport")}</p>
                            </div>
                            <div className="text-right mt-4 md:mt-0">
                                <p className="text-sm font-bold text-gray-400 uppercase">{t("adminReports.dateGenerated")}</p>
                                <p className="text-lg font-bold text-[#2d5a41]">{today}</p>
                                <p className="text-xs text-gray-400 font-medium mt-1 italic">{t("adminReports.systemGeneratedReport")}</p>
                            </div>
                        </div>

                        {/* Summary Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <div className="bg-[#2d5a41] rounded-3xl p-6 text-white shadow-lg shadow-[#2d5a41]/20">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-white/20 rounded-xl"><TrendingUp size={24} /></div>
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-70">{t("adminReports.totalValuation")}</span>
                                </div>
                                <div className="text-4xl font-black mb-1">{totalNetWorth.toLocaleString()} {t("common.currencyBr")}</div>
                                <div className="text-sm opacity-80 font-medium">{t("adminReports.estimatedMarketValue")}</div>
                            </div>

                            <div className="bg-[#f5bc6b] rounded-3xl p-6 text-[#1a1a1a] shadow-lg shadow-[#f5bc6b]/20">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-black/10 rounded-xl"><Package size={24} /></div>
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-60">{t("adminReports.totalItems")}</span>
                                </div>
                                <div className="text-4xl font-black mb-1">{stockItems.length}</div>
                                <div className="text-sm opacity-70 font-medium">{t("adminReports.uniqueStockSkus")}</div>
                            </div>

                            <div className="bg-blue-500 rounded-3xl p-6 text-white shadow-lg shadow-blue-500/20">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-white/20 rounded-xl"><DollarSign size={24} /></div>
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-70">{t("adminReports.topCategory")}</span>
                                </div>
                                <div className="text-4xl font-black mb-1 truncate">{categorySummary[0]?.name || "N/A"}</div>
                                <div className="text-sm opacity-80 font-medium">{t("adminReports.highestAssetValue")}</div>
                            </div>
                        </div>

                        {/* Category Breakdown */}
                        <div className="mb-12">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <div className="w-1 h-6 bg-[#2d5a41] rounded-full"></div>
                                {t("adminReports.categoricalAssetAnalysis")}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {categorySummary.map((cat, idx) => (
                                    <div key={idx} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 group hover:border-[#2d5a41]/30 transition-colors">
                                        <p className="text-xs font-bold text-gray-400 uppercase truncate mb-1">{cat.name}</p>
                                        <p className="text-xl font-black text-slate-800">{cat.value.toLocaleString()} {t("common.currencyBr")}</p>
                                        <div className="mt-2 w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#2d5a41] transition-all duration-1000"
                                                style={{ width: `${(cat.value / totalNetWorth) * 100}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">{cat.count} {t("adminReports.totalItems")} ({((cat.value / totalNetWorth) * 100).toFixed(1)}%)</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Detailed Table */}
                        <div>
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <div className="w-1 h-6 bg-[#2d5a41] rounded-full"></div>
                                {t("adminReports.itemizedValuationList")}
                            </h2>
                            <div className="w-full overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b-2 border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                            <th className="pb-4 px-2">{t("adminReports.itemName")}</th>
                                            <th className="pb-4 px-2">{t("adminStock.category")}</th>
                                            <th className="pb-4 px-2 text-right">{t("adminStock.currentQuantity")}</th>
                                            <th className="pb-4 px-2 text-right">{t("adminStock.unitCost")}</th>
                                            <th className="pb-4 px-2 text-right text-[#2d5a41]">{t("adminReports.totalValue")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {stockItems.map((item, idx) => (
                                            <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4 px-2 font-bold text-slate-700">{item.name}</td>
                                                <td className="py-4 px-2">
                                                    <span className="text-xs font-bold px-3 py-1 bg-gray-100 rounded-full text-gray-500 uppercase">
                                                        {item.category}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-2 text-right font-medium text-gray-500">{item.quantity} {item.unit}</td>
                                                <td className="py-4 px-2 text-right font-medium text-gray-500">{(item.unitCost ?? 0).toLocaleString()} {t("common.currencyBr")}</td>
                                                <td className="py-4 px-2 text-right font-black text-slate-800">{((item.quantity ?? 0) * (item.unitCost ?? 0)).toLocaleString()} {t("common.currencyBr")}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-slate-900">
                                            <td colSpan={4} className="py-6 text-right font-black text-slate-400 uppercase tracking-widest text-xs">{t("adminReports.totalEstimatedAssetValue")}</td>
                                            <td className="py-6 text-right font-black text-2xl text-[#2d5a41]">{totalNetWorth.toLocaleString()} {t("common.currencyBr")}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-16 pt-8 border-t border-gray-100 text-center text-gray-400 text-xs font-semibold uppercase tracking-[0.2em] print:mt-8">
                            {t("adminReports.confidentialBusinessReport")} &copy; {new Date().getFullYear()} {settings.app_name}
                        </div>
                    </div>
                </div>

                <style jsx global>{`
          @media print {
            body { 
              background: white !important;
              color: black !important;
            }
            .print\\:hidden { display: none !important; }
            .bg-\\[#f8faf7\\] { background: white !important; }
            #report-content { 
              border: none !important; 
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            @page {
              margin: 2cm;
            }
          }
        `}</style>
            </div>
        </ProtectedRoute>
    )
}
