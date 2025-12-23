import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import { connectDB } from "@/lib/db"
import Stock from "@/lib/models/stock"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

// Update stock item
export async function PUT(request: Request, context: any) {
    try {
        const { id } = await context.params
        const token = request.headers.get("authorization")?.replace("Bearer ", "")

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any

        if (decoded.role !== "admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        await connectDB()

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: "Invalid stock ID format" }, { status: 400 })
        }

        const updateData = await request.json()

        const updatedStock = await Stock.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })

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

// Delete stock item
export async function DELETE(request: Request, context: any) {
    try {
        const { id } = await context.params
        const token = request.headers.get("authorization")?.replace("Bearer ", "")

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any

        if (decoded.role !== "admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        await connectDB()

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: "Invalid stock ID format" }, { status: 400 })
        }

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
