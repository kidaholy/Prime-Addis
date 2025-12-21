"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
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

interface UserForm {
  name: string
  email: string
  role: "admin" | "cashier" | "chef"
  password: string
  isActive?: boolean
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formData, setFormData] = useState<UserForm>({
    name: "",
    email: "",
    role: "cashier",
    password: "",
    isActive: true
  })

  const { token, user: currentUser } = useAuth()

  useEffect(() => {
    if (token) fetchUsers()
  }, [token])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        setUsers(await response.json())
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      const url = editingUser ? `/api/users/${editingUser._id}` : "/api/users"
      const method = editingUser ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        if (!editingUser) {
          alert(`✅ User created!\nEmail: ${data.credentials.email}\nPassword: ${data.credentials.password}`)
        }
        resetForm()
        fetchUsers()
        localStorage.setItem('userUpdated', Date.now().toString())
      }
    } catch (error) {
      console.error("Error saving user:", error)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (userToDelete: User) => {
    if (!confirm(`Are you sure you want to delete "${userToDelete.name}"?`)) return

    try {
      const response = await fetch(`/api/users/${userToDelete._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        fetchUsers()
        localStorage.setItem('userUpdated', Date.now().toString())
      }
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
    let p = ""
    for (let i = 0; i < 8; i++) p += chars.charAt(Math.floor(Math.random() * chars.length))
    setFormData({ ...formData, password: p })
  }

  const handleEdit = (userToEdit: User) => {
    setEditingUser(userToEdit)
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      role: userToEdit.role,
      password: "",
      isActive: userToEdit.isActive
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setEditingUser(null)
    setFormData({ name: "", email: "", role: "cashier", password: "", isActive: true })
    setShowForm(false)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return { label: 'Admin', color: 'bg-[#f5bc6b] text-[#1a1a1a]', emoji: '👑' }
      case 'chef': return { label: 'Chef', color: 'bg-[#93c5fd] text-blue-800', emoji: '👨‍🍳' }
      case 'cashier': return { label: 'Cashier', color: 'bg-[#e2e7d8] text-[#2d5a41]', emoji: '💳' }
      default: return { label: role, color: 'bg-gray-100 text-gray-500', emoji: '👤' }
    }
  }

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="min-h-screen bg-[#e2e7d8] p-4 font-sans text-slate-800">
        <div className="max-w-7xl mx-auto">
          <BentoNavbar />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Control Sidebar */}
            <div className="lg:col-span-3 flex flex-col gap-6 sticky top-4">
              <div className="bg-white rounded-[40px] p-8 custom-shadow">
                <h2 className="text-2xl font-bold mb-6 bubbly-text">Staff</h2>
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full bg-[#2d5a41] text-white font-bold py-4 rounded-[30px] custom-shadow transform transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mb-4"
                >
                  <span className="text-xl">➕</span> Add New Member
                </button>
                <div className="bg-gray-50 rounded-[30px] p-5 text-center">
                  <div className="text-4xl font-black text-[#2d5a41] mb-1">{users.length}</div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Active Staff</div>
                </div>
              </div>

              <div className="bg-[#93c5fd] rounded-[40px] p-8 custom-shadow text-blue-900 overflow-hidden relative group">
                <div className="relative z-10">
                  <h3 className="font-bold text-xl mb-2">Permissions Card</h3>
                  <p className="text-sm opacity-80 font-medium">Managers have full access to reports and inventory settings.</p>
                </div>
                <div className="absolute -bottom-6 -right-6 text-9xl opacity-10 group-hover:rotate-12 transition-transform duration-500">🛡️</div>
              </div>
            </div>

            {/* User Grid */}
            <div className="lg:col-span-9">
              <div className="bg-white rounded-[40px] p-8 custom-shadow min-h-[700px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-32">
                    <div className="text-6xl animate-bounce mb-4">🧁</div>
                    <p className="text-gray-400 font-bold">Assembling Team...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {users.map((u) => {
                      const badge = getRoleBadge(u.role)
                      return (
                        <div key={u._id} className="bg-gray-50 rounded-[40px] p-6 border-2 border-transparent hover:border-[#2d5a41]/10 hover:shadow-xl transition-all flex flex-col group relative overflow-hidden">
                          <div className="flex items-center gap-4 mb-6">
                            <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center text-2xl ${badge.color}`}>
                              {badge.emoji}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-lg truncate">{u.name}</h3>
                              <p className="text-xs text-gray-400 truncate font-medium">{u.email}</p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-auto bg-white/50 rounded-[25px] p-4">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${badge.color}`}>
                              {badge.label}
                            </span>
                            <div className="flex gap-2">
                              <button onClick={() => handleEdit(u)} className="w-9 h-9 bg-white rounded-full flex items-center justify-center custom-shadow hover:scale-110 transition-transform">✏️</button>
                              {u.email !== currentUser?.email && (
                                <button onClick={() => handleDelete(u)} className="w-9 h-9 bg-red-50 text-red-500 rounded-full flex items-center justify-center custom-shadow hover:scale-110 transition-transform">🗑️</button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Form */}
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[50px] p-8 md:p-10 custom-shadow max-w-md w-full relative transform animate-bounce-custom">
              <button onClick={resetForm} className="absolute top-8 right-8 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500 hover:bg-red-50 transition-colors">✕</button>

              <h2 className="text-3xl font-bold mb-8 bubbly-text">{editingUser ? "Edit Profile" : "New Member"}</h2>

              <form onSubmit={handleCreateOrUpdate} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a41]"
                    placeholder="E.g. Abebe Bikila"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a41]"
                    placeholder="staff@primeaddis.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Access Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['cashier', 'chef', 'admin'].map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: r as any })}
                        className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border-2 transition-all ${formData.role === r
                            ? "bg-[#2d5a41] text-white border-[#2d5a41]"
                            : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                          }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Password {editingUser && "(Optional)"}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm"
                      placeholder={editingUser ? "Keep current" : "Secure Password"}
                    />
                    <button type="button" onClick={generatePassword} className="bg-gray-100 px-4 rounded-2xl font-bold text-gray-600 hover:bg-gray-200">Gen</button>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-50 flex gap-3">
                  <button type="button" onClick={resetForm} className="flex-1 py-4 font-bold text-gray-400 rounded-2xl hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={formLoading} className="flex-[2] bg-[#2d5a41] text-white font-bold py-4 rounded-2xl custom-shadow hover:scale-105 transition-transform disabled:opacity-50">
                    {formLoading ? "Saving..." : (editingUser ? "Update Profile" : "Create Account")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}