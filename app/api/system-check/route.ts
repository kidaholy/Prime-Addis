import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import User from "@/lib/models/user"
import Order from "@/lib/models/order"
import MenuItem from "@/lib/models/menu-item"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

export async function GET(request: Request) {
  const checks = {
    database: { status: "unknown", details: "" },
    collections: { status: "unknown", details: {} },
    auth: { status: "unknown", details: "" },
    environment: { status: "unknown", details: {} }
  }

  try {
    // Check database connection
    try {
      await connectDB()
      checks.database.status = "✅ Connected"
      checks.database.details = "MongoDB Atlas connection successful"
    } catch (error) {
      checks.database.status = "❌ Failed"
      checks.database.details = error instanceof Error ? error.message : "Unknown error"
    }

    // Check collections
    try {
      const userCount = await User.countDocuments()
      const orderCount = await Order.countDocuments()
      const menuItemCount = await MenuItem.countDocuments()
      
      checks.collections.status = "✅ Available"
      checks.collections.details = {
        users: userCount,
        orders: orderCount,
        menuItems: menuItemCount
      }
    } catch (error) {
      checks.collections.status = "❌ Failed"
      checks.collections.details = error instanceof Error ? error.message : "Unknown error"
    }

    // Check authentication
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        checks.auth.status = "✅ Valid"
        checks.auth.details = `User: ${decoded.email || decoded.id} (${decoded.role})`
      } catch (error) {
        checks.auth.status = "❌ Invalid"
        checks.auth.details = "Token verification failed"
      }
    } else {
      checks.auth.status = "⚠️ No Token"
      checks.auth.details = "No authorization header provided"
    }

    // Check environment
    checks.environment.status = "✅ Loaded"
    checks.environment.details = {
      nodeEnv: process.env.NODE_ENV || "development",
      mongoUri: process.env.MONGODB_URI ? "Set" : "Missing",
      jwtSecret: process.env.JWT_SECRET ? "Set" : "Missing"
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      overall: Object.values(checks).every(check => check.status.includes("✅")) ? "✅ Healthy" : "⚠️ Issues Found",
      checks
    })

  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      overall: "❌ Critical Error",
      error: error instanceof Error ? error.message : "Unknown error",
      checks
    }, { status: 500 })
  }
}