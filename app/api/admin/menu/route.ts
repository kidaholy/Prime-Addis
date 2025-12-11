import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import MenuItem from "@/lib/models/menu-item"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

// Get all menu items (admin only)
export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    console.log("📋 Admin fetching menu items:", decoded.email || decoded.id)
    
    if (decoded.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    await connectDB()
    console.log("📊 Database connected for menu retrieval")
    
    const menuItems = await MenuItem.find({}).lean()
    console.log(`🍽️ Found ${menuItems.length} menu items in database`)

    // Convert ObjectId to string for frontend compatibility
    const serializedItems = menuItems.map(item => ({
      ...item,
      _id: item._id.toString()
    }))

    return NextResponse.json(serializedItems)
  } catch (error: any) {
    console.error("❌ Get menu items error:", error)
    return NextResponse.json({ message: error.message || "Failed to get menu items" }, { status: 500 })
  }
}

// Create new menu item (admin only)
export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    console.log("🔐 Admin creating menu item:", decoded.email || decoded.id)
    
    if (decoded.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    await connectDB()
    console.log("📊 Database connected for menu item creation")
    
    const { name, category, price, description, image, preparationTime, available } = await request.json()
    console.log("📝 Menu item data received:", { name, category, price })

    if (!name || !category || !price) {
      return NextResponse.json({ message: "Name, category, and price are required" }, { status: 400 })
    }

    // Create menu item
    const menuItem = await MenuItem.create({
      name,
      category,
      price: Number(price),
      description,
      image,
      preparationTime: preparationTime ? Number(preparationTime) : 10,
      available: available !== false,
    })

    console.log("✅ Menu item created successfully:", menuItem._id)

    return NextResponse.json({
      message: "Menu item created successfully",
      menuItem
    })
  } catch (error: any) {
    console.error("❌ Create menu item error:", error)
    return NextResponse.json({ message: error.message || "Failed to create menu item" }, { status: 500 })
  }
}