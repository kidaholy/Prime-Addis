"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"
import { BusinessMetricsDashboard } from "@/components/business-metrics-dashboard"
import { useBusinessMetrics, useRealtimeMetrics, MetricsUtils } from "@/hooks/use-business-metrics"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  AlertTriangle,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Clock,
  Target
} from 'lucide-react'

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
  const [activeTab, setActiveTab] = useState<'overview' | 'realtime' | 'analytics'>('overview')
  const { token } = useAuth()
  const { t } = useLanguage()
  
  // Use comprehensive business metrics
  const { metrics, loading, error, refresh, lastUpdated } = useBusinessMetrics({
    period: 'today',
    autoRefresh: true,
    refreshInterval: 30000
  })

  // Real-time metrics for live updates
  const { realTimeMetrics } = useRealtimeMetrics()

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
      <div className="min-h-screen bg-white p-4 font-sans text-slate-800">
        <div className="max-w-7xl mx-auto">
          <BentoNavbar />

          {/* Header Section */}
          <div className="bg-[#8B4513] rounded-[40px] p-8 mb-6 custom-shadow relative overflow-hidden group text-white">
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold mb-2 bubbly-text">{t("adminDashboard.title")}</h1>
                <p className="opacity-90 font-medium">{t("adminDashboard.subtitle")}</p>
                {lastUpdated && (
                  <p className="text-sm opacity-75 mt-2">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={refresh} 
                  variant="outline" 
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] w-48 h-48 bg-[#D2691E] rounded-full opacity-20 group-hover:scale-125 transition-transform duration-500"></div>
          </div>

          {/* Real-time Metrics Overview */}
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <MetricCard 
                icon={<DollarSign className="h-6 w-6" />}
                label="Today's Revenue"
                value={MetricsUtils.formatCurrency(metrics.realTimeMetrics.todayRevenue)}
                growth={metrics.salesAnalytics.revenueGrowth.daily}
                color="brown"
              />
              <MetricCard 
                icon={<ShoppingCart className="h-6 w-6" />}
                label="Orders"
                value={metrics.realTimeMetrics.todayOrders.toString()}
                subtext={`${metrics.realTimeMetrics.activeOrders} active`}
                color="orange"
              />
              <MetricCard 
                icon={<Target className="h-6 w-6" />}
                label="Completion Rate"
                value={`${metrics.realTimeMetrics.completionRate.toFixed(1)}%`}
                color="white"
              />
              <MetricCard 
                icon={<BarChart3 className="h-6 w-6" />}
                label="Avg Order"
                value={MetricsUtils.formatCurrency(metrics.realTimeMetrics.averageOrderValue)}
                color="white"
              />
              <MetricCard 
                icon={<TrendingUp className="h-6 w-6" />}
                label="Net Profit"
                value={MetricsUtils.formatCurrency(metrics.financialOverview.netProfit)}
                subtext={`${metrics.financialOverview.profitMargin.toFixed(1)}% margin`}
                color="brown"
              />
              <MetricCard 
                icon={<Package className="h-6 w-6" />}
                label="Stock Alerts"
                value={metrics.inventoryInsights.lowStockAlerts.length.toString()}
                color={metrics.inventoryInsights.lowStockAlerts.length > 0 ? "orange" : "white"}
                href="/admin/reports/stock"
              />
            </div>
          )}

          {/* Main Dashboard Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="realtime" className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4" />
                <span>Real-time</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <PieChartIcon className="h-4 w-4" />
                <span>Analytics</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              {metrics && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Sales & Operations */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Top Selling Items */}
                    <Card className="rounded-[30px] custom-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5 text-[#8B4513]" />
                          <span>Top Selling Items</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {metrics.salesAnalytics.topSellingItems.slice(0, 5).map((item, index) => (
                            <div key={item.name} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50">
                              <div className="flex items-center space-x-3">
                                <Badge variant="outline" className="w-8 h-8 p-0 flex items-center justify-center bg-[#8B4513] text-white">
                                  {index + 1}
                                </Badge>
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-sm text-gray-500">{item.category}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-[#8B4513]">{MetricsUtils.formatCurrency(item.revenue)}</p>
                                <p className="text-sm text-gray-500">{item.quantity} sold</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Order Status Distribution */}
                    <Card className="rounded-[30px] custom-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Clock className="h-5 w-5 text-[#D2691E]" />
                          <span>Order Status</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(metrics.operationalMetrics.orderStatusDistribution).map(([status, count]) => (
                            <div key={status} className="text-center p-4 rounded-2xl bg-gray-50">
                              <div className="text-2xl font-bold text-[#8B4513]">{count}</div>
                              <div className="text-sm font-medium capitalize text-gray-600">{status}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - Alerts & Quick Actions */}
                  <div className="space-y-6">
                    {/* Stock Alerts */}
                    <Card className="rounded-[30px] custom-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            <span>Stock Alerts</span>
                          </div>
                          {metrics.inventoryInsights.lowStockAlerts.length > 0 && (
                            <Badge variant="destructive">
                              {metrics.inventoryInsights.lowStockAlerts.length}
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {metrics.inventoryInsights.lowStockAlerts.length === 0 ? (
                          <div className="text-center py-6">
                            <div className="text-4xl mb-2">✅</div>
                            <p className="text-gray-500">All stock levels healthy</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {metrics.inventoryInsights.lowStockAlerts.slice(0, 3).map((alert, index) => (
                              <div key={index} className="p-3 bg-red-50 rounded-2xl border border-red-200">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium text-red-800">{alert.name}</p>
                                    <p className="text-sm text-red-600">
                                      {alert.current} {alert.unit} remaining
                                    </p>
                                  </div>
                                  <Badge variant={alert.urgency === 'critical' ? 'destructive' : 'secondary'}>
                                    {alert.urgency}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                            {metrics.inventoryInsights.lowStockAlerts.length > 3 && (
                              <Link href="/admin/reports/stock" className="block text-center p-2 text-[#8B4513] hover:underline">
                                View all {metrics.inventoryInsights.lowStockAlerts.length} alerts
                              </Link>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="rounded-[30px] custom-shadow">
                      <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Link href="/admin/reports/orders" className="block p-4 rounded-2xl border border-[#8B4513] bg-[#8B4513]/10 text-[#1a1a1a] hover:scale-[1.02] transition-transform">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-sm">📊 View Detailed Reports</p>
                              <p className="text-xs opacity-70">Sales, orders, and analytics</p>
                            </div>
                            <span className="text-xl">→</span>
                          </div>
                        </Link>
                        <Link href="/admin/stock" className="block p-4 rounded-2xl border border-[#D2691E] bg-[#D2691E]/10 text-[#1a1a1a] hover:scale-[1.02] transition-transform">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-sm">📦 Manage Inventory</p>
                              <p className="text-xs opacity-70">Update stock levels</p>
                            </div>
                            <span className="text-xl">→</span>
                          </div>
                        </Link>
                        <Link href="/admin/menu" className="block p-4 rounded-2xl border border-[#CD853F] bg-[#CD853F]/10 text-[#1a1a1a] hover:scale-[1.02] transition-transform">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-sm">🍽️ Update Menu</p>
                              <p className="text-xs opacity-70">Add or modify items</p>
                            </div>
                            <span className="text-xl">→</span>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>

                    {/* Financial Summary */}
                    <Card className="rounded-[30px] custom-shadow bg-gradient-to-br from-[#8B4513] to-[#D2691E] text-white">
                      <CardHeader>
                        <CardTitle className="text-white">Today's Financial Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="opacity-90">Gross Revenue:</span>
                            <span className="font-bold">{MetricsUtils.formatCurrency(metrics.financialOverview.grossRevenue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="opacity-90">Total Expenses:</span>
                            <span className="font-bold">{MetricsUtils.formatCurrency(metrics.financialOverview.totalExpenses)}</span>
                          </div>
                          <div className="border-t border-white/20 pt-3">
                            <div className="flex justify-between text-lg">
                              <span>Net Profit:</span>
                              <span className="font-bold">{MetricsUtils.formatCurrency(metrics.financialOverview.netProfit)}</span>
                            </div>
                            <div className="text-sm opacity-75 text-right">
                              {metrics.financialOverview.profitMargin.toFixed(1)}% margin
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="realtime" className="mt-6">
              <BusinessMetricsDashboard variant="realtime" />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <BusinessMetricsDashboard variant="full" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}

function MetricCard({ 
  icon, 
  label, 
  value, 
  growth, 
  subtext, 
  color, 
  href 
}: { 
  icon: React.ReactNode
  label: string
  value: string
  growth?: number
  subtext?: string
  color: 'white' | 'brown' | 'orange'
  href?: string
}) {
  const styles = {
    white: "bg-white text-[#1a1a1a] border border-gray-200",
    brown: "bg-[#8B4513] text-white",
    orange: "bg-[#D2691E] text-white"
  }

  const content = (
    <div className={`rounded-[30px] p-4 custom-shadow flex flex-col justify-between h-32 ${styles[color]} transition-all hover:scale-105 cursor-pointer`}>
      <div className="flex items-center justify-between">
        <div className="text-2xl opacity-80">{icon}</div>
        {growth !== undefined && (
          <div className={`flex items-center text-xs font-bold ${growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {growth >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {MetricsUtils.formatPercentage(growth)}
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-end">
        <div className="mb-1">
          <div className="text-2xl font-bold leading-none truncate">{value}</div>
          {subtext && <div className="text-xs font-medium opacity-70 mt-1">{subtext}</div>}
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xs uppercase font-bold tracking-wide opacity-70 truncate flex-1">
            {label}
          </p>
          {href && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full ml-1 flex-shrink-0">View</span>}
        </div>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
