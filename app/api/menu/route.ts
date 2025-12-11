import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import MenuItem from "@/lib/models/menu-item"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    jwt.verify(token, JWT_SECRET)

    await connectDB()
    const menuItems = await MenuItem.find({ available: true }).lean()

    // Convert ObjectId to string for frontend compatibility
    const serializedItems = menuItems.map(item => ({
      ...item,
      _id: item._id.toString()
    }))

    return NextResponse.json(serializedItems)
  } catch (error: any) {
    console.error("Get menu error:", error)
    return NextResponse.json({ message: error.message || "Failed to get menu" }, { status: 500 })
  }
}
