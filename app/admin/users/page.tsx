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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <BentoNavbar />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Control Sidebar */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:sticky lg:top-4">
              <div className="bg-[#8B4513] rounded-2xl p-6 md:p-8 shadow-xl shadow-[#8B4513]/20 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h1 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">{t("adminUsers.title")} 👥</h1>
                  <p className="opacity-80 text-xs md:text-sm font-bold uppercase tracking-widest mb-6">{t("adminUsers.totalActiveStaff")}: {users.length}</p>
                  <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="w-full bg-white text-[#8B4513] px-6 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                  >
                    ✨ {t("adminUsers.addNewMember")}
                  </button>
                </div>
                <div className="absolute -bottom-4 -right-4 text-8xl opacity-10 transform -rotate-12">👥</div>
              </div>

              <div className="hidden lg:block bg-[#D2691E] rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-xl font-bold mb-2 text-white">{t("adminUsers.permissionsCard")}</h2>
                  <p className="text-white/80 font-medium text-sm">{t("adminUsers.permissionsDesc")}</p>
                </div>
                <div className="absolute -bottom-6 -right-6 text-9xl opacity-10 transform">🛡️</div>
              </div>
            </div>

            <div className="lg:col-span-9">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 min-h-[600px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 md:py-32">
                    <div className="text-5xl md:text-6xl animate-bounce mb-4">🧩</div>
                    <p className="text-gray-400 font-black uppercase tracking-widest text-xs">{t("adminUsers.assemblingTeam")}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                    {users.map((u) => {
                      const isMe = u._id === currentUser?.id
                      const badge = u.role === "admin"
                        ? { color: "bg-[#8B4513] text-white", label: "Admin" }
                        : u.role === "chef"
                          ? { color: "bg-[#D2691E] text-white", label: "Chef" }
                          : { color: "bg-[#CD853F] text-white", label: "Cashier" }

                      return (
                        <div key={u._id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:border-[#8B4513]/30 hover:shadow-xl transition-all flex flex-col relative group">
                          {isMe && <div className="absolute top-4 right-4 text-[9px] font-black text-[#8B4513] bg-white border border-[#8B4513]/20 px-3 py-1 rounded-full uppercase tracking-widest z-10 shadow-sm">You</div>}
                          <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 shadow-sm group-hover:scale-110 transition-transform">
                            {u.role === "admin" ? "🎩" : u.role === "chef" ? "🍳" : "☕"}
                          </div>
                          <h3 className="font-black text-lg text-slate-800 mb-0.5">{u.name}</h3>
                          <p className="text-xs text-gray-400 mb-6 font-bold truncate tracking-tight">{u.email}</p>

                          <div className="flex justify-between items-center mt-auto bg-white/60 backdrop-blur-sm rounded-2xl p-3 border border-white">
                            <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${badge.color}`}>
                              {badge.label}
                            </span>
                            <div className="flex gap-2">
                              <button onClick={() => handleEdit(u)} className="w-8 h-8 md:w-9 md:h-9 bg-white rounded-xl flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all text-sm">✏️</button>
                              {!isMe && (
                                <button onClick={() => handleDelete(u)} className="w-8 h-8 md:w-9 md:h-9 bg-white rounded-xl flex items-center justify-center shadow-sm hover:bg-red-50 hover:text-red-500 hover:scale-110 active:scale-95 transition-all text-sm">🗑️</button>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl max-w-md w-full relative overflow-hidden flex flex-col max-h-[90vh]">
              <button
                onClick={resetForm}
                className="absolute top-6 right-6 w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center font-bold text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all z-10"
              >✕</button>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 pt-16 md:pt-20 scrollbar-hide">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
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
