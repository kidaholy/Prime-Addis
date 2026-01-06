import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import Waiter from "@/lib/models/waiter"

export async function GET(request: Request) {
    try {
        await connectDB()
        const waiters = await Waiter.find({ active: true }).sort({ waiterId: 1 })
        // Return only necessary fields
        const serializedWaiters = waiters.map(w => ({
            _id: w._id,
            waiterId: w.waiterId,
            name: w.name,
            tables: w.tables || []
        }))
        return NextResponse.json(serializedWaiters)
    } catch (error: any) {
        return NextResponse.json({ message: "Failed to fetch waiters" }, { status: 500 })
    }
}
