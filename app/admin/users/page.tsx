"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarNav } from "@/components/sidebar-nav"
import { AuthHeader } from "@/components/auth-header"
import { AnimatedButton } from "@/components/animated-button"

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

interface EditUserForm {
  name: string
  email: string
  role: "admin" | "cashier" | "chef"
  password: string
  isActive: boolean
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [createLoading, setCreateLoading] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateUserForm>({
    name: "",
    email: "",
    role: "cashier",
    password: "",
  })
  const [editFormData, setEditFormData] = useState<EditUserForm>({
    name: "",
    email: "",
    role: "cashier",
    password: "",
    isActive: true,
  })
  const { token, user } = useAuth()

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
        
        // Trigger immediate refresh on other pages
        localStorage.setItem('userUpdated', Date.now().toString())
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

  const generateEditPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let password = ""
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setEditFormData({ ...editFormData, password })
  }

  const handleEditUser = (userToEdit: User) => {
    setEditingUser(userToEdit)
    setEditFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      role: userToEdit.role,
      password: "",
      isActive: userToEdit.isActive,
    })
    setShowEditForm(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingUser || !editFormData.name || !editFormData.email) {
      alert("Please fill in required fields")
      return
    }

    setUpdateLoading(true)
    try {
      console.log("🔄 Updating user:", editingUser._id, editFormData)
      console.log("🔍 User ID length:", editingUser._id.length)
      console.log("🔍 User ID format:", editingUser._id)
      
      const url = `/api/users/${editingUser._id}`
      console.log("🔗 Request URL:", url)
      console.log("📦 Request body:", JSON.stringify(editFormData))
      
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      })
      
      console.log("📡 Response object:", response)
      console.log("🌐 Response URL:", response.url)
      console.log("📊 Response headers:", Object.fromEntries(response.headers.entries()))

      console.log("📥 Response status:", response.status)
      
      let responseData
      try {
        const responseText = await response.text()
        console.log("📄 Raw response:", responseText)
        responseData = responseText ? JSON.parse(responseText) : {}
      } catch (parseError) {
        console.error("❌ Failed to parse response:", parseError)
        responseData = { message: "Invalid response format" }
      }
      
      console.log("📄 Parsed response data:", responseData)

      if (response.ok) {
        alert("✅ User updated successfully!")
        
        // Reset form and close modal
        setEditFormData({ name: "", email: "", role: "cashier", password: "", isActive: true })
        setShowEditForm(false)
        setEditingUser(null)
        
        // Refresh users list
        fetchUsers()
        
        // Trigger immediate refresh on other pages
        localStorage.setItem('userUpdated', Date.now().toString())
      } else {
        console.error("❌ Update failed:", response.status, responseData)
        alert(`❌ Failed to update user: ${responseData.message || 'Unknown error'}\n\nStatus: ${response.status}\nUser ID: ${editingUser._id}`)
      }
    } catch (error) {
      console.error("❌ Update user error:", error)
      alert(`❌ Error updating user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleDeleteUser = async (userToDelete: User) => {
    if (!confirm(`Are you sure you want to delete user "${userToDelete.name}"?\n\nThis action cannot be undone.`)) {
      return
    }

    setDeleteLoading(userToDelete._id)
    try {
      console.log("🗑️ Deleting user:", userToDelete._id)
      
      const response = await fetch(`/api/users/${userToDelete._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const responseData = await response.json()

      if (response.ok) {
        alert("✅ User deleted successfully!")
        
        // Refresh users list
        fetchUsers()
        
        // Trigger immediate refresh on other pages
        localStorage.setItem('userUpdated', Date.now().toString())
      } else {
        alert(`❌ Failed to delete user: ${responseData.message}`)
      }
    } catch (error) {
      console.error("❌ Delete user error:", error)
      alert(`❌ Error deleting user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDeleteLoading(null)
    }
  }

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="min-h-screen bg-background">
        <SidebarNav />
        <main className="md:ml-64">
          <AuthHeader title="User Management" description="Manage system users and permissions" />

          <div className="p-2.5 sm:p-4 lg:p-6">

            
            {/* Header with Create Button - Mobile Optimized */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <h2 className="text-lg sm:text-2xl font-bold text-foreground">System Users</h2>
                <div className="flex gap-2">
                  <AnimatedButton
                    onClick={fetchUsers}
                    variant="secondary"
                    disabled={loading}
                    className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-2"
                  >
                    🔄 <span className="hidden xs:inline">Refresh</span>
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={() => setShowCreateForm(true)}
                    variant="glow"
                    className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-4 py-2"
                  >
                    ➕ <span className="hidden xs:inline">Create User</span>
                  </AnimatedButton>
                </div>
              </div>
            </div>

            {/* System Status - Mobile Optimized */}
            <div className="mb-4 p-3 bg-card/50 rounded-lg border border-border">
              <h3 className="text-sm font-semibold mb-2">System Status</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Database</span>
                  <span className="text-success font-medium">Connected</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Auth</span>
                  <span className="font-medium">{token ? "✅ Valid" : "❌ Missing"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium capitalize">{user?.role || "Unknown"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Users</span>
                  <span className="font-medium">{users.length} found</span>
                </div>
              </div>
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
              <div className="space-y-3">
                {users.map((userItem) => (
                  <div key={userItem._id} className="card-base hover-lift p-3">
                    {/* Mobile-Optimized User Card */}
                    <div className="flex flex-col gap-3">
                      {/* User Info Section */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-base">
                            {userItem.role === "admin" ? "👑" : userItem.role === "cashier" ? "💳" : "👨‍🍳"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-sm truncate">{userItem.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{userItem.email}</p>
                        </div>
                      </div>
                      
                      {/* Status and Actions Section */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                            userItem.role === "admin" ? "bg-accent/20 text-accent" :
                            userItem.role === "cashier" ? "bg-info/20 text-info" :
                            "bg-success/20 text-success"
                          }`}>
                            {userItem.role}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            userItem.isActive ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
                          }`}>
                            {userItem.isActive ? "✓" : "✗"}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <AnimatedButton
                            onClick={() => handleEditUser(userItem)}
                            variant="secondary"
                            size="sm"
                            className="text-xs px-2 py-1"
                          >
                            ✏️
                          </AnimatedButton>
                          {userItem.email !== user?.email && (
                            <AnimatedButton
                              onClick={() => handleDeleteUser(userItem)}
                              variant="secondary"
                              size="sm"
                              disabled={deleteLoading === userItem._id}
                              className="text-xs px-2 py-1 text-danger hover:bg-danger/20"
                            >
                              {deleteLoading === userItem._id ? "..." : "🗑️"}
                            </AnimatedButton>
                          )}
                        </div>
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

          {/* Edit User Modal - Mobile Optimized */}
          {showEditForm && editingUser && (
            <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-2">
              <div className="bg-card rounded-xl p-3 w-full max-w-sm border border-border max-h-[98vh] overflow-y-auto mt-2">
                <h3 className="text-base font-bold text-foreground mb-3">Edit User</h3>
                
                <form onSubmit={handleUpdateUser} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="input-base text-sm"
                      placeholder="Full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Email</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="input-base text-sm"
                      placeholder="Email address"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Role</label>
                    <select
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as "admin" | "cashier" | "chef" })}
                      className="input-base text-sm"
                    >
                      <option value="admin">Admin</option>
                      <option value="cashier">Cashier</option>
                      <option value="chef">Chef</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">New Password (optional)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editFormData.password}
                        onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                        className="input-base text-sm flex-1"
                        placeholder="Leave empty to keep current"
                      />
                      <button
                        type="button"
                        onClick={generateEditPassword}
                        className="px-2 py-1 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 text-xs"
                      >
                        Gen
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="editIsActive"
                      checked={editFormData.isActive}
                      onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                      className="w-4 h-4 text-accent"
                    />
                    <label htmlFor="editIsActive" className="text-xs font-medium text-foreground">
                      User is active
                    </label>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <AnimatedButton
                      type="submit"
                      disabled={updateLoading}
                      variant="glow"
                      className="flex-1 text-xs py-2"
                    >
                      {updateLoading ? "Updating..." : "Update"}
                    </AnimatedButton>
                    <AnimatedButton
                      type="button"
                      onClick={() => {
                        setShowEditForm(false)
                        setEditingUser(null)
                      }}
                      variant="secondary"
                      className="px-3 text-xs py-2"
                    >
                      Cancel
                    </AnimatedButton>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Create User Modal - Mobile Optimized */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-2">
              <div className="bg-card rounded-xl p-3 w-full max-w-sm border border-border max-h-[98vh] overflow-y-auto mt-2">
                <h3 className="text-base font-bold text-foreground mb-3">Create User</h3>
                
                <form onSubmit={handleCreateUser} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-base text-sm"
                      placeholder="Full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-base text-sm"
                      placeholder="Email address"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as "cashier" | "chef" })}
                      className="input-base text-sm"
                    >
                      <option value="cashier">Cashier</option>
                      <option value="chef">Chef</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Password</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="input-base text-sm flex-1"
                        placeholder="Password"
                        required
                      />
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="px-2 py-1 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 text-xs"
                      >
                        Gen
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <AnimatedButton
                      type="submit"
                      disabled={createLoading}
                      variant="glow"
                      className="flex-1 text-xs py-2"
                    >
                      {createLoading ? "Creating..." : "Create"}
                    </AnimatedButton>
                    <AnimatedButton
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      variant="secondary"
                      className="px-3 text-xs py-2"
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