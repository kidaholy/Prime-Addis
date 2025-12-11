"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarNav } from "@/components/sidebar-nav"
import { AuthHeader } from "@/components/auth-header"
import { useAuth } from "@/context/auth-context"

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("week")
  const [orders, setOrders] = useState<any[]>([])
  const { token } = useAuth()

  useEffect(() => {
    fetchReportData()
  }, [token, timeRange])

  const fetchReportData = async () => {
    try {
      const response = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (err) {
      console.error("Failed to load report data")
    }
  }

  // Filter orders based on selected time range
  const getFilteredOrders = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt)
      
      switch (timeRange) {
        case "today":
          // Only orders from today (same date)
          const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate())
          return orderDay.getTime() === today.getTime()
          
        case "week":
          // Orders from current week (Monday to Sunday)
          const startOfWeek = new Date(today)
          const dayOfWeek = today.getDay()
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Handle Sunday as 0
          startOfWeek.setDate(today.getDate() + mondayOffset)
          
          const endOfWeek = new Date(startOfWeek)
          endOfWeek.setDate(startOfWeek.getDate() + 6)
          endOfWeek.setHours(23, 59, 59, 999)
          
          return orderDate >= startOfWeek && orderDate <= endOfWeek
          
        case "month":
          // Orders from current month
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
          
          return orderDate >= startOfMonth && orderDate <= endOfMonth
          
        default:
          return true
      }
    })
  }

  const filteredOrders = getFilteredOrders()
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0)
  const completedOrders = filteredOrders.filter((o) => o.status === "completed").length
  const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0

  // Export functions
  const exportToCSV = () => {
    const csvHeaders = [
      'Order Number',
      'Date',
      'Status', 
      'Total Amount',
      'Payment Method',
      'Items Count'
    ]
    
    const csvData = filteredOrders.map(order => [
      order.orderNumber,
      new Date(order.createdAt).toLocaleDateString(),
      order.status,
      order.totalAmount.toFixed(2),
      order.paymentMethod || 'cash',
      order.items?.length || 0
    ])
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `prime-addis-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prime Addis Coffee - ${timeRange.toUpperCase()} Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
          .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .status-pending { color: #f59e0b; }
          .status-preparing { color: #3b82f6; }
          .status-ready { color: #10b981; }
          .status-completed { color: #059669; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Prime Addis Coffee Management</h1>
          <h2>${timeRange.toUpperCase()} Report</h2>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="stats">
          <div class="stat-card">
            <h3>Total Revenue</h3>
            <div class="stat-value">${totalRevenue.toFixed(2)} Br</div>
          </div>
          <div class="stat-card">
            <h3>Completed Orders</h3>
            <div class="stat-value">${completedOrders}</div>
          </div>
          <div class="stat-card">
            <h3>Total Orders</h3>
            <div class="stat-value">${orders.length}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Date</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Items</th>
            </tr>
          </thead>
          <tbody>
            ${filteredOrders.map(order => `
              <tr>
                <td>${order.orderNumber}</td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td class="status-${order.status}">${order.status}</td>
                <td>${order.totalAmount.toFixed(2)} Br</td>
                <td>${order.paymentMethod || 'cash'}</td>
                <td>${order.items?.length || 0}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `
    
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    
    // Auto-save as PDF (browser will show save dialog)
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  const printReport = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prime Addis Coffee - ${timeRange.toUpperCase()} Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
          .stat-card { border: 2px solid #000; padding: 15px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; }
          @media print { 
            body { margin: 0; } 
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Prime Addis Coffee Management</h1>
          <h2>${timeRange.toUpperCase()} Report</h2>
          <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
        
        <div class="stats">
          <div class="stat-card">
            <h3>Total Revenue</h3>
            <div class="stat-value">${totalRevenue.toFixed(2)} Br</div>
            <p>+12% from last period</p>
          </div>
          <div class="stat-card">
            <h3>Completed Orders</h3>
            <div class="stat-value">${completedOrders}</div>
            <p>Avg: ${averageOrderValue.toFixed(2)} Br per order</p>
          </div>
          <div class="stat-card">
            <h3>Total Orders</h3>
            <div class="stat-value">${filteredOrders.length}</div>
            <p>Completion: ${Math.round((completedOrders / (filteredOrders.length || 1)) * 100)}%</p>
          </div>
        </div>
        
        <h3>Order Details</h3>
        <table>
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Date & Time</th>
              <th>Status</th>
              <th>Amount (Br)</th>
              <th>Payment Method</th>
              <th>Items Count</th>
            </tr>
          </thead>
          <tbody>
            ${filteredOrders.map(order => `
              <tr>
                <td>${order.orderNumber}</td>
                <td>${new Date(order.createdAt).toLocaleString()}</td>
                <td>${order.status.toUpperCase()}</td>
                <td>${order.totalAmount.toFixed(2)}</td>
                <td>${(order.paymentMethod || 'cash').toUpperCase()}</td>
                <td>${order.items?.length || 0}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Prime Addis Coffee Management System - Report Generated Automatically</p>
          <p>Contact: info@primeaddis.com | Phone: +251-XXX-XXXX</p>
        </div>
      </body>
      </html>
    `
    
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    
    // Auto-print
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="min-h-screen bg-background">
        <SidebarNav />
        <main className="md:ml-64">
          <AuthHeader title="Reports & Analytics" description="Sales and operational reports" />

          <div className="p-2.5 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Time Range Selector - Mobile Optimized */}
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-3 gap-2">
                {["today", "week", "month"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-2 sm:px-4 py-2 rounded-lg transition-colors capitalize text-xs sm:text-sm font-medium ${
                      timeRange === range ? "bg-primary text-primary-foreground" : "bg-card border border-border"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              
              {/* Date Range Display */}
              <div className="text-center p-2 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Showing {timeRange} data • {filteredOrders.length} orders
                  {timeRange === "today" && ` • ${new Date().toLocaleDateString()}`}
                  {timeRange === "week" && ` • Week of ${new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1)).toLocaleDateString()}`}
                  {timeRange === "month" && ` • ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
                </p>
              </div>
            </div>

            {/* Revenue Analytics - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="card-base bg-success/10 border border-success/30 p-3 sm:p-4">
                <p className="text-muted-foreground text-xs sm:text-sm">Total Revenue</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-success mt-1 sm:mt-2">{totalRevenue.toFixed(2)} Br</p>
                <p className="text-xs text-muted-foreground mt-1 sm:mt-2">+12% from last period</p>
              </div>
              <div className="card-base bg-info/10 border border-info/30 p-3 sm:p-4">
                <p className="text-muted-foreground text-xs sm:text-sm">Orders Completed</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-info mt-1 sm:mt-2">{completedOrders}</p>
                <p className="text-xs text-muted-foreground mt-1 sm:mt-2">Avg: {averageOrderValue.toFixed(2)} Br per order</p>
              </div>
              <div className="card-base bg-primary/10 border border-primary/30 p-3 sm:p-4">
                <p className="text-muted-foreground text-xs sm:text-sm">Total Orders</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mt-1 sm:mt-2">{filteredOrders.length}</p>
                <p className="text-xs text-muted-foreground mt-1 sm:mt-2">
                  Completion: {Math.round((completedOrders / (filteredOrders.length || 1)) * 100)}%
                </p>
              </div>
            </div>

            {/* Order Status Distribution - Mobile Optimized */}
            <div className="card-base p-3 sm:p-4">
              <h2 className="text-base sm:text-xl font-bold text-foreground mb-3 sm:mb-4">Order Status Distribution</h2>
              <div className="space-y-2 sm:space-y-3">
                {["pending", "preparing", "ready", "completed"].map((status) => {
                  const count = filteredOrders.filter((o) => o.status === status).length
                  const percentage = ((count / (filteredOrders.length || 1)) * 100).toFixed(0)
                  const statusColors = {
                    pending: "bg-warning",
                    preparing: "bg-info", 
                    ready: "bg-success",
                    completed: "bg-primary"
                  }
                  return (
                    <div key={status} className="flex items-center gap-2 sm:gap-4">
                      <span className="capitalize text-xs sm:text-sm font-medium min-w-16 sm:min-w-24">{status}</span>
                      <div className="flex-1 bg-muted rounded-full h-2 sm:h-3 overflow-hidden">
                        <div 
                          className={`${statusColors[status as keyof typeof statusColors]} h-full transition-all duration-300`} 
                          style={{ width: `${percentage}%` }} 
                        />
                      </div>
                      <div className="flex items-center gap-1 min-w-12 sm:min-w-16">
                        <span className="text-xs sm:text-sm font-semibold">{count}</span>
                        <span className="text-xs text-muted-foreground">({percentage}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Quick Insights - Mobile Optimized */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="card-base p-3 bg-accent/10 border border-accent/30">
                <p className="text-accent text-xs font-medium">Peak Hours</p>
                <p className="text-sm sm:text-base font-bold text-accent mt-1">12-2 PM</p>
                <p className="text-xs text-muted-foreground">Busiest period</p>
              </div>
              <div className="card-base p-3 bg-warning/10 border border-warning/30">
                <p className="text-warning text-xs font-medium">Avg Wait Time</p>
                <p className="text-sm sm:text-base font-bold text-warning mt-1">8 mins</p>
                <p className="text-xs text-muted-foreground">Order to ready</p>
              </div>
            </div>

            {/* Export Section - Mobile Optimized */}
            <div className="card-base p-3 sm:p-4">
              <h2 className="text-base sm:text-xl font-bold text-foreground mb-3 sm:mb-4">Export Data</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                <button 
                  onClick={exportToCSV}
                  className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
                >
                  📊 Export CSV
                </button>
                <button 
                  onClick={exportToPDF}
                  className="px-3 sm:px-4 py-2 bg-success text-success-foreground rounded hover:bg-success/90 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
                >
                  📄 Export PDF
                </button>
                <button 
                  onClick={printReport}
                  className="px-3 sm:px-4 py-2 bg-info text-info-foreground rounded hover:bg-info/90 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
                >
                  🖨️ Print Report
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Export {timeRange} data • {filteredOrders.length} orders • Generated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
