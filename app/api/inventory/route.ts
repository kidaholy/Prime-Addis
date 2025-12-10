import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import { addNotification } from "@/lib/notifications"

// Create Inventory model inline since we need it
import mongoose, { Schema } from "mongoose"

interface IInventory {
  name: string
  category: string
  quantity: number
  unit: string
  minStock: number
  maxStock?: number
  cost?: number
  supplier?: string
  lastUpdated: Date
  isActive: boolean
}

const inventorySchema = new Schema<IInventory>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    minStock: { type: Number, required: true, min: 0 },
    maxStock: { type: Number },
    cost: { type: Number, min: 0 },
    supplier: { type: String },
    lastUpdated: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

const Inventory = mongoose.models.Inventory || mongoose.model<IInventory>("Inventory", inventorySchema)

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

// GET all inventory items
export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    jwt.verify(token, JWT_SECRET)

    await connectDB()
    const inventory = await Inventory.find({ isActive: true }).sort({ category: 1, name: 1 }).lean()

    console.log(`📦 Retrieved ${inventory.length} inventory items`)
    return NextResponse.json(inventory)
  } catch (error: any) {
    console.error("❌ Get inventory error:", error)
    return NextResponse.json({ message: error.message || "Failed to get inventory" }, { status: 500 })
  }
}

// POST create new inventory item
export async function POST(request: Request) {
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

    // Check if item already exists
    const existingItem = await Inventory.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } })
    if (existingItem) {
      return NextResponse.json({ message: "Inventory item with this name already exists" }, { status: 400 })
    }

    // Create inventory item
    const inventoryItem = await Inventory.create({
      name,
      category,
      quantity: Number(quantity),
      unit,
      minStock: Number(minStock),
      maxStock: maxStock ? Number(maxStock) : undefined,
      cost: cost ? Number(cost) : undefined,
      supplier,
      lastUpdated: new Date(),
      isActive: true,
    })

    console.log(`✅ Created inventory item: ${inventoryItem.name}`)

    // Send notification
    addNotification(
      "success",
      `📦 New inventory item added: ${inventoryItem.name}`,
      "admin"
    )

    return NextResponse.json(inventoryItem, { status: 201 })
  } catch (error: any) {
    console.error("❌ Create inventory error:", error)
    return NextResponse.json({ message: error.message || "Failed to create inventory item" }, { status: 500 })
  }
}

export { Inventory }