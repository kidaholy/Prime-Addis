"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"
import { useSettings } from "@/context/settings-context"
import { Printer, Download, ArrowLeft, Package, TrendingUp, DollarSign, TrendingDown } from "lucide-react"
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
    const [filter, setFilter] = useState("week") // today, week, month, year
    const [stockItems, setStockItems] = useState<StockItem[]>([])
    const [periodData, setPeriodData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const { token } = useAuth()
    const { t } = useLanguage()
    const { settings } = useSettings()

    useEffect(() => {
        if (token) {
            fetchReportData()
        }
    }, [token, filter])

    const fetchReportData = async () => {
        setLoading(true)
        try {
            // 1. Fetch Current Stock for Valuation
            const stockRes = await fetch("/api/stock", {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (stockRes.ok) {
                const data = await stockRes.json()
                setStockItems(data)
            }

            // 2. Fetch Period Expenses & Consumption
            const salesRes = await fetch(`/api/reports/sales?period=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const usageRes = await fetch(`/api/reports/stock-usage?period=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (salesRes.ok && usageRes.ok) {
                const sales = await salesRes.json()
                const usage = await usageRes.json()
                setPeriodData({ sales, usage })
            }
        } catch (error) {
            console.error("Failed to fetch report data", error)
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

                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="flex gap-2 bg-white p-1.5 rounded-[20px] shadow-sm">
                                {["today", "week", "month", "year"].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-6 py-2 rounded-[15px] font-bold capitalize transition-all ${filter === f ? "bg-[#2d5a41] text-white shadow-md scale-105" : "text-gray-500 hover:bg-gray-50"
                                            }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 bg-white text-[#2d5a41] border-2 border-[#2d5a41]/10 px-6 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    <Printer size={20} />
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 bg-[#2d5a41] text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-transform shadow-lg shadow-[#2d5a41]/20"
                                >
                                    <Download size={20} />
                                </button>
                            </div>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            <div className="bg-[#2d5a41] rounded-[2.5rem] p-8 text-white shadow-lg shadow-[#2d5a41]/20 group relative overflow-hidden ring-4 ring-[#2d5a41]/10">
                                <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 group-hover:scale-110 transition-transform"><TrendingUp size={120} /></div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">{t("adminReports.estimatedMarketValue")}</p>
                                    <div className="text-3xl font-black mb-1 leading-tight">{(periodData?.sales?.summary?.totalRevenue || 0).toLocaleString()} <span className="text-xs">Br</span></div>
                                    <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">Total Orders (Sales Revenue)</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] p-8 text-[#1a1a1a] shadow-xl border border-gray-50 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><TrendingUp size={20} /></div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total Costs ({filter})</span>
                                    </div>
                                    <div className="text-2xl font-black mb-1 text-emerald-600 leading-tight">
                                        -{((periodData?.sales?.summary?.totalOtherExpenses || 0) + (periodData?.sales?.summary?.totalOxCost || 0)).toLocaleString()} <span className="text-[10px] font-bold opacity-50">ETB</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-loose">Period Expenses (Ox + Physical)</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] p-8 text-[#1a1a1a] shadow-xl border border-gray-50 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Package size={20} /></div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Stock Assets Value</span>
                                    </div>
                                    <div className="text-2xl font-black mb-1 text-slate-800 leading-tight">
                                        {totalNetWorth.toLocaleString()} <span className="text-[10px] font-bold opacity-30">ETB</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-loose">On-Hand Stock Assets</p>
                                </div>
                            </div>

                            <div className={`rounded-[2.5rem] p-8 shadow-xl border-2 flex flex-col justify-between transition-all ${(periodData?.sales?.summary?.totalRevenue - (periodData?.sales?.summary?.totalOtherExpenses + periodData?.sales?.summary?.totalOxCost)) >= 0
                                ? 'bg-[#2d5a41]/5 border-[#2d5a41]/10 text-[#2d5a41]'
                                : 'bg-red-50 border-red-100 text-red-600'
                                }`}>
                                <div>
                                    {/* Net Position Calculation */}
                                    {(() => {
                                        const oxStockValue = stockItems.filter(i => i.name.toLowerCase() === 'ox').reduce((acc, i) => acc + ((i.quantity ?? 0) * (i.unitCost ?? 0)), 0);
                                        const physicalStockValue = totalNetWorth - oxStockValue;
                                        const totalInvestment = (periodData?.sales?.summary?.totalOxCost || 0) + (periodData?.sales?.summary?.totalOtherExpenses || 0) + physicalStockValue;
                                        const netValue = (periodData?.sales?.summary?.totalRevenue || 0) - totalInvestment;

                                        return (
                                            <>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={`p-3 rounded-2xl ${netValue >= 0 ? 'bg-[#2d5a41] text-white' : 'bg-red-600 text-white'}`}>
                                                        <DollarSign size={20} />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Inventory Net ({filter})</span>
                                                </div>
                                                <div className="text-3xl font-black mb-1 leading-tight">
                                                    {netValue.toLocaleString()} <span className="text-xs font-bold opacity-60">Br</span>
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-widest leading-loose">Orders - (Diary + Physical Assets)</p>
                                            </>
                                        );
                                    })()}
                                </div>
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

                        {/* Tangible Acquisitions Summary */}
                        <div className="mb-12 bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-50">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <div className="w-1 h-6 bg-[#2d5a41] rounded-full"></div>
                                Tangible Acquisitions ({filter})
                            </h2>
                            <div className="flex flex-wrap gap-6">
                                {/* Ox Total */}
                                {((periodData?.sales?.dailyExpenses?.reduce((acc: number, d: any) => acc + (d.oxQuantity || 0), 0) || 0) > 0) && (
                                    <div className="flex items-center gap-4 bg-gray-50 px-6 py-4 rounded-3xl border border-gray-100">
                                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl font-black">🐂</div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Oxen Bought</p>
                                            <p className="text-xl font-black text-slate-800">
                                                {periodData?.sales?.dailyExpenses?.reduce((acc: number, d: any) => acc + (d.oxQuantity || 0), 0)}
                                                <span className="text-xs font-bold text-gray-400 ml-1">UNITS</span>
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Tangible Itemized Totals */}
                                {(() => {
                                    const tangibleTotals: { [name: string]: { qty: number, unit: string } } = {};
                                    periodData?.sales?.dailyExpenses?.forEach((day: any) => {
                                        day.items?.forEach((item: any) => {
                                            if (item.quantity > 0) {
                                                const key = item.name;
                                                if (!tangibleTotals[key]) tangibleTotals[key] = { qty: 0, unit: item.unit || 'pcs' };
                                                tangibleTotals[key].qty += item.quantity;
                                            }
                                        });
                                    });

                                    return Object.entries(tangibleTotals).map(([name, data], idx) => (
                                        <div key={idx} className="flex items-center gap-4 bg-gray-50 px-6 py-4 rounded-3xl border border-gray-100">
                                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl font-black">{name.charAt(0)}</div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{name}</p>
                                                <p className="text-xl font-black text-slate-800">
                                                    {data.qty.toLocaleString()}
                                                    <span className="text-xs font-bold text-gray-400 ml-1 uppercase">{data.unit}</span>
                                                </p>
                                            </div>
                                        </div>
                                    ));
                                })()}

                                {((periodData?.sales?.dailyExpenses?.length || 0) === 0 ||
                                    ((periodData?.sales?.dailyExpenses?.reduce((acc: number, d: any) => acc + (d.oxQuantity || 0) + (d.items?.length || 0), 0) || 0) === 0)) && (
                                        <p className="text-sm font-medium text-gray-400 py-4">No tangible stock acquired in this period.</p>
                                    )}
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
                                        <tr className="border-b-2 border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            <th className="pb-4 px-2">{t("adminReports.itemName")}</th>
                                            <th className="pb-4 px-2">{t("adminStock.category")}</th>
                                            <th className="pb-4 px-2 text-right">In ({filter})</th>
                                            <th className="pb-4 px-2 text-right">Out ({filter})</th>
                                            <th className="pb-4 px-2 text-right">On Hand</th>
                                            <th className="pb-4 px-2 text-right text-[#2d5a41]">{t("adminReports.totalValue")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {stockItems.map((item, idx) => {
                                            // Calculate per-item flow
                                            const purchased = periodData?.sales?.summary?.totalOtherExpenses ?
                                                periodData.sales.orders.reduce((acc: number, o: any) => acc, 0) : 0; // Simplified for now as DailyExpense items are harder to map globally

                                            // Match usage from consumption report
                                            const consumedItem = periodData?.usage?.usage?.flatMap((u: any) => u.items).find((i: any) => i.name === item.name);
                                            const totalValue = (item.quantity ?? 0) * (item.unitCost ?? 0);

                                            return (
                                                <tr key={idx} className="group hover:bg-gray-100/30 transition-colors">
                                                    <td className="py-5 px-2 font-bold text-slate-800">{item.name}</td>
                                                    <td className="py-5 px-2">
                                                        <span className="text-[9px] font-black px-3 py-1 bg-gray-100 rounded-full text-gray-400 uppercase">
                                                            {item.category}
                                                        </span>
                                                    </td>
                                                    <td className="py-5 px-2 text-right font-black text-emerald-500 text-xs text-nowrap">
                                                        {item.category === 'meat' && item.name.toLowerCase().includes('ox') ? (
                                                            <span>{(periodData?.sales?.dailyExpenses?.reduce((acc: number, d: any) => acc + (d.oxQuantity || 0), 0) || 0)} <span className="text-[10px] font-bold">Count</span></span>
                                                        ) : (
                                                            <span>
                                                                {periodData?.sales?.dailyExpenses?.reduce((acc: number, day: any) => {
                                                                    return acc + (day.items?.filter((di: any) => di.name.toLowerCase() === item.name.toLowerCase())
                                                                        .reduce((s: number, di: any) => s + (Number(di.quantity) || 0), 0) || 0)
                                                                }, 0).toLocaleString()} <span className="text-[10px] font-bold uppercase">{item.unit}</span>
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-5 px-2 text-right font-black text-red-400 text-xs">
                                                        {consumedItem ? consumedItem.quantity.toLocaleString() : 0} {item.unit}
                                                    </td>
                                                    <td className="py-5 px-2 text-right font-bold text-slate-500">
                                                        {item.quantity} <span className="text-[10px] uppercase opacity-50">{item.unit}</span>
                                                    </td>
                                                    <td className="py-5 px-2 text-right font-black text-slate-800">{totalValue.toLocaleString()} Br</td>
                                                </tr>
                                            );
                                        })}
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
