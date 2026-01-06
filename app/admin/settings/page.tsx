"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"
import { useSettings } from "@/context/settings-context"
import { Logo } from "@/components/logo"
import { compressImage, validateImageFile, formatFileSize, getBase64Size } from "@/lib/utils/image-utils"
import { Save, Upload, Link as LinkIcon, Info, CheckCircle2 } from "lucide-react"
import { ConfirmationCard, NotificationCard } from "@/components/confirmation-card"
import { useConfirmation } from "@/hooks/use-confirmation"

interface AdminSettings {
  logo_url: string
  app_name: string
  app_tagline: string
}

export default function AdminSettingsPage() {
  const { token } = useAuth()
  const { t } = useLanguage()
  const { settings, refreshSettings } = useSettings()
  const { confirmationState, confirm, closeConfirmation, notificationState, notify, closeNotification } = useConfirmation()
  const [formData, setFormData] = useState<AdminSettings>({
    logo_url: "",
    app_name: "Prime Addis",
    app_tagline: "Coffee Management"
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<"url" | "file">("url")

  // Table & Waiter Management State
  const [activeTab, setActiveTab] = useState("branding")
  const [tables, setTables] = useState<any[]>([])
  const [waiters, setWaiters] = useState<any[]>([])
  const [newTable, setNewTable] = useState({ tableNumber: "", capacity: "" })
  const [newWaiter, setNewWaiter] = useState({ waiterId: "", name: "", tables: [] as string[] })

  useEffect(() => {
    if (settings) {
      setFormData({
        logo_url: settings.logo_url || "",
        app_name: settings.app_name || "Prime Addis",
        app_tagline: settings.app_tagline || "Coffee Management"
      })
    }
  }, [settings])

  useEffect(() => {
    if (activeTab === "tables") fetchTables()
    if (activeTab === "waiters") fetchWaiters()
  }, [activeTab])

  const fetchTables = async () => {
    try {
      const res = await fetch("/api/admin/tables", { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setTables(await res.json())
    } catch (err) { console.error("Failed to fetch tables", err) }
  }

  const fetchWaiters = async () => {
    try {
      const res = await fetch("/api/admin/waiters", { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setWaiters(await res.json())
    } catch (err) { console.error("Failed to fetch waiters", err) }
  }

  const handleAddTable = async () => {
    try {
      const res = await fetch("/api/admin/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newTable)
      })
      if (res.ok) {
        setNewTable({ tableNumber: "", capacity: "" })
        fetchTables()
        notify({ title: "Success", message: "Table added successfully", type: "success" })
      } else {
        const err = await res.json()
        notify({ title: "Error", message: err.message, type: "error" })
      }
    } catch (err) { notify({ title: "Error", message: "Failed to add table", type: "error" }) }
  }

  const handleDeleteTable = async (id: string) => {
    if (!await confirm({ title: "Delete Table", message: "Are you sure?", type: "warning", confirmText: "Delete", cancelText: "Cancel" })) return
    try {
      const res = await fetch(`/api/admin/tables?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        fetchTables()
        notify({ title: "Success", message: "Table deleted", type: "success" })
      }
    } catch (err) { notify({ title: "Error", message: "Failed to delete table", type: "error" }) }
  }

  const handleAddWaiter = async () => {
    try {
      const res = await fetch("/api/admin/waiters", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newWaiter)
      })
      if (res.ok) {
        setNewWaiter({ waiterId: "", name: "", tables: [] })
        fetchWaiters()
        notify({ title: "Success", message: "Waiter added successfully", type: "success" })
      } else {
        const err = await res.json()
        notify({ title: "Error", message: err.message, type: "error" })
      }
    } catch (err) { notify({ title: "Error", message: "Failed to add waiter", type: "error" }) }
  }

  const handleDeleteWaiter = async (id: string) => {
    if (!await confirm({ title: "Delete Waiter", message: "Are you sure?", type: "warning", confirmText: "Delete", cancelText: "Cancel" })) return
    try {
      const res = await fetch(`/api/admin/waiters?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        fetchWaiters()
        notify({ title: "Success", message: "Waiter deleted", type: "success" })
      }
    } catch (err) { notify({ title: "Error", message: "Failed to delete waiter", type: "error" }) }
  }

  const handleSaveSetting = async (key: string, value: string, type: string = "string", description?: string) => {
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ key, value, type, description }),
      })

      if (response.ok) {
        console.log(`✅ ${key} updated successfully`)
      } else {
        const error = await response.json()
        throw new Error(error.message || `Failed to update ${key}`)
      }
    } catch (error) {
      console.error(`Failed to update ${key}:`, error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Save all settings
      await Promise.all([
        handleSaveSetting("logo_url", formData.logo_url, "url", t("adminSettings.applicationLogoUrl")),
        handleSaveSetting("app_name", formData.app_name, "string", t("adminSettings.applicationName")),
        handleSaveSetting("app_tagline", formData.app_tagline, "string", t("adminSettings.applicationTagline"))
      ])

      // Refresh settings in context
      await refreshSettings()
      notify({
        title: "Settings Saved",
        message: "Your application settings have been updated successfully.",
        type: "success"
      })
    } catch (error: any) {
      console.error("Failed to save settings:", error)
      notify({
        title: "Save Failed",
        message: error.message || "Failed to save settings. Please try again.",
        type: "error"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      notify({
        title: "Invalid Image",
        message: validation.error || "Please select a valid image file",
        type: "error"
      })
      return
    }

    setUploading(true)
    try {
      // Compress and process image
      const compressedImage = await compressImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.8,
        format: 'jpeg'
      })

      // Check final size
      const finalSize = getBase64Size(compressedImage)
      if (finalSize > 500 * 1024) { // 500KB limit for base64
        notify({
          title: "Image Too Large",
          message: "The compressed image is still too large. Please try a smaller image.",
          type: "error"
        })
        setUploading(false)
        return
      }

      setFormData({ ...formData, logo_url: compressedImage })
    } catch (error) {
      console.error('Failed to process image:', error)
      notify({
        title: "Image Processing Failed",
        message: "Failed to process the selected image. Please try again.",
        type: "error"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveLogo = async () => {
    const confirmed = await confirm({
      title: "Remove Logo",
      message: "Are you sure you want to remove the current logo?\n\nThis will reset it to the default image.",
      type: "warning",
      confirmText: "Remove Logo",
      cancelText: "Cancel"
    })

    if (confirmed) {
      setFormData({ ...formData, logo_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop&crop=center' })
    }
  }

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="min-h-screen bg-white p-4 font-sans text-slate-800">
        <div className="max-w-7xl mx-auto">
          <BentoNavbar />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar - Preview */}
            <div className="lg:col-span-4 space-y-6 sticky top-4">
              <div className="bg-white rounded-[40px] p-8 custom-shadow">
                <h2 className="text-2xl font-bold mb-6 bubbly-text">{t("adminSettings.logoPreview")}</h2>

                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-gray-500 mb-3">{t("adminSettings.currentLogo")}</h3>
                    <div className="flex justify-center">
                      <Logo size="lg" showText={true} />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-sm font-bold text-gray-500 mb-3">{t("adminSettings.previewInNavigation")}</h3>
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <Logo size="md" showText={true} />
                        <div className="text-xs text-gray-400">{t("adminSettings.navigationBar")}</div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6 text-center">
                    <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-widest">{t("adminSettings.browserTabPreview")}</h3>
                    <div className="bg-gray-100 rounded-xl p-3 flex items-center gap-3 border border-gray-200">
                      <div className="w-6 h-6 rounded bg-white p-0.5 shadow-sm overflow-hidden">
                        {formData.logo_url ? (
                          <img src={formData.logo_url} className="w-full h-full object-contain" alt={t("adminSettings.favicon")} />
                        ) : (
                          <div className="w-full h-full bg-[#f4a261] flex items-center justify-center text-[10px] text-white font-black">
                            {formData.app_name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-[10px] font-bold text-slate-700 truncate w-32">
                          {formData.app_name} - {t("adminSettings.managementSystem")}
                        </div>
                        <div className="text-[8px] text-gray-400 -mt-1">prime-addis.vercel.app</div>
                      </div>
                      <div className="text-gray-300">✕</div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 italic">{t("adminSettings.livePreviewBrowserTab")}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#D2691E] rounded-[40px] p-8 custom-shadow group overflow-hidden relative">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-[#1a1a1a] mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    {t("adminSettings.logoTips.title")}
                  </h3>
                  <ul className="space-y-3">
                    {[
                      t("adminSettings.logoTips.tip1"),
                      t("adminSettings.logoTips.tip2"),
                      t("adminSettings.logoTips.tip3"),
                      t("adminSettings.logoTips.tip4"),
                      t("adminSettings.logoTips.tip5"),
                      t("adminSettings.logoTips.tip6")
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-3 group">
                        <CheckCircle2 className="w-4 h-4 text-[#2d5a41] mt-0.5 flex-shrink-0" />
                        <p className="text-sm font-medium text-[#1a1a1a]/70 group-hover:text-[#1a1a1a] transition-colors">
                          {tip}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="absolute -bottom-6 -right-6 text-8xl opacity-20 transform group-hover:rotate-12 transition-transform duration-500">🎨</div>
              </div>
            </div>

            {/* Main Content - Settings Form */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-[40px] p-8 custom-shadow">

                <div className="flex gap-4 mb-8 border-b border-gray-100 pb-4">
                  <button
                    onClick={() => setActiveTab("branding")}
                    className={`pb-2 text-sm font-bold transition-all ${activeTab === "branding" ? "text-[#8B4513] border-b-4 border-[#8B4513]" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    Branding
                  </button>
                  <button
                    onClick={() => setActiveTab("tables")}
                    className={`pb-2 text-sm font-bold transition-all ${activeTab === "tables" ? "text-[#8B4513] border-b-4 border-[#8B4513]" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    Table Management
                  </button>
                  <button
                    onClick={() => setActiveTab("waiters")}
                    className={`pb-2 text-sm font-bold transition-all ${activeTab === "waiters" ? "text-[#8B4513] border-b-4 border-[#8B4513]" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    Waiter Management
                  </button>
                </div>

                {activeTab === "branding" && (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* ... (Existing Branding Form Content - Logo, App Name, Tagline) ... */}
                    {/* Logo Upload Section */}
                    <div className="space-y-4">
                      {/* ... Copy existing Logo Upload content here ... */}
                      <label className="block text-sm font-bold text-gray-700">
                        {t("adminSettings.logoUpload")}
                      </label>

                      {/* Upload Method Toggle */}
                      <div className="flex gap-2 mb-4 bg-gray-50 p-1 rounded-2xl w-fit">
                        <button
                          type="button"
                          onClick={() => setUploadMethod("url")}
                          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${uploadMethod === "url"
                            ? "bg-white text-[#8B4513] shadow-sm"
                            : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                          🔗 {t("adminSettings.url")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadMethod("file")}
                          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${uploadMethod === "file"
                            ? "bg-white text-[#8B4513] shadow-sm"
                            : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                          📁 {t("adminSettings.uploadFile")}
                        </button>
                      </div>

                      {uploadMethod === "url" ? (
                        /* URL Input */
                        <div className="space-y-3">
                          <input
                            type="url"
                            value={formData.logo_url.startsWith('data:') ? '' : formData.logo_url}
                            onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-[#8B4513]/10 focus:border-[#8B4513]/20 transition-all font-medium"
                            placeholder={t("adminSettings.logoUrlPlaceholder")}
                          />
                          <p className="text-xs text-[#8B4513] font-bold flex items-center gap-2 ml-2">
                            <Info className="w-3 h-3" />
                            {t("adminSettings.urlFaviconHint")}
                          </p>
                        </div>
                      ) : (
                        /* File Upload */
                        <div className="space-y-3">
                          <div className="relative group">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              disabled={uploading}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="bg-gray-50 border-2 border-dashed border-gray-100 rounded-2xl px-6 py-10 transition-all group-hover:bg-gray-100/50 group-hover:border-[#8B4513]/20 flex flex-col items-center gap-3">
                              <div className="p-3 bg-white rounded-full custom-shadow">
                                <Upload className="w-6 h-6 text-[#8B4513]" />
                              </div>
                              <p className="text-sm font-bold text-slate-800">{t("adminSettings.uploadFile")}</p>
                              {uploading && (
                                <span className="animate-spin text-lg">⏳</span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-[#8B4513] font-bold flex items-center gap-2 ml-2">
                            <Info className="w-3 h-3" />
                            {t("adminSettings.fileFaviconHint")}
                          </p>
                        </div>
                      )}

                      {/* Current Logo Display */}
                      {formData.logo_url && (
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="w-16 h-16 relative overflow-hidden rounded-xl border border-gray-200 bg-white p-1">
                            <img
                              src={formData.logo_url}
                              alt={t("adminSettings.currentLogoAlt")}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800">
                              {formData.logo_url.startsWith('data:') ? t("adminSettings.uploadedImage") : t("adminSettings.urlImage")}
                            </p>
                            <p className="text-xs text-gray-400 font-medium truncate max-w-[200px]">
                              {formData.logo_url.startsWith('data:')
                                ? t("adminSettings.compressed")
                                : formData.logo_url}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="bg-red-50 text-red-500 hover:bg-red-100 p-2.5 rounded-xl transition-colors"
                            title={t("adminSettings.removeLogo")}
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>

                    {/* App Name */}
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-gray-700">
                        {t("adminSettings.appName")}
                      </label>
                      <input
                        type="text"
                        value={formData.app_name}
                        onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-[#8B4513]/10 focus:border-[#8B4513]/20 transition-all font-bold"
                        placeholder={t("adminSettings.appNamePlaceholder")}
                        required
                      />
                      <p className="text-xs text-[#8B4513] font-bold flex items-center gap-2 ml-2">
                        <Info className="w-3 h-3" />
                        {t("adminSettings.appNameHint")}
                      </p>
                    </div>

                    {/* App Tagline */}
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-gray-700">
                        {t("adminSettings.appTagline")}
                      </label>
                      <input
                        type="text"
                        value={formData.app_tagline}
                        onChange={(e) => setFormData({ ...formData, app_tagline: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-[#8B4513]/10 focus:border-[#8B4513]/20 transition-all font-medium text-slate-600"
                        placeholder={t("adminSettings.appTaglinePlaceholder")}
                        required
                      />
                      <p className="text-xs text-gray-400 font-medium ml-2">
                        {t("adminSettings.appTaglineHint")}
                      </p>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-6 border-t border-gray-100">
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-[#8B4513] text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl hover:shadow-[#8B4513]/20 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:transform-none flex items-center gap-3"
                      >
                        {saving ? (
                          <>
                            <span className="animate-spin text-lg">⏳</span>
                            {t("adminSettings.saving")}
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            {t("adminSettings.saveSettings")}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === "tables" && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <h3 className="font-bold text-lg mb-4 text-[#8B4513]">Add New Table</h3>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Table Number (e.g. T-01)"
                            value={newTable.tableNumber}
                            onChange={(e) => setNewTable({ ...newTable, tableNumber: e.target.value })}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Capacity (Optional)"
                            value={newTable.capacity}
                            onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20"
                          />
                        </div>
                        <button
                          onClick={handleAddTable}
                          disabled={!newTable.tableNumber}
                          className="bg-[#8B4513] text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-[#A0522D] transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {tables.map(table => (
                        <div key={table._id} className="p-4 bg-white border border-gray-200 rounded-2xl flex justify-between items-center group hover:border-[#8B4513] hover:shadow-md transition-all">
                          <div>
                            <div className="font-black text-lg text-gray-800">{table.tableNumber}</div>
                            {table.capacity && <div className="text-xs text-gray-400 font-bold">{table.capacity} Seats</div>}
                          </div>
                          <button
                            onClick={() => handleDeleteTable(table._id)}
                            className="text-gray-300 hover:text-red-500 transition-colors p-2"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                      {tables.length === 0 && (
                        <div className="col-span-full text-center py-10 text-gray-400">
                          No tables added yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "waiters" && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <h3 className="font-bold text-lg mb-4 text-[#8B4513]">Add New Waiter/Batch</h3>
                      <div className="flex flex-col gap-4">
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Batch Number (e.g. B-01)"
                              value={newWaiter.waiterId}
                              onChange={(e) => setNewWaiter({ ...newWaiter, waiterId: e.target.value })}
                              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20"
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Waiter Name"
                              value={newWaiter.name}
                              onChange={(e) => setNewWaiter({ ...newWaiter, name: e.target.value })}
                              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20"
                            />
                          </div>
                        </div>

                        {/* Table Assignment */}
                        <div>
                          <label className="text-sm font-bold text-gray-700 mb-2 block">Assign Tables (Optional)</label>
                          <div className="bg-white border border-gray-200 rounded-xl p-4 max-h-40 overflow-y-auto custom-scrollbar grid grid-cols-3 gap-2">
                            {tables.map(table => (
                              <label key={table._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded-lg">
                                <input
                                  type="checkbox"
                                  checked={newWaiter.tables.includes(table.tableNumber)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNewWaiter({ ...newWaiter, tables: [...newWaiter.tables, table.tableNumber] })
                                    } else {
                                      setNewWaiter({ ...newWaiter, tables: newWaiter.tables.filter(t => t !== table.tableNumber) })
                                    }
                                  }}
                                  className="accent-[#8B4513] w-4 h-4 rounded-sm"
                                />
                                <span className="text-sm font-medium text-gray-700">{table.tableNumber}</span>
                              </label>
                            ))}
                            {tables.length === 0 && <div className="text-gray-400 text-xs col-span-3">No tables available. Add tables first.</div>}
                          </div>
                        </div>

                        <button
                          onClick={handleAddWaiter}
                          disabled={!newWaiter.waiterId || !newWaiter.name}
                          className="bg-[#8B4513] text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-[#A0522D] transition-colors w-full"
                        >
                          Add Waiter
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {waiters.map(waiter => (
                        <div key={waiter._id} className="p-4 bg-white border border-gray-200 rounded-2xl flex flex-col gap-3 group hover:border-[#8B4513] hover:shadow-md transition-all">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#8B4513]/10 rounded-full flex items-center justify-center text-lg">
                                👤
                              </div>
                              <div>
                                <div className="font-black text-sm text-gray-800">{waiter.name}</div>
                                <div className="text-xs text-[#8B4513] font-mono font-bold">{waiter.waiterId}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteWaiter(waiter._id)}
                              className="text-gray-300 hover:text-red-500 transition-colors p-2"
                            >
                              🗑️
                            </button>
                          </div>

                          {/* Display Assigned Tables */}
                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tables</div>
                            <div className="flex flex-wrap gap-1">
                              {waiter.tables && waiter.tables.length > 0 ? (
                                waiter.tables.map((t: string) => (
                                  <span key={t} className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-md font-bold">
                                    {t}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-300 italic">No tables assigned</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {waiters.length === 0 && (
                        <div className="col-span-full text-center py-10 text-gray-400">
                          No waiters added yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

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