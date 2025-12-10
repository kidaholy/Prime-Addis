import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import { connectDB } from "@/lib/db"
import MenuItem from "@/lib/models/menu-item"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

// Update menu item (admin only)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    console.log("🔐 Admin updating menu item:", decoded.email || decoded.id)
    
    if (decoded.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    await connectDB()
    console.log("📊 Database connected for menu item update")
    
    const updateData = await request.json()
    console.log("📝 Menu item update data:", updateData)
    console.log("🆔 Menu item ID to update:", params.id)

    // Validate ObjectId format using mongoose
    if (!params.id || !mongoose.Types.ObjectId.isValid(params.id)) {
      console.error("❌ Invalid ObjectId format:", params.id)
      console.error("❌ ID type:", typeof params.id)
      console.error("❌ ID length:", params.id?.length)
      return NextResponse.json({ message: "Invalid menu item ID format" }, { status: 400 })
    }

    // Convert numeric fields
    if (updateData.price) updateData.price = Number(updateData.price)
    if (updateData.preparationTime) updateData.preparationTime = Number(updateData.preparationTime)

    // First check if the item exists
    const existingItem = await MenuItem.findById(params.id)
    console.log("🔍 Existing menu item found:", existingItem ? "Yes" : "No")
    
    if (!existingItem) {
      console.error("❌ Menu item not found in database:", params.id)
      return NextResponse.json({ message: "Menu item not found" }, { status: 404 })
    }

    const menuItem = await MenuItem.findByIdAndUpdate(
      params.id, 
      updateData, 
      { new: true, runValidators: true }
    )

    if (!menuItem) {
      console.error("❌ Failed to update menu item:", params.id)
      return NextResponse.json({ message: "Menu item not found" }, { status: 404 })
    }

    console.log("✅ Menu item updated successfully:", menuItem._id)

    return NextResponse.json({
      message: "Menu item updated successfully",
      menuItem
    })
  } catch (error: any) {
    console.error("❌ Update menu item error:", error)
    return NextResponse.json({ message: error.message || "Failed to update menu item" }, { status: 500 })
  }
}

// Delete menu item (admin only)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    console.log("🔐 Admin deleting menu item:", decoded.email || decoded.id)
    
    if (decoded.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    await connectDB()
    console.log("📊 Database connected for menu item deletion")
    console.log("🆔 Menu item ID to delete:", params.id)

    // Validate ObjectId format using mongoose
    if (!params.id || !mongoose.Types.ObjectId.isValid(params.id)) {
      console.error("❌ Invalid ObjectId format for deletion:", params.id)
      return NextResponse.json({ message: "Invalid menu item ID format" }, { status: 400 })
    }

    const menuItem = await MenuItem.findByIdAndDelete(params.id)

    if (!menuItem) {
      return NextResponse.json({ message: "Menu item not found" }, { status: 404 })
    }

    console.log("✅ Menu item deleted successfully:", menuItem._id)

    return NextResponse.json({
      message: "Menu item deleted successfully"
    })
  } catch (error: any) {
    console.error("❌ Delete menu item error:", error)
    return NextResponse.json({ message: error.message || "Failed to delete menu item" }, { status: 500 })
  }
}