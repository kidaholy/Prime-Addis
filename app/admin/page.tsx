"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"
import { useBusinessMetrics, MetricsUtils } from "@/hooks/use-business-metrics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Printer
} from 'lucide-react'
import { PrinterSetup } from "@/components/printer-setup"
import { RevenueChart, OrdersChart, CategoryChart, TrendsChart } from "@/components/simple-chart"

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  totalCustomers: number
  lowStockItems: number
  pendingOrders: number
  completedOrders: number
  averageOrderValue: number
  inventoryValue: number
}

export default function AdminDashboardPage() {
  const { token } = useAuth()
  const { t } = useLanguage()
  const [showPrinterSetup, setShowPrinterSetup] = useState(false)
  
  // Force light theme always
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
  }, [])
  
  // Use basic business metrics
  const { metrics, loading, error, refresh, lastUpdated } = useBusinessMetrics({
    period: 'today',
    autoRefresh: true,
    refreshInterval: 60000 // Refresh every minute
  })

  if (loading && !metrics) {
    return (
      <ProtectedRoute requiredRoles={["admin"]}>
        <div className="min-h-screen bg-white p-4 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-8 w-8 animate-spin text-[#8B4513]" />
            <div className="text-2xl font-bold text-[#8B4513]">Loading Business Metrics...</div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute requiredRoles={["admin"]}>
        <div className="min-h-screen bg-white p-4 flex items-center justify-center">
          <Card className="border-red-200 max-w-md">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Metrics</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={refresh} className="bg-[#8B4513] hover:bg-[#D2691E]">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="min-h-screen bg-white p-4 font-sans text-gray-800">
        <div className="max-w-6xl mx-auto">
          <BentoNavbar />

          {/* Simple Header */}
          <div className="bg-white border-2 border-[#8B4513] rounded-3xl p-6 mb-6 shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-[#8B4513] mb-2">{t("adminDashboard.title")}</h1>
                <p className="text-gray-600">{t("adminDashboard.subtitle")}</p>
                {lastUpdated && (
                  <p className="text-sm text-gray-500 mt-2">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => setShowPrinterSetup(true)}
                  variant="outline"
                  className="border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513] hover:text-white"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Kitchen Printers
                </Button>
                <Button 
                  onClick={refresh} 
                  className="bg-[#8B4513] hover:bg-[#D2691E] text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Performance Overview Chart */}
          {metrics && (
            <div className="mb-6">
              <Card className="border-2 border-[#8B4513]">
                <CardHeader>
                  <CardTitle className="text-[#8B4513] flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Today's Performance Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Revenue Progress */}
                    <div className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-2">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-200"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-[#8B4513]"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            strokeDasharray={`${Math.min(100, (metrics.realTimeMetrics.todayRevenue / 1000) * 100)}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-[#8B4513]">
                            {Math.min(100, Math.round((metrics.realTimeMetrics.todayRevenue / 1000) * 100))}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-gray-600">Revenue Goal</p>
                      <p className="text-sm font-bold text-[#8B4513]">
                        {MetricsUtils.formatCurrency(metrics.realTimeMetrics.todayRevenue)}
                      </p>
                    </div>

                    {/* Orders Progress */}
                    <div className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-2">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-200"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-[#D2691E]"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            strokeDasharray={`${Math.min(100, (metrics.realTimeMetrics.todayOrders / 50) * 100)}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-[#D2691E]">
                            {Math.min(100, Math.round((metrics.realTimeMetrics.todayOrders / 50) * 100))}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-gray-600">Orders Goal</p>
                      <p className="text-sm font-bold text-[#D2691E]">
                        {metrics.realTimeMetrics.todayOrders} orders
                      </p>
                    </div>

                    {/* Completion Rate */}
                    <div className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-2">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-200"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-green-500"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            strokeDasharray={`${metrics.realTimeMetrics.completionRate}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-green-500">
                            {Math.round(metrics.realTimeMetrics.completionRate)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-gray-600">Completion</p>
                      <p className="text-sm font-bold text-green-500">
                        {metrics.operationalMetrics.customerSatisfaction.completedOrders} completed
                      </p>
                    </div>

                    {/* Active Orders */}
                    <div className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-2">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl font-bold text-[#8B4513]">
                            {metrics.realTimeMetrics.activeOrders}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-gray-600">Active Orders</p>
                      <p className="text-sm font-bold text-[#8B4513]">
                        In progress
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Simple Metrics Cards */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <SimpleMetricCard 
                icon={<DollarSign className="h-8 w-8 text-white" />}
                label="Today's Revenue"
                value={MetricsUtils.formatCurrency(metrics.realTimeMetrics.todayRevenue)}
                variant="brown"
              />
              <SimpleMetricCard 
                icon={<ShoppingCart className="h-8 w-8 text-[#8B4513]" />}
                label="Total Orders"
                value={metrics.realTimeMetrics.todayOrders.toString()}
                variant="white"
              />
              <SimpleMetricCard 
                icon={<BarChart3 className="h-8 w-8 text-white" />}
                label="Average Order"
                value={MetricsUtils.formatCurrency(metrics.realTimeMetrics.averageOrderValue)}
                variant="brown"
              />
              <SimpleMetricCard 
                icon={<Package className="h-8 w-8 text-[#8B4513]" />}
                label="Stock Alerts"
                value={metrics.inventoryInsights.lowStockAlerts.length.toString()}
                variant="white"
                isAlert={metrics.inventoryInsights.lowStockAlerts.length > 0}
              />
            </div>
          )}

          {/* Main Chart - Revenue Overview */}
          {metrics && (
            <div className="mb-6">
              <RevenueChart 
                hourlyData={metrics.realTimeMetrics.hourlyRevenue} 
                className="w-full"
              />
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Link href="/admin/reports/orders" className="block">
              <Card className="border-2 border-[#8B4513] bg-[#8B4513] hover:bg-[#D2691E] transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="h-12 w-12 text-white mx-auto mb-3" />
                  <h3 className="font-bold text-lg text-white mb-2">View Reports</h3>
                  <p className="text-white/90 text-sm">Sales, orders, and analytics</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/stock" className="block">
              <Card className="border-2 border-[#8B4513] bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Package className="h-12 w-12 text-[#8B4513] mx-auto mb-3" />
                  <h3 className="font-bold text-lg text-[#8B4513] mb-2">Manage Stock</h3>
                  <p className="text-[#8B4513]/80 text-sm">Update inventory levels</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/menu" className="block">
              <Card className="border-2 border-[#8B4513] bg-[#8B4513] hover:bg-[#D2691E] transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <ShoppingCart className="h-12 w-12 text-white mx-auto mb-3" />
                  <h3 className="font-bold text-lg text-white mb-2">Update Menu</h3>
                  <p className="text-white/90 text-sm">Add or modify items</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Stock Alerts (if any) */}
          {metrics && metrics.inventoryInsights.lowStockAlerts.length > 0 && (
            <Card className="border-2 border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Stock Alerts ({metrics.inventoryInsights.lowStockAlerts.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.inventoryInsights.lowStockAlerts.slice(0, 5).map((alert, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border border-red-200">
                      <div>
                        <p className="font-medium text-red-800">{alert.name}</p>
                        <p className="text-sm text-red-600">{alert.current} {alert.unit} remaining</p>
                      </div>
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
                        {alert.urgency}
                      </span>
                    </div>
                  ))}
                  {metrics.inventoryInsights.lowStockAlerts.length > 5 && (
                    <Link href="/admin/reports/stock" className="block text-center p-2 text-red-600 hover:underline">
                      View all {metrics.inventoryInsights.lowStockAlerts.length} alerts
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Printer Setup Modal */}
        {showPrinterSetup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <PrinterSetup onClose={() => setShowPrinterSetup(false)} />
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

function SimpleMetricCard({ 
  icon, 
  label, 
  value, 
  variant = "white",
  isAlert = false 
}: { 
  icon: React.ReactNode
  label: string
  value: string
  variant?: "brown" | "white"
  isAlert?: boolean
}) {
  // Alert styling overrides variant
  if (isAlert) {
    return (
      <Card className="border-2 border-red-200 bg-red-50 hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            {icon}
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-800 mb-1">{value}</div>
          <div className="text-sm text-red-600 font-medium">{label}</div>
        </CardContent>
      </Card>
    )
  }

  // Brown variant
  if (variant === "brown") {
    return (
      <Card className="border-2 border-[#8B4513] bg-[#8B4513] hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            {icon}
          </div>
          <div className="text-2xl font-bold text-white mb-1">{value}</div>
          <div className="text-sm text-white/90 font-medium">{label}</div>
        </CardContent>
      </Card>
    )
  }

  // White variant (default)
  return (
    <Card className="border-2 border-[#8B4513] bg-white hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          {icon}
        </div>
        <div className="text-2xl font-bold text-[#8B4513] mb-1">{value}</div>
        <div className="text-sm text-[#8B4513]/80 font-medium">{label}</div>
      </CardContent>
    </Card>
  )
}
