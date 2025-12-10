import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db"
import User from "@/lib/models/user"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

// Get all users (admin only)
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
    const users = await User.find({}).select("-password").lean()

    return NextResponse.json(users)
  } catch (error: any) {
    console.error("Get users error:", error)
    return NextResponse.json({ message: error.message || "Failed to get users" }, { status: 500 })
  }
}

// Create new user (admin only)
export async function POST(request: Request) {
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
    
    const { name, email, role, password } = await request.json()

    if (!name || !email || !role || !password) {
      return NextResponse.json({ message: "All fields required" }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      isActive: true,
    })

    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      credentials: {
        email,
        password, // Return plain password for admin to share
      },
    })
  } catch (error: any) {
    console.error("Create user error:", error)
    return NextResponse.json({ message: error.message || "Failed to create user" }, { status: 500 })
  }
}
