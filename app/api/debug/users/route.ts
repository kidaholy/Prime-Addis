import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import User from "@/lib/models/user"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    if (decoded.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    await connectDB()
    
    const users = await User.find({}).lean()
    
    const debugInfo = users.map(user => ({
      id: user._id.toString(),
      idLength: user._id.toString().length,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    }))

    return NextResponse.json({
      message: "Debug user information",
      count: users.length,
      users: debugInfo
    })
  } catch (error: any) {
    console.error("❌ Debug users error:", error)
    return NextResponse.json({ message: error.message || "Failed to get debug info" }, { status: 500 })
  }
}