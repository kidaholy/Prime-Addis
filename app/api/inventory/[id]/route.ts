import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import { addNotification } from "@/lib/notifications"
import { Inventory } from "../route"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

// GET single inventory item
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    jwt.verify(token, JWT_SECRET)

    await connectDB()
    const item = await Inventory.findById(params.id)

    if (!item) {
      return NextResponse.json({ message: "Inventory item not found" }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error: any) {
    console.error("❌ Get inventory item error:", error)
    return NextResponse.json({ message: error.message || "Failed to get inventory item" }, { status: 500 })
  }
}

// PUT update inventory item
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any

    if (decoded.role !== "admin") {
      return NextResponse.json({ message: "Forbidden - Admin access required" }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const { name, category, quantity, unit, minStock, maxStock, cost, supplier } = body

    // Validate required fields
    if (!name || !category || quantity === undefined || !unit || minStock === undefined) {
      return NextResponse.json({ message: "Name, category, quantity, unit, and minStock are required" }, { status: 400 })
    }

    // Check if another item with the same name exists (excluding current item)
    const existingItem = await Inventory.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: params.id }
    })
    
    if (existingItem) {
      return NextResponse.json({ message: "Another inventory item with this name already exists" }, { status: 400 })
    }

    // Update inventory item
    const updatedItem = await Inventory.findByIdAndUpdate(
      params.id,
      {
        name,
        category,
        quantity: Number(quantity),
        unit,
        minStock: Number(minStock),
        maxStock: maxStock ? Number(maxStock) : undefined,
        cost: cost ? Number(cost) : undefined,
        supplier,
        lastUpdated: new Date(),
      },
      { new: true }
    )

    if (!updatedItem) {
      return NextResponse.json({ message: "Inventory item not found" }, { status: 404 })
    }

    console.log(`✅ Updated inventory item: ${updatedItem.name}`)

    // Send notification
    addNotification(
      "info",
      `📝 Inventory updated: ${updatedItem.name}`,
      "admin"
    )

    // Check for low stock alert
    if (updatedItem.quantity <= updatedItem.minStock) {
      addNotification(
        "warning",
        `⚠️ Low stock alert: ${updatedItem.name} (${updatedItem.quantity} ${updatedItem.unit} remaining)`,
        "admin"
      )
    }

    return NextResponse.json(updatedItem)
  } catch (error: any) {
    console.error("❌ Update inventory error:", error)
    return NextResponse.json({ message: error.message || "Failed to update inventory item" }, { status: 500 })
  }
}

// DELETE inventory item (soft delete)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any

    if (decoded.role !== "admin") {
      return NextResponse.json({ message: "Forbidden - Admin access required" }, { status: 403 })
    }

    await connectDB()

    // Soft delete by setting isActive to false
    const deletedItem = await Inventory.findByIdAndUpdate(
      params.id,
      { 
        isActive: false,
        lastUpdated: new Date()
      },
      { new: true }
    )

    if (!deletedItem) {
      return NextResponse.json({ message: "Inventory item not found" }, { status: 404 })
    }

    console.log(`🗑️ Deleted inventory item: ${deletedItem.name}`)

    // Send notification
    addNotification(
      "warning",
      `🗑️ Inventory item deleted: ${deletedItem.name}`,
      "admin"
    )

    return NextResponse.json({ message: "Inventory item deleted successfully" })
  } catch (error: any) {
    console.error("❌ Delete inventory error:", error)
    return NextResponse.json({ message: error.message || "Failed to delete inventory item" }, { status: 500 })
  }
}