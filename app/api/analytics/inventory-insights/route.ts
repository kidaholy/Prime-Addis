import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { connectDB } from "@/lib/db"
import Order from "@/lib/models/order"
import Stock from "@/lib/models/stock"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    await connectDB()

    // Inventory insights
    const allStock = await Stock.find().lean()
    
    const lowStockItems = allStock.filter(item => 
      item.trackQuantity && 
      item.minLimit && 
      (item.quantity || 0) <= (item.minLimit || 0)
    )

    const inventoryValue = allStock.reduce((sum, item) => {
      if (item.trackQuantity && item.quantity && item.unitCost) {
        return sum + (item.quantity * item.unitCost)
      }
      return sum
    }, 0)

    const insights = {
      totalItems: allStock.length,
      lowStockCount: lowStockItems.length,
      inventoryValue,
      lowStockItems: lowStockItems.map(item => ({
        name: item.name,
        current: item.quantity || 0,
        minimum: item.minLimit || 0,
        unit: item.unit || ''
      }))
    }

    return NextResponse.json(insights)
  } catch (error: any) {
    console.error("Inventory insights error:", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}