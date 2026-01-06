import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import Stock from "@/lib/models/stock"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

// GET single stock item with full history
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const token = request.headers.get("authorization")?.replace("Bearer ", "")
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

        const decoded = jwt.verify(token, JWT_SECRET) as any
        if (decoded.role !== "admin" && decoded.role !== "super-admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        await connectDB()

        const { id } = await params
        const stockItem = await Stock.findById(id).populate('restockHistory.restockedBy', 'name email').lean()

        if (!stockItem) {
            return NextResponse.json({ message: "Stock item not found" }, { status: 404 })
        }

        const serializedStock = {
            ...stockItem,
            _id: stockItem._id.toString(),
            totalValue: (stockItem.quantity || 0) * (stockItem.unitCost || 0),
            isLowStock: stockItem.trackQuantity && (stockItem.quantity || 0) <= (stockItem.minLimit || 0),
            isOutOfStock: stockItem.trackQuantity && (stockItem.quantity || 0) <= 0,
            availableForOrder: stockItem.trackQuantity ? (stockItem.status === 'active' && (stockItem.quantity || 0) > 0) : true,
            restockHistory: stockItem.restockHistory?.map((entry: any) => ({
                ...entry,
                _id: entry._id?.toString(),
                restockedBy: entry.restockedBy ? {
                    ...entry.restockedBy,
                    _id: entry.restockedBy._id?.toString()
                } : null
            })) || []
        }

        return NextResponse.json(serializedStock)
    } catch (error: any) {
        console.error("❌ Get stock item error:", error)
        return NextResponse.json({ message: error.message || "Failed to get stock item" }, { status: 500 })
    }
}

// PUT update stock item or restock
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

        const stockItem = await Stock.findById(id)
        if (!stockItem) {
            return NextResponse.json({ message: "Stock item not found" }, { status: 404 })
        }

        // Check if this is a restock operation
        if (body.action === 'restock' && body.quantityAdded && body.totalPurchaseCost) {
            console.log(`🔄 Restocking ${stockItem.name}: +${body.quantityAdded} ${stockItem.unit} for total cost ${body.totalPurchaseCost} Br / selling at ${body.newUnitCost || stockItem.unitCost} per unit`)
            
            stockItem.restock(
                Number(body.quantityAdded),
                Number(body.totalPurchaseCost),
                Number(body.newUnitCost || stockItem.unitCost),
                body.notes || `Restocked via admin panel`,
                decoded.id
            )
            
            await stockItem.save()
            
            const serializedStock = {
                ...stockItem.toObject(),
                _id: stockItem._id.toString(),
                totalValue: stockItem.quantity * stockItem.averagePurchasePrice,
                sellingValue: stockItem.quantity * stockItem.unitCost,
                profitMargin: stockItem.unitCost > 0 ? ((stockItem.unitCost - stockItem.averagePurchasePrice) / stockItem.unitCost * 100).toFixed(1) : 0,
                isLowStock: stockItem.trackQuantity && stockItem.quantity <= stockItem.minLimit,
                isOutOfStock: stockItem.trackQuantity && stockItem.quantity <= 0,
                availableForOrder: stockItem.trackQuantity ? (stockItem.status === 'active' && stockItem.quantity > 0) : true
            }

            return NextResponse.json({
                ...serializedStock,
                message: `Successfully restocked ${body.quantityAdded} ${stockItem.unit}. New total: ${stockItem.quantity} ${stockItem.unit}. Investment: ${body.totalPurchaseCost.toLocaleString()} Br`
            })
        }

        // Regular update operation
        const allowedUpdates = ['name', 'category', 'unit', 'unitType', 'minLimit', 'trackQuantity', 'showStatus', 'status']
        const updateData: any = {}
        
        for (const key of allowedUpdates) {
            if (body[key] !== undefined) {
                updateData[key] = body[key]
            }
        }

        // Handle direct quantity/price updates (for admin corrections)
        if (body.quantity !== undefined) {
            updateData.quantity = Math.max(0, Number(body.quantity))
        }
        if (body.averagePurchasePrice !== undefined) {
            updateData.averagePurchasePrice = Math.max(0, Number(body.averagePurchasePrice))
        }
        if (body.unitCost !== undefined) {
            updateData.unitCost = Math.max(0, Number(body.unitCost))
        }

        Object.assign(stockItem, updateData)
        await stockItem.save()

        const serializedStock = {
            ...stockItem.toObject(),
            _id: stockItem._id.toString(),
            totalValue: stockItem.quantity * stockItem.averagePurchasePrice,
            sellingValue: stockItem.quantity * stockItem.unitCost,
            profitMargin: stockItem.unitCost > 0 ? ((stockItem.unitCost - stockItem.averagePurchasePrice) / stockItem.unitCost * 100).toFixed(1) : 0,
            isLowStock: stockItem.trackQuantity && stockItem.quantity <= stockItem.minLimit,
            isOutOfStock: stockItem.trackQuantity && stockItem.quantity <= 0,
            availableForOrder: stockItem.trackQuantity ? (stockItem.status === 'active' && stockItem.quantity > 0) : true
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