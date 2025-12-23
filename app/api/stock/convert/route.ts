import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import Stock from "@/lib/models/stock"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

export async function POST(request: Request) {
    try {
        const token = request.headers.get("authorization")?.replace("Bearer ", "")

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any
        if (decoded.role !== "admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        await connectDB()

        const { sourceId, targetId, sourceQuantity, targetYield } = await request.json()

        if (!sourceId || !targetId || !sourceQuantity || !targetYield) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
        }

        // 1. Decrement source
        const sourceItem = await Stock.findById(sourceId)
        if (!sourceItem || sourceItem.quantity < sourceQuantity) {
            return NextResponse.json({ message: "Insufficient source quantity" }, { status: 400 })
        }

        sourceItem.quantity -= sourceQuantity
        await sourceItem.save()

        // 2. Increment target
        const targetItem = await Stock.findById(targetId)
        if (!targetItem) {
            return NextResponse.json({ message: "Target item not found" }, { status: 404 })
        }

        targetItem.quantity += targetYield
        await targetItem.save()

        return NextResponse.json({
            message: "Conversion successful",
            source: { name: sourceItem.name, newQuantity: sourceItem.quantity },
            target: { name: targetItem.name, newQuantity: targetItem.quantity }
        })

    } catch (error: any) {
        console.error("❌ Stock conversion error:", error)
        return NextResponse.json({ message: error.message || "Failed to convert stock" }, { status: 500 })
    }
}
