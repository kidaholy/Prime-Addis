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

interface AdminSettings {
  logo_url: string
  app_name: string
  app_tagline: string
}

export default function AdminSettingsPage() {
  const { token } = useAuth()
  const { t } = useLanguage()
  const { settings, refreshSettings } = useSettings()
  const [formData, setFormData] = useState<AdminSettings>({
    logo_url: "",
    app_name: "Prime Addis",
    app_tagline: "Coffee Management"
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<"url" | "file">("url")

  useEffect(() => {
    if (settings) {
      setFormData({
        logo_url: settings.logo || "",
        app_name: settings.appName || "Prime Addis",
        app_tagline: settings.appTagline || "Coffee Management"
      })
    }
  }, [settings])

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
      alert(t("adminSettings.saveSuccessMessage"))
    } catch (error: any) {
      console.error("Failed to save settings:", error)
      alert(`${t("adminSettings.failedToSaveSettings")}. ${error.message || t("adminSettings.pleaseTryAgain")}`)
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
      alert(validation.error)
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
        alert(t("adminSettings.compressedImageTooLarge"))
        setUploading(false)
        return
      }

      setFormData({ ...formData, logo_url: compressedImage })
    } catch (error) {
      console.error('Failed to process image:', error)
      alert(t("adminSettings.processImageError"))
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveLogo = () => {
    if (confirm(t("adminSettings.confirmRemoveLogo"))) {
      setFormData({ ...formData, logo_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop&crop=center' })
    }
  }

  return (
    <ProtectedRoute requiredRoles={["admin"]}>
      <div className="min-h-screen bg-[#e2e7d8] p-4 font-sans text-slate-800">
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

              <div className="bg-[#f5bc6b] rounded-[40px] p-8 custom-shadow group overflow-hidden relative">
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
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-bold bubbly-text">{t("adminSettings.title")}</h2>
                    <p className="text-gray-500 text-sm mt-1">
                      {t("adminSettings.subtitle")}
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-32">
                    <div className="text-6xl animate-bounce mb-4">⚙️</div>
                    <p className="text-gray-400 font-bold">{t("adminSettings.loadingSettings")}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Logo Upload Section */}
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-gray-700">
                        {t("adminSettings.logoUpload")}
                      </label>

                      {/* Upload Method Toggle */}
                      <div className="flex gap-2 mb-4 bg-gray-50 p-1 rounded-2xl w-fit">
                        <button
                          type="button"
                          onClick={() => setUploadMethod("url")}
                          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${uploadMethod === "url"
                              ? "bg-white text-[#2d5a41] shadow-sm"
                              : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                          🔗 {t("adminSettings.url")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadMethod("file")}
                          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${uploadMethod === "file"
                              ? "bg-white text-[#2d5a41] shadow-sm"
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
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-[#2d5a41]/10 focus:border-[#2d5a41]/20 transition-all font-medium"
                            placeholder={t("adminSettings.logoUrlPlaceholder")}
                          />
                          <p className="text-xs text-[#2d5a41] font-bold flex items-center gap-2 ml-2">
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
                            <div className="bg-gray-50 border-2 border-dashed border-gray-100 rounded-2xl px-6 py-10 transition-all group-hover:bg-gray-100/50 group-hover:border-[#2d5a41]/20 flex flex-col items-center gap-3">
                              <div className="p-3 bg-white rounded-full custom-shadow">
                                <Upload className="w-6 h-6 text-[#2d5a41]" />
                              </div>
                              <p className="text-sm font-bold text-slate-800">{t("adminSettings.uploadFile")}</p>
                              {uploading && (
                                <span className="animate-spin text-lg">⏳</span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-[#2d5a41] font-bold flex items-center gap-2 ml-2">
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
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-[#2d5a41]/10 focus:border-[#2d5a41]/20 transition-all font-bold"
                        placeholder={t("adminSettings.appNamePlaceholder")}
                        required
                      />
                      <p className="text-xs text-[#2d5a41] font-bold flex items-center gap-2 ml-2">
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
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-[#2d5a41]/10 focus:border-[#2d5a41]/20 transition-all font-medium text-slate-600"
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
                        className="bg-[#2d5a41] text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl hover:shadow-[#2d5a41]/20 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:transform-none flex items-center gap-3"
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}