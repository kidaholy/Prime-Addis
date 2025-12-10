"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarNav } from "@/components/sidebar-nav"
import { AuthHeader } from "@/components/auth-header"
import { AnimatedButton } from "@/components/animated-button"
import { TestUsersFetch } from "@/components/test-users-fetch"
import { useAuth } from "@/context/auth-context"

interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "cashier" | "chef"
  isActive: boolean
  createdAt: string
}

interface CreateUserForm {
  name: string
  email: string
  role: "cashier" | "chef"
  password: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [formData, setFormData] = useState<CreateUserForm>({
    name: "",
    email: "",
    role: "cashier",
    password: "",
  })
  const { token } = useAuth()

  useEffect(() => {
    if (token) {
      fetchUsers()
    } else {
      console.log("⚠️ No token available, skipping user fetch")
    }
  }, [token])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      console.log("🔄 Fetching users with token:", token ? "Present" : "Missing")
      
      const response = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      })

      console.log("📥 Users fetch response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Users fetched successfully:", data.length, "users")
        setUsers(data)
      } else {
        const errorData = await response.json()
        console.error("❌ Failed to fetch users:", response.status, errorData)
        alert(`Failed to fetch users: ${errorData.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error("❌ Error fetching users:", error)
      alert(`Error fetching users: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.password) {
      alert("Please fill in all fields")
      return
    }

    setCreateLoading(true)
    try {
      console.log("🔄 Creating user:", formData)
      
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      console.log("📥 Response status:", response.status)
      const responseData = await response.json()
      console.log("📄 Response data:", responseData)

      if (response.ok) {
        alert(`✅ User created successfully!\n\nCredentials:\nEmail: ${responseData.credentials.email}\nPassword: ${responseData.credentials.password}\n\nPlease share these credentials with the user.`)
        
        // Reset form and close modal
        setFormData({ name: "", email: "", role: "cashier", password: "" })
        setShowCreateForm(false)
        
        // Refresh users list
        fetchUsers()
      } else {
        alert(`❌ Failed to create user: ${responseData.message}`)
      }
    } catch (error) {
      console.error("❌ Create user error:", error)
      alert(`❌ Error creating user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCreateLoading(false)
    }
  }

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let password = ""
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, password })
  }

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="flex flex-col md:flex-row">
        <SidebarNav />
        <main className="flex-1 md:ml-64">
          <AuthHeader title="User Management" description="Manage system users and permissions" />

          <div className="p-6">
            {/* Debug Component */}
            <TestUsersFetch />
            
            {/* Header with Create Button */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">System Users</h2>
              <AnimatedButton
                onClick={() => setShowCreateForm(true)}
                variant="glow"
              >
                ➕ Create User
              </AnimatedButton>
            </div>

            {/* Users List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading users...</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {users.map((user) => (
                  <div key={user._id} className="card-base hover-lift">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                          <span className="text-xl">
                            {user.role === "admin" ? "👑" : user.role === "cashier" ? "💳" : "👨‍🍳"}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{user.name}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                          user.role === "admin" ? "bg-accent/20 text-accent" :
                          user.role === "cashier" ? "bg-info/20 text-info" :
                          "bg-success/20 text-success"
                        }`}>
                          {user.role}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.isActive ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
                        }`}>
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {users.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-xl font-bold text-foreground mb-2">No Users Found</h3>
                    <p className="text-muted-foreground">Create your first user to get started</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Create User Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border">
                <h3 className="text-xl font-bold text-foreground mb-4">Create New User</h3>
                
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-base"
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-base"
                      placeholder="Enter email address"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as "cashier" | "chef" })}
                      className="input-base"
                    >
                      <option value="cashier">Cashier</option>
                      <option value="chef">Chef</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="input-base flex-1"
                        placeholder="Enter password"
                        required
                      />
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="px-3 py-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 text-sm"
                      >
                        Generate
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <AnimatedButton
                      type="submit"
                      disabled={createLoading}
                      variant="glow"
                      className="flex-1"
                    >
                      {createLoading ? "Creating..." : "Create User"}
                    </AnimatedButton>
                    <AnimatedButton
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      variant="secondary"
                    >
                      Cancel
                    </AnimatedButton>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}