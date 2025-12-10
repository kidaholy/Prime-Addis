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
    console.log("📋 Admin fetching users:", decoded.email || decoded.id)
    
    if (decoded.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    await connectDB()
    console.log("📊 Database connected for user retrieval")
    
    const users = await User.find({}).select("-password").lean()
    console.log(`👥 Found ${users.length} users in database`)

    return NextResponse.json(users)
  } catch (error: any) {
    console.error("❌ Get users error:", error)
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
    console.log("🔐 Admin creating user:", decoded.email || decoded.id)
    
    if (decoded.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    await connectDB()
    console.log("📊 Database connected for user creation")
    
    const { name, email, role, password } = await request.json()
    console.log("📝 User data received:", { name, email, role, passwordLength: password?.length })

    if (!name || !email || !role || !password) {
      return NextResponse.json({ message: "All fields required" }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      console.log("❌ User already exists:", email)
      return NextResponse.json({ message: "User already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log("🔒 Password hashed successfully")

    // Create user data
    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
      isActive: true,
    }

    console.log("💾 Creating user in database:", { ...userData, password: "[HIDDEN]" })

    // Create user
    const user = await User.create(userData)
    console.log("✅ User created successfully:", user._id)

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
    console.error("❌ Create user error:", error)
    return NextResponse.json({ message: error.message || "Failed to create user" }, { status: 500 })
  }
}
