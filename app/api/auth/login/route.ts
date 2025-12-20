import { NextResponse } from "next/server"
import { signToken } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db"
import User from "@/lib/models/user"



export async function POST(request: Request) {
  try {
    await connectDB()

    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 })
    }

    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password required" }, { status: 400 })
    }

    // Find user
    const user = await User.findOne({ email }).lean()

    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Generate token
    const token = signToken({ id: user._id, email: user.email, role: user.role })

    return NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json({ message: error.message || "Login failed" }, { status: 500 })
  }
}
