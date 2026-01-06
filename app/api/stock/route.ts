import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import Stock from "@/lib/models/stock"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

// GET all stock items with enhanced filtering and availability checking
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const includeHistory = searchParams.get("includeHistory") === "true"
        const availableOnly = searchParams.get("availableOnly") === "true"
        const category = searchParams.get("category")

        const token = request.headers.get("authorization")?.replace("Bearer ", "")

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any
        console.log("📦 Admin fetching stock items:", decoded.email || decoded.id)

        if (decoded.role !== "admin" && decoded.role !== "super-admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        await connectDB()
        console.log("📊 Database connected for stock retrieval")

        // Build query
        let query: any = {}
        if (availableOnly) {
            query.status = 'active'
            query.quantity = { $gt: 0 }
        }
        if (category) {
            query.category = category
        }

        let stockQuery = Stock.find(query).sort({ name: 1 })
        
        // Conditionally include restock history
        if (!includeHistory) {
            stockQuery = stockQuery.select('-restockHistory')
        }

        const stockItems = await stockQuery.lean()
        console.log(`📦 Found ${stockItems.length} stock items in database`)

        // Convert ObjectId to string for frontend compatibility and add computed fields
        const serializedItems = stockItems.map(item => {
            // Handle migration from old purchasePrice to averagePurchasePrice
            const avgPurchasePrice = item.averagePurchasePrice || item.purchasePrice || 0
            
            return {
                ...item,
                _id: item._id.toString(),
                averagePurchasePrice: avgPurchasePrice, // Ensure this field exists
                totalValue: (item.quantity || 0) * avgPurchasePrice, // Investment value
                sellingValue: (item.quantity || 0) * (item.unitCost || 0), // Potential revenue
                profitMargin: (item.unitCost || 0) > 0 ? (((item.unitCost - avgPurchasePrice) / item.unitCost) * 100).toFixed(1) : 0,
                isLowStock: item.trackQuantity && (item.quantity || 0) <= (item.minLimit || 0),
                isOutOfStock: item.trackQuantity && (item.quantity || 0) <= 0,
                availableForOrder: item.trackQuantity ? (item.status === 'active' && (item.quantity || 0) > 0) : true
            }
        })

        return NextResponse.json(serializedItems)
    } catch (error: any) {
        console.error("❌ Get stock error:", error)
        return NextResponse.json({ message: error.message || "Failed to get stock items" }, { status: 500 })
    }
}

// POST create new stock item with initial restock
export async function POST(request: Request) {
    try {
        const token = request.headers.get("authorization")?.replace("Bearer ", "")

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any
        console.log("🔐 Admin creating stock item:", decoded.email || decoded.id)

        if (decoded.role !== "admin" && decoded.role !== "super-admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 })
        }

        await connectDB()
        console.log("📊 Database connected for stock creation")

        const body = await request.json()
        console.log("📝 Stock data received:", body)

        // Validate unit type based on unit
        let unitType = 'count' // default
        const unit = body.unit?.toLowerCase()
        if (['kg', 'g', 'gram', 'kilogram'].includes(unit)) {
            unitType = 'weight'
        } else if (['l', 'ml', 'liter', 'litre', 'milliliter'].includes(unit)) {
            unitType = 'volume'
        }

        const stockData = {
            ...body,
            unitType,
            quantity: body.quantity || 0,
            minLimit: body.minLimit || 0,
            averagePurchasePrice: body.quantity > 0 ? (body.totalPurchaseCost || 0) / body.quantity : 0,
            unitCost: body.unitCost || 0,
            totalPurchased: body.quantity || 0,
            totalConsumed: 0,
            totalInvestment: body.totalPurchaseCost || 0
        }

        const newStock = new Stock(stockData)

        // If initial quantity > 0, add to restock history manually
        if (stockData.quantity > 0 && (body.totalPurchaseCost || 0) > 0) {
            newStock.restockHistory.push({
                date: new Date(),
                quantityAdded: stockData.quantity,
                totalPurchaseCost: body.totalPurchaseCost || 0,
                unitCostAtTime: stockData.unitCost,
                notes: "Initial stock entry",
                restockedBy: decoded.id
            })
        }

        await newStock.save()
        console.log("✅ Stock item created successfully:", newStock._id)

        const serializedStock = {
            ...newStock.toObject(),
            _id: newStock._id.toString(),
            totalValue: newStock.quantity * newStock.averagePurchasePrice, // Investment value
            sellingValue: newStock.quantity * newStock.unitCost, // Potential revenue
            profitMargin: newStock.unitCost > 0 ? ((newStock.unitCost - newStock.averagePurchasePrice) / newStock.unitCost * 100).toFixed(1) : 0,
            isLowStock: newStock.trackQuantity && newStock.quantity <= newStock.minLimit,
            isOutOfStock: newStock.trackQuantity && newStock.quantity <= 0,
            availableForOrder: newStock.trackQuantity ? (newStock.status === 'active' && newStock.quantity > 0) : true
        }

        return NextResponse.json(serializedStock, { status: 201 })
    } catch (error: any) {
        console.error("❌ Create stock error:", error)
        return NextResponse.json({ message: error.message || "Failed to create stock item" }, { status: 500 })
    }
}
