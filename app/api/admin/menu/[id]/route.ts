import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import { connectDB } from "@/lib/db"
import MenuItem from "@/lib/models/menu-item"
import Stock from "@/lib/models/stock"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"


// Update menu item (admin only)
export async function PUT(request: Request, context: any) {
  try {
    console.log("🔄 PUT request received for menu item update")

    const params = await context.params
    console.log("🆔 Raw params:", params)
    console.log("🆔 Params ID:", params.id)
    console.log("🔍 ID type:", typeof params.id)
    console.log("🔍 ID length:", params.id?.length)

    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      console.log("❌ No token provided")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    console.log("🔐 Admin updating menu item:", decoded.email || decoded.id)

    if (decoded.role !== "admin") {
      console.log("❌ User is not admin:", decoded.role)
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    await connectDB()
    console.log("📊 Database connected for menu item update")

    const updateData = await request.json()
    console.log("📝 Menu item update data:", updateData)
    console.log("🖼️ Image URL in update data:", updateData.image)
    console.log("🆔 Menu item ID to update:", params.id)

    // Validate ObjectId format using mongoose
    if (!params.id || !mongoose.Types.ObjectId.isValid(params.id)) {
      console.error("❌ Invalid ObjectId format:", params.id)
      console.error("❌ ID type:", typeof params.id)
      console.error("❌ ID length:", params.id?.length)
      console.error("❌ ID value:", JSON.stringify(params.id))
      return NextResponse.json({ message: "Invalid menu item ID format" }, { status: 400 })
    }

    // Convert numeric fields
    if (updateData.price) updateData.price = Number(updateData.price)
    if (updateData.preparationTime) updateData.preparationTime = Number(updateData.preparationTime)
    if (updateData.stockConsumption) updateData.stockConsumption = Number(updateData.stockConsumption)

    // Ensure image field is properly handled (empty string should be saved as empty string, not undefined)
    if (updateData.hasOwnProperty('image')) {
      updateData.image = updateData.image || ""
      console.log("🖼️ Processed image URL:", updateData.image)
    }

    // First check if the item exists
    const existingItem = await MenuItem.findById(params.id)
    console.log("🔍 Existing menu item found:", existingItem ? "Yes" : "No")

    if (existingItem) {
      console.log("🖼️ Current image URL:", existingItem.image)
    }

    if (!existingItem) {
      console.error("❌ Menu item not found in database:", params.id)
      return NextResponse.json({ message: "Menu item not found" }, { status: 404 })
    }

    console.log("🔄 Performing MongoDB update with data:", JSON.stringify(updateData, null, 2))

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
    console.log("🖼️ Updated image URL:", menuItem.image)

    // Verify the update by fetching the item again
    const verificationItem = await MenuItem.findById(params.id)
    console.log("🔍 Verification fetch - Image URL:", verificationItem?.image)

    if (verificationItem?.image !== updateData.image) {
      console.error("⚠️ Image URL mismatch after update!")
      console.error("   Expected:", updateData.image)
      console.error("   Actual:", verificationItem?.image)
    }

    // Return the updated menu item with string ID
    const serializedMenuItem = {
      ...menuItem.toObject(),
      _id: menuItem._id.toString()
    }

    return NextResponse.json({
      message: "Menu item updated successfully",
      menuItem: serializedMenuItem
    })
  } catch (error: any) {
    console.error("❌ Update menu item error:", error)
    return NextResponse.json({ message: error.message || "Failed to update menu item" }, { status: 500 })
  }
}

// Delete menu item (admin only)
export async function DELETE(request: Request, context: any) {
  try {
    const params = await context.params

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