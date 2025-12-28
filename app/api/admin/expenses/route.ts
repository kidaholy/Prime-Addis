import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import DailyExpense from "@/lib/models/daily-expense"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

async function verifyAdmin(request: Request) {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null

    const token = authHeader.split(" ")[1]
    try {
        const decoded: any = jwt.verify(token, JWT_SECRET)
        if (decoded.role !== "admin" && decoded.role !== "super-admin") return null
        return decoded
    } catch {
        return null
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get("start")
        const endDate = searchParams.get("end")

        await connectDB()

        let query = {}
        if (startDate && endDate) {
            query = {
                date: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                },
            }
        }

        const expenses = await DailyExpense.find(query).sort({ date: -1 })
        return NextResponse.json(expenses)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const admin = await verifyAdmin(request)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const body = await request.json()
        const { date, oxCost, oxQuantity, items, description } = body

        let calculatedOtherExpenses = body.otherExpenses || 0;
        if (items && Array.isArray(items)) {
            calculatedOtherExpenses = items.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0)
        }

        await connectDB()

        // Sync with Stock: Get previous state to calculate difference
        const existingExpense = await DailyExpense.findOne({ date: new Date(date) })
        const oldOxQuantity = existingExpense?.oxQuantity || 0
        const newOxQuantity = oxQuantity || 0
        const diffOxQuantity = newOxQuantity - oldOxQuantity

        const expense = await DailyExpense.findOneAndUpdate(
            { date: new Date(date) },
            {
                oxCost: oxCost || 0,
                oxQuantity: newOxQuantity,
                otherExpenses: calculatedOtherExpenses,
                items: items || [],
                description
            },
            { new: true, upsert: true }
        )

        // Update physical stock item "Ox"
        if (diffOxQuantity !== 0) {
            await Stock.findOneAndUpdate(
                { name: { $regex: /^ox$/i }, category: "meat" },
                {
                    $setOnInsert: { name: "Ox", category: "meat", trackQuantity: true, showStatus: true },
                    $inc: { quantity: diffOxQuantity },
                    $set: {
                        unit: "unit",
                        unitCost: newOxQuantity > 0 ? (oxCost / newOxQuantity) : (existingExpense?.oxCost ? existingExpense.oxCost / oldOxQuantity : 0)
                    }
                },
                { upsert: true, new: true }
            )
        }

        return NextResponse.json(expense)
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ error: "Expense already exists for this date" }, { status: 400 })
        }
        return NextResponse.json({ error: "Failed to save expense" }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    const admin = await verifyAdmin(request)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 })
        }

        await connectDB()
        const expense = await DailyExpense.findById(id)

        if (!expense) {
            return NextResponse.json({ error: "Expense not found" }, { status: 404 })
        }

        // Decrement stock before deleting expense
        if (expense.oxQuantity > 0) {
            await Stock.findOneAndUpdate(
                { name: { $regex: /^ox$/i }, category: "meat" },
                { $inc: { quantity: -expense.oxQuantity } }
            )
        }

        await DailyExpense.findByIdAndDelete(id)

        return NextResponse.json({ message: "Expense deleted successfully" })
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 })
    }
}
