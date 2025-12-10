"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])
  const { token, user } = useAuth()

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testAuth = () => {
    addResult(`🔐 Auth Status: ${token ? 'Authenticated' : 'Not authenticated'}`)
    addResult(`👤 User: ${user ? `${user.name} (${user.role})` : 'No user'}`)
    addResult(`🎫 Token: ${token ? 'Present' : 'Missing'}`)
  }

  const testDatabase = async () => {
    try {
      addResult("🧪 Testing database connection...")
      const response = await fetch("/api/health")
      const data = await response.json()
      addResult(`📊 Database: ${data.database}`)
      addResult(`🌐 Environment: ${data.environment}`)
    } catch (error) {
      addResult(`❌ Database test failed: ${error}`)
    }
  }

  const testNotifications = async () => {
    try {
      addResult("🔔 Testing notifications...")
      const response = await fetch("/api/notifications", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (response.ok) {
        const notifications = await response.json()
        addResult(`📬 Notifications: ${notifications.length} found`)
      } else {
        addResult(`❌ Notifications failed: ${response.status}`)
      }
    } catch (error) {
      addResult(`❌ Notifications test failed: ${error}`)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white p-2 rounded-full text-xs z-50"
      >
        🐛 Debug
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg p-4 max-w-md max-h-96 overflow-y-auto z-50 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-foreground">🐛 Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <button onClick={testAuth} className="btn-primary text-xs w-full">
          Test Auth
        </button>
        <button onClick={testDatabase} className="btn-primary text-xs w-full">
          Test Database
        </button>
        <button onClick={testNotifications} className="btn-primary text-xs w-full">
          Test Notifications
        </button>
        <button onClick={clearResults} className="btn-secondary text-xs w-full">
          Clear Results
        </button>
      </div>

      <div className="bg-primary/10 p-2 rounded text-xs max-h-48 overflow-y-auto">
        {testResults.length === 0 ? (
          <p className="text-muted-foreground">No test results yet...</p>
        ) : (
          testResults.map((result, index) => (
            <div key={index} className="mb-1 font-mono text-xs">
              {result}
            </div>
          ))
        )}
      </div>
    </div>
  )
}