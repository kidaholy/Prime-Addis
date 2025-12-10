import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"

export async function GET() {
  try {
    // Test database connection
    await connectDB()
    
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      database: "connected"
    })
  } catch (error) {
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}