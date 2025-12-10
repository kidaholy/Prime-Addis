"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"

export function TestUsersFetch() {
  const [result, setResult] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const { token, user } = useAuth()

  const testFetch = async () => {
    setLoading(true)
    setResult("Testing...")

    try {
      console.log("🧪 Testing users fetch...")
      console.log("👤 Current user:", user)
      console.log("🎫 Token:", token ? "Present" : "Missing")

      if (!token) {
        setResult("❌ No authentication token")
        return
      }

      const response = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      })

      console.log("📥 Response status:", response.status)

      if (response.ok) {
        const users = await response.json()
        setResult(`✅ Success: Found ${users.length} users\n${users.map((u: any) => `- ${u.name} (${u.role})`).join('\n')}`)
      } else {
        const errorData = await response.json()
        setResult(`❌ Error ${response.status}: ${errorData.message}`)
      }
    } catch (error) {
      setResult(`❌ Exception: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card-base m-4 p-4">
      <h3 className="font-bold mb-4">🧪 Test Users API</h3>
      <button
        onClick={testFetch}
        disabled={loading}
        className="btn-primary mb-4"
      >
        {loading ? "Testing..." : "Test Fetch Users"}
      </button>
      {result && (
        <pre className="bg-primary/10 p-3 rounded text-xs whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  )
}