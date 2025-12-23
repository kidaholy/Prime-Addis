"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { BentoNavbar } from "@/components/bento-navbar"
import { useAuth } from "@/context/auth-context"
import { useSettings } from "@/context/settings-context"
import { Logo } from "@/components/logo"
import { compressImage, validateImageFile, formatFileSize, getBase64Size } from "@/lib/utils/image-utils"

interface AdminSettings {
  logo_url: string
  app_name: string
  app_tagline: string
}

export default function AdminSettingsPage() {
  const { token } = useAuth()
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
    fetchSettings()
  }, [])

  useEffect(() => {
    setFormData({
      logo_url: settings.logo_url || "",
      app_name: settings.app_name || "Prime Addis",
      app_tagline: settings.app_tagline || "Coffee Management"
    })
  }, [settings])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setFormData({
          logo_url: data.logo_url?.value || "",
          app_name: data.app_name?.value || "Prime Addis",
          app_tagline: data.app_tagline?.value || "Coffee Management"
        })
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSetting = async (key: string, value: string, type: string = "string", description?: string) => {
    setSaving(true)
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
        // Refresh settings in context
        await refreshSettings()
      } else {
        const error = await response.json()
        alert(`Failed to update ${key}: ${error.message}`)
      }
    } catch (error) {
      console.error(`Failed to update ${key}:`, error)
      alert(`Failed to update ${key}. Please try again.`)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Save all settings
      await Promise.all([
        handleSaveSetting("logo_url", formData.logo_url, "url", "Application logo URL"),
        handleSaveSetting("app_name", formData.app_name, "string", "Application name"),
        handleSaveSetting("app_tagline", formData.app_tagline, "string", "Application tagline")
      ])

      alert("Settings saved successfully!")
    } catch (error) {
      console.error("Failed to save settings:", error)
      alert("Failed to save settings. Please try again.")
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
        alert('Compressed image is still too large. Please use a smaller image.')
        setUploading(false)
        return
      }

      setFormData({ ...formData, logo_url: compressedImage })
      console.log(`✅ Image processed: ${formatFileSize(finalSize)}`)
    } catch (error) {
      console.error('Failed to process image:', error)
      alert('Failed to process image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveLogo = () => {
    if (confirm('Are you sure you want to remove the logo?')) {
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
                <h2 className="text-2xl font-bold mb-6 bubbly-text">Logo Preview</h2>

                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-gray-500 mb-3">Current Logo</h3>
                    <div className="flex justify-center">
                      <Logo size="lg" showText={true} />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-sm font-bold text-gray-500 mb-3">Preview in Navigation</h3>
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <Logo size="md" showText={true} />
                        <div className="text-xs text-gray-400">Navigation Bar</div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6 text-center">
                    <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-widest">Browser Tab Preview</h3>
                    <div className="bg-gray-100 rounded-xl p-3 flex items-center gap-3 border border-gray-200">
                      <div className="w-6 h-6 rounded bg-white p-0.5 shadow-sm overflow-hidden">
                        {formData.logo_url ? (
                          <img src={formData.logo_url} className="w-full h-full object-contain" alt="Favicon" />
                        ) : (
                          <div className="w-full h-full bg-[#f4a261] flex items-center justify-center text-[10px] text-white font-black">
                            {formData.app_name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-[10px] font-bold text-slate-700 truncate w-32">
                          {formData.app_name} - Management System
                        </div>
                        <div className="text-[8px] text-gray-400 -mt-1">prime-addis.vercel.app</div>
                      </div>
                      <div className="text-gray-300">✕</div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 italic">Live preview of your browser tab</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#f5bc6b] rounded-[40px] p-8 custom-shadow group overflow-hidden relative">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">Logo Tips</h3>
                  <ul className="text-sm font-medium text-[#1a1a1a]/70 space-y-1">
                    <li>• Use square images (1:1 ratio)</li>
                    <li>• Minimum 200x200 pixels</li>
                    <li>• PNG, JPG, GIF, or WebP format</li>
                    <li>• Max upload size: 5MB</li>
                    <li>• Auto-compressed to 400x400px</li>
                    <li>• Clear, simple design works best</li>
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
                    <h2 className="text-2xl font-bold bubbly-text">App Settings</h2>
                    <p className="text-gray-500 text-sm mt-1">
                      Customize your application branding and appearance
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-32">
                    <div className="text-6xl animate-bounce mb-4">⚙️</div>
                    <p className="text-gray-400 font-bold">Loading Settings...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Logo Upload Section */}
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-gray-700">
                        Logo Upload
                      </label>

                      {/* Upload Method Toggle */}
                      <div className="flex gap-2 mb-4">
                        <button
                          type="button"
                          onClick={() => setUploadMethod("url")}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${uploadMethod === "url"
                            ? "bg-[#2d5a41] text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                          🔗 URL
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadMethod("file")}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${uploadMethod === "file"
                            ? "bg-[#2d5a41] text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                          📁 Upload File
                        </button>
                      </div>

                      {uploadMethod === "url" ? (
                        /* URL Input */
                        <div className="space-y-3">
                          <input
                            type="url"
                            value={formData.logo_url.startsWith('data:') ? '' : formData.logo_url}
                            onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a41] focus:border-transparent"
                            placeholder="https://example.com/logo.png"
                          />
                          <p className="text-xs text-[#2d5a41] font-bold">
                            🔗 This URL will also be used as your site's Favicon.
                          </p>
                        </div>
                      ) : (
                        /* File Upload */
                        <div className="space-y-3">
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              disabled={uploading}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a41] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#2d5a41] file:text-white hover:file:bg-black"
                            />
                            {uploading && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <span className="animate-spin text-lg">⏳</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-[#2d5a41] font-bold">
                            📁 This image will also be used as your site's Favicon.
                          </p>
                        </div>
                      )}

                      {/* Current Logo Display */}
                      {formData.logo_url && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="w-12 h-12 relative overflow-hidden rounded-lg border-2 border-gray-200">
                            <img
                              src={formData.logo_url}
                              alt="Current logo"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">
                              {formData.logo_url.startsWith('data:') ? 'Uploaded Image' : 'URL Image'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formData.logo_url.startsWith('data:')
                                ? `Compressed: ${formatFileSize(getBase64Size(formData.logo_url))}`
                                : formData.logo_url.substring(0, 50) + '...'
                              }
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Remove logo"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>

                    {/* App Name */}
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-gray-700">
                        Application Name
                      </label>
                      <input
                        type="text"
                        value={formData.app_name}
                        onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a41] focus:border-transparent"
                        placeholder="Prime Addis"
                        required
                      />
                      <p className="text-xs text-[#2d5a41] font-bold">
                        🏷️ Updates the page title and browser tab label.
                      </p>
                    </div>

                    {/* App Tagline */}
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-gray-700">
                        Application Tagline
                      </label>
                      <input
                        type="text"
                        value={formData.app_tagline}
                        onChange={(e) => setFormData({ ...formData, app_tagline: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a41] focus:border-transparent"
                        placeholder="Coffee Management"
                        required
                      />
                      <p className="text-xs text-gray-500">
                        A short description that appears below the app name.
                      </p>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-6 border-t">
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-[#2d5a41] hover:bg-black disabled:bg-gray-400 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none flex items-center gap-2"
                      >
                        {saving ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <span>💾</span>
                            Save Settings
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