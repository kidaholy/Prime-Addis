import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import Stock from "@/lib/models/stock"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

// PUT update stock item
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const token = request.headers.get("authorization")?.replace("Bearer ", "")
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

        const decoded = jwt.verify(token, JWT_SECRET) as any
        if (decoded.role !== "admin" && decoded.role !== "super-admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        await connectDB()

        const body = await request.json()
        const { id } = await params

        const updatedStock = await Stock.findByIdAndUpdate(
            id,
            body,
            { new: true, runValidators: true }
        )

        if (!updatedStock) {
            return NextResponse.json({ message: "Stock item not found" }, { status: 404 })
        }

        const serializedStock = {
            ...updatedStock.toObject(),
            _id: updatedStock._id.toString()
        }

        return NextResponse.json(serializedStock)
    } catch (error: any) {
        console.error("❌ Update stock error:", error)
        return NextResponse.json({ message: error.message || "Failed to update stock item" }, { status: 500 })
    }
}

// DELETE stock item
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const token = request.headers.get("authorization")?.replace("Bearer ", "")
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

        const decoded = jwt.verify(token, JWT_SECRET) as any
        if (decoded.role !== "admin" && decoded.role !== "super-admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        await connectDB()

        const { id } = await params

        const deletedStock = await Stock.findByIdAndDelete(id)
        if (!deletedStock) {
            return NextResponse.json({ message: "Stock item not found" }, { status: 404 })
        }

        return NextResponse.json({ message: "Stock item deleted successfully" })
    } catch (error: any) {
        console.error("❌ Delete stock error:", error)
        return NextResponse.json({ message: error.message || "Failed to delete stock item" }, { status: 500 })
    }
}