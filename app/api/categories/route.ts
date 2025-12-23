import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import Category from "@/lib/models/category"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

// GET categories by type
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get("type")

        await connectDB()

        const query = type ? { type } : {}
        const categories = await Category.find(query).sort({ name: 1 }).lean()

        return NextResponse.json(categories)
    } catch (error: any) {
        console.error("❌ Get categories error:", error)
        return NextResponse.json({ message: error.message || "Failed to get categories" }, { status: 500 })
    }
}

// POST create new category (Admin only)
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

        const body = await request.json()
        const { name, type, description } = body

        if (!name || !type) {
            return NextResponse.json({ message: "Name and type are required" }, { status: 400 })
        }

        const newCategory = new Category({ name, type, description })
        await newCategory.save()

        return NextResponse.json(newCategory, { status: 201 })
    } catch (error: any) {
        console.error("❌ Create category error:", error)
        return NextResponse.json({ message: error.message || "Failed to create category" }, { status: 500 })
    }
}
