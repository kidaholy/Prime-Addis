import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import Stock from "@/lib/models/stock"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

// GET all stock items
export async function GET(request: Request) {
    try {
        const token = request.headers.get("authorization")?.replace("Bearer ", "")

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any
        console.log("📦 Admin fetching stock items:", decoded.email || decoded.id)

        if (decoded.role !== "admin" && decoded.role !== "super-admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        await connectDB()
        console.log("📊 Database connected for stock retrieval")

        const stockItems = await Stock.find().sort({ name: 1 }).lean()
        console.log(`📦 Found ${stockItems.length} stock items in database`)

        // Convert ObjectId to string for frontend compatibility
        const serializedItems = stockItems.map(item => ({
            ...item,
            _id: item._id.toString()
        }))

        return NextResponse.json(serializedItems)
    } catch (error: any) {
        console.error("❌ Get stock error:", error)
        return NextResponse.json({ message: error.message || "Failed to get stock items" }, { status: 500 })
    }
}

// POST create new stock item
export async function POST(request: Request) {
    try {
        const token = request.headers.get("authorization")?.replace("Bearer ", "")

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any
        console.log("🔐 Admin creating stock item:", decoded.email || decoded.id)

        if (decoded.role !== "admin" && decoded.role !== "super-admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        await connectDB()
        console.log("📊 Database connected for stock creation")

        const body = await request.json()
        console.log("📝 Stock data received:", body)

        const newStock = new Stock(body)
        await newStock.save()
        console.log("✅ Stock item created successfully:", newStock._id)

        const serializedStock = {
            ...newStock.toObject(),
            _id: newStock._id.toString()
        }

        return NextResponse.json(serializedStock, { status: 201 })
    } catch (error: any) {
        console.error("❌ Create stock error:", error)
        return NextResponse.json({ message: error.message || "Failed to create stock item" }, { status: 500 })
    }
}
