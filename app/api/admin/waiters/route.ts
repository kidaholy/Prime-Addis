import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import Waiter from "@/lib/models/waiter"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

export async function GET(request: Request) {
    try {
        await connectDB()
        const waiters = await Waiter.find({ active: true }).sort({ waiterId: 1 })
        return NextResponse.json(waiters)
    } catch (error: any) {
        return NextResponse.json({ message: "Failed to fetch waiters" }, { status: 500 })
    }
}

// Handle creation of new waiters
export async function POST(request: Request) {
    try {
        const token = request.headers.get("authorization")?.replace("Bearer ", "")
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        const decoded = jwt.verify(token, JWT_SECRET) as any
        if (decoded.role !== "admin" && decoded.role !== "super-admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        await connectDB()
        const { waiterId, name, tables } = await request.json()

        if (!waiterId || !name) {
            return NextResponse.json({ message: "Waiter ID (Batch #) and Name are required" }, { status: 400 })
        }

        const existing = await Waiter.findOne({ waiterId })
        if (existing) {
            return NextResponse.json({ message: "Waiter ID already exists" }, { status: 400 })
        }

        const waiter = await Waiter.create({
            waiterId,
            name,
            active: true,
            tables: tables || []
        })
        return NextResponse.json(waiter, { status: 201 })
    } catch (error: any) {
        return NextResponse.json({ message: error.message || "Failed to create waiter" }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const token = request.headers.get("authorization")?.replace("Bearer ", "")
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        const decoded = jwt.verify(token, JWT_SECRET) as any
        if (decoded.role !== "admin" && decoded.role !== "super-admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        await connectDB()
        const { id, waiterId, name, tables } = await request.json()

        if (!id || !waiterId || !name) {
            return NextResponse.json({ message: "ID, Waiter ID and Name are required" }, { status: 400 })
        }

        // Check uniqueness
        const existing = await Waiter.findOne({ waiterId, _id: { $ne: id } })
        if (existing) {
            return NextResponse.json({ message: "Waiter ID (Batch #) already exists" }, { status: 400 })
        }

        const updatedWaiter = await Waiter.findByIdAndUpdate(
            id,
            { waiterId, name, tables },
            { new: true }
        )

        if (!updatedWaiter) {
            return NextResponse.json({ message: "Waiter not found" }, { status: 404 })
        }

        return NextResponse.json(updatedWaiter)
    } catch (error: any) {
        return NextResponse.json({ message: error.message || "Failed to update waiter" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const token = request.headers.get("authorization")?.replace("Bearer ", "")
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        const decoded = jwt.verify(token, JWT_SECRET) as any
        if (decoded.role !== "admin" && decoded.role !== "super-admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) return NextResponse.json({ message: "ID is required" }, { status: 400 })

        await connectDB()
        await Waiter.findByIdAndDelete(id)
        return NextResponse.json({ message: "Waiter deleted" })
    } catch (error: any) {
        return NextResponse.json({ message: "Failed to delete waiter" }, { status: 500 })
    }
}
