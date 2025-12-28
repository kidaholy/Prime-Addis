import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import DailyExpense from "@/lib/models/daily-expense"
import Stock from "@/lib/models/stock"
import MenuItem from "@/lib/models/menu-item"
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

        // 🔄 FULL STOCK SYNC
        // 1. Sync Ox
        if (diffOxQuantity !== 0) {
            const updatedOx = await Stock.findOneAndUpdate(
                { name: { $regex: /^ox$/i }, category: "meat" },
                {
                    $setOnInsert: { name: "Ox", category: "meat", trackQuantity: true, showStatus: true, status: "active" },
                    $inc: { quantity: diffOxQuantity },
                    $set: {
                        unit: "unit",
                        unitCost: newOxQuantity > 0 ? (oxCost / newOxQuantity) : (existingExpense?.oxCost ? existingExpense.oxCost / oldOxQuantity : 0),
                        status: "active"
                    }
                },
                { upsert: true, new: true }
            )

            // 🔗 Auto-Link MenuItems for Ox
            if (updatedOx) {
                const meatStockIds = await Stock.find({
                    name: { $regex: /ox/i },
                    _id: { $ne: updatedOx._id }
                }).select('_id')

                await MenuItem.updateMany(
                    {
                        $or: [
                            { name: { $regex: /burger|steak|meat|tibes/i } },
                            { stockItemId: { $in: meatStockIds.map(s => s._id) } }
                        ]
                    },
                    { $set: { stockItemId: updatedOx._id } }
                )
            }
        }

        // 2. Sync Other Items
        const oldItems = existingExpense?.items || []
        const newItems = items || []

        // Extract all unique names
        const allItemNames = Array.from(new Set([
            ...oldItems.map((i: any) => i.name.toLowerCase()),
            ...newItems.map((i: any) => i.name.toLowerCase())
        ]))

        for (const name of allItemNames) {
            if (name === 'ox') continue; // Handled above

            const oldItem = oldItems.find((i: any) => i.name.toLowerCase() === name)
            const newItem = newItems.find((i: any) => i.name.toLowerCase() === name)

            const oldQty = oldItem?.quantity || 0
            const newQty = newItem?.quantity || 0
            const diff = newQty - oldQty

            if (diff !== 0) {
                const updatedStock = await Stock.findOneAndUpdate(
                    { name: { $regex: new RegExp(`^${name}$`, 'i') } },
                    {
                        $setOnInsert: {
                            name: newItem?.name || name,
                            category: "general",
                            trackQuantity: true,
                            showStatus: true,
                            status: "active"
                        },
                        $inc: { quantity: diff },
                        $set: {
                            unit: newItem?.unit || oldItem?.unit || "unit",
                            unitCost: (newItem?.amount && newItem?.quantity) ? (newItem.amount / newItem.quantity) : 0,
                            status: "active"
                        }
                    },
                    { upsert: true, new: true }
                )

                // 🔗 Auto-Link MenuItems
                // If this is a meat/general item, relink menu items that might be pointing to archived versions
                if (updatedStock) {
                    await MenuItem.updateMany(
                        {
                            name: { $regex: new RegExp(name, 'i') }, // Match menu items by name similarity
                            stockItemId: { $exists: false } // Only if not linked? Or if linked to a finished one
                        },
                        { $set: { stockItemId: updatedStock._id } }
                    )

                    // Also find menu items linked to stock items that share the same root name but are NOT this ID
                    // This handles the transition from "Ox (Finished)" to "Ox"
                    const relatedStockIds = await Stock.find({
                        name: { $regex: new RegExp(name, 'i') },
                        _id: { $ne: updatedStock._id }
                    }).select('_id')

                    if (relatedStockIds.length > 0) {
                        await MenuItem.updateMany(
                            { stockItemId: { $in: relatedStockIds.map(s => s._id) } },
                            { $set: { stockItemId: updatedStock._id } }
                        )
                    }
                }
            }
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

        // 🔄 REVERSE STOCK SYNC
        // 1. Decrement Ox
        if (expense.oxQuantity > 0) {
            await Stock.findOneAndUpdate(
                { name: { $regex: /^ox$/i }, category: "meat" },
                { $inc: { quantity: -expense.oxQuantity } }
            )
        }

        // 2. Decrement Other Items
        for (const item of expense.items || []) {
            if (item.name.toLowerCase() === 'ox') continue;
            if (item.quantity > 0) {
                await Stock.findOneAndUpdate(
                    { name: { $regex: new RegExp(`^${item.name}$`, 'i') } },
                    { $inc: { quantity: -item.quantity } }
                )
            }
        }

        await DailyExpense.findByIdAndDelete(id)

        return NextResponse.json({ message: "Expense deleted successfully" })
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 })
    }
}
