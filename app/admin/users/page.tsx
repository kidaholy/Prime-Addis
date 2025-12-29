"use client"
import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
import { AnimatedButton } from "@/components/animated-button"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"
import { ConfirmationCard, NotificationCard } from "@/components/confirmation-card"
import { useConfirmation } from "@/hooks/use-confirmation"

interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "chef" | "cashier"
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "cashier" as "admin" | "chef" | "cashier",
  })

  const { token, user: currentUser } = useAuth()
  const { t } = useLanguage()
  const { confirmationState, confirm, closeConfirmation, notificationState, notify, closeNotification } = useConfirmation()

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
        const data = await response.json()
        setUsers(data)
      }
    } catch (err) {
      console.error("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    const url = editingUser ? `/api/users/${editingUser._id}` : "/api/users"
    const method = editingUser ? "PUT" : "POST"

    try {
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
          notify({
            title: "User Created Successfully!",
            message: `Email: ${data.credentials.email}\nPassword: ${data.credentials.password}`,
            type: "success"
          })
        } else {
          notify({
            title: "User Updated",
            message: "User information has been updated successfully.",
            type: "success"
          })
        }
        resetForm()
        fetchUsers()
      } else {
        const errorData = await response.json()
        notify({
          title: "Save Failed",
          message: errorData.message || "Failed to save user",
          type: "error"
        })
      }
    } catch (err) {
      console.error("Failed to save user")
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (userToDelete: User) => {
    const confirmed = await confirm({
      title: "Delete User",
      message: `Are you sure you want to delete "${userToDelete.name}"?\n\nThis action cannot be undone.`,
      type: "danger",
      confirmText: "Delete User",
      cancelText: "Cancel"
    })
    
    if (!confirmed) return

    try {
      const response = await fetch(`/api/users/${userToDelete._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        fetchUsers()
      }
    } catch (err) {
      console.error("Failed to delete user")
    }
  }

  const generatePassword = () => {
    setFormData({ ...formData, password: Math.random().toString(36).slice(-8) })
  }

  const handleEdit = (userToEdit: User) => {
    setEditingUser(userToEdit)
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      password: "",
      role: userToEdit.role,
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setEditingUser(null)
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "cashier",
    })
    setShowForm(false)
  }

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="min-h-screen bg-white p-4 font-sans text-slate-800">
        <div className="max-w-7xl mx-auto">
          <BentoNavbar />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Control Sidebar */}
            <div className="lg:col-span-3 flex flex-col gap-6 sticky top-4">
              <div className="bg-[#8B4513] rounded-[40px] p-8 custom-shadow text-white">
                <h1 className="text-4xl font-bold mb-2 bubbly-text">{t("adminUsers.title")} 👥</h1>
                <p className="opacity-90 font-medium mb-6">{t("adminUsers.totalActiveStaff")}: {users.length}</p>
                <button
                  onClick={() => { resetForm(); setShowForm(true); }}
                  className="w-full bg-[#D2691E] text-white px-8 py-4 rounded-full font-bold shadow-xl hover:shadow-[#D2691E]/20 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  <span className="text-xl">✨</span> {t("adminUsers.addNewMember")}
                </button>
              </div>

              <div className="bg-[#D2691E] rounded-[40px] p-8 custom-shadow relative overflow-hidden group">
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold mb-2 text-white">{t("adminUsers.permissionsCard")}</h2>
                  <p className="text-white/80 font-medium">{t("adminUsers.permissionsDesc")}</p>
                </div>
                <div className="absolute -bottom-6 -right-6 text-9xl opacity-10 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">🛡️</div>
              </div>
            </div>

            {/* Users List */}
            <div className="lg:col-span-9">
              <div className="bg-white rounded-[40px] p-8 custom-shadow min-h-[700px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-32">
                    <div className="text-6xl animate-bounce mb-4">🧩</div>
                    <p className="text-gray-400 font-bold">{t("adminUsers.assemblingTeam")}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {users.map((u) => {
                      const isMe = u._id === currentUser?.id
                      const badge = u.role === "admin"
                        ? { color: "bg-[#8B4513] text-white", label: "Admin" }
                        : u.role === "chef"
                          ? { color: "bg-[#D2691E] text-white", label: "Chef" }
                          : { color: "bg-[#CD853F] text-white", label: "Cashier" }

                      return (
                        <div key={u._id} className="bg-gray-50 rounded-[35px] p-6 hover:shadow-xl transition-all border-4 border-transparent hover:border-[#8B4513]/10 flex flex-col group relative overflow-hidden">
                          {isMe && <div className="absolute top-4 right-4 text-xs font-black text-[#8B4513] bg-[#8B4513]/10 px-3 py-1 rounded-full uppercase tracking-widest">You</div>}
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl mb-4 custom-shadow group-hover:scale-110 transition-transform">
                            {u.role === "admin" ? "🎩" : u.role === "chef" ? "🍳" : "☕"}
                          </div>
                          <h3 className="font-bold text-lg text-slate-800 mb-1">{u.name}</h3>
                          <p className="text-sm text-gray-400 mb-6 font-medium truncate">{u.email}</p>

                          <div className="flex justify-between items-center mt-auto bg-white/50 rounded-[25px] p-4">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${badge.color}`}>
                              {badge.label}
                            </span>
                            <div className="flex gap-2">
                              <button onClick={() => handleEdit(u)} className="w-9 h-9 bg-white rounded-full flex items-center justify-center custom-shadow hover:scale-110 transition-transform">✏️</button>
                              {!isMe && (
                                <button onClick={() => handleDelete(u)} className="w-9 h-9 bg-white rounded-full flex items-center justify-center custom-shadow hover:bg-red-50 hover:scale-110 transition-transform">🗑️</button>
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

        {/* Create/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[50px] p-8 md:p-10 custom-shadow max-w-md w-full relative transform animate-bounce-custom">
              <button onClick={resetForm} className="absolute top-8 right-8 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500 hover:bg-red-50 transition-colors">✕</button>

              <div className="bg-white rounded-[40px] p-8 custom-shadow border-4 border-[#2d5a41]/5">
                <h2 className="text-2xl font-bold mb-6 bubbly-text">
                  {editingUser ? t("adminUsers.editProfile") : t("adminUsers.newMember")}
                </h2>
                <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600 ml-2">{t("adminUsers.displayName")}</label>
                    <input
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 outline-none focus:ring-4 focus:ring-[#8B4513]/10 font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600 ml-2">{t("adminUsers.emailAddress")}</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 outline-none focus:ring-4 focus:ring-[#8B4513]/10 font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-600 ml-2">{t("adminUsers.accessLevel")}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["cashier", "chef", "admin"].map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setFormData({ ...formData, role: r as any })}
                          className={`py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${formData.role === r ? "bg-[#8B4513] text-white shadow-lg" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
                        >
                          {t(`adminUsers.${r}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-sm font-bold text-gray-600 ml-2">
                      {t("adminUsers.password")} <span className="text-gray-400 text-xs">{editingUser ? t("adminUsers.optional") : ""}</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required={!editingUser}
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="flex-1 bg-gray-50 border-none rounded-2xl p-4 outline-none focus:ring-4 focus:ring-[#8B4513]/10 font-mono"
                      />
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="bg-gray-200 text-gray-600 px-4 rounded-2xl font-bold text-xs hover:bg-gray-300 transition-colors"
                      >
                        {t("adminUsers.generate")}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    {editingUser && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition-colors"
                      >
                        {t("common.cancel")}
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="flex-[2] bg-[#8B4513] text-white py-4 rounded-2xl font-bold shadow-xl shadow-[#8B4513]/20 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50"
                    >
                      {formLoading ? t("common.loading") : (editingUser ? t("adminUsers.updateProfile") : t("adminUsers.createAccount"))}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation and Notification Cards */}
        <ConfirmationCard
          isOpen={confirmationState.isOpen}
          onClose={closeConfirmation}
          onConfirm={confirmationState.onConfirm}
          title={confirmationState.options.title}
          message={confirmationState.options.message}
          type={confirmationState.options.type}
          confirmText={confirmationState.options.confirmText}
          cancelText={confirmationState.options.cancelText}
          icon={confirmationState.options.icon}
        />

        <NotificationCard
          isOpen={notificationState.isOpen}
          onClose={closeNotification}
          title={notificationState.options.title}
          message={notificationState.options.message}
          type={notificationState.options.type}
          autoClose={notificationState.options.autoClose}
          duration={notificationState.options.duration}
        />
      </div>
    </ProtectedRoute>
  )
}
