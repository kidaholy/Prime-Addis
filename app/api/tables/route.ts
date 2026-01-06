import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import Table from "@/lib/models/table"

export async function GET(request: Request) {
    try {
        await connectDB()
        const tables = await Table.find({ status: "active" }).sort({ tableNumber: 1 })
        // Return only necessary fields
        const serializedTables = tables.map(t => ({
            _id: t._id,
            tableNumber: t.tableNumber,
            capacity: t.capacity
        }))
        return NextResponse.json(serializedTables)
    } catch (error: any) {
        return NextResponse.json({ message: "Failed to fetch tables" }, { status: 500 })
    }
}
