"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"

interface User {
  _id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

export default function UsersPage() {
  const { token } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "cashier",
    password: "",
  })
  const [generatedCredentials, setGeneratedCredentials] = useState<any>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let password = ""
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewUser({ ...newUser, password })
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      })

      if (res.ok) {
        const data = await res.json()
        setGeneratedCredentials(data.credentials)
        setNewUser({ name: "", email: "", role: "cashier", password: "" })
        setShowForm(false)
        fetchUsers()
      } else {
        const error = await res.json()
        alert(error.message)
      }
    } catch (error) {
      console.error("Failed to create user:", error)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error("Failed to delete user:", error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancel" : "Add New User"}
        </button>
      </div>

      {showForm && (
        <div className="card-base mb-6">
          <h2 className="text-xl font-bold mb-4">Create New User</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="input-base"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="input-base"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="input-base"
              >
                <option value="cashier">Cashier</option>
                <option value="chef">Chef</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="input-base flex-1"
                  required
                />
                <button type="button" onClick={generatePassword} className="btn-secondary">
                  Generate
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full">
              Create User
            </button>
          </form>
        </div>
      )}

      {generatedCredentials && (
        <div className="card-base mb-6 bg-green-50 border-green-200">
          <h2 className="text-xl font-bold mb-4 text-green-800">User Created Successfully!</h2>
          <p className="mb-4 text-green-700">Share these credentials with the user:</p>
          <div className="space-y-2 bg-white p-4 rounded">
            <div className="flex justify-between items-center">
              <span className="font-medium">Email:</span>
              <div className="flex gap-2 items-center">
                <code className="bg-gray-100 px-2 py-1 rounded">{generatedCredentials.email}</code>
                <button
                  onClick={() => copyToClipboard(generatedCredentials.email)}
                  className="text-blue-600 text-sm"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Password:</span>
              <div className="flex gap-2 items-center">
                <code className="bg-gray-100 px-2 py-1 rounded">{generatedCredentials.password}</code>
                <button
                  onClick={() => copyToClipboard(generatedCredentials.password)}
                  className="text-blue-600 text-sm"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
          <button onClick={() => setGeneratedCredentials(null)} className="btn-secondary mt-4">
            Close
          </button>
        </div>
      )}

      <div className="card-base">
        <h2 className="text-xl font-bold mb-4">All Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : user.role === "cashier"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3">
                    {user.role !== "admin" && (
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
